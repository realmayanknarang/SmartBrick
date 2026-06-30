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
 *  • Natural-language search bar (Phase 9E) — calls POST /api/search/vendors
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
import { NAV_ITEMS } from '../config/dashboardNav.jsx';
import Card     from '../components/Card';
import Button   from '../components/Button';
import Select   from '../components/Select';
import apiClient from '../api/client';
import './DashboardPage.css';
import './VendorsPage.css';


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

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
      <line x1="13.5" y1="13.5" x2="17" y2="17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

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

  // ── Natural-language search (Phase 9E) ────────────────────────────────────
  const [nlInput,         setNlInput]         = useState('');
  const [nlActive,        setNlActive]        = useState(false);
  const [nlLoading,       setNlLoading]       = useState(false);
  const [nlError,         setNlError]         = useState(null);
  const [nlQuery,         setNlQuery]         = useState('');
  const [nlParsedFilters, setNlParsedFilters] = useState(null);
  const [nlGroqWarning,   setNlGroqWarning]   = useState(null);

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
    if (nlActive) return;
    fetchVendors();
  }, [fetchVendors, nlActive]);

  async function handleNlSearch(e) {
    e.preventDefault();

    const trimmed = nlInput.trim();
    if (!trimmed || nlLoading) return;

    setNlLoading(true);
    setNlError(null);
    setSelectedVendor(null);

    try {
      const { data } = await apiClient.post('/search/vendors', { query: trimmed });
      setVendors(data.vendors ?? []);
      setPagination({
        total:      data.total ?? data.vendors?.length ?? 0,
        page:       1,
        limit:      data.vendors?.length ?? 0,
        totalPages: 1,
      });
      setNlActive(true);
      setNlQuery(trimmed);
      setNlParsedFilters(data.parsedFilters ?? {});
      setNlGroqWarning(data.groqWarning ?? null);
    } catch (err) {
      setNlError(
        err?.response?.status === 429
          ? 'Too many search requests — please wait a few minutes and try again.'
          : err?.response?.data?.message || 'Natural language search failed. Please try again.'
      );
    } finally {
      setNlLoading(false);
    }
  }

  function clearNlSearch() {
    setNlActive(false);
    setNlInput('');
    setNlQuery('');
    setNlParsedFilters(null);
    setNlGroqWarning(null);
    setNlError(null);
    setPage(1);
  }

  // Reset to page 1 whenever filters or sort change; exit NL mode if active
  const handleCategoryChange = (e) => {
    if (nlActive) clearNlSearch();
    setCategory(e.target.value);
    setPage(1);
  };
  const handleCityChange = (e) => {
    if (nlActive) clearNlSearch();
    setCity(e.target.value);
    setPage(1);
  };
  const handleSortChange = (e) => {
    if (nlActive) clearNlSearch();
    setSortBy(e.target.value);
    setPage(1);
  };

  // ── Pagination helpers ────────────────────────────────────────────────────
  const totalPages  = pagination.totalPages ?? 1;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const listLoading = nlActive ? nlLoading : loading;
  const listError   = nlActive ? nlError   : error;

  function formatParsedFilters(filters) {
    if (!filters || !Object.keys(filters).length) return 'No specific filters detected — showing broad matches.';
    const parts = [];
    if (filters.category) parts.push(`category: ${filters.category}`);
    if (filters.city)     parts.push(`city: ${filters.city}`);
    if (filters.maxPrice != null) parts.push(`max price: ₹${Number(filters.maxPrice).toLocaleString('en-IN')}`);
    if (filters.minScore != null) parts.push(`min score: ${filters.minScore}`);
    return `Parsed as ${parts.join(', ')}`;
  }

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
              {nlActive
                ? `${pagination.total} result${pagination.total !== 1 ? 's' : ''} for “${nlQuery}”`
                : `${pagination.total} active vendor${pagination.total !== 1 ? 's' : ''} — ranked by composite performance score.`}
            </p>
          </section>

          {/* Natural-language search — Phase 9E */}
          <Card surface="navy-secondary" padding="var(--space-4)" className="vp-nl-search-card">
            <form className="vp-nl-search" onSubmit={handleNlSearch}>
              <label className="vp-nl-search__label" htmlFor="vendor-nl-search">
                Search in plain English
              </label>
              <div className="vp-nl-search__row">
                <div className="vp-nl-search__input-wrap">
                  <span className="vp-nl-search__icon" aria-hidden="true">
                    <SearchIcon />
                  </span>
                  <input
                    id="vendor-nl-search"
                    className="vp-nl-search__input"
                    type="search"
                    value={nlInput}
                    onChange={(e) => setNlInput(e.target.value)}
                    placeholder="Try: 'cement vendors under ₹400 per bag in Mohali'"
                    disabled={nlLoading}
                    aria-describedby={nlActive ? 'vendor-nl-search-status' : undefined}
                  />
                </div>
                <Button type="submit" variant="primary" size="sm" disabled={nlLoading || !nlInput.trim()}>
                  {nlLoading ? 'Searching…' : 'Search'}
                </Button>
                {nlActive && (
                  <Button type="button" variant="secondary" size="sm" onClick={clearNlSearch} disabled={nlLoading}>
                    Clear search
                  </Button>
                )}
              </div>
              {nlActive && (
                <p id="vendor-nl-search-status" className={`vp-nl-search__status${nlGroqWarning ? ' vp-nl-search__status--warning' : ''}`}>
                  {nlGroqWarning || formatParsedFilters(nlParsedFilters)}
                </p>
              )}
              {nlError && !nlActive && (
                <p className="vp-nl-search__error" role="alert">{nlError}</p>
              )}
            </form>
          </Card>

          {/* Controls */}
          <Card surface="navy-secondary" padding="var(--space-4)" className={nlActive ? 'vp-controls-card--inactive' : ''}>
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
              {(category || city || sortBy !== 'score') && !nlActive && (
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
              {listLoading && (
                <div className="vp-empty">
                  <span className="vp-empty__icon">⏳</span>
                  {nlActive ? 'Searching vendors…' : 'Loading vendors…'}
                </div>
              )}
              {!listLoading && listError && (
                <div className="vp-empty">
                  <span className="vp-empty__icon">⚠️</span>
                  {listError}
                </div>
              )}
              {!listLoading && !listError && vendors.length === 0 && (
                <div className="vp-empty">
                  <span className="vp-empty__icon">🏪</span>
                  {nlActive
                    ? 'No vendors match that search. Try different wording or clear search.'
                    : 'No active vendors match the selected filters.'}
                </div>
              )}
              {!listLoading && !listError && vendors.length > 0 && (
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
            {!listLoading && !nlActive && totalPages > 1 && (
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
