/**
 * client/src/pages/marketplace/VendorOverviewPage.jsx
 *
 * Vendor Dashboard Overview — Phase M6A.
 * Shows metrics and recent active listings for the vendor.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import apiClient from '../../api/client';
import './VendorOverviewPage.css';

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

function ActiveListingsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function TotalMaterialsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function CategoriesIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="9" height="9" rx="1" />
      <rect x="13" y="2" width="9" height="9" rx="1" />
      <rect x="2" y="13" width="9" height="9" rx="1" />
      <rect x="13" y="13" width="9" height="9" rx="1" />
    </svg>
  );
}

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

// ─── Stock badge ──────────────────────────────────────────────────────────────

function StockBadge({ stock, unit }) {
  if (stock === 0) {
    return <span className="vendor-stock-badge vendor-stock-badge--out">Out of stock</span>;
  }
  if (stock <= 10) {
    return <span className="vendor-stock-badge vendor-stock-badge--low">Low stock ({stock})</span>;
  }
  return <span className="vendor-stock-badge vendor-stock-badge--ok">{stock} {unit} in stock</span>;
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, icon, loading }) {
  if (loading) {
    return (
      <Card surface="navy" className="vendor-metric-card vendor-metric-card--loading">
        <div className="skeleton-icon pulse" />
        <div className="skeleton-value pulse" />
        <div className="skeleton-label pulse" />
      </Card>
    );
  }

  return (
    <Card surface="navy" className="vendor-metric-card">
      <div className="vendor-metric-card__icon-row">
        <span className="vendor-metric-card__icon" aria-hidden="true">{icon}</span>
      </div>
      <p className="vendor-metric-card__value">{value}</p>
      <p className="vendor-metric-card__label">{label}</p>
    </Card>
  );
}

// ─── Active Listing Mini-card ─────────────────────────────────────────────────

function ActiveMaterialCard({ material }) {
  const catColors = CATEGORY_COLORS[material.category] || CATEGORY_COLORS.other;

  return (
    <div className="vendor-active-card">
      <div className="vendor-active-card__header">
        <span
          className="vendor-category-badge"
          style={{
            backgroundColor: catColors.bg,
            color: catColors.color,
            border: `1px solid ${catColors.border}`,
          }}
        >
          {material.category}
        </span>
        <StockBadge stock={material.stock} unit={material.unit} />
      </div>
      <p className="vendor-active-card__name">{material.name}</p>
      <p className="vendor-active-card__price">
        ₹{material.pricePerUnit} <span className="vendor-active-card__unit">{material.unit}</span>
      </p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function VendorOverviewPage() {
  const { user } = useAuth();
  const displayName = user?.firstName || user?.name || 'Vendor';

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchMaterials() {
      try {
        setLoading(true);
        const res = await apiClient.get('/api/marketplace/materials/my');
        if (active) {
          setMaterials(res.data.materials || []);
        }
      } catch (err) {
        console.error('[VendorOverviewPage] Failed to fetch materials:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchMaterials();
    return () => { active = false; };
  }, []);

  const activeMaterials   = materials.filter(m => m.isActive);
  const activeCount       = activeMaterials.length;
  const totalCount        = materials.length;
  const distinctCategories = [...new Set(activeMaterials.map(m => m.category))].length;

  // 4 most recent active materials
  const recentActive = activeMaterials.slice(0, 4);

  return (
    <div className="dash-content vendor-overview">

      {/* Welcome Banner */}
      <section className="vendor-welcome" aria-label="Welcome message">
        <p className="vendor-welcome__greeting">Welcome back,</p>
        <h2 className="vendor-welcome__name">{displayName} 🏗️</h2>
        <p className="vendor-welcome__sub">
          Manage your material listings, monitor stock levels, and reach builders and owners across the marketplace.
        </p>
      </section>

      {/* Metrics Grid */}
      <section className="vendor-metrics" aria-label="Overview metrics">
        <div className="vendor-metrics__grid">
          <MetricCard
            label="Active Listings"
            value={loading ? '—' : activeCount}
            icon={<ActiveListingsIcon />}
            loading={loading}
          />
          <MetricCard
            label="Total Materials"
            value={loading ? '—' : totalCount}
            icon={<TotalMaterialsIcon />}
            loading={loading}
          />
          <MetricCard
            label="Categories"
            value={loading ? '—' : distinctCategories}
            icon={<CategoriesIcon />}
            loading={loading}
          />
        </div>
      </section>

      {/* Active Listings Section */}
      <section className="vendor-active-section" aria-label="Your active listings">
        <div className="vendor-active-section__header">
          <h3 className="vendor-section-title">Your Active Listings</h3>
          <Link to="/marketplace/vendor/materials" className="vendor-view-all-link">
            View all listings →
          </Link>
        </div>

        {loading ? (
          <div className="vendor-active-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="vendor-active-card vendor-active-card--skeleton">
                <div className="skeleton-label pulse" style={{ width: '60%', marginBottom: '8px' }} />
                <div className="skeleton-value pulse" style={{ width: '80%', height: '18px', marginBottom: '8px' }} />
                <div className="skeleton-label pulse" style={{ width: '40%' }} />
              </div>
            ))}
          </div>
        ) : recentActive.length === 0 ? (
          <Card surface="navy" className="vendor-empty-card">
            <div className="vendor-empty-card__content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent, #fffa56)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <p className="vendor-empty-card__text">You haven't listed any active materials yet.</p>
              <Button
                as={Link}
                to="/marketplace/vendor/materials/new"
                variant="primary"
                id="vendor-overview-add-material-btn"
              >
                Add Your First Material
              </Button>
            </div>
          </Card>
        ) : (
          <div className="vendor-active-grid">
            {recentActive.map(m => (
              <ActiveMaterialCard key={m._id} material={m} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Row */}
      {!loading && recentActive.length > 0 && (
        <div className="vendor-cta-row">
          <Button
            as={Link}
            to="/marketplace/vendor/materials/new"
            variant="primary"
            id="vendor-overview-add-new-material-btn"
          >
            Add New Material
          </Button>
        </div>
      )}
    </div>
  );
}

export default VendorOverviewPage;
