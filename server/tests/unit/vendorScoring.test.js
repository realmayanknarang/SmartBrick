/**
 * server/tests/unit/vendorScoring.test.js
 *
 * Unit tests for calculateVendorRank() — Phase 12B
 * ─────────────────────────────────────────────────────────────────────────────
 * These tests exercise the pure scoring function with no database or network
 * involved.  They cover:
 *   1. A high-reliability vendor with no delays scores high
 *   2. A vendor with many past delays scores lower
 *   3. Score clamping — never exceeds 100 or drops below 0
 *   4. The penalty cap — pastDelays beyond the cap don't keep reducing the score
 *   5. Missing fields default gracefully to 0
 *   6. The breakdown object is populated correctly
 *
 * Formula recap (from vendorScoring.js):
 *   baseScore  = (reliabilityScore × 0.40) + (deliveryScore × 0.35) + (qualityScore × 0.25)
 *   penalty    = min(pastDelays × 1.5, 20)
 *   finalScore = clamp(baseScore − penalty, 0, 100)
 */

import { calculateVendorRank } from '../../utils/vendorScoring.js';

// ─── Test helpers ──────────────────────────────────────────────────────────────

/**
 * Build a vendor object with sensible defaults so individual tests only need
 * to specify the fields they care about.
 */
function makeVendor(overrides = {}) {
  return {
    reliabilityScore:     80,
    deliveryScore:        80,
    qualityScore:         80,
    pastDelays:           0,
    totalOrdersCompleted: 50,
    ...overrides,
  };
}

// ─── Test suite ────────────────────────────────────────────────────────────────

