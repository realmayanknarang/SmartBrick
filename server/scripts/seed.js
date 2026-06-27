/**
 * seed.js — SmartBrick comprehensive seed data generator
 *
 * Usage (from the server/ directory):
 *   node scripts/seed.js
 *   npm run seed
 *
 * Safe to re-run: clears all 7 collections first and logs how many
 * documents were removed from each before inserting fresh data.
 *
 * Insertion order respects referential integrity:
 *   Users → Vendors → Projects → Sites → Materials
 *   → UsageHistory → PurchaseOrders
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

import User          from '../models/User.js';
import Vendor        from '../models/Vendor.js';
import Project       from '../models/Project.js';
import Site          from '../models/Site.js';
import Material      from '../models/Material.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import UsageHistory  from '../models/UsageHistory.js';

// ─── tiny helpers ────────────────────────────────────────────────────────────

const rand    = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick    = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Return a Date that is `days` in the past. */
const daysAgo  = (days)  => { const d = new Date(); d.setDate(d.getDate() - days);  return d; };
/** Return a Date that is `days` in the future. */
const daysLater = (days) => { const d = new Date(); d.setDate(d.getDate() + days);  return d; };
/** Return a Date that is `weeks` weeks in the past. */
const weeksAgo  = (weeks) => daysAgo(weeks * 7);

// ─── 1. WIPE ─────────────────────────────────────────────────────────────────

async function wipeAll() {
  console.log('\n🗑️  Clearing existing data...');
  // Reverse dependency order so foreign-key guards never trigger
  const targets = [
    { model: UsageHistory,  label: 'UsageHistory ' },
    { model: PurchaseOrder, label: 'PurchaseOrder' },
    { model: Material,      label: 'Material     ' },
    { model: Site,          label: 'Site         ' },
    { model: Project,       label: 'Project      ' },
    { model: Vendor,        label: 'Vendor       ' },
    { model: User,          label: 'User         ' },
  ];
  for (const { model, label } of targets) {
    const { deletedCount } = await model.deleteMany({});
    console.log(`   ${label}: ${deletedCount} removed`);
  }
}

// ─── 2. USERS (4 — one per role) ─────────────────────────────────────────────

async function seedUsers() {
  return User.insertMany([
    { name: 'Vikram Singh Dhaliwal', email: 'owner@smartbrick-demo.com',    role: 'owner' },
    { name: 'Neha Kapoor',           email: 'pm@smartbrick-demo.com',       role: 'project_manager' },
    { name: 'Rajesh Kumar Sharma',   email: 'engineer@smartbrick-demo.com', role: 'site_engineer' },
    { name: 'Sunita Arora',          email: 'finance@smartbrick-demo.com',  role: 'finance' },
  ]);
}

// ─── 3. VENDORS (18 — 3 per category, Chandigarh-tricity region) ─────────────
//
// Scoring is intentionally non-uniform:
//   • Best vendor  → reliability 90-97, pastDelays 1-4
//   • Average      → reliability 72-88, pastDelays 5-10
//   • Poor vendor  → reliability 55-70, pastDelays 14-24
// This spread lets Phase 8 AI surface meaningful vendor recommendations.

