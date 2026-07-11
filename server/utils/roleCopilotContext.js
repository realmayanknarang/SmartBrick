import MarketplaceProject from '../models/marketplace/MarketplaceProject.js';
import Proposal from '../models/marketplace/Proposal.js';
import MarketplaceMaterial from '../models/marketplace/MarketplaceMaterial.js';
import MarketplaceOrder from '../models/marketplace/MarketplaceOrder.js';

function formatRupees(amount) {
  if (amount == null || Number.isNaN(amount)) return '₹0';
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)} Cr`;
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(2)} L`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

async function gatherOwnerContext(userId) {
  const projects = await MarketplaceProject.find({ owner: userId, isActive: true })
    .populate('approvedProposal', 'estimatedBudget estimatedDuration status')
    .lean();

  const projectSummaries = projects.map(p => {
    const proposal = p.approvedProposal;
    return `• ${p.title} (${p.status}) — ${p.constructionType} in ${p.location}, budget ₹${formatRupees(p.budgetMin)}–${formatRupees(p.budgetMax)}, ${proposal ? `approved proposal: ₹${formatRupees(proposal.estimatedBudget)}, ${proposal.estimatedDuration}` : 'no approved proposal yet'}`;
  }).join('\n');

  const proposalsCount = await Proposal.countDocuments({
    project: { $in: projects.map(p => p._id) },
  });

  return {
    summary: `You have ${projects.length} project(s) on SmartBrick.\n${projectSummaries}\n${projects.length > 0 ? `Total proposals received across your projects: ${proposalsCount}` : 'Post a project to start receiving proposals from builders.'}`,
    projects,
    proposalsCount,
  };
}

async function gatherBuilderContext(userId) {
  const proposals = await Proposal.find({ builder: userId })
    .populate('project', 'title constructionType location status budgetMin budgetMax')
    .lean();

  const proposalSummaries = proposals.map(p => {
    const proj = p.project || {};
    return `• ${proj.title || 'Unknown'} — bid ₹${formatRupees(p.estimatedBudget)}, ${p.estimatedDuration}, status: ${p.status} (project: ${proj.status || 'N/A'})`;
  }).join('\n');

  const orders = await MarketplaceOrder.find({ builder: userId })
    .populate('material', 'name category')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const orderSummaries = orders.map(o => {
    const mat = o.material || {};
    return `• ${mat.name || 'Unknown'} x${o.quantity} — ${formatRupees(o.totalCost)} (${o.status})`;
  }).join('\n');

  return {
    summary: `You have ${proposals.length} proposal(s) and ${orders.length} recent order(s).\n${proposals.length > 0 ? `Your proposals:\n${proposalSummaries}` : 'Browse projects and submit proposals to get started.'}\n${orders.length > 0 ? `Recent orders:\n${orderSummaries}` : ''}`,
    proposals,
    orders,
  };
}

async function gatherVendorContext(userId) {
  const materials = await MarketplaceMaterial.find({ vendor: userId, isActive: true }).lean();

  const materialSummaries = materials.map(m =>
    `• ${m.name} (${m.category}) — ${formatRupees(m.pricePerUnit)}/${m.unit}, stock: ${m.stock}, brand: ${m.brand || 'N/A'}`
  ).join('\n');

  const orders = await MarketplaceOrder.find({ vendor: userId })
    .populate('material', 'name category')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const orderSummaries = orders.map(o => {
    const mat = o.material || {};
    return `• ${mat.name || 'Unknown'} x${o.quantity} — ${formatRupees(o.totalCost)} (${o.status})`;
  }).join('\n');

  return {
    summary: `You have ${materials.length} material listing(s) and ${orders.length} recent order(s).\n${materials.length > 0 ? `Your materials:\n${materialSummaries}` : 'Add materials to start selling on SmartBrick.'}\n${orders.length > 0 ? `Recent orders:\n${orderSummaries}` : ''}`,
    materials,
    orders,
  };
}

export async function gatherRoleContext(userId, role) {
  if (role === 'owner') return gatherOwnerContext(userId);
  if (role === 'builder') return gatherBuilderContext(userId);
  if (role === 'vendor') return gatherVendorContext(userId);
  return { summary: '' };
}

export function getRoleSystemPrompt(role) {
  const prompts = {
    owner: `You are SmartBrick's AI assistant for property owners and home builders.
Your role is to help owners manage their construction projects, understand builder proposals, track progress, and make informed decisions.
Answer questions about:
- Their construction projects (scope, budget, timeline)
- Construction best practices for owners
- Understanding proposals from builders
- Project budgeting and cost management
- Material choices and quality considerations
- Timelines and construction phases
Use ONLY the provided project data. If the user asks about something outside their data, explain what you can help with.
Be concise and practical. Use rupee amounts (₹) when discussing costs.`,

    builder: `You are SmartBrick's AI assistant for construction builders and contractors.
Your role is to help builders find projects, prepare winning proposals, manage active construction, source materials, and grow their business.
Answer questions about:
- Project bidding and proposal strategies
- Construction techniques and best practices
- Material selection and sourcing
- Project management and workforce planning
- Budget estimation and cost optimization
- Building codes and compliance tips
Use ONLY the provided data. If the user asks about something outside their data, explain what you can help with.
Be concise and practical. Use rupee amounts (₹) when discussing costs.`,

    vendor: `You are SmartBrick's AI assistant for material suppliers and vendors.
Your role is to help vendors manage their material listings, set competitive prices, track inventory, fulfill orders, and grow their business.
Answer questions about:
- Material listing optimization and pricing strategies
- Inventory management best practices
- Order fulfillment and delivery logistics
- Market trends and demand insights
- Customer relationship management
- Product categories and specifications
Use ONLY the provided data. If the user asks about something outside their data, explain what you can help with.
Be concise and practical. Use rupee amounts (₹) when discussing costs.`,
  };

  return prompts[role] || prompts.owner;
}
