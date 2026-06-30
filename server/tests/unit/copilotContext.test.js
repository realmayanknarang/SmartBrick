/**
 * server/tests/unit/copilotContext.test.js
 *
 * Unit tests for pure helper functions in copilotContext.js — Phase 12B
 * ─────────────────────────────────────────────────────────────────────────────
 * DECISION: gatherRelevantContext() is NOT tested here.
 *
 * Rationale: gatherRelevantContext() is the only EXPORTED function from
 * copilotContext.js.  All internal helper functions (formatRupees, percentUsed,
 * summarizeVendors, summarizeStockAlerts, etc.) are module-private (no export
 * keyword) and cannot be imported directly.
 *
 * gatherRelevantContext() makes five concurrent MongoDB queries (Vendor, Project,
 * PurchaseOrder, Site, Material) and calls fetchStockAlerts() / fetchBudgetAlerts()
 * which are themselves DB-dependent. Testing it in full requires a running
 * MongoDB instance — it belongs in 12C integration tests, NOT 12B unit tests.
 *
 * What IS tested here:
 *   • The pure input-sanitization behaviour visible via gatherRelevantContext's
 *     output contract when called with edge-case question strings — we stub
 *     the DB calls using Jest module mocks so no real MongoDB is needed.
 *
 * NOTE: We use jest.mock() to replace all DB-touching modules so this file
 * has zero real I/O and remains a true unit test.
 */

import { jest } from '@jest/globals';

// ── Mock all modules that touch the database ─────────────────────────────────
// These are set up BEFORE the module under test is imported (hoisting requirement)

jest.mock('../../models/Vendor.js', () => ({
  default: {
    find: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../models/Project.js', () => ({
  default: {
    find: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../models/PurchaseOrder.js', () => ({
  default: {
    find: jest.fn().mockReturnValue({
      sort:     jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean:     jest.fn().mockResolvedValue([]),
    }),
  },
}));

jest.mock('../../utils/alertData.js', () => ({
  fetchStockAlerts:  jest.fn().mockResolvedValue([]),
  fetchBudgetAlerts: jest.fn().mockResolvedValue([]),
}));

// ── Now import the module under test ────────────────────────────────────────
// Dynamic import is required here because Jest's module mocks must be registered
// before the module is evaluated, but the module uses top-level await is not
// possible in this context. We do a static import — mocks are hoisted by Jest.

import { gatherRelevantContext } from '../../utils/copilotContext.js';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('gatherRelevantContext() — question sanitization and output contract', () => {

  test('returns the expected shape with all required top-level fields', async () => {
    const result = await gatherRelevantContext('What are stock levels?');

    // Top-level structure
    expect(result).toHaveProperty('meta');
    expect(result).toHaveProperty('vendors');
    expect(result).toHaveProperty('stockAlerts');
    expect(result).toHaveProperty('budgetAlerts');
    expect(result).toHaveProperty('recentPurchaseOrders');
    expect(result).toHaveProperty('projects');
    expect(result).toHaveProperty('summaries');
    expect(result).toHaveProperty('promptSummary');

    // Meta shape
    expect(result.meta).toHaveProperty('gatheredAt');
    expect(result.meta).toHaveProperty('question');
    expect(result.meta.question).toBe('What are stock levels?');

    // Arrays are returned even when mocked DB returns empty
    expect(Array.isArray(result.vendors)).toBe(true);
    expect(Array.isArray(result.stockAlerts)).toBe(true);
  });

  test('question is trimmed and stored in meta.question', async () => {
    const result = await gatherRelevantContext('  Which vendors are reliable?  ');
    expect(result.meta.question).toBe('Which vendors are reliable?');
  });

  test('question is truncated at 500 characters', async () => {
    const longQuestion = 'x'.repeat(600);
    const result = await gatherRelevantContext(longQuestion);
    expect(result.meta.question.length).toBe(500);
  });

  test('a non-string question is handled gracefully (defaults to empty string)', async () => {
    const result = await gatherRelevantContext(null);
    expect(result.meta.question).toBe('');
  });

  test('called with no argument defaults question to empty string', async () => {
    const result = await gatherRelevantContext();
    expect(result.meta.question).toBe('');
  });

  test('promptSummary is a non-empty string containing section headers', async () => {
    const result = await gatherRelevantContext('test question');
    expect(typeof result.promptSummary).toBe('string');
    expect(result.promptSummary.length).toBeGreaterThan(0);
    // Should contain the section headers from the template
    expect(result.promptSummary).toContain('=== ACTIVE VENDORS');
    expect(result.promptSummary).toContain('=== STOCK ALERTS');
    expect(result.promptSummary).toContain('=== RECENT PURCHASE ORDERS');
    expect(result.promptSummary).toContain('=== PROJECT BUDGET STATUS');
  });

  test('summaries.vendors says "No active vendors" when DB returns empty', async () => {
    const result = await gatherRelevantContext();
    expect(result.summaries.vendors).toContain('No active vendors');
  });

  test('summaries.stockAlerts says no materials below threshold when DB returns empty', async () => {
    const result = await gatherRelevantContext();
    expect(result.summaries.stockAlerts).toContain('No sites currently have');
  });

  test('meta.gatheredAt is a valid ISO 8601 date string', async () => {
    const result = await gatherRelevantContext();
    const parsed = new Date(result.meta.gatheredAt);
    expect(isNaN(parsed.getTime())).toBe(false);
  });

});
