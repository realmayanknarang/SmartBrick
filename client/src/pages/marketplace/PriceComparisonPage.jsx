/**
 * client/src/pages/marketplace/PriceComparisonPage.jsx
 *
 * Material Price Comparison Page — Phase M6D.
 * Route: /marketplace/compare?ids=id1,id2,id3 (role-agnostic, protected)
 *
 * Reads up to 3 material IDs from the `ids` query param.
 * Guard: fewer than 2 valid IDs → show guard message.
 *
 * DESKTOP: Structured comparison table
 *   • Header row — one column per material (image, name, brand, vendor)
 *   • Attribute rows — Category, Price, Unit, Stock, Delivery, Vendor, Location
 *   • Highlight logic:
 *       Price  → lowest  = green cell, highest = red/amber cell
 *       Stock  → highest = green cell, lowest  = red/amber cell
 *       Equal values on all → no highlighting
 *
 * MOBILE (< 640px): Card-per-material layout
 *   • One card per material with all attributes listed vertically
 *   • "Best Price" badge on the lowest-price material
 *
 * Footer: "Compare Others" button → back to Browse
 */

import { Fragment, useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import apiClient from '../../api/client';
import './PriceComparisonPage.css';

// ─── Category colour map ──────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  cement:     { bg: 'rgba(107,114,128,0.22)', color: '#9ca3af', border: 'rgba(107,114,128,0.4)' },
  steel:      { bg: 'rgba(74,144,217,0.22)',  color: '#4A90D9', border: 'rgba(74,144,217,0.4)' },
  sand:       { bg: 'rgba(245,158,11,0.22)',  color: '#f59e0b', border: 'rgba(245,158,11,0.4)' },
  bricks:     { bg: 'rgba(239,68,68,0.22)',   color: '#ef4444', border: 'rgba(239,68,68,0.4)' },
  electrical: { bg: 'rgba(234,179,8,0.22)',   color: '#eab308', border: 'rgba(234,179,8,0.4)' },
  plumbing:   { bg: 'rgba(20,184,166,0.22)',  color: '#14b8a6', border: 'rgba(20,184,166,0.4)' },
  paint:      { bg: 'rgba(168,85,247,0.22)',  color: '#a855f7', border: 'rgba(168,85,247,0.4)' },
  flooring:   { bg: 'rgba(180,83,9,0.22)',    color: '#b45309', border: 'rgba(180,83,9,0.4)' },
  other:      { bg: 'rgba(100,116,139,0.22)', color: '#94a3b8', border: 'rgba(100,116,139,0.4)' },
};

// ─── Category icon placeholder ────────────────────────────────────────────────

function CategoryIcon({ category, size = 40 }) {
  const color = CATEGORY_COLORS[category]?.color || '#94a3b8';
  switch (category) {
    case 'cement':
    case 'sand':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'steel':
    case 'bricks':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      );
    case 'electrical':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'plumbing':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14" /><path d="M5 12a7 7 0 0 1 7-7v0a7 7 0 0 1 7 7" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'paint':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 3H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
          <path d="M12 11v4" /><path d="M8 15h8" /><circle cx="12" cy="19" r="2" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
  }
}

// ─── Highlight classification helpers ─────────────────────────────────────────
// Returns 'best' | 'worst' | 'mid' | 'neutral' for a value within an array.
// neutral = all values equal (no highlighting).

function classifyPrice(value, allValues) {
  const nums = allValues.filter(v => typeof v === 'number' && isFinite(v));
  if (nums.length < 2) return 'neutral';
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) return 'neutral';       // all equal
  if (value === min) return 'best';        // lowest price = best
  if (value === max) return 'worst';       // highest price = worst
  return 'mid';
}

function classifyStock(value, allValues) {
  const nums = allValues.filter(v => typeof v === 'number' && isFinite(v));
  if (nums.length < 2) return 'neutral';
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) return 'neutral';       // all equal
  if (value === max) return 'best';        // highest stock = best
  if (value === min) return 'worst';       // lowest stock = worst
  return 'mid';
}

// ─── Cell highlight classes ───────────────────────────────────────────────────

function highlightClass(rank) {
  if (rank === 'best')  return 'pcp-cell--best';
  if (rank === 'worst') return 'pcp-cell--worst';
  return '';
}

// ─── Skeleton Table ───────────────────────────────────────────────────────────

