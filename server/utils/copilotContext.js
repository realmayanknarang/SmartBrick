/**
 * server/utils/copilotContext.js
 *
 * Copilot context retrieval — Phase 9A
 * ─────────────────────────────────────────────────────────────────────────────
 * Gathers real SmartBrick data from MongoDB so the Copilot can answer questions
 * grounded in seeded facts — not hallucinated inventory or vendor names.
 *
 * Strategy
 * ────────
 * Phase 2's dataset is small (~18 vendors, 8 sites, 52 POs).  Rather than
 * brittle intent classification, we fetch a reasonable breadth every time and
 * summarise it into prompt-friendly text.  The `question` parameter is stored
 * for traceability but does NOT gate which collections are queried.
 *
 * Data sources (reused from prior phases)
 * ───────────────────────────────────────
 *   • Active vendors + composite scores  — Phase 8A vendorScoring.js
 *   • Stock + budget alerts                — Phase 8D alertData.js
 *   • Recent purchase orders (30 days)     — PurchaseOrder + orderDate index
 *   • Project budget status                — all projects with spend ratios
 */

import Vendor        from '../models/Vendor.js';
import Project       from '../models/Project.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Site          from '../models/Site.js';
import Material      from '../models/Material.js';
import { calculateVendorRank } from './vendorScoring.js';
import { fetchStockAlerts, fetchBudgetAlerts } from './alertData.js';

