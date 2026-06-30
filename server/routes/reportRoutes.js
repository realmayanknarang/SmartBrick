/**
 * server/routes/reportRoutes.js
 *
 * Report Export API — Phase 11A
 * ─────────────────────────────────────────────────────────────────────────────
 * Packages existing real data (Phase 8A vendors, Phase 8C analytics) into
 * downloadable PDF and Excel files.  No new data sources — export logic only.
 *
 * Routes
 * ──────
 *   GET /api/reports/spending-pdf
 *     Spending summary PDF: total spend, by-category table, by-project table.
 *
 *   GET /api/reports/vendor-list-excel
 *     Active vendor list with scores as a .xlsx download.
 *
 * Both routes require requireAuth and return Content-Disposition: attachment
 * so browsers trigger a file download rather than inline display.
 */

import { Router }      from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import { reportLimiter } from '../middleware/rateLimiter.js';
import {
  generateSpendingPdf,
  generateVendorListExcel,
} from '../utils/reportGenerators.js';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/reports/spending-pdf
// ---------------------------------------------------------------------------

router.get('/spending-pdf', reportLimiter, requireAuth, async (_req, res) => {
  try {
    const pdfBuffer = await generateSpendingPdf();
    const filename  = `smartbrick-spending-report-${new Date().toISOString().slice(0, 10)}.pdf`;

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error('[GET /api/reports/spending-pdf] Error:', err);
    return res.status(500).json({
      error:   'Internal Server Error',
      message: 'Failed to generate spending PDF report.',
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/reports/vendor-list-excel
// ---------------------------------------------------------------------------

router.get('/vendor-list-excel', reportLimiter, requireAuth, async (_req, res) => {
  try {
    const xlsxBuffer = await generateVendorListExcel();
    const filename   = `smartbrick-vendor-list-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.set({
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      xlsxBuffer.length,
    });

    return res.send(xlsxBuffer);
  } catch (err) {
    console.error('[GET /api/reports/vendor-list-excel] Error:', err);
    return res.status(500).json({
      error:   'Internal Server Error',
      message: 'Failed to generate vendor list Excel report.',
    });
  }
});

export default router;
