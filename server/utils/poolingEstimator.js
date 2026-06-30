/**
 * server/utils/poolingEstimator.js
 *
 * Order Pooling Estimator — Phase 11E
 * ─────────────────────────────────────────────────────────────────────────────
 * Genuine arithmetic on real PurchaseOrder data.  Pooling is hypothetical —
 * no orders are merged in the database.
 *
 * BULK DISCOUNT RULE (documented business assumption):
 *   Pooling only applies within a SINGLE material category.
 *   Combined quantity is summed across selected orders.
 *
 *   Per-category quantity thresholds:
 *     Tier 1 — combined qty ≥ tier1 → 5% bulk discount
 *     Tier 2 — combined qty ≥ tier2 → 10% bulk discount
 *     Below tier1 → 0% discount (no savings from pooling)
 *
 *   Thresholds reflect typical bulk-order breakpoints in Indian construction:
 *     cement: 300/600 bags, steel: 5/10 tons, sand: 25/50 cu m,
 *     bricks: 8000/15000 pieces, electrical/plumbing: 250/500 units
 */

export const POOLING_THRESHOLDS = {
  cement:     { tier1: 300,   tier2: 600,   unit: 'bags' },
  steel:      { tier1: 5,     tier2: 10,    unit: 'tons' },
  sand:       { tier1: 25,    tier2: 50,    unit: 'cu m' },
  bricks:     { tier1: 8000,  tier2: 15000, unit: 'pieces' },
  electrical: { tier1: 250,   tier2: 500,   unit: 'units' },
  plumbing:   { tier1: 250,   tier2: 500,   unit: 'units' },
};

/**
 * @param {string} category
 * @param {number} combinedQuantity
 * @returns {{ discountRate: number, discountLabel: string, tierReached: string|null }}
 */
export function getBulkDiscount(category, combinedQuantity) {
  const thresholds = POOLING_THRESHOLDS[category];
  if (!thresholds) {
    return { discountRate: 0, discountLabel: '0%', tierReached: null };
  }

  if (combinedQuantity >= thresholds.tier2) {
    return { discountRate: 0.10, discountLabel: '10%', tierReached: 'tier2' };
  }
  if (combinedQuantity >= thresholds.tier1) {
    return { discountRate: 0.05, discountLabel: '5%', tierReached: 'tier1' };
  }

  return { discountRate: 0, discountLabel: '0%', tierReached: null };
}

/**
 * @param {Array<{ quantity: number, totalCost: number, material?: { category: string } }>} orders
 * @returns {{
 *   category: string,
 *   combinedQuantity: number,
 *   costWithoutPooling: number,
 *   discountRate: number,
 *   discountLabel: string,
 *   tierReached: string|null,
 *   savingsAmount: number,
 *   costWithPooling: number,
 *   orderCount: number,
 *   thresholds: object,
 * }}
 */
export function estimatePooling(orders) {
  if (!orders.length) {
    throw new Error('At least one order is required.');
  }

  const categories = [...new Set(
    orders.map(o => o.material?.category ?? o.category).filter(Boolean),
  )];

  if (categories.length !== 1) {
    throw new Error(
      `Cross-category pooling is not supported. Selected orders span: ${categories.join(', ')}.`,
    );
  }

  const category = categories[0];
  const combinedQuantity   = orders.reduce((sum, o) => sum + o.quantity, 0);
  const costWithoutPooling = orders.reduce((sum, o) => sum + o.totalCost, 0);

  const { discountRate, discountLabel, tierReached } = getBulkDiscount(category, combinedQuantity);
  const savingsAmount  = parseFloat((costWithoutPooling * discountRate).toFixed(2));
  const costWithPooling = parseFloat((costWithoutPooling - savingsAmount).toFixed(2));

  return {
    category,
    combinedQuantity,
    costWithoutPooling,
    discountRate,
    discountLabel,
    tierReached,
    savingsAmount,
    costWithPooling,
    orderCount: orders.length,
    thresholds: POOLING_THRESHOLDS[category] ?? null,
  };
}
