/**
 * client/src/pages/VendorsPage.jsx
 *
 * Vendor List & Scoring — Phase 8B
 * ─────────────────────────────────────────────────────────────────────────────
 * Features
 * ────────
 *  • Table of active vendors with compositeScore badge (green/amber/red)
 *  • Category + city dropdowns populated from distinct backend values
 *  • Sort control: by score (default) or by price
 *  • True server-side pagination — every filter/sort/page change fires a
 *    real network request with updated query params (not client-side filtering)
 *  • Click a row → slide-in drawer with full score breakdown bars
 *
 * Component hierarchy
 * ───────────────────
 *  VendorsPage
 *    Sidebar
 *    Controls (Select × 2, sort buttons)
 *    VendorTable
 *      VendorRow × n
 *    Pagination
 *    VendorDrawer (conditional, animated)
 *      ScoreBreakdown
 *
 * Uses Phase 4 design system: Card, Button, Select — no one-off styled elements.
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link }                from 'react-router-dom';
import { useUser, SignOutButton }            from '@clerk/clerk-react';
import Sidebar  from '../components/Sidebar';
import Card     from '../components/Card';
import Button   from '../components/Button';
import Select   from '../components/Select';
import apiClient from '../api/client';
import './DashboardPage.css';
import './VendorsPage.css';

// ─── Sidebar nav items (canonical set shared across all dash pages) ────────────
function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" />
    </svg>
  );
}
function SitesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L3 7v11h4v-5h6v5h4V7L10 2z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
function VendorsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="6" r="3.5" fill="currentColor" />
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function ReportsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <line x1="6" y1="7"  x2="14" y2="7"  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="13" x2="11" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function AlertsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L2 16h16L10 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="currentColor" opacity="0.15" />
      <line x1="10" y1="8"  x2="10" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="0.9" fill="currentColor" />
    </svg>
  );
}
function ScannerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12h5M14.5 12v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function WeatherIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 14c0-1.1.9-2 2-2h6a2 2 0 110 4H7a2 2 0 01-2-2z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4l5 2 6-2 5 2v12l-5-2-6 2-5-2V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="7" y1="6" x2="7" y2="18" stroke="currentColor" strokeWidth="1.2" />
      <line x1="13" y1="2" x2="13" y2="16" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function LeafIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 4C16 4 14 12 8 14C5 15 3 16 3 16C3 16 4 12 7 9C10 6 16 4 16 4Z" fill="currentColor" opacity="0.6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M3 16C5 13 8 11 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function CopilotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2a6 6 0 00-6 6v2.5a2.5 2.5 0 002.5 2.5h1.2a1.3 1.3 0 001.3-1.3V9.5A1.3 1.3 0 007.7 8.2H6.5A4.5 4.5 0 0110 3.5 4.5 4.5 0 0113.5 8.2h-1.2a1.3 1.3 0 00-1.3 1.3v2.2a1.3 1.3 0 001.3 1.3H13.5A2.5 2.5 0 0016 10.5V8a6 6 0 00-6-6z" fill="currentColor" opacity="0.85"/>
      <rect x="7" y="14" width="6" height="3" rx="1.2" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}

const NAV_ITEMS = [
  { icon: <OverviewIcon />,  label: 'Overview',       path: '/dashboard' },
  { icon: <SitesIcon />,     label: 'Sites',          path: '/dashboard/sites' },
  { icon: <VendorsIcon />,   label: 'Vendors',        path: '/dashboard/vendors' },
  { icon: <ReportsIcon />,   label: 'Analytics',      path: '/dashboard/analytics' },
  { icon: <AlertsIcon />,    label: 'Alerts',         path: '/dashboard/alerts' },
  { icon: <ScannerIcon />, label: 'Invoice OCR', path: '/dashboard/invoice-scanner', dividerBefore: true },
  { icon: <WeatherIcon />,   label: 'Weather Alerts', path: '/dashboard/weather' },
  { icon: <MapIcon />,       label: 'Logistics',      path: '/dashboard/logistics' },
  { icon: <LeafIcon />,      label: 'Sustainability',  path: '/dashboard/carbon' },
  { icon: <CopilotIcon />,     label: 'Copilot',         path: '/dashboard/copilot', dividerBefore: true },
];

// ─── Score badge helper ───────────────────────────────────────────────────────
function scoreBadgeClass(score) {
  if (score >= 75) return 'vp-score-badge vp-score-badge--high';
  if (score >= 50) return 'vp-score-badge vp-score-badge--mid';
  return 'vp-score-badge vp-score-badge--low';
}

function scoreBadgeColor(score) {
  if (score >= 75) return '#3CB57A';
  if (score >= 50) return '#E8C547';
  return '#E05C5C';
}

// ─── Score breakdown bar component ────────────────────────────────────────────
function BreakdownBar({ label, value, maxPts, color }) {
  const pct = Math.min(100, (value / maxPts) * 100);
  return (
    <div className="vp-breakdown__row">
      <div className="vp-breakdown__row-header">
        <span className="vp-breakdown__row-label">{label}</span>
        <span className="vp-breakdown__row-pts">{value.toFixed(2)} / {maxPts} pts</span>
      </div>
      <div className="vp-breakdown__bar-track">
        <div
          className="vp-breakdown__bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Vendor detail drawer ─────────────────────────────────────────────────────
function VendorDrawer({ vendor, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!vendor) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient.get(`/vendors/${vendor._id}`)
      .then(({ data }) => {
        if (!cancelled) {
          setDetail(data.vendor);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load vendor details.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [vendor]);

  if (!vendor) return null;

  const score = detail?.compositeScore ?? vendor.compositeScore;
  const bd    = detail?.scoreBreakdown;

  return (
    <>
      {/* Dim overlay — clicking it closes the drawer */}
      <div className="vp-drawer-overlay" onClick={onClose} aria-hidden="true" />

      <aside className="vp-drawer" role="dialog" aria-modal="true" aria-label={`Vendor detail: ${vendor.name}`}>
        <div className="vp-drawer__header">
          <h2 className="vp-drawer__title">{vendor.name}</h2>
          <button className="vp-drawer__close" onClick={onClose} aria-label="Close vendor detail">×</button>
        </div>

        <div className="vp-drawer__body">
          {/* Meta */}
          <div className="vp-drawer__meta">
            <div className="vp-drawer__meta-item">
              <span className="vp-drawer__meta-label">Category</span>
              <span className="vp-drawer__meta-value" style={{ textTransform: 'capitalize' }}>{vendor.category}</span>
            </div>
            <div className="vp-drawer__meta-item">
              <span className="vp-drawer__meta-label">City</span>
              <span className="vp-drawer__meta-value">{vendor.city}</span>
            </div>
            <div className="vp-drawer__meta-item">
              <span className="vp-drawer__meta-label">Price</span>
              <span className="vp-drawer__meta-value">₹{vendor.pricePerUnit?.toLocaleString('en-IN')} {vendor.unit}</span>
            </div>
            {vendor.contactPhone && (
              <div className="vp-drawer__meta-item">
                <span className="vp-drawer__meta-label">Phone</span>
                <span className="vp-drawer__meta-value">{vendor.contactPhone}</span>
              </div>
            )}
            {(detail?.totalOrdersCompleted ?? vendor.totalOrdersCompleted) > 0 && (
              <div className="vp-drawer__meta-item">
                <span className="vp-drawer__meta-label">Orders completed</span>
                <span className="vp-drawer__meta-value">{detail?.totalOrdersCompleted ?? vendor.totalOrdersCompleted}</span>
              </div>
            )}
          </div>

          {/* Composite score */}
          <div className="vp-drawer__score-row">
            <span className={scoreBadgeClass(score)} style={{ fontSize: '1.25rem', minWidth: '72px' }}>
              {score}
            </span>
            <div>
              <div style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-on-dark)' }}>
                Composite Score
              </div>
              <div className="vp-drawer__score-label">out of 100 — weighted performance index</div>
            </div>
          </div>

          {/* Breakdown */}
          {loading && (
            <p style={{ color: 'var(--color-text-on-dark-muted)', fontSize: 'var(--text-sm)' }}>
              Loading breakdown…
            </p>
          )}
          {error && (
            <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</p>
          )}
          {bd && !loading && (
            <div>
              <p className="vp-breakdown__title">Score Breakdown</p>

              <BreakdownBar
                label="Reliability (weight 40%)"
                value={bd.reliabilityContribution}
                maxPts={40}
                color="#3CB57A"
              />
              <BreakdownBar
                label="Delivery (weight 35%)"
                value={bd.deliveryContribution}
                maxPts={35}
                color="#4A90D9"
              />
              <BreakdownBar
                label="Quality (weight 25%)"
                value={bd.qualityContribution}
                maxPts={25}
                color="#9B7FE8"
              />

              {/* Delay penalty */}
              <div className={`vp-breakdown__penalty${bd.delayPenalty === 0 ? ' vp-breakdown__penalty--none' : ''}`}>
                <span>Delay penalty ({vendor.pastDelays ?? detail.pastDelays} recorded delays × 1.5, cap 20)</span>
                <span>−{bd.delayPenalty} pts</span>
              </div>

              {/* Final */}
              <div className="vp-breakdown__final" style={{ marginTop: 'var(--space-3)' }}>
                <span>Final composite score</span>
                <span>{score} / 100</span>
              </div>

              {/* Explanation text */}
              <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-on-dark-muted)', lineHeight: 'var(--leading-relaxed)' }}>
                Base score {bd.baseScore} pts − penalty {bd.delayPenalty} pts = {bd.rawScore} pts → clamped to {score}.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: 'cement',      label: 'Cement' },
  { value: 'steel',       label: 'Steel' },
  { value: 'sand',        label: 'Sand' },
  { value: 'bricks',      label: 'Bricks' },
  { value: 'electrical',  label: 'Electrical' },
  { value: 'plumbing',    label: 'Plumbing' },
];

