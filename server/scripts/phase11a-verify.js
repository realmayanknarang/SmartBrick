/**
 * Phase 11A verification — generates report files directly from MongoDB
 * (bypasses Clerk auth; tests the generator layer and data correctness).
 *
 * Usage: node scripts/phase11a-verify.js
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

import connectDB from '../config/db.js';
import { fetchSpendingSummary } from '../utils/spendingAnalytics.js';
import {
  generateSpendingPdf,
  generateVendorListExcel,
  fetchScoredVendorList,
} from '../utils/reportGenerators.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', '..', '.phase11-verify');

async function main() {
  await connectDB();

  const summary = await fetchSpendingSummary();
  console.log('── Spending summary (from MongoDB) ──');
  console.log(`  totalSpend: ₹${summary.totalSpend.toLocaleString('en-IN')}`);
  console.log(`  categories: ${summary.byCategory.length}`);
  console.log(`  projects:   ${summary.byProject.length}`);

  const vendors = await fetchScoredVendorList();
  console.log('\n── Vendor list ──');
  console.log(`  active vendors: ${vendors.length}`);
  if (vendors[0]) {
    console.log(`  top vendor: ${vendors[0].name} (score ${vendors[0].compositeScore})`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pdfPath  = path.join(OUT_DIR, 'spending-report.pdf');
  const xlsxPath = path.join(OUT_DIR, 'vendor-list.xlsx');

  const pdfBuffer  = await generateSpendingPdf();
  const xlsxBuffer = await generateVendorListExcel();

  fs.writeFileSync(pdfPath, pdfBuffer);
  fs.writeFileSync(xlsxPath, xlsxBuffer);

  console.log('\n── Generated files ──');
  console.log(`  PDF:  ${pdfPath} (${pdfBuffer.length} bytes)`);
  console.log(`  XLSX: ${xlsxPath} (${xlsxBuffer.length} bytes)`);

  // Basic sanity checks
  if (pdfBuffer.slice(0, 4).toString() !== '%PDF') {
    throw new Error('PDF buffer does not start with %PDF magic bytes');
  }
  if (xlsxBuffer[0] !== 0x50 || xlsxBuffer[1] !== 0x4b) {
    throw new Error('XLSX buffer does not start with PK zip magic bytes');
  }

  console.log('\n✓ Phase 11A generator verification passed');
  process.exit(0);
}

main().catch(err => {
  console.error('✗ Verification failed:', err);
  process.exit(1);
});