async function seedVendors() {
  return Vendor.insertMany([
    // ── CEMENT ──────────────────────────────────────────────────────────────
    // (all vendor names are fictional — demo data only)
    {
      name: 'MaxBuild Cement Depot [Demo]',
      category: 'cement', city: 'Chandigarh', contactPhone: '+91-9900101001',
      pricePerUnit: 395, unit: 'per bag',
      reliabilityScore: 95, deliveryScore: 93, qualityScore: 97,
      pastDelays: 1,  totalOrdersCompleted: 252,
    },
    {
      name: 'BlueStar Cement Mohali [Demo]',
      category: 'cement', city: 'Mohali', contactPhone: '+91-9900102002',
      pricePerUnit: 378, unit: 'per bag',
      reliabilityScore: 83, deliveryScore: 80, qualityScore: 87,
      pastDelays: 6,  totalOrdersCompleted: 141,
    },
    {
      name: 'GreyMix Cement Store Ludhiana [Demo]',
      category: 'cement', city: 'Ludhiana', contactPhone: '+91-9900103003',
      pricePerUnit: 359, unit: 'per bag',
      reliabilityScore: 64, deliveryScore: 60, qualityScore: 68,
      pastDelays: 17, totalOrdersCompleted: 67,
    },

    // ── STEEL ────────────────────────────────────────────────────────────────
    {
      name: 'NorthForge Steel Chandigarh [Demo]',
      category: 'steel', city: 'Chandigarh', contactPhone: '+91-9900104004',
      pricePerUnit: 63000, unit: 'per ton',
      reliabilityScore: 97, deliveryScore: 95, qualityScore: 98,
      pastDelays: 1,  totalOrdersCompleted: 318,
    },
    {
      name: 'TriCity Steel Hub Panchkula [Demo]',
      category: 'steel', city: 'Panchkula', contactPhone: '+91-9900105005',
      pricePerUnit: 61200, unit: 'per ton',
      reliabilityScore: 80, deliveryScore: 77, qualityScore: 83,
      pastDelays: 8,  totalOrdersCompleted: 119,
    },
    {
      name: 'Regal Steel Stockyard Ludhiana [Demo]',
      category: 'steel', city: 'Ludhiana', contactPhone: '+91-9900106006',
      pricePerUnit: 58800, unit: 'per ton',
      reliabilityScore: 58, deliveryScore: 54, qualityScore: 62,
      pastDelays: 22, totalOrdersCompleted: 44,
    },

    // ── SAND ─────────────────────────────────────────────────────────────────
    {
      name: 'GoldenGrain Sand Traders Ludhiana [Demo]',
      category: 'sand', city: 'Ludhiana', contactPhone: '+91-9900107007',
      pricePerUnit: 1360, unit: 'per ton',
      reliabilityScore: 88, deliveryScore: 85, qualityScore: 86,
      pastDelays: 3,  totalOrdersCompleted: 152,
    },
    {
      name: 'ClearRun Sand Supplies Mohali [Demo]',
      category: 'sand', city: 'Mohali', contactPhone: '+91-9900108008',
      pricePerUnit: 1240, unit: 'per ton',
      reliabilityScore: 74, deliveryScore: 71, qualityScore: 76,
      pastDelays: 11, totalOrdersCompleted: 88,
    },
    {
      name: 'TriCity Sand Works Panchkula [Demo]',
      category: 'sand', city: 'Panchkula', contactPhone: '+91-9900109009',
      pricePerUnit: 1140, unit: 'per ton',
      reliabilityScore: 56, deliveryScore: 50, qualityScore: 59,
      pastDelays: 24, totalOrdersCompleted: 35,
    },

    // ── BRICKS ───────────────────────────────────────────────────────────────
    {
      name: 'SolidKiln Brick Works Chandigarh [Demo]',
      category: 'bricks', city: 'Chandigarh', contactPhone: '+91-9900110010',
      pricePerUnit: 9, unit: 'per piece',
      reliabilityScore: 91, deliveryScore: 90, qualityScore: 93,
      pastDelays: 2,  totalOrdersCompleted: 208,
    },
    {
      name: 'RedRock Bricks Mohali [Demo]',
      category: 'bricks', city: 'Mohali', contactPhone: '+91-9900111011',
      pricePerUnit: 8, unit: 'per piece',
      reliabilityScore: 78, deliveryScore: 75, qualityScore: 80,
      pastDelays: 9,  totalOrdersCompleted: 105,
    },
    {
      name: 'SunBaked Brick Factory Ludhiana [Demo]',
      category: 'bricks', city: 'Ludhiana', contactPhone: '+91-9900112012',
      pricePerUnit: 7, unit: 'per piece',
      reliabilityScore: 61, deliveryScore: 57, qualityScore: 65,
      pastDelays: 19, totalOrdersCompleted: 58,
    },

    // ── ELECTRICAL ───────────────────────────────────────────────────────────
    {
      name: 'VoltLine Electrical Chandigarh [Demo]',
      category: 'electrical', city: 'Chandigarh', contactPhone: '+91-9900113013',
      pricePerUnit: 288, unit: 'per meter',
      reliabilityScore: 94, deliveryScore: 92, qualityScore: 96,
      pastDelays: 1,  totalOrdersCompleted: 335,
    },
    {
      name: 'CopperGrid Depot Mohali [Demo]',
      category: 'electrical', city: 'Mohali', contactPhone: '+91-9900114014',
      pricePerUnit: 258, unit: 'per meter',
      reliabilityScore: 84, deliveryScore: 82, qualityScore: 87,
      pastDelays: 5,  totalOrdersCompleted: 176,
    },
    {
      name: 'SparkMart Wires Panchkula [Demo]',
      category: 'electrical', city: 'Panchkula', contactPhone: '+91-9900115015',
      pricePerUnit: 218, unit: 'per meter',
      reliabilityScore: 59, deliveryScore: 54, qualityScore: 61,
      pastDelays: 20, totalOrdersCompleted: 40,
    },

    // ── PLUMBING ─────────────────────────────────────────────────────────────
    {
      name: 'FlowTech Pipes Chandigarh [Demo]',
      category: 'plumbing', city: 'Chandigarh', contactPhone: '+91-9900116016',
      pricePerUnit: 212, unit: 'per meter',
      reliabilityScore: 92, deliveryScore: 91, qualityScore: 95,
      pastDelays: 2,  totalOrdersCompleted: 245,
    },
    {
      name: 'AquaRun Plumbing Mohali [Demo]',
      category: 'plumbing', city: 'Mohali', contactPhone: '+91-9900117017',
      pricePerUnit: 186, unit: 'per meter',
      reliabilityScore: 77, deliveryScore: 74, qualityScore: 80,
      pastDelays: 9,  totalOrdersCompleted: 99,
    },
    {
      name: 'PipeWorks Store Ludhiana [Demo]',
      category: 'plumbing', city: 'Ludhiana', contactPhone: '+91-9900118018',
      pricePerUnit: 163, unit: 'per meter',
      reliabilityScore: 65, deliveryScore: 60, qualityScore: 68,
      pastDelays: 16, totalOrdersCompleted: 55,
    },
  ]);
}