describe('calculateVendorRank()', () => {

  // ── 1. Perfect vendor ─────────────────────────────────────────────────────

  test('a perfect vendor (all scores 100, no delays) scores 100', () => {
    const result = calculateVendorRank(makeVendor({
      reliabilityScore: 100,
      deliveryScore:    100,
      qualityScore:     100,
      pastDelays:       0,
    }));

    expect(result.compositeScore).toBe(100);
    expect(result.breakdown.baseScore).toBe(100);
    expect(result.breakdown.delayPenalty).toBe(0);
  });

  // ── 2. High-reliability vendor with no delays scores high ─────────────────

  test('a high-reliability vendor with no delays receives a high score', () => {
    const result = calculateVendorRank(makeVendor({
      reliabilityScore: 95,
      deliveryScore:    90,
      qualityScore:     85,
      pastDelays:       0,
    }));

    // Hand-calculated:
    // baseScore = 95×0.40 + 90×0.35 + 85×0.25 = 38 + 31.5 + 21.25 = 90.75
    // penalty   = 0
    // final     = 90.75
    expect(result.compositeScore).toBeCloseTo(90.75, 2);
    expect(result.compositeScore).toBeGreaterThan(85);
  });

  // ── 3. Vendor with many past delays scores lower ──────────────────────────

  test('a vendor with 5 past delays scores lower than the same vendor with 0 delays', () => {
    const baseVendor = {
      reliabilityScore: 80,
      deliveryScore:    80,
      qualityScore:     80,
    };

    const withNoDelays    = calculateVendorRank(makeVendor({ ...baseVendor, pastDelays: 0 }));
    const withFiveDelays  = calculateVendorRank(makeVendor({ ...baseVendor, pastDelays: 5 }));

    // Penalty for 5 delays = 5 × 1.5 = 7.5 points
    expect(withFiveDelays.compositeScore).toBeLessThan(withNoDelays.compositeScore);
    expect(withNoDelays.compositeScore - withFiveDelays.compositeScore).toBeCloseTo(7.5, 2);
  });

  // ── 4. Delay penalty is capped at 20 points ───────────────────────────────

  test('the delay penalty is capped at 20 regardless of how many past delays exist', () => {
    // 14 delays × 1.5 = 21 → should be capped at 20
    const result14 = calculateVendorRank(makeVendor({ pastDelays: 14 }));
    // 100 delays × 1.5 = 150 → should still be capped at 20
    const result100 = calculateVendorRank(makeVendor({ pastDelays: 100 }));

    expect(result14.breakdown.delayPenalty).toBe(20);
    expect(result100.breakdown.delayPenalty).toBe(20);
    // Both should produce the same final score because the penalty is the same
    expect(result14.compositeScore).toBe(result100.compositeScore);
  });

  // ── 5. Score never goes below 0 (lower-bound clamp) ──────────────────────

  test('score is clamped to 0 even with extreme inputs that would go negative', () => {
    // All scores 0, maximum delays — raw score would be 0 − 20 = −20
    const result = calculateVendorRank(makeVendor({
      reliabilityScore: 0,
      deliveryScore:    0,
      qualityScore:     0,
      pastDelays:       999, // well past the penalty cap
    }));

    expect(result.compositeScore).toBe(0);
    expect(result.compositeScore).toBeGreaterThanOrEqual(0);
  });

  // ── 6. Score never exceeds 100 (upper-bound clamp) ───────────────────────

  test('score is clamped to 100 even if somehow computed above it', () => {
    // All scores at maximum; there is no mechanism to exceed 100 but confirm clamp exists
    const result = calculateVendorRank(makeVendor({
      reliabilityScore: 100,
      deliveryScore:    100,
      qualityScore:     100,
      pastDelays:       0,
    }));

    expect(result.compositeScore).toBeLessThanOrEqual(100);
  });

  // ── 7. Breakdown fields are populated correctly ──────────────────────────

  test('the breakdown object contains all expected fields with correct values', () => {
    const vendor = {
      reliabilityScore:     80,
      deliveryScore:        70,
      qualityScore:         60,
      pastDelays:           4,
      totalOrdersCompleted: 120,
    };
    const result = calculateVendorRank(vendor);
    const { breakdown } = result;

    // Weights
    expect(breakdown.weights.reliability).toBe(0.40);
    expect(breakdown.weights.delivery).toBe(0.35);
    expect(breakdown.weights.quality).toBe(0.25);

    // Contributions (hand-calculated)
    expect(breakdown.reliabilityContribution).toBeCloseTo(80 * 0.40, 2); // 32
    expect(breakdown.deliveryContribution).toBeCloseTo(70 * 0.35, 2);    // 24.5
    expect(breakdown.qualityContribution).toBeCloseTo(60 * 0.25, 2);     // 15

    // Base score
    expect(breakdown.baseScore).toBeCloseTo(32 + 24.5 + 15, 2); // 71.5

    // Delay penalty: 4 × 1.5 = 6 (not capped)
    expect(breakdown.delayPenalty).toBeCloseTo(6, 2);

    // Raw score before clamping
    expect(breakdown.rawScore).toBeCloseTo(71.5 - 6, 2); // 65.5

    // Final composite score == raw score when in [0, 100]
    expect(result.compositeScore).toBeCloseTo(65.5, 2);

    // totalOrdersCompleted passes through
    expect(breakdown.totalOrdersCompleted).toBe(120);
  });

  // ── 8. Missing fields default to 0 ─────────────────────────────────────

  test('missing vendor fields default to 0 without throwing', () => {
    // Empty object — all fields missing
    expect(() => calculateVendorRank({})).not.toThrow();

    const result = calculateVendorRank({});
    expect(result.compositeScore).toBe(0);
    expect(result.breakdown.baseScore).toBe(0);
    expect(result.breakdown.delayPenalty).toBe(0);
  });

  // ── 9. Verify the test IS meaningful — clamping code ────────────────────
  //
  // The spec requires us to confirm the test WOULD fail if we temporarily
  // removed the clamping.  We do this directly here by testing with an
  // input that would go negative WITHOUT clamping and checking the
  // compositeScore is not negative (which proves the clamp is doing work).

  test('INTEGRITY CHECK: compositeScore is never negative even for adversarial input', () => {
    // If clamp() were removed, raw score = 0 - 20 = -20
    const adversarial = calculateVendorRank({
      reliabilityScore: 0,
      deliveryScore:    0,
      qualityScore:     0,
      pastDelays:       100,
    });

    // Without the clamp the raw score would be -20; with it, it must be 0.
    expect(adversarial.breakdown.rawScore).toBe(-20);
    expect(adversarial.compositeScore).toBe(0);  // This is the proof-of-clamp assertion
  });

});