function SkeletonTable({ count }) {
  return (
    <div className="pcp-skeleton-wrap">
      <div className="pcp-skeleton-header">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="pcp-skeleton-header-col">
            <div className="pcp-skeleton-img pcp-pulse" />
            <div className="pcp-skeleton-line pcp-pulse" style={{ width: '70%', height: '18px' }} />
            <div className="pcp-skeleton-line pcp-pulse" style={{ width: '50%', height: '13px' }} />
          </div>
        ))}
      </div>
      {[1, 2, 3, 4, 5].map(row => (
        <div key={row} className="pcp-skeleton-row">
          <div className="pcp-skeleton-row-label pcp-pulse" />
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="pcp-skeleton-row-cell pcp-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Guard / Empty State ──────────────────────────────────────────────────────

function GuardState({ message }) {
  return (
    <div className="pcp-guard" id="pcp-guard-message">
      <div className="pcp-guard__icon" aria-hidden="true">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-on-dark-muted, #9FB0BC)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
        </svg>
      </div>
      <p className="pcp-guard__text">{message}</p>
      <Link to="/marketplace/builder/materials">
        <Button variant="primary" id="pcp-browse-materials-btn">Browse Materials</Button>
      </Link>
    </div>
  );
}

// ─── Desktop Comparison Table ─────────────────────────────────────────────────

function ComparisonTable({ materials }) {
  const count = materials.length;
  const prices  = materials.map(m => m.pricePerUnit);
  const stocks  = materials.map(m => m.stock);
  const lowestPrice = Math.min(...prices);

  const ROWS = [
    {
      key:    'category',
      label:  'Category',
      render: (m) => {
        const cat = CATEGORY_COLORS[m.category] || CATEGORY_COLORS.other;
        return (
          <span
            className="pcp-category-badge"
            style={{
              backgroundColor: cat.bg,
              color:           cat.color,
              border:          `1px solid ${cat.border}`,
            }}
          >
            {m.category}
          </span>
        );
      },
      rank: () => 'neutral',   // categories are descriptive, no highlighting
    },
    {
      key:    'price',
      label:  'Price / Unit (₹)',
      render: (m) => (
        <span className="pcp-price-value">
          ₹{m.pricePerUnit.toLocaleString('en-IN')}
          <span className="pcp-price-unit"> {m.unit}</span>
        </span>
      ),
      rank: (m) => classifyPrice(m.pricePerUnit, prices),
    },
    {
      key:    'unit',
      label:  'Unit',
      render: (m) => m.unit,
      rank:   () => 'neutral',
    },
    {
      key:    'stock',
      label:  'Stock Available',
      render: (m) => {
        if (m.stock === 0) return <span className="pcp-stock pcp-stock--out">Out of stock</span>;
        if (m.stock <= 10) return <span className="pcp-stock pcp-stock--low">Low — {m.stock} {m.unit}</span>;
        return <span className="pcp-stock pcp-stock--ok">{m.stock} {m.unit}</span>;
      },
      rank: (m) => classifyStock(m.stock, stocks),
    },
    {
      key:    'delivery',
      label:  'Delivery Time',
      render: (m) => m.deliveryTime || <em className="pcp-muted">Not specified</em>,
      rank:   () => 'neutral',
    },
    {
      key:    'vendor',
      label:  'Vendor Name',
      render: (m) => m.vendor?.name || 'Unknown Vendor',
      rank:   () => 'neutral',
    },
    {
      key:    'location',
      label:  'Vendor Location',
      render: (m) => m.vendor?.city || <em className="pcp-muted">Not listed</em>,
      rank:   () => 'neutral',
    },
  ];

  return (
    <div className="pcp-table-wrap">
      <div
        className="pcp-table"
        style={{ gridTemplateColumns: `180px repeat(${count}, 1fr)` }}
        role="table"
        aria-label="Material price comparison"
      >
        {/* ── HEADER ROW ── */}
        {/* Empty label cell */}
        <div className="pcp-th pcp-th--label" role="columnheader" aria-label="Attribute" />

        {materials.map((m, i) => {
          const imageUrl = m.images?.[0]?.url;
          const catColors = CATEGORY_COLORS[m.category] || CATEGORY_COLORS.other;
          const isLowest  = m.pricePerUnit === lowestPrice && count >= 2;
          const allEqual  = prices.every(p => p === lowestPrice);

          return (
            <div
              key={m._id}
              className={`pcp-th${isLowest && !allEqual ? ' pcp-th--best' : ''}`}
              role="columnheader"
            >
              {isLowest && !allEqual && (
                <div className="pcp-best-tag" aria-label="Best price">
                  ⭐ Best Price
                </div>
              )}
              {imageUrl ? (
                <div className="pcp-th__img-wrap">
                  <img
                    src={imageUrl}
                    alt={m.name}
                    className="pcp-th__img"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              ) : (
                <div className="pcp-th__img-placeholder">
                  <CategoryIcon category={m.category} size={36} />
                </div>
              )}
              <h3 className="pcp-th__name">{m.name}</h3>
              {m.brand && <p className="pcp-th__brand">{m.brand}</p>}
              <p className="pcp-th__vendor">{m.vendor?.name || 'Unknown Vendor'}</p>
            </div>
          );
        })}

        {/* ── ATTRIBUTE ROWS ── */}
        {ROWS.map((row) => (
          <Fragment key={row.key}>
            {/* Label cell */}
            <div className="pcp-td pcp-td--label" role="rowheader">
              {row.label}
            </div>

            {/* Value cells */}
            {materials.map((m) => {
              const rank = row.rank(m);
              return (
                <div
                  key={m._id}
                  className={`pcp-td ${highlightClass(rank)}`}
                  role="cell"
                >
                  {row.render(m)}
                  {rank === 'best' && row.key === 'price' && (
                    <span className="pcp-td__indicator pcp-td__indicator--best" aria-label="Lowest price">↓ Lowest</span>
                  )}
                  {rank === 'worst' && row.key === 'price' && (
                    <span className="pcp-td__indicator pcp-td__indicator--worst" aria-label="Highest price">↑ Highest</span>
                  )}
                  {rank === 'best' && row.key === 'stock' && (
                    <span className="pcp-td__indicator pcp-td__indicator--best" aria-label="Most in stock">↑ Most</span>
                  )}
                  {rank === 'worst' && row.key === 'stock' && (
                    <span className="pcp-td__indicator pcp-td__indicator--worst" aria-label="Least in stock">↓ Least</span>
                  )}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile Card View ─────────────────────────────────────────────────────────

function MobileCards({ materials }) {
  const prices = materials.map(m => m.pricePerUnit);
  const lowestPrice = Math.min(...prices);
  const allEqual = prices.every(p => p === lowestPrice);

  return (
    <div className="pcp-mobile-cards">
      {materials.map((m) => {
        const catColors = CATEGORY_COLORS[m.category] || CATEGORY_COLORS.other;
        const imageUrl  = m.images?.[0]?.url;
        const isBest    = m.pricePerUnit === lowestPrice && !allEqual;

        return (
          <div key={m._id} className={`pcp-mobile-card${isBest ? ' pcp-mobile-card--best' : ''}`}>
            {isBest && (
              <div className="pcp-mobile-card__best-tag">⭐ Best Price</div>
            )}

            {/* Image */}
            {imageUrl ? (
              <div className="pcp-mobile-card__img-wrap">
                <img src={imageUrl} alt={m.name} className="pcp-mobile-card__img"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            ) : (
              <div className="pcp-mobile-card__img-placeholder">
                <CategoryIcon category={m.category} size={36} />
              </div>
            )}

            {/* Header */}
            <div className="pcp-mobile-card__header">
              <span
                className="pcp-category-badge"
                style={{
                  backgroundColor: catColors.bg,
                  color:           catColors.color,
                  border:          `1px solid ${catColors.border}`,
                }}
              >
                {m.category}
              </span>
              <h3 className="pcp-mobile-card__name">{m.name}</h3>
              {m.brand && <p className="pcp-mobile-card__brand">{m.brand}</p>}
            </div>

            {/* Attributes */}
            <div className="pcp-mobile-card__attrs">
              <div className={`pcp-mobile-attr pcp-mobile-attr--price${isBest ? ' pcp-mobile-attr--price-best' : ''}`}>
                <span className="pcp-mobile-attr__label">Price</span>
                <span className="pcp-mobile-attr__value pcp-price-value">
                  ₹{m.pricePerUnit.toLocaleString('en-IN')}
                  <span className="pcp-price-unit"> {m.unit}</span>
                </span>
              </div>

              <div className="pcp-mobile-attr">
                <span className="pcp-mobile-attr__label">Stock</span>
                <span className="pcp-mobile-attr__value">
                  {m.stock === 0
                    ? <span className="pcp-stock pcp-stock--out">Out of stock</span>
                    : m.stock <= 10
                      ? <span className="pcp-stock pcp-stock--low">Low — {m.stock} {m.unit}</span>
                      : <span className="pcp-stock pcp-stock--ok">{m.stock} {m.unit}</span>
                  }
                </span>
              </div>

              <div className="pcp-mobile-attr">
                <span className="pcp-mobile-attr__label">Delivery</span>
                <span className="pcp-mobile-attr__value">
                  {m.deliveryTime || <em className="pcp-muted">Not specified</em>}
                </span>
              </div>

              <div className="pcp-mobile-attr">
                <span className="pcp-mobile-attr__label">Vendor</span>
                <span className="pcp-mobile-attr__value">{m.vendor?.name || 'Unknown'}</span>
              </div>

              {m.vendor?.city && (
                <div className="pcp-mobile-attr">
                  <span className="pcp-mobile-attr__label">Location</span>
                  <span className="pcp-mobile-attr__value">{m.vendor.city}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="pcp-legend" role="note" aria-label="Comparison legend">
      <div className="pcp-legend__item">
        <span className="pcp-legend__swatch pcp-legend__swatch--best" />
        <span className="pcp-legend__text">Best value</span>
      </div>
      <div className="pcp-legend__item">
        <span className="pcp-legend__swatch pcp-legend__swatch--worst" />
        <span className="pcp-legend__text">Highest cost / Lowest stock</span>
      </div>
      <div className="pcp-legend__divider" aria-hidden="true" />
      <span className="pcp-legend__hint">Price and stock cells are colour-coded for quick comparison</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function PriceComparisonPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawIds = searchParams.get('ids') || '';
  const ids = rawIds.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const fetchAll = useCallback(async (idList) => {
    if (idList.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const results = await Promise.allSettled(
        idList.map(id => apiClient.get(`/marketplace/materials/${id}`))
      );
      const loaded = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value.data.material)
        .filter(Boolean);
      setMaterials(loaded);
    } catch (err) {
      console.error('[PriceComparisonPage] fetch error:', err);
      setError('Failed to load one or more materials. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ids.length > 0) fetchAll(ids);
    else setMaterials([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawIds]);

  // Guard: < 2 IDs provided in URL
  const tooFewIds = !loading && ids.length < 2;
  // Guard: fetched fewer materials than expected (e.g. invalid IDs)
  const tooFewLoaded = !loading && ids.length >= 2 && materials.length < 2;

  return (
    <div className="pcp-page">
      {/* ── Header ── */}
      <header className="pcp-header">
        <div className="pcp-header__left">
          <button
            className="pcp-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            id="pcp-back-arrow"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div>
            <h2 className="pcp-header__title">Material Comparison</h2>
            <p className="pcp-header__subtitle">
              {loading
                ? `Loading ${ids.length} material${ids.length !== 1 ? 's' : ''}…`
                : materials.length > 0
                  ? `Comparing ${materials.length} material${materials.length !== 1 ? 's' : ''} side by side`
                  : 'Select materials from Browse to compare'
              }
            </p>
          </div>
        </div>

        <Link to="/marketplace/builder/materials">
          <Button variant="secondary" id="pcp-compare-others-header-btn">
            Compare Others
          </Button>
        </Link>
      </header>

      {/* ── Guard: too few IDs in URL ── */}
      {tooFewIds && (
        <GuardState message="Select at least 2 materials from the Browse page to compare." />
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="pcp-error-banner" role="alert">{error}</div>
      )}

      {/* ── Guard: fetched but not enough valid materials ── */}
      {tooFewLoaded && !error && (
        <GuardState message="Could not load enough materials. Some IDs may be invalid or inactive." />
      )}

      {/* ── Loading skeleton ── */}
      {loading && ids.length >= 2 && (
        <SkeletonTable count={ids.length} />
      )}

      {/* ── Comparison content ── */}
      {!loading && materials.length >= 2 && (
        <>
          <Legend />

          {/* Desktop table */}
          <div className="pcp-desktop-only">
            <ComparisonTable materials={materials} />
          </div>

          {/* Mobile stacked cards */}
          <div className="pcp-mobile-only">
            <MobileCards materials={materials} />
          </div>

          {/* Footer CTA */}
          <div className="pcp-footer">
            <p className="pcp-footer__text">Want to compare different materials?</p>
            <Link to="/marketplace/builder/materials">
              <Button variant="primary" id="pcp-compare-others-btn">
                ← Browse &amp; Compare Others
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default PriceComparisonPage;