const SORT_OPTIONS = [
  { value: 'score',        label: 'Sort: Score ↓' },
  { value: 'name',         label: 'Sort: Name A–Z' },
  { value: 'pricePerUnit', label: 'Sort: Price ↑' },
];

const LIMIT = 10; // vendors per page

function VendorsPage() {
  const { pathname } = useLocation();
  const { user }     = useUser();

  // ── Filter / sort / page state ────────────────────────────────────────────
  const [category, setCategory] = useState('');
  const [city,     setCity]     = useState('');
  const [sortBy,   setSortBy]   = useState('score');
  const [page,     setPage]     = useState(1);

  // ── Data state ────────────────────────────────────────────────────────────
  const [vendors,    setVendors]    = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: LIMIT, totalPages: 1 });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  // ── Distinct city options (fetched once on mount) ─────────────────────────
  const [cityOptions, setCityOptions] = useState([{ value: '', label: 'All cities' }]);

  // ── Selected vendor for drawer ────────────────────────────────────────────
  const [selectedVendor, setSelectedVendor] = useState(null);

  // ── Fetch distinct cities from the backend on mount ───────────────────────
  useEffect(() => {
    // Fetch all vendors (large limit) to extract distinct city values.
    // A dedicated /api/vendors/meta endpoint would be cleaner at scale;
    // for seed-data size this is fast enough and avoids a new backend route.
    apiClient.get('/vendors', { params: { limit: 100, sortBy: 'name' } })
      .then(({ data }) => {
        const distinct = [...new Set(data.vendors.map(v => v.city))].sort();
        setCityOptions([
          { value: '', label: 'All cities' },
          ...distinct.map(c => ({ value: c, label: c })),
        ]);
      })
      .catch(() => { /* non-critical — city filter still works without options */ });
  }, []);

  // ── Fetch vendors whenever filter/sort/page changes ───────────────────────
  const fetchVendors = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = { sortBy, page, limit: LIMIT };
    if (category) params.category = category;
    if (city)     params.city     = city;

    apiClient.get('/vendors', { params })
      .then(({ data }) => {
        setVendors(data.vendors);
        setPagination(data.pagination);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load vendors.');
        setLoading(false);
      });
  }, [category, city, sortBy, page]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Reset to page 1 whenever filters or sort change
  const handleCategoryChange = (e) => { setCategory(e.target.value); setPage(1); };
  const handleCityChange     = (e) => { setCity(e.target.value);     setPage(1); };
  const handleSortChange     = (e) => { setSortBy(e.target.value);   setPage(1); };

  // ── Pagination helpers ────────────────────────────────────────────────────
  const totalPages  = pagination.totalPages ?? 1;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        {/* Top bar */}
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Vendors</h1>
          </div>
          <div className="dash-topbar__right">
            <Link to="/dashboard" className="dash-topbar__link">Overview</Link>
            <Link to="/" className="dash-topbar__link">Home</Link>
            <SignOutButton>
              <button className="dash-topbar__signout">Sign out</button>
            </SignOutButton>
          </div>
        </header>

        <div className="dash-content">
          {/* Welcome */}
          <section className="dash-welcome">
            <h2 className="dash-welcome__name">Vendor Scoring</h2>
            <p className="dash-welcome__sub">
              {pagination.total} active vendor{pagination.total !== 1 ? 's' : ''} — ranked by composite performance score.
            </p>
          </section>

          {/* Controls */}
          <Card surface="navy-secondary" padding="var(--space-4)">
            <div className="vp-controls">
              <div className="vp-controls__selects">
                <Select
                  id="vendor-category-filter"
                  label="Category"
                  options={CATEGORY_OPTIONS}
                  value={category}
                  onChange={handleCategoryChange}
                />
                <Select
                  id="vendor-city-filter"
                  label="City"
                  options={cityOptions}
                  value={city}
                  onChange={handleCityChange}
                />
                <Select
                  id="vendor-sort"
                  label="Sort by"
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onChange={handleSortChange}
                />
              </div>
              {(category || city || sortBy !== 'score') && (
                <Button
                  variant="secondary"
                  size="sm"
                  id="vendor-reset-filters"
                  onClick={() => { setCategory(''); setCity(''); setSortBy('score'); setPage(1); }}
                >
                  Reset filters
                </Button>
              )}
            </div>
          </Card>

          {/* Table */}
          <Card surface="navy-secondary" padding="0">
            <div className="vp-table-wrap">
              {loading && (
                <div className="vp-empty">
                  <span className="vp-empty__icon">⏳</span>
                  Loading vendors…
                </div>
              )}
              {!loading && error && (
                <div className="vp-empty">
                  <span className="vp-empty__icon">⚠️</span>
                  {error}
                </div>
              )}
              {!loading && !error && vendors.length === 0 && (
                <div className="vp-empty">
                  <span className="vp-empty__icon">🏪</span>
                  No active vendors match the selected filters.
                </div>
              )}
              {!loading && !error && vendors.length > 0 && (
                <table className="vp-table" aria-label="Vendor list">
                  <thead>
                    <tr>
                      <th scope="col">Vendor</th>
                      <th scope="col">Category</th>
                      <th scope="col">Score</th>
                      <th scope="col">Price / unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((v) => (
                      <tr
                        key={v._id}
                        onClick={() => setSelectedVendor(v)}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedVendor(v)}
                        aria-label={`View details for ${v.name}`}
                      >
                        <td>
                          <div className="vp-table__name">{v.name}</div>
                          <div className="vp-table__meta">{v.city}</div>
                        </td>
                        <td>
                          <span className="vp-category-pill">{v.category}</span>
                        </td>
                        <td>
                          <span className={scoreBadgeClass(v.compositeScore)}>
                            {v.compositeScore}
                          </span>
                        </td>
                        <td className="vp-table__price">
                          ₹{v.pricePerUnit?.toLocaleString('en-IN')}
                          <span style={{ color: 'var(--color-text-on-dark-muted)', marginLeft: 4 }}>
                            {v.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="vp-pagination">
                <span className="vp-pagination__info">
                  Page {pagination.page} of {totalPages} · {pagination.total} vendors
                </span>
                <button
                  id="vendor-prev-page"
                  className="vp-pagination__btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  ←
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    className={`vp-pagination__btn${page === n ? ' vp-pagination__btn--active' : ''}`}
                    onClick={() => setPage(n)}
                    aria-label={`Go to page ${n}`}
                    aria-current={page === n ? 'page' : undefined}
                  >
                    {n}
                  </button>
                ))}
                <button
                  id="vendor-next-page"
                  className="vp-pagination__btn"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  →
                </button>
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Vendor detail drawer (conditionally rendered) */}
      {selectedVendor && (
        <VendorDrawer
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
        />
      )}
    </div>
  );
}

export default VendorsPage;
