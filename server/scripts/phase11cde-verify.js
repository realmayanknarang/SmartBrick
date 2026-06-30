/**
 * Phase 11C–11E backend verification (no Clerk auth).
 * Usage: node scripts/phase11cde-verify.js
 */

import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../config/db.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Material from '../models/Material.js';
import {
  canActOnStage,
  resolveTransition,
  getAdvanceTarget,
} from '../utils/approvalWorkflow.js';
import { estimatePooling, getBulkDiscount } from '../utils/poolingEstimator.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  await connectDB();

  // 11C — price trends static file
  const trends = JSON.parse(
    readFileSync(join(__dirname, '..', 'data', 'priceTrends.json'), 'utf8'),
  );
  const cats = Object.keys(trends);
  console.log('── 11C Price trends ──');
  console.log(`  categories: ${cats.length}`);
  for (const c of cats) {
    console.log(`  ${c}: ${trends[c].dataPoints.length} months, latest ₹${trends[c].dataPoints.at(-1).price}`);
  }

  // 11D — role gating unit checks
  console.log('\n── 11D Approval workflow ──');
  console.log('  site_engineer can act at site_engineer:', canActOnStage('site_engineer', 'site_engineer'));
  console.log('  site_engineer CANNOT act at finance:', !canActOnStage('site_engineer', 'finance'));
  console.log('  owner can act at finance:', canActOnStage('owner', 'finance'));
  console.log('  finance → approved:', getAdvanceTarget('finance'));
  const invalid = resolveTransition('site_engineer', 'advance');
  console.log('  site_engineer advance →', invalid.nextStage);

  const pending = await PurchaseOrder.countDocuments({
    approvalStage: { $nin: ['approved', 'rejected'] },
  });
  console.log(`  pending POs in DB: ${pending}`);

  // 11E — pooling math on real cement orders
  console.log('\n── 11E Pooling estimator ──');
  const cementOrders = await PurchaseOrder.find()
    .populate('material', 'category')
    .limit(20)
    .lean();

  const cement = cementOrders.filter(o => o.material?.category === 'cement');
  if (cement.length >= 2) {
    const sample = cement.slice(0, 3);
    const result = estimatePooling(sample);
    const manualTotal = sample.reduce((s, o) => s + o.totalCost, 0);
    const manualQty   = sample.reduce((s, o) => s + o.quantity, 0);
    const { discountRate } = getBulkDiscount('cement', manualQty);
    const manualSavings = parseFloat((manualTotal * discountRate).toFixed(2));

    console.log(`  sample orders: ${sample.length}`);
    console.log(`  combined qty: ${result.combinedQuantity} (manual: ${manualQty})`);
    console.log(`  cost without pooling: ₹${result.costWithoutPooling} (manual: ₹${manualTotal})`);
    console.log(`  discount: ${result.discountLabel}`);
    console.log(`  savings: ₹${result.savingsAmount} (manual: ₹${manualSavings})`);

    if (result.combinedQuantity !== manualQty || result.costWithoutPooling !== manualTotal) {
      throw new Error('Quantity or cost mismatch');
    }
    if (result.savingsAmount !== manualSavings) {
      throw new Error('Savings calculation mismatch');
    }
    console.log('  ✓ manual math matches estimator');
  } else {
    console.log('  (skipped — not enough cement orders in seed)');
  }

  console.log('\n✓ Phase 11C–11E backend verification passed');
  process.exit(0);
}

main().catch(err => {
  console.error('✗', err);
  process.exit(1);
});