// ─── 4. PROJECTS (5 — all statuses, INR crore budgets) ───────────────────────
//
// spentSoFar is calibrated to status:
//   planning  → 0%,  foundation → ~12%,  structure → ~53%
//   finishing → ~86%, completed → ~98%

async function seedProjects() {
  return Project.insertMany([
    {
      name: 'Tricity Heights Residential Complex',
      builderName: 'Vikram Singh Constructions Pvt Ltd',
      status: 'structure',
      budget: 8_00_00_000,
      spentSoFar: 4_24_00_000,
      startDate:       daysAgo(540),
      expectedEndDate: daysLater(180),
    },
    {
      name: 'Mohali IT Park Phase 1',
      builderName: 'Tricity Infra Developers',
      status: 'foundation',
      budget: 15_00_00_000,
      spentSoFar: 1_82_00_000,
      startDate:       daysAgo(90),
      expectedEndDate: daysLater(450),
    },
    {
      name: 'Sector 82 Premium Residency',
      builderName: 'Vikram Singh Constructions Pvt Ltd',
      status: 'finishing',
      budget: 5_00_00_000,
      spentSoFar: 4_31_00_000,
      startDate:       daysAgo(730),
      expectedEndDate: daysLater(60),
    },
    {
      name: 'Panchkula Commercial Complex',
      builderName: 'North India Build Corp',
      status: 'planning',
      budget: 12_00_00_000,
      spentSoFar: 0,
      startDate:       daysLater(30),  // hasn't broken ground yet
      expectedEndDate: daysLater(630),
    },
    {
      name: 'Ludhiana Industrial Warehouse',
      builderName: 'Punjab Industrial Properties',
      status: 'completed',
      budget: 3_50_00_000,
      spentSoFar: 3_43_00_000,
      startDate:       daysAgo(1095),
      expectedEndDate: daysAgo(180),
    },
  ]);
}

