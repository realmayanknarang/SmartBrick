/**
 * server/tests/unit/poolingCalculation.test.js
 *
 * Unit tests for getBulkDiscount() and estimatePooling() — Phase 12B
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests the Phase 11E pooling/discount arithmetic directly against known
 * inputs.  No database or network involved — pure function tests.
 *
 * Bulk discount rules (from poolingEstimator.js):
 *   cement:  tier1=300 bags (5%), tier2=600 bags (10%)
 *   steel:   tier1=5 tons (5%),   tier2=10 tons (10%)
 *   sand:    tier1=25 cu m (5%),  tier2=50 cu m (10%)
 *   bricks:  tier1=8000 pieces,   tier2=15000 pieces
 *   electrical / plumbing: tier1=250, tier2=500
 *
 * Threshold boundary tests target:
 *   • Just BELOW tier1 → 0% discount
 *   • Exactly AT tier1  → 5% discount
 *   • Between tiers     → 5% discount
 *   • Exactly AT tier2  → 10% discount
 *   • Well ABOVE tier2  → 10% discount (cap, not growing)
 */

import {
  getBulkDiscount,
  estimatePooling,
  POOLING_THRESHOLDS,
} from '../../utils/poolingEstimator.js';

// ─── getBulkDiscount() tests ──────────────────────────────────────────────────

describe('getBulkDiscount()', () => {

  // ── Cement thresholds (tier1=300, tier2=600) ──────────────────────────────

  describe('cement thresholds', () => {
    test('qty just BELOW tier1 (299) → 0% discount, no tier', () => {
      const result = getBulkDiscount('cement', 299);
      expect(result.discountRate).toBe(0);
      expect(result.discountLabel).toBe('0%');
      expect(result.tierReached).toBeNull();
    });

    test('qty exactly AT tier1 (300) → 5% discount, tier1', () => {
      const result = getBulkDiscount('cement', 300);
      expect(result.discountRate).toBe(0.05);
      expect(result.discountLabel).toBe('5%');
      expect(result.tierReached).toBe('tier1');
    });

    test('qty between tiers (450) → 5% discount, tier1', () => {
      const result = getBulkDiscount('cement', 450);
      expect(result.discountRate).toBe(0.05);
      expect(result.tierReached).toBe('tier1');
    });

    test('qty exactly AT tier2 (600) → 10% discount, tier2', () => {
      const result = getBulkDiscount('cement', 600);
      expect(result.discountRate).toBe(0.10);
      expect(result.discountLabel).toBe('10%');
      expect(result.tierReached).toBe('tier2');
    });

    test('qty well ABOVE tier2 (1200) → 10% discount (cap — not growing), tier2', () => {
      const result = getBulkDiscount('cement', 1200);
      expect(result.discountRate).toBe(0.10);
      expect(result.tierReached).toBe('tier2');
    });
  });

  // ── Steel thresholds (tier1=5, tier2=10) ──────────────────────────────────

  describe('steel thresholds', () => {
    test('qty 4.9 → 0%', () => {
      expect(getBulkDiscount('steel', 4.9).discountRate).toBe(0);
    });

    test('qty 5 (exactly tier1) → 5%', () => {
      expect(getBulkDiscount('steel', 5).discountRate).toBe(0.05);
    });

    test('qty 10 (exactly tier2) → 10%', () => {
      expect(getBulkDiscount('steel', 10).discountRate).toBe(0.10);
    });
  });

  // ── Unknown category ──────────────────────────────────────────────────────

  test('unknown category returns 0% with null tier', () => {
    const result = getBulkDiscount('unknownMaterial', 9999);
    expect(result.discountRate).toBe(0);
    expect(result.discountLabel).toBe('0%');
    expect(result.tierReached).toBeNull();
  });

  // ── Electrical / plumbing ─────────────────────────────────────────────────

  test('electrical at tier1 (250 units) → 5%', () => {
    expect(getBulkDiscount('electrical', 250).discountRate).toBe(0.05);
  });

  test('plumbing at tier2 (500 units) → 10%', () => {
    expect(getBulkDiscount('plumbing', 500).discountRate).toBe(0.10);
  });

});

// ─── estimatePooling() tests ──────────────────────────────────────────────────

