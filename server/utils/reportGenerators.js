/**
 * server/utils/reportGenerators.js
 *
 * Phase 11A — PDF and Excel report generators.
 *
 * Library choice (Node/Express, not Python):
 *   • PDF  — pdfkit (programmatic PDF; Node equivalent of Python ReportLab)
 *   • Excel — exceljs (native .xlsx generation)
 *
 * The original plan referenced ReportLab, which is Python-specific and does
 * not apply to this Express backend.
 */

import PDFDocument from 'pdfkit';
import ExcelJS     from 'exceljs';
import Vendor      from '../models/Vendor.js';
import { calculateVendorRank } from './vendorScoring.js';
import { fetchSpendingSummary } from './spendingAnalytics.js';

// ─── Formatting helpers ─────────────────────────────────────────────────────

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

function formatCategoryLabel(category) {
  if (!category) return 'Unknown';
  return category.charAt(0).toUpperCase() + category.slice(1);
}

// ─── Data fetchers ──────────────────────────────────────────────────────────

/**
 * Active vendors with composite scores — same logic as GET /api/vendors (sortBy=score).
 */
export async function fetchScoredVendorList() {
  const allVendors = await Vendor.find({ isActive: true }).lean();
  return allVendors
    .map(v => {
      const { compositeScore } = calculateVendorRank(v);
      return { ...v, compositeScore };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);
}

// ─── PDF: Spending Report ───────────────────────────────────────────────────

/**
 * Generates a spending summary PDF buffer from real MongoDB data.
 *
 * @returns {Promise<Buffer>}
 */
export async function generateSpendingPdf() {
  const { totalSpend, byCategory, byProject } = await fetchSpendingSummary();
  const generatedAt = new Date();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title block
    doc.fontSize(22).font('Helvetica-Bold').text('SmartBrick Spending Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#555555')
      .text(`Generated: ${generatedAt.toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}`, { align: 'center' });
    doc.moveDown(1.5);
    doc.fillColor('#000000');

    // Total spend
    doc.fontSize(14).font('Helvetica-Bold').text('Total Spend');
    doc.fontSize(18).font('Helvetica').text(formatCurrency(totalSpend));
    doc.moveDown(1.5);

    // Spend by category table
    doc.fontSize(14).font('Helvetica-Bold').text('Spend by Material Category');
    doc.moveDown(0.5);

    const catColX = 50;
    const catSpendX = 280;
    const catCountX = 420;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Category', catColX, doc.y, { continued: false });
    const catHeaderY = doc.y - 12;
    doc.text('Spend', catSpendX, catHeaderY);
    doc.text('Orders', catCountX, catHeaderY);
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(0.3);

    doc.font('Helvetica');
    if (byCategory.length === 0) {
      doc.text('No purchase order data available.');
    } else {
      for (const row of byCategory) {
        const rowY = doc.y;
        doc.text(formatCategoryLabel(row.category), catColX, rowY);
        doc.text(formatCurrency(row.spend), catSpendX, rowY);
        doc.text(String(row.count), catCountX, rowY);
        doc.moveDown(0.5);
      }
    }

    doc.moveDown(1);

    // Spend by project table
    doc.fontSize(14).font('Helvetica-Bold').text('Spend by Project');
    doc.moveDown(0.5);

    const projColX = 50;
    const projSpendX = 320;
    const projCountX = 450;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Project', projColX, doc.y, { continued: false });
    const projHeaderY = doc.y - 12;
    doc.text('Spend', projSpendX, projHeaderY);
    doc.text('Orders', projCountX, projHeaderY);
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(0.3);

    doc.font('Helvetica');
    if (byProject.length === 0) {
      doc.text('No purchase order data available.');
    } else {
      for (const row of byProject) {
        const rowY = doc.y;
        doc.text(row.projectName ?? 'Unknown', projColX, rowY, { width: 250 });
        doc.text(formatCurrency(row.spend), projSpendX, rowY);
        doc.text(String(row.orderCount), projCountX, rowY);
        doc.moveDown(0.5);
      }
    }

    doc.end();
  });
}

// ─── Excel: Vendor List ─────────────────────────────────────────────────────

/**
 * Generates a vendor list Excel workbook buffer from real MongoDB data.
 *
 * @returns {Promise<Buffer>}
 */
export async function generateVendorListExcel() {
  const vendors = await fetchScoredVendorList();
  const generatedAt = new Date();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SmartBrick';
  workbook.created = generatedAt;

  const sheet = workbook.addWorksheet('Vendor List');

  sheet.columns = [
    { header: 'Name',            key: 'name',            width: 28 },
    { header: 'Category',        key: 'category',        width: 14 },
    { header: 'City',            key: 'city',            width: 16 },
    { header: 'Price/Unit',      key: 'pricePerUnit',    width: 14 },
    { header: 'Composite Score', key: 'compositeScore',  width: 16 },
    { header: 'Reliability',     key: 'reliabilityScore', width: 14 },
    { header: 'Delivery',        key: 'deliveryScore',   width: 12 },
    { header: 'Quality',         key: 'qualityScore',    width: 12 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type:    'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A5F' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  for (const v of vendors) {
    sheet.addRow({
      name:             v.name,
      category:         formatCategoryLabel(v.category),
      city:             v.city,
      pricePerUnit:     v.pricePerUnit,
      compositeScore:   v.compositeScore,
      reliabilityScore: v.reliabilityScore,
      deliveryScore:    v.deliveryScore,
      qualityScore:     v.qualityScore,
    });
  }

  // Format price column as currency
  sheet.getColumn('pricePerUnit').numFmt = '#,##0.00';
  sheet.getColumn('compositeScore').numFmt = '0.00';

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