// ─── 5. SITES (8 — 1-2 per project, Chandigarh-region coords) ────────────────
//
// currentPhase is aligned with the parent project's status.
// "planning" maps to 'foundation' (just beginning civil work).
// "completed" maps to 'finishing' (last phase of construction).

async function seedSites(projects) {
  return Site.insertMany([
    // Tricity Heights (structure) ─────────────────────────────────────────────
    {
      project: projects[0]._id, name: 'Tricity Heights Block A',
      city: 'Chandigarh', latitude: 30.7350, longitude: 76.7812,
      currentPhase: 'structure',
    },
    {
      project: projects[0]._id, name: 'Tricity Heights Block B',
      city: 'Chandigarh', latitude: 30.7372, longitude: 76.7834,
      currentPhase: 'foundation',   // slightly behind Block A
    },

    // Mohali IT Park (foundation) ─────────────────────────────────────────────
    {
      project: projects[1]._id, name: 'IT Park Tower 1',
      city: 'Mohali', latitude: 30.7062, longitude: 76.7198,
      currentPhase: 'foundation',
    },
    {
      project: projects[1]._id, name: 'IT Park Tower 2',
      city: 'Mohali', latitude: 30.7081, longitude: 76.7214,
      currentPhase: 'foundation',
    },

    // Sector 82 Residency (finishing) ─────────────────────────────────────────
    {
      project: projects[2]._id, name: 'Sector 82 Wing C',
      city: 'Mohali', latitude: 30.7016, longitude: 76.7112,
      currentPhase: 'finishing',
    },

    // Panchkula Commercial (planning → just starting) ─────────────────────────
    {
      project: projects[3]._id, name: 'Panchkula Commercial Plot A',
      city: 'Panchkula', latitude: 30.6958, longitude: 76.8625,
      currentPhase: 'foundation',
    },

    // Ludhiana Industrial (completed → final phase logged) ────────────────────
    {
      project: projects[4]._id, name: 'Ludhiana Warehouse Zone 1',
      city: 'Ludhiana', latitude: 30.9028, longitude: 75.8594,
      currentPhase: 'finishing',
    },
    {
      project: projects[4]._id, name: 'Ludhiana Warehouse Zone 2',
      city: 'Ludhiana', latitude: 30.9048, longitude: 75.8618,
      currentPhase: 'finishing',
    },
  ]);
}

// ─── 6. MATERIALS (6 — one per category) ─────────────────────────────────────
//
// currentStockBySite covers EVERY site.
// Deliberately seeded ⚠️ below-threshold combinations (marked) so Phase 8's
// Smart Alerts feature has real trigger conditions to detect on day one.