describe('estimatePooling()', () => {

  // Helper to build a fake order object
  function makeOrder(quantity, totalCost, category = 'cement') {
    return { quantity, totalCost, material: { category } };
  }

  // ── Basic happy-path test with known values ───────────────────────────────

  test('two cement orders that together cross tier1 → 5% discount', () => {
    // 200 + 150 = 350 bags → tier1=300, so 5% discount
    const orders = [
      makeOrder(200, 200_000), // ₹2L for 200 bags
      makeOrder(150, 150_000), // ₹1.5L for 150 bags
    ];

    const result = estimatePooling(orders);

    expect(result.category).toBe('cement');
    expect(result.combinedQuantity).toBe(350);
    expect(result.costWithoutPooling).toBe(350_000);
    expect(result.discountRate).toBe(0.05);
    expect(result.discountLabel).toBe('5%');
    expect(result.tierReached).toBe('tier1');

    // savingsAmount = 350000 × 0.05 = 17500
    expect(result.savingsAmount).toBeCloseTo(17_500, 2);

    // costWithPooling = 350000 − 17500 = 332500
    expect(result.costWithPooling).toBeCloseTo(332_500, 2);

    expect(result.orderCount).toBe(2);
  });

  // ── Tier2 scenario ────────────────────────────────────────────────────────

  test('cement orders totalling exactly tier2 (600 bags) → 10% discount', () => {
    const orders = [
      makeOrder(300, 300_000),
      makeOrder(300, 300_000),
    ];

    const result = estimatePooling(orders);

    expect(result.combinedQuantity).toBe(600);
    expect(result.discountRate).toBe(0.10);

    // savingsAmount = 600000 × 0.10 = 60000
    expect(result.savingsAmount).toBeCloseTo(60_000, 2);
    expect(result.costWithPooling).toBeCloseTo(540_000, 2);
  });

  // ── Just BELOW tier1 → no savings ─────────────────────────────────────────

  test('cement orders totalling just below tier1 (299 bags) → 0% discount, no savings', () => {
    const orders = [
      makeOrder(149, 149_000),
      makeOrder(150, 150_000),
    ];

    const result = estimatePooling(orders);

    expect(result.combinedQuantity).toBe(299);
    expect(result.discountRate).toBe(0);
    expect(result.savingsAmount).toBe(0);
    expect(result.costWithPooling).toBe(result.costWithoutPooling);
    expect(result.tierReached).toBeNull();
  });

  // ── Cross-category rejection ──────────────────────────────────────────────

  test('orders from different categories throw an error', () => {
    const orders = [
      makeOrder(200, 100_000, 'cement'),
      makeOrder(5,   200_000, 'steel'),
    ];

    expect(() => estimatePooling(orders)).toThrow(/Cross-category pooling is not supported/);
  });

  // ── Empty orders array ────────────────────────────────────────────────────

  test('empty orders array throws an error', () => {
    expect(() => estimatePooling([])).toThrow(/At least one order is required/);
  });

  // ── Single order — confirms function handles length-1 correctly ───────────

  test('a single large order crossing tier2 still gets the discount applied', () => {
    const orders = [makeOrder(700, 700_000, 'cement')]; // 700 > tier2=600

    const result = estimatePooling(orders);

    expect(result.discountRate).toBe(0.10);
    expect(result.combinedQuantity).toBe(700);
    expect(result.savingsAmount).toBeCloseTo(70_000, 2);
    expect(result.orderCount).toBe(1);
  });

  // ── Threshold boundary: EXACTLY at tier1 for steel ───────────────────────

  test('steel orders totalling exactly tier1 (5 tons) → 5% discount', () => {
    const orders = [
      makeOrder(3, 150_000, 'steel'),
      makeOrder(2, 100_000, 'steel'),
    ];

    const result = estimatePooling(orders);

    expect(result.combinedQuantity).toBe(5);
    expect(result.discountRate).toBe(0.05);
    expect(result.savingsAmount).toBeCloseTo(12_500, 2); // 250000 × 0.05
  });

  // ── Thresholds object is returned in the result ───────────────────────────

  test('result contains the correct thresholds for the category', () => {
    const result = estimatePooling([makeOrder(350, 350_000, 'cement')]);

    expect(result.thresholds).toEqual(POOLING_THRESHOLDS.cement);
    expect(result.thresholds.tier1).toBe(300);
    expect(result.thresholds.tier2).toBe(600);
  });

});
