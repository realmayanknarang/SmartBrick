/**
 * verify.js — SmartBrick Phase 2 spot-check script
 * Run: node scripts/verify.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Vendor        from '../models/Vendor.js';
import Material      from '../models/Material.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Site          from '../models/Site.js';
import Project       from '../models/Project.js';
import User          from '../models/User.js';
import UsageHistory  from '../models/UsageHistory.js';

const HR = '─'.repeat(60);

async function main() {
  await connectDB();
  console.log('\n' + HR);
  console.log('SmartBrick Phase 2 — Verification Spot-Check');
  console.log(HR);

  // ── 1. Collection counts ────────────────────────────────────────────────
  console.log('\n📊  COLLECTION COUNTS');
  const counts = {
    Users:          await User.countDocuments(),
    Vendors:        await Vendor.countDocuments(),
    Projects:       await Project.countDocuments(),
    Sites:          await Site.countDocuments(),
    Materials:      await Material.countDocuments(),
    PurchaseOrders: await PurchaseOrder.countDocuments(),
    UsageHistory:   await UsageHistory.countDocuments(),
  };
  for (const [col, n] of Object.entries(counts)) {
    console.log(`   ${col.padEnd(16)}: ${n}`);
  }

  // ── 2. Vendor score spread ──────────────────────────────────────────────
  console.log('\n📈  VENDOR SCORE SPREAD (reliabilityScore)');
  const vendors = await Vendor.find({}, 'name category reliabilityScore deliveryScore qualityScore pastDelays').sort({ reliabilityScore: -1 });
  for (const v of vendors) {
    const bar = '█'.repeat(Math.round(v.reliabilityScore / 10));
    console.log(`   [${v.category.padEnd(11)}] ${String(v.reliabilityScore).padStart(3)} ${bar.padEnd(10)}  delays:${v.pastDelays}  "${v.name}"`);
  }

  // ── 3. Below-threshold stock ────────────────────────────────────────────
  console.log('\n⚠️   BELOW-THRESHOLD STOCK (quantity < reorderThreshold)');
  const materials = await Material.find().populate('currentStockBySite.site', 'name');
  let alertCount = 0;
  for (const mat of materials) {
    for (const entry of mat.currentStockBySite) {
      if (entry.quantity < entry.reorderThreshold) {
        const siteName = entry.site?.name ?? entry.site;
        console.log(`   ⚠️  ${mat.name} @ ${siteName}: qty=${entry.quantity} < threshold=${entry.reorderThreshold}`);
        alertCount++;
      }
    }
  }
  console.log(`   Total alert conditions: ${alertCount}`);

  // ── 4. PurchaseOrder referential integrity spot-check ──────────────────
  console.log('\n🔗  PURCHASE ORDER REFERENTIAL INTEGRITY (first 5)');
  const orders = await PurchaseOrder.find()
    .limit(5)
    .populate('project', 'name')
    .populate('site', 'name')
    .populate('vendor', 'name')
    .populate('material', 'name');
  for (const o of orders) {
    const totalCheck = Math.abs(o.totalCost - o.quantity * o.pricePerUnit) < 0.01;
    console.log(`   PO ${String(o._id).slice(-6)}  status=${o.deliveryStatus.padEnd(9)}  stage=${o.approvalStage.padEnd(15)}`);
    console.log(`      project="${o.project?.name}"  site="${o.site?.name}"`);
    console.log(`      vendor="${o.vendor?.name}"  material="${o.material?.name}"`);
    console.log(`      qty=${o.quantity}  ppu=${o.pricePerUnit}  total=${o.totalCost}  hook_correct=${totalCheck}`);
  }

  // ── 5. PurchaseOrder delivery status distribution ───────────────────────
  console.log('\n📦  PURCHASE ORDER DELIVERY STATUS DISTRIBUTION');
  const deliveryDist = await PurchaseOrder.aggregate([
    { $group: { _id: '$deliveryStatus', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  for (const d of deliveryDist) {
    console.log(`   ${d._id.padEnd(10)}: ${d.count}`);
  }

  // ── 6. PurchaseOrder approval stage distribution ────────────────────────
  console.log('\n🏷️   PURCHASE ORDER APPROVAL STAGE DISTRIBUTION');
  const stageDist = await PurchaseOrder.aggregate([
    { $group: { _id: '$approvalStage', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  for (const d of stageDist) {
    console.log(`   ${d._id.padEnd(16)}: ${d.count}`);
  }

  // ── 7. totalCost pre-save hook verification ─────────────────────────────
  console.log('\n🔧  PRE-SAVE HOOK — totalCost accuracy check (all POs)');
  const allOrders = await PurchaseOrder.find({}, 'quantity pricePerUnit totalCost');
  let hookErrors = 0;
  for (const o of allOrders) {
    const expected = parseFloat((o.quantity * o.pricePerUnit).toFixed(10));
    if (Math.abs(o.totalCost - expected) > 0.01) hookErrors++;
  }
  console.log(`   ${allOrders.length} POs checked — hook errors: ${hookErrors}`);

  // ── 8. UsageHistory monsoon dip check ──────────────────────────────────
  console.log('\n🌧️   USAGE HISTORY — monsoon vs non-monsoon avg (cement, all sites)');
  const cementMat = await Material.findOne({ category: 'cement' });
  if (cementMat) {
    const monsoon = await UsageHistory.aggregate([
      { $match: { material: cementMat._id, $expr: { $and: [
        { $gte: [{ $month: '$date' }, 6] },
        { $lte: [{ $month: '$date' }, 9] },
      ]}}},
      { $group: { _id: null, avg: { $avg: '$quantityUsed' }, count: { $sum: 1 } } },
    ]);
    const nonMonsoon = await UsageHistory.aggregate([
      { $match: { material: cementMat._id, $expr: { $or: [
        { $lt: [{ $month: '$date' }, 6] },
        { $gt: [{ $month: '$date' }, 9] },
      ]}}},
      { $group: { _id: null, avg: { $avg: '$quantityUsed' }, count: { $sum: 1 } } },
    ]);
    const mAvg   = monsoon[0]?.avg?.toFixed(1)    ?? 'n/a';
    const nmAvg  = nonMonsoon[0]?.avg?.toFixed(1) ?? 'n/a';
    console.log(`   Monsoon    avg (Jun–Sep): ${mAvg}  bags/week  (n=${monsoon[0]?.count ?? 0})`);
    console.log(`   Non-monsoon avg:          ${nmAvg}  bags/week  (n=${nonMonsoon[0]?.count ?? 0})`);
    const ratio = (nonMonsoon[0]?.avg && monsoon[0]?.avg)
      ? (monsoon[0].avg / nonMonsoon[0].avg * 100).toFixed(1)
      : 'n/a';
    console.log(`   Monsoon is ~${ratio}% of non-monsoon (expected ~55%)`);
  }

  console.log('\n' + HR);
  console.log('✅  Verification complete');
  console.log(HR + '\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌  Verify failed:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