async function seedMaterials(sites) {
  //               idx:  0=Tri-A  1=Tri-B  2=IT1   3=IT2   4=Sec82  5=Pchk  6=Lud1  7=Lud2

  return Material.insertMany([
    {
      name: 'OPC 53 Grade Cement', category: 'cement', unit: 'bags',
      currentStockBySite: [
        { site: sites[0]._id, quantity: 320,   reorderThreshold: 200  },  // OK
        { site: sites[1]._id, quantity: 145,   reorderThreshold: 200  },  // ⚠️
        { site: sites[2]._id, quantity: 560,   reorderThreshold: 250  },  // OK
        { site: sites[3]._id, quantity: 195,   reorderThreshold: 250  },  // ⚠️
        { site: sites[4]._id, quantity: 82,    reorderThreshold: 50   },  // OK
        { site: sites[5]._id, quantity: 415,   reorderThreshold: 200  },  // OK
        { site: sites[6]._id, quantity: 28,    reorderThreshold: 40   },  // ⚠️
        { site: sites[7]._id, quantity: 58,    reorderThreshold: 40   },  // OK
      ],
    },
    {
      name: 'TMT Steel Bars Fe500', category: 'steel', unit: 'tons',
      currentStockBySite: [
        { site: sites[0]._id, quantity: 8.5,   reorderThreshold: 5    },  // OK
        { site: sites[1]._id, quantity: 3.1,   reorderThreshold: 5    },  // ⚠️
        { site: sites[2]._id, quantity: 12.0,  reorderThreshold: 6    },  // OK
        { site: sites[3]._id, quantity: 9.0,   reorderThreshold: 6    },  // OK
        { site: sites[4]._id, quantity: 0.9,   reorderThreshold: 1.5  },  // ⚠️
        { site: sites[5]._id, quantity: 6.5,   reorderThreshold: 5    },  // OK
        { site: sites[6]._id, quantity: 0.4,   reorderThreshold: 1    },  // ⚠️
        { site: sites[7]._id, quantity: 0.7,   reorderThreshold: 1    },  // ⚠️
      ],
    },
    {
      name: 'M-Sand (Manufactured Sand)', category: 'sand', unit: 'tons',
      currentStockBySite: [
        { site: sites[0]._id, quantity: 58,    reorderThreshold: 20   },  // OK
        { site: sites[1]._id, quantity: 17,    reorderThreshold: 20   },  // ⚠️
        { site: sites[2]._id, quantity: 82,    reorderThreshold: 25   },  // OK
        { site: sites[3]._id, quantity: 68,    reorderThreshold: 25   },  // OK
        { site: sites[4]._id, quantity: 14,    reorderThreshold: 10   },  // OK
        { site: sites[5]._id, quantity: 92,    reorderThreshold: 20   },  // OK
        { site: sites[6]._id, quantity: 7,     reorderThreshold: 10   },  // ⚠️
        { site: sites[7]._id, quantity: 15,    reorderThreshold: 10   },  // OK
      ],
    },
    {
      name: 'Red Clay Bricks', category: 'bricks', unit: 'pieces',
      currentStockBySite: [
        { site: sites[0]._id, quantity: 15200, reorderThreshold: 5000 },  // OK
        { site: sites[1]._id, quantity: 3700,  reorderThreshold: 5000 },  // ⚠️
        { site: sites[2]._id, quantity: 22000, reorderThreshold: 6000 },  // OK
        { site: sites[3]._id, quantity: 18500, reorderThreshold: 6000 },  // OK
        { site: sites[4]._id, quantity: 2100,  reorderThreshold: 1500 },  // OK
        { site: sites[5]._id, quantity: 31000, reorderThreshold: 5000 },  // OK
        { site: sites[6]._id, quantity: 1100,  reorderThreshold: 1500 },  // ⚠️
        { site: sites[7]._id, quantity: 1750,  reorderThreshold: 1500 },  // OK
      ],
    },
    {
      name: 'FR PVC Electrical Conduit Wire', category: 'electrical', unit: 'meters',
      currentStockBySite: [
        { site: sites[0]._id, quantity: 820,   reorderThreshold: 200  },  // OK
        { site: sites[1]._id, quantity: 360,   reorderThreshold: 150  },  // OK
        { site: sites[2]._id, quantity: 510,   reorderThreshold: 200  },  // OK
        { site: sites[3]._id, quantity: 185,   reorderThreshold: 150  },  // OK
        { site: sites[4]._id, quantity: 115,   reorderThreshold: 150  },  // ⚠️
        { site: sites[5]._id, quantity: 420,   reorderThreshold: 150  },  // OK
        { site: sites[6]._id, quantity: 88,    reorderThreshold: 150  },  // ⚠️
        { site: sites[7]._id, quantity: 65,    reorderThreshold: 100  },  // ⚠️
      ],
    },
    {
      name: 'CPVC Plumbing Pipe 25mm', category: 'plumbing', unit: 'meters',
      currentStockBySite: [
        { site: sites[0]._id, quantity: 510,   reorderThreshold: 100  },  // OK
        { site: sites[1]._id, quantity: 205,   reorderThreshold: 80   },  // OK
        { site: sites[2]._id, quantity: 360,   reorderThreshold: 100  },  // OK
        { site: sites[3]._id, quantity: 95,    reorderThreshold: 80   },  // OK
        { site: sites[4]._id, quantity: 55,    reorderThreshold: 100  },  // ⚠️
        { site: sites[5]._id, quantity: 460,   reorderThreshold: 100  },  // OK
        { site: sites[6]._id, quantity: 48,    reorderThreshold: 80   },  // ⚠️
        { site: sites[7]._id, quantity: 72,    reorderThreshold: 80   },  // ⚠️
      ],
    },
  ]);
}