const RECENT_ORDER_DAYS = 30;

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatRupees(amount) {
  if (amount == null || Number.isNaN(amount)) return '₹0';
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)} Cr`;
  if (amount >= 1_00_000)    return `₹${(amount / 1_00_000).toFixed(2)} L`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function percentUsed(spent, budget) {
  if (!budget || budget <= 0) return 0;
  return parseFloat(((spent / budget) * 100).toFixed(1));
}

/**
 * Groups stock alerts by site name for readable summaries.
 *
 * @param {Array} alerts
 * @returns {Record<string, Array>}
 */
function groupAlertsBySite(alerts) {
  return alerts.reduce((acc, alert) => {
    const key = alert.siteName || 'Unknown site';
    if (!acc[key]) acc[key] = [];
    acc[key].push(alert);
    return acc;
  }, {});
}

/**
 * Builds a human-readable stock-alert summary, e.g.
 * "Tricity Heights Block B has 4 materials below threshold: cement (145/200), …"
 *
 * @param {Array} stockAlerts
 * @returns {string}
 */
function summarizeStockAlerts(stockAlerts) {
  if (!stockAlerts.length) {
    return 'No sites currently have materials below reorder threshold.';
  }

  const bySite = groupAlertsBySite(stockAlerts);
  const lines = Object.entries(bySite).map(([siteName, alerts]) => {
    const items = alerts
      .map(a => {
        const label = a.category || a.materialName;
        return `${label} (${a.quantity}/${a.reorderThreshold} ${a.unit}, ${a.severity})`;
      })
      .join('; ');
    return `${siteName} — ${alerts.length} shortage(s): ${items}`;
  });

  return `${stockAlerts.length} stock alert(s) across ${Object.keys(bySite).length} site(s). ${lines.join(' | ')}`;
}

/**
 * Summarises vendors ranked by composite score, grouped by category.
 *
 * @param {Array} scoredVendors
 * @returns {string}
 */
function summarizeVendors(scoredVendors) {
  if (!scoredVendors.length) return 'No active vendors in the system.';

  const byCategory = scoredVendors.reduce((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {});

  const lines = Object.entries(byCategory).map(([category, vendors]) => {
    const top = vendors
      .slice(0, 5)
      .map(v => `${v.name} (score ${v.compositeScore}, ${formatRupees(v.pricePerUnit)}/${v.unit}, delays: ${v.pastDelays})`)
      .join('; ');
    return `${category}: ${top}`;
  });

  return `${scoredVendors.length} active vendor(s). Top by category — ${lines.join(' | ')}`;
}

/**
 * Summarises recent purchase orders.
 *
 * @param {Array} orders
 * @returns {string}
 */
function summarizeRecentOrders(orders) {
  if (!orders.length) {
    return `No purchase orders in the last ${RECENT_ORDER_DAYS} days.`;
  }

  const totalSpend = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
  const delayed = orders.filter(o => o.deliveryStatus === 'delayed').length;

  const topOrders = [...orders]
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 8)
    .map(o =>
      `${o.materialName} @ ${o.siteName} from ${o.vendorName}: ${formatRupees(o.totalCost)} (${o.deliveryStatus})`
    )
    .join('; ');

  return `${orders.length} order(s) in last ${RECENT_ORDER_DAYS} days, total ${formatRupees(totalSpend)}, ${delayed} delayed. Notable: ${topOrders}`;
}

/**
 * Summarises all project budgets (not just over-threshold alerts).
 *
 * @param {Array} projects
 * @param {Array} budgetAlerts
 * @returns {string}
 */
function summarizeProjects(projects, budgetAlerts) {
  if (!projects.length) return 'No projects in the system.';

  const lines = projects.map(p => {
    const pct = percentUsed(p.spentSoFar, p.budget);
    const flag = pct >= 90 ? ' ⚠️ near/over budget' : '';
    return `${p.name} (${p.status}): spent ${formatRupees(p.spentSoFar)} of ${formatRupees(p.budget)} budget (${pct}% used)${flag}`;
  });

  const alertNote = budgetAlerts.length
    ? `${budgetAlerts.length} project(s) exceed 90% budget threshold.`
    : 'No projects exceed 90% budget threshold.';

  return `${alertNote} All projects: ${lines.join(' | ')}`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * gatherRelevantContext(question)
 *
 * Fetches a broad slice of current SmartBrick data and returns both structured
 * fields (for testing/debugging) and a single `promptSummary` string ready to
 * inject into a Groq system prompt.
 *
 * @param {string} [question='']  User's raw question (stored for traceability)
 * @returns {Promise<{
 *   meta: { gatheredAt: string, question: string },
 *   vendors: Array,
 *   stockAlerts: Array,
 *   budgetAlerts: Array,
 *   recentPurchaseOrders: Array,
 *   projects: Array,
 *   summaries: {
 *     vendors: string,
 *     stockAlerts: string,
 *     recentOrders: string,
 *     projects: string,
 *   },
 *   promptSummary: string,
 * }>}
 */
export async function gatherRelevantContext(question = '') {
  const safeQuestion = typeof question === 'string' ? question.trim().slice(0, 500) : '';
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - RECENT_ORDER_DAYS);

  const [
    rawVendors,
    stockAlerts,
    budgetAlerts,
    recentOrdersRaw,
    projects,
  ] = await Promise.all([
    Vendor.find({ isActive: true }).lean(),
    fetchStockAlerts(),
    fetchBudgetAlerts(),
    PurchaseOrder.find({ orderDate: { $gte: thirtyDaysAgo } })
      .sort({ orderDate: -1 })
      .populate('project', 'name')
      .populate('site', 'name city')
      .populate('vendor', 'name category')
      .populate('material', 'name category unit')
      .lean(),
    Project.find({}, { name: 1, status: 1, budget: 1, spentSoFar: 1 }).lean(),
  ]);

  const vendors = rawVendors
    .map(v => {
      const { compositeScore } = calculateVendorRank(v);
      return {
        id:                   v._id,
        name:                 v.name,
        category:             v.category,
        city:                 v.city,
        pricePerUnit:         v.pricePerUnit,
        unit:                 v.unit,
        reliabilityScore:     v.reliabilityScore,
        deliveryScore:        v.deliveryScore,
        qualityScore:         v.qualityScore,
        pastDelays:           v.pastDelays,
        totalOrdersCompleted: v.totalOrdersCompleted,
        compositeScore,
      };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);

  const recentPurchaseOrders = recentOrdersRaw.map(o => ({
    id:             o._id,
    orderDate:      o.orderDate,
    projectName:    o.project?.name ?? null,
    siteName:       o.site?.name ?? null,
    siteCity:       o.site?.city ?? null,
    vendorName:     o.vendor?.name ?? null,
    vendorCategory: o.vendor?.category ?? null,
    materialName:   o.material?.name ?? null,
    materialCategory: o.material?.category ?? null,
    quantity:       o.quantity,
    totalCost:      o.totalCost,
    deliveryStatus: o.deliveryStatus,
    approvalStage:  o.approvalStage,
  }));

  const projectBudgets = projects.map(p => ({
    id:          p._id,
    name:        p.name,
    status:      p.status,
    budget:      p.budget,
    spentSoFar:  p.spentSoFar,
    percentUsed: percentUsed(p.spentSoFar, p.budget),
    overThreshold: p.budget > 0 && p.spentSoFar > p.budget * 0.9,
  }));

  const summaries = {
    vendors:      summarizeVendors(vendors),
    stockAlerts:  summarizeStockAlerts(stockAlerts),
    recentOrders: summarizeRecentOrders(recentPurchaseOrders),
    projects:     summarizeProjects(projectBudgets, budgetAlerts),
  };

  const promptSummary = [
    '=== ACTIVE VENDORS (ranked by composite score) ===',
    summaries.vendors,
    '',
    '=== STOCK ALERTS (quantity below reorder threshold) ===',
    summaries.stockAlerts,
    '',
    '=== RECENT PURCHASE ORDERS (last 30 days) ===',
    summaries.recentOrders,
    '',
    '=== PROJECT BUDGET STATUS ===',
    summaries.projects,
  ].join('\n');

  return {
    meta: {
      gatheredAt: new Date().toISOString(),
      question:   safeQuestion,
    },
    vendors,
    stockAlerts,
    budgetAlerts,
    recentPurchaseOrders,
    projects: projectBudgets,
    summaries,
    promptSummary,
  };
}
