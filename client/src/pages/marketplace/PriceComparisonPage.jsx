/**
 * client/src/pages/marketplace/PriceComparisonPage.jsx
 *
 * Material Price Comparison Page — Phase M6C.
 * Route: /marketplace/compare?ids=id1,id2,id3 (role-agnostic)
 *
 * Reads the `ids` query param, fetches each material individually,
 * then renders a side-by-side comparison table.
 *
 * Features:
 *   • Loads up to 3 materials from GET /api/marketplace/materials/:id
 *   • Side-by-side comparison: name, category, brand, price, stock, delivery
 *   • Highlights the best (lowest) price in green
 *   • Skeleton loading state during fetch
 *   • "Browse More" back link
 */

import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import apiClient from '../../api/client';
import './PriceComparisonPage.css';

// ─── Category colour map ──────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  cement:     { bg: 'rgba(107,114,128,0.18)', color: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
  steel:      { bg: 'rgba(74,144,217,0.18)',  color: '#4A90D9', border: 'rgba(74,144,217,0.3)' },
  sand:       { bg: 'rgba(245,158,11,0.18)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  bricks:     { bg: 'rgba(239,68,68,0.18)',   color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  electrical: { bg: 'rgba(234,179,8,0.18)',   color: '#eab308', border: 'rgba(234,179,8,0.3)' },
  plumbing:   { bg: 'rgba(20,184,166,0.18)',  color: '#14b8a6', border: 'rgba(20,184,166,0.3)' },
  paint:      { bg: 'rgba(168,85,247,0.18)',  color: '#a855f7', border: 'rgba(168,85,247,0.3)' },
  flooring:   { bg: 'rgba(180,83,9,0.18)',    color: '#b45309', border: 'rgba(180,83,9,0.3)' },
  other:      { bg: 'rgba(100,116,139,0.18)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
};

// ─── CategoryIcon ─────────────────────────────────────────────────────────────

function CategoryIcon({ category }) {
  const color = CATEGORY_COLORS[category]?.color || '#94a3b8';
  switch (category) {
    case 'cement':
    case 'sand':
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'electrical':
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    default:
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
  }
}

// ─── Skeleton Column ──────────────────────────────────────────────────────────

function SkeletonColumn() {
  return (
    <div className="pcp-col pcp-col--skeleton">
      <div className="pcp-col__img-placeholder pcp-pulse" />
      <div className="pcp-col__body">
        <div className="pcp-skeleton-line pcp-pulse" style={{ width: '50%', height: '12px' }} />
        <div className="pcp-skeleton-line pcp-pulse" style={{ width: '80%', height: '20px' }} />
        <div className="pcp-skeleton-line pcp-pulse" style={{ width: '60%', height: '14px' }} />
        <div className="pcp-skeleton-line pcp-pulse" style={{ width: '40%', height: '14px' }} />
      </div>
    </div>
  );
}

// ─── Stock Row Value ──────────────────────────────────────────────────────────

function StockValue({ stock, unit }) {
  if (stock === 0) return <span className="pcp-stock pcp-stock--out">Out of stock</span>;
  if (stock <= 10) return <span className="pcp-stock pcp-stock--low">Low — {stock} {unit}</span>;
  return <span className="pcp-stock pcp-stock--ok">{stock} {unit}</span>;
}

// ─── Comparison Column ────────────────────────────────────────────────────────

function ComparisonColumn({ material, isBestPrice }) {
  const catColors = CATEGORY_COLORS[material.category] || CATEGORY_COLORS.other;
  const imageUrl  = material.images?.[0]?.url;
  const vendorName = material.vendor?.name || 'Unknown Vendor';

  return (
    <div className={`pcp-col${isBestPrice ? ' pcp-col--best' : ''}`}>
      {isBestPrice && (
        <div className="pcp-best-badge" aria-label="Best price">
          ⭐ Best Price
        </div>
      )}

      {/* Image */}
      {imageUrl ? (
        <div className="pcp-col__img-wrapper">
          <img src={imageUrl} alt={material.name} className="pcp-col__img"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      ) : (
        <div className="pcp-col__img-placeholder">
          <CategoryIcon category={material.category} />
        </div>
      )}

      {/* Name & category */}
      <div className="pcp-col__body">
        <span
          className="pcp-category-badge"
          style={{
            backgroundColor: catColors.bg,
            color:           catColors.color,
            border:          `1px solid ${catColors.border}`,
          }}
        >
          {material.category}
        </span>
        <h3 className="pcp-col__name">{material.name}</h3>
        <p className="pcp-col__vendor">{vendorName}</p>
      </div>

      {/* Comparison rows */}
      <div className="pcp-col__rows">
        <div className="pcp-row">
          <span className="pcp-row__label">Brand</span>
          <span className="pcp-row__value">{material.brand || <em>No brand</em>}</span>
        </div>

        <div className={`pcp-row pcp-row--price${isBestPrice ? ' pcp-row--price-best' : ''}`}>
          <span className="pcp-row__label">Price</span>
          <span className="pcp-row__value pcp-row__price">
            ₹{material.pricePerUnit.toLocaleString('en-IN')}
            <span className="pcp-row__unit"> {material.unit}</span>
          </span>
        </div>

        <div className="pcp-row">
          <span className="pcp-row__label">Stock</span>
          <StockValue stock={material.stock} unit={material.unit} />
        </div>

        <div className="pcp-row">
          <span className="pcp-row__label">Delivery</span>
          <span className="pcp-row__value">
            {material.deliveryTime || <em className="pcp-row__muted">Not specified</em>}
          </span>
        </div>
      </div>
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

  useEffect(() => {
    if (ids.length === 0) return;

    let active = true;

    async function fetchAll() {
      setLoading(true);
      setError('');
      try {
        const results = await Promise.all(
          ids.map(id => apiClient.get(`/api/marketplace/materials/${id}`))
        );
        if (active) {
          setMaterials(results.map(r => r.data.material).filter(Boolean));
        }
      } catch (err) {
        console.error('[PriceComparisonPage] fetch error:', err);
        if (active) setError('Failed to load one or more materials. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchAll();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawIds]);

  // Determine best (lowest) price
  const lowestPrice = materials.length > 0
    ? Math.min(...materials.map(m => m.pricePerUnit))
    : null;

  return (
    <div className="pcp-page">
      {/* Header */}
      <header className="pcp-header">
        <div className="pcp-header__left">
          <Link to="/marketplace/builder/materials" className="pcp-back-link" aria-label="Back to Browse Materials">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <div>
            <h2 className="pcp-header__title">Material Comparison</h2>
            <p className="pcp-header__subtitle">Compare prices and availability side by side</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)} id="pcp-back-btn">
          ← Back
        </Button>
      </header>

      {/* No IDs state */}
      {ids.length === 0 && (
        <Card surface="navy" className="pcp-empty-state">
          <div className="pcp-empty-state__inner">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-on-dark-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
            <p className="pcp-empty-state__text">No materials selected for comparison.</p>
            <Link to="/marketplace/builder/materials">
              <Button variant="primary" id="pcp-browse-btn">Browse Materials</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <div className="pcp-error-banner" role="alert">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="pcp-comparison-grid">
          {ids.map((id) => <SkeletonColumn key={id} />)}
        </div>
      )}

      {/* Comparison grid */}
      {!loading && materials.length > 0 && (
        <>
          {/* Badge row */}
          {materials.length >= 2 && (
            <div className="pcp-legend">
              <span className="pcp-legend__badge pcp-legend__badge--best">⭐ Best Price</span>
              <span className="pcp-legend__text">Highlighted based on lowest price per unit</span>
            </div>
          )}

          <div className="pcp-comparison-grid">
            {materials.map(material => (
              <ComparisonColumn
                key={material._id}
                material={material}
                isBestPrice={materials.length >= 2 && material.pricePerUnit === lowestPrice}
              />
            ))}
          </div>

          {/* Browse more */}
          <div className="pcp-footer">
            <Link to="/marketplace/builder/materials" className="pcp-footer__link">
              ← Browse more materials
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default PriceComparisonPage;