// ─── 7. USAGE HISTORY (~1,300 records) ───────────────────────────────────────
//
// Generates 26 weekly entries (≈6 months) per site × material combination.
//
// Pattern layering:
//   Phase multiplier  — structure phases burn cement/steel faster; finishing
//                       phases burn electrical/plumbing faster.
//   Monsoon factor    — June–September (months 5–8) → ×0.55 (productivity dip).
//   Random noise      — ±25% jitter so no two weeks look identical.

function buildWeeklyUsage(siteId, materialId, phase, category, weeksBack) {
  // How much each category is consumed relative to base, per phase
  const phaseMultiplier = {
    cement:     { foundation: 1.2, structure: 1.9, finishing: 0.4 },
    steel:      { foundation: 1.6, structure: 2.1, finishing: 0.2 },
    sand:       { foundation: 1.4, structure: 1.7, finishing: 0.3 },
    bricks:     { foundation: 1.0, structure: 1.8, finishing: 0.5 },
    electrical: { foundation: 0.3, structure: 0.5, finishing: 2.0 },
    plumbing:   { foundation: 0.2, structure: 0.4, finishing: 1.9 },
  };

  // Approximate weekly base consumption (unit matches the material's unit field)
  const weeklyBase = {
    cement: 100,    // bags
    steel: 2.0,     // tons
    sand: 30,       // tons
    bricks: 8000,   // pieces
    electrical: 130, // meters
    plumbing: 95,   // meters
  };

  const records = [];
  for (let w = weeksBack; w >= 0; w--) {
    const date  = weeksAgo(w);
    const month = date.getMonth();                        // 0-indexed
    const isMonsoon    = month >= 5 && month <= 8;        // Jun–Sep
    const monsoonScale = isMonsoon ? 0.55 : 1.0;
    const phaseScale   = (phaseMultiplier[category] ?? {})[phase] ?? 1.0;
    const noiseScale   = 1 + (Math.random() - 0.5) * 0.5;  // ±25%

    let qty = weeklyBase[category] * phaseScale * monsoonScale * noiseScale;

    // Round to 2 dp for tonnage, nearest integer for everything else
    qty = category === 'steel'
      ? Math.max(0, parseFloat(qty.toFixed(2)))
      : Math.max(0, Math.round(qty));

    records.push({ site: siteId, material: materialId, date, quantityUsed: qty, phaseAtTime: phase });
  }
  return records;
}

async function seedUsageHistory(sites, materials) {
  const sitePhases = [
    'structure',   // sites[0] Tricity Block A
    'foundation',  // sites[1] Tricity Block B
    'foundation',  // sites[2] IT Park Tower 1
    'foundation',  // sites[3] IT Park Tower 2
    'finishing',   // sites[4] Sector 82 Wing C
    'foundation',  // sites[5] Panchkula Commercial
    'finishing',   // sites[6] Ludhiana Warehouse 1
    'finishing',   // sites[7] Ludhiana Warehouse 2
  ];

  const categories = ['cement', 'steel', 'sand', 'bricks', 'electrical', 'plumbing'];
  const WEEKS = 26;  // ≈ 6 months of weekly data

  const allRecords = [];
  for (let s = 0; s < sites.length; s++) {
    for (let m = 0; m < materials.length; m++) {
      allRecords.push(
        ...buildWeeklyUsage(
          sites[s]._id,
          materials[m]._id,
          sitePhases[s],
          categories[m],
          WEEKS,
        )
      );
    }
  }

  // insertMany with ordered:false for speed on large batches
  return UsageHistory.insertMany(allRecords, { ordered: false });
}

// ─── 8. PURCHASE ORDERS (40–64 total) ────────────────────────────────────────
//
// deliveryStatus logic — internally consistent with vendor quality:
//   • Order date < 14 days ago  → 'pending'  (hasn't arrived yet)
//   • Poor vendor (pastDelays > 12):
//       40% delayed, 35% delivered, 25% pending
//   • Good/average vendor:
//        5% delayed, 15% pending, 80% delivered
//
// approvalStage follows delivery:
//   • delivered → 'approved'
//   • Recent pending → early stages (site_engineer / project_manager)
//   • Older pending → later stages or rejected

async function seedPurchaseOrders(projects, sites, vendors, materials) {
  // Build a lookup: category → [vendor, vendor, ...]
  const vendorsByCategory = {};
  for (const v of vendors) {
    (vendorsByCategory[v.category] ??= []).push(v);
  }

  // site index → parent project _id
  const siteToProject = [
    projects[0]._id,  // sites[0]
    projects[0]._id,  // sites[1]
    projects[1]._id,  // sites[2]
    projects[1]._id,  // sites[3]
    projects[2]._id,  // sites[4]
    projects[3]._id,  // sites[5]
    projects[4]._id,  // sites[6]
    projects[4]._id,  // sites[7]
  ];

  const categories = ['cement', 'steel', 'sand', 'bricks', 'electrical', 'plumbing'];

  // Realistic quantity and price windows per category
  const specs = {
    cement:     { qty: [100, 500],   price: [355, 400]     },
    steel:      { qty: [1,   10],    price: [58000, 64000] },
    sand:       { qty: [10,  40],    price: [1100, 1400]   },
    bricks:     { qty: [2000, 15000], price: [7, 9]        },
    electrical: { qty: [100, 400],   price: [215, 295]     },
    plumbing:   { qty: [100, 400],   price: [160, 215]     },
  };

  function pickDeliveryStatus(vendor, daysOld) {
    if (daysOld < 14) return 'pending';
    if (vendor.pastDelays > 12) {
      const r = Math.random();
      return r < 0.40 ? 'delayed' : r < 0.75 ? 'delivered' : 'pending';
    }
    const r = Math.random();
    return r < 0.05 ? 'delayed' : r < 0.20 ? 'pending' : 'delivered';
  }

  function pickApprovalStage(deliveryStatus, daysOld) {
    if (deliveryStatus === 'delivered') return 'approved';
    if (daysOld < 4)  return 'site_engineer';
    if (daysOld < 10) return pick(['site_engineer', 'project_manager']);
    if (daysOld < 21) return pick(['project_manager', 'finance']);
    return pick(['finance', 'approved', 'rejected']);
  }

  const ordersToSave = [];

  // 5–8 orders per site → 40–64 total
  for (let s = 0; s < sites.length; s++) {
    const count = randInt(5, 8);
    for (let o = 0; o < count; o++) {
      const matIdx   = randInt(0, 5);
      const category = categories[matIdx];
      const material = materials[matIdx];
      const vendor   = pick(vendorsByCategory[category]);
      const { qty, price } = specs[category];

      const daysOld = randInt(5, 365);

      const quantity = category === 'steel'
        ? parseFloat(rand(qty[0], qty[1]).toFixed(1))
        : randInt(qty[0], qty[1]);

      const pricePerUnit = parseFloat(rand(price[0], price[1]).toFixed(2));

      const deliveryStatus = pickDeliveryStatus(vendor, daysOld);
      const approvalStage  = pickApprovalStage(deliveryStatus, daysOld);

      ordersToSave.push({
        project: siteToProject[s],
        site: sites[s]._id,
        vendor: vendor._id,
        material: material._id,
        quantity,
        pricePerUnit,
        totalCost: 0,               // pre-save hook always recalculates
        orderDate: daysAgo(daysOld),
        deliveryStatus,
        approvalStage,
      });
    }
  }

  // Must use .save() — not insertMany — so the pre-save hook fires on each doc
  const saved = [];
  for (const data of ordersToSave) {
    const po = new PurchaseOrder(data);
    await po.save();
    saved.push(po);
  }
  return saved;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  await connectDB();
  await wipeAll();

  console.log('\n🌱  Seeding collections...\n');

  const users    = await seedUsers();
  console.log(`   👤  Users:          ${users.length}`);

  const vendors  = await seedVendors();
  console.log(`   🏭  Vendors:        ${vendors.length}`);

  const projects = await seedProjects();
  console.log(`   🏗️   Projects:       ${projects.length}`);

  const sites    = await seedSites(projects);
  console.log(`   📍  Sites:          ${sites.length}`);

  const materials = await seedMaterials(sites);
  console.log(`   🧱  Materials:      ${materials.length}`);

  const history  = await seedUsageHistory(sites, materials);
  console.log(`   📊  UsageHistory:   ${history.length}  (26 wks × ${sites.length} sites × ${materials.length} materials)`);

  const orders   = await seedPurchaseOrders(projects, sites, vendors, materials);
  console.log(`   📦  PurchaseOrders: ${orders.length}`);

  // ── summary ──────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(56));
  console.log('✅  Seed complete — summary');
  console.log('─'.repeat(56));
  console.log(`   Users:          ${users.length}   (1 per role)`);
  console.log(`   Vendors:        ${vendors.length}  (3 per category × 6 categories)`);
  console.log(`   Projects:       ${projects.length}   (planning / foundation / structure / finishing / completed)`);
  console.log(`   Sites:          ${sites.length}   (1–2 per project, Chandigarh-tricity region)`);
  console.log(`   Materials:      ${materials.length}   (one per category)`);
  console.log(`   UsageHistory:   ${history.length}`);
  console.log(`   PurchaseOrders: ${orders.length}`);

  // ── Phase 8 alert callout ────────────────────────────────────────────────
  console.log('\n⚠️  Below-threshold stock (Phase 8 Smart Alert triggers):');
  console.log('   cement     : Tricity Block B, IT Park Tower 2, Ludhiana Warehouse 1');
  console.log('   steel      : Tricity Block B, Sector 82 Wing C, Ludhiana Warehouses 1 & 2');
  console.log('   sand       : Tricity Block B, Ludhiana Warehouse 1');
  console.log('   bricks     : Tricity Block B, Ludhiana Warehouse 1');
  console.log('   electrical : Sector 82 Wing C, Ludhiana Warehouses 1 & 2');
  console.log('   plumbing   : Sector 82 Wing C, Ludhiana Warehouses 1 & 2');
  console.log('─'.repeat(56));

  await mongoose.disconnect();
  console.log('\n🔌  MongoDB disconnected. Done.\n');
}

main().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  console.error(err);
  mongoose.disconnect().finally(() => process.exit(1));
});
