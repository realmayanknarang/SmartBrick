/**
 * client/src/pages/marketplace/BrowseMaterialsPage.jsx
 *
 * Browse All Materials — Phase M6C.
 * Shared across: /marketplace/builder/materials and /marketplace/vendor/browse
 *
 * Features:
 *   • Filter bar: category, maxPrice, minStock, search — search on button click
 *   • Skeleton loading state
 *   • Material cards with category badges, stock indicators, vendor name
 *   • Comparison feature: select up to 3 materials, sticky "Compare Now" bar
 *   • Pagination (page controls at bottom)
 *
 * Fetch: GET /marketplace/materials (returns isActive: true materials only)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import apiClient from '../../api/client';
import './BrowseMaterialsPage.css';

// ─── Category colour map (same as MyMaterialsPage) ──────────────────────────

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

// ─── Category icon placeholder (same as MyMaterialsPage) ────────────────────

function CategoryIcon({ category }) {
  const color = CATEGORY_COLORS[category]?.color || '#94a3b8';
  switch (category) {
    case 'cement':
    case 'sand':
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'steel':
    case 'bricks':
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      );
    case 'electrical':
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'plumbing':
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14" />
          <path d="M5 12a7 7 0 0 1 7-7v0a7 7 0 0 1 7 7" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'paint':
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 3H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
          <path d="M12 11v4" />
          <path d="M8 15h8" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      );
    default:
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
  }
}

// ─── StockBadge ───────────────────────────────────────────────────────────────

function StockBadge({ stock, unit }) {
  if (stock === 0) {
    return <span className="bmp-stock bmp-stock--out">Out of stock</span>;
  }
  if (stock <= 10) {
    return <span className="bmp-stock bmp-stock--low">Low — {stock} {unit}</span>;
  }
  return <span className="bmp-stock bmp-stock--ok">{stock} {unit} in stock</span>;
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card surface="navy" padding="0" className="bmp-card bmp-card--skeleton">
      <div className="bmp-card__img-placeholder pulse" />
      <div className="bmp-card__body">
        <div className="bmp-skeleton-line pulse" style={{ width: '55%', height: '14px' }} />
        <div className="bmp-skeleton-line pulse" style={{ width: '85%', height: '18px' }} />
        <div className="bmp-skeleton-line pulse" style={{ width: '45%', height: '14px' }} />
        <div className="bmp-skeleton-line pulse" style={{ width: '65%', height: '14px' }} />
      </div>
    </Card>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="bmp-pagination" role="navigation" aria-label="Pagination">
      <button
        className="bmp-pagination__btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        id="browse-materials-prev-page"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span className="bmp-pagination__info">
        Page {page} of {totalPages}
      </span>

      <button
        className="bmp-pagination__btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        id="browse-materials-next-page"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

// ─── Material Card ────────────────────────────────────────────────────────────

const MAX_COMPARE = 3;

function MaterialCard({ material, isSelected, onCompareChange, compareDisabled, isBuilder }) {
  const catColors = CATEGORY_COLORS[material.category] || CATEGORY_COLORS.other;
  const imageUrl  = material.images && material.images[0]?.url;
  const vendorName = material.vendor?.name || 'Unknown Vendor';

  const checkboxDisabled = compareDisabled && !isSelected;

  return (
    <Card surface="navy" padding="0" className="bmp-card">
      {/* Card image / placeholder */}
      {imageUrl ? (
        <div className="bmp-card__img-wrapper">
          <img
            src={imageUrl}
            alt={material.name}
            className="bmp-card__img"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement.classList.add('bmp-card__img-wrapper--fallback');
            }}
          />
        </div>
      ) : (
        <div className="bmp-card__img-placeholder">
          <CategoryIcon category={material.category} />
        </div>
      )}

      {/* Card body */}
      <div className="bmp-card__body">
        <div className="bmp-card__badges">
          <span
            className="bmp-category-badge"
            style={{
              backgroundColor: catColors.bg,
              color:           catColors.color,
              border:          `1px solid ${catColors.border}`,
            }}
          >
            {material.category}
          </span>
        </div>

        <p className="bmp-card__name">{material.name}</p>

        <p className="bmp-card__brand">
          {material.brand || <span className="bmp-card__brand--empty">No brand</span>}
        </p>

        <p className="bmp-card__price">
          ₹{material.pricePerUnit.toLocaleString('en-IN')}
          <span className="bmp-card__unit"> {material.unit}</span>
        </p>

        <StockBadge stock={material.stock} unit={material.unit} />

        {material.deliveryTime && (
          <p className="bmp-card__delivery">🚚 {material.deliveryTime}</p>
        )}

        <p className="bmp-card__vendor">Supplied by {vendorName}</p>
      </div>

      <div className="bmp-card__footer">
        <label
          className={`bmp-compare-label${checkboxDisabled ? ' bmp-compare-label--disabled' : ''}`}
          title={checkboxDisabled ? `Max ${MAX_COMPARE} materials` : 'Add to comparison'}
        >
          <input
            type="checkbox"
            className="bmp-compare-checkbox"
            checked={isSelected}
            disabled={checkboxDisabled}
            onChange={() => onCompareChange(material._id)}
            id={`compare-material-${material._id}`}
            aria-label={`Compare ${material.name}`}
          />
          <span className="bmp-compare-box" />
          Compare
        </label>

        {isBuilder && (
          <Button
            as={Link}
            to={`/marketplace/builder/order/${material._id}`}
            variant="primary"
            size="sm"
          >
            Order
          </Button>
        )}
      </div>
    </Card>
  );
}

// ─── Sticky Compare Bar ───────────────────────────────────────────────────────

function CompareBar({ selectedIds, onClear, onCompare }) {
  const count = selectedIds.length;
  if (count < 2) return null;

  return (
    <div className="bmp-compare-bar" role="complementary" aria-label="Material comparison bar">
      <div className="bmp-compare-bar__inner">
        <span className="bmp-compare-bar__count">
          <strong>{count}</strong> material{count !== 1 ? 's' : ''} selected
        </span>
        <div className="bmp-compare-bar__actions">
          <button
            className="bmp-compare-bar__clear"
            onClick={onClear}
            id="compare-bar-clear-btn"
          >
            Clear
          </button>
          <Button
            variant="primary"
            onClick={onCompare}
            id="compare-bar-compare-btn"
          >
            Compare Now →
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Category options ─────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: '',           label: 'All Categories' },
  { value: 'cement',     label: 'Cement' },
  { value: 'steel',      label: 'Steel' },
  { value: 'sand',       label: 'Sand' },
  { value: 'bricks',     label: 'Bricks' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing',   label: 'Plumbing' },
  { value: 'paint',      label: 'Paint' },
  { value: 'flooring',   label: 'Flooring' },
  { value: 'other',      label: 'Other' },
];

const PAGE_SIZE = 12;

// ─── Page ─────────────────────────────────────────────────────────────────────

function BrowseMaterialsPage() {
  const { user } = useAuth();
  const isBuilder = user?.role === 'builder';
  const navigate = useNavigate();

  // Filter state (controlled inputs, not sent until Search click)
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMaxPrice, setFilterMaxPrice]  = useState('');
  const [filterMinStock, setFilterMinStock]  = useState('');
  const [filterSearch,   setFilterSearch]    = useState('');

  // Applied filter state (what was last submitted)
  const [appliedCategory, setAppliedCategory] = useState('');
  const [appliedMaxPrice, setAppliedMaxPrice]  = useState('');
  const [appliedMinStock, setAppliedMinStock]  = useState('');
  const [appliedSearch,   setAppliedSearch]    = useState('');

  // Pagination
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);

  // Data
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Compare selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Track pending fetch to avoid stale responses
  const fetchIdRef = useRef(0);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchMaterials = useCallback(async ({
    category, maxPrice, minStock, search, pageNum,
  }) => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);

    try {
      const params = { page: pageNum, limit: PAGE_SIZE };
      if (category)  params.category = category;
      if (maxPrice)  params.maxPrice  = maxPrice;
      if (minStock)  params.minStock  = minStock;
      if (search)    params.search    = search;

      const res = await apiClient.get('/marketplace/materials', { params });
      if (fetchId !== fetchIdRef.current) return; // stale

      setMaterials(res.data.materials || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
      setHasSearched(true);
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      console.error('[BrowseMaterialsPage] fetch error:', err);
      setMaterials([]);
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  }, []);

  // ── Initial load (fetch on mount) ─────────────────────────────────────────
  useEffect(() => {
    fetchMaterials({
      category: '', maxPrice: '', minStock: '', search: '', pageNum: 1,
    });
    setHasSearched(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Search Handler ─────────────────────────────────────────────────────────

  function handleSearch() {
    setAppliedCategory(filterCategory);
    setAppliedMaxPrice(filterMaxPrice);
    setAppliedMinStock(filterMinStock);
    setAppliedSearch(filterSearch);
    setPage(1);
    setSelectedIds([]);
    fetchMaterials({
      category: filterCategory,
      maxPrice:  filterMaxPrice,
      minStock:  filterMinStock,
      search:    filterSearch,
      pageNum:   1,
    });
  }

  function handleClear() {
    setFilterCategory('');
    setFilterMaxPrice('');
    setFilterMinStock('');
    setFilterSearch('');
    setAppliedCategory('');
    setAppliedMaxPrice('');
    setAppliedMinStock('');
    setAppliedSearch('');
    setPage(1);
    setSelectedIds([]);
    fetchMaterials({ category: '', maxPrice: '', minStock: '', search: '', pageNum: 1 });
  }

  function handlePageChange(newPage) {
    setPage(newPage);
    setSelectedIds([]);
    fetchMaterials({
      category: appliedCategory,
      maxPrice:  appliedMaxPrice,
      minStock:  appliedMinStock,
      search:    appliedSearch,
      pageNum:   newPage,
    });
  }

  // ── Compare ─────────────────────────────────────────────────────────────────

  function handleCompareChange(id) {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= MAX_COMPARE) return prev; // safety guard
      return [...prev, id];
    });
  }

  function handleCompareNow() {
    const idsParam = selectedIds.join(',');
    navigate(`/marketplace/compare?ids=${idsParam}`);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const compareDisabled = selectedIds.length >= MAX_COMPARE;

  return (
    <div className="bmp-page">
      {/* Page Header */}
      <header className="bmp-header">
        <div className="bmp-header__left">
          <h2 className="bmp-header__title">Browse Materials</h2>
          {!loading && hasSearched && (
            <span className="bmp-header__count">{total} result{total !== 1 ? 's' : ''}</span>
          )}
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bmp-filter-bar">
        <div className="bmp-filter-bar__field">
          <label className="bmp-filter-label" htmlFor="bmp-filter-category">Category</label>
          <select
            id="bmp-filter-category"
            className="bmp-filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="bmp-filter-bar__field">
          <label className="bmp-filter-label" htmlFor="bmp-filter-maxprice">Max Price (₹)</label>
          <input
            id="bmp-filter-maxprice"
            className="bmp-filter-input"
            type="number"
            placeholder="Any"
            min="0"
            value={filterMaxPrice}
            onChange={(e) => setFilterMaxPrice(e.target.value)}
          />
        </div>

        <div className="bmp-filter-bar__field">
          <label className="bmp-filter-label" htmlFor="bmp-filter-minstock">Min Stock</label>
          <input
            id="bmp-filter-minstock"
            className="bmp-filter-input"
            type="number"
            placeholder="Any"
            min="0"
            value={filterMinStock}
            onChange={(e) => setFilterMinStock(e.target.value)}
          />
        </div>

        <div className="bmp-filter-bar__field bmp-filter-bar__field--grow">
          <label className="bmp-filter-label" htmlFor="bmp-filter-search">Search</label>
          <input
            id="bmp-filter-search"
            className="bmp-filter-input"
            type="text"
            placeholder="Search by name or brand…"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          />
        </div>

        <div className="bmp-filter-bar__actions">
          <Button
            variant="primary"
            onClick={handleSearch}
            disabled={loading}
            id="browse-materials-search-btn"
          >
            Search
          </Button>
          <button
            className="bmp-filter-clear"
            onClick={handleClear}
            id="browse-materials-clear-btn"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bmp-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : !hasSearched ? null : materials.length === 0 ? (
        <div className="bmp-empty-state">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-on-dark-muted, #9FB0BC)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <p className="bmp-empty-state__text">No materials found for your search.</p>
          <button className="bmp-filter-clear" onClick={handleClear}>Clear filters</button>
        </div>
      ) : (
        <>
          <div className="bmp-grid" role="list">
            {materials.map(material => (
              <MaterialCard
                key={material._id}
                material={material}
                isSelected={selectedIds.includes(material._id)}
                onCompareChange={handleCompareChange}
                compareDisabled={compareDisabled}
                isBuilder={isBuilder}
              />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Sticky Compare Bar */}
      <CompareBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
        onCompare={handleCompareNow}
      />
    </div>
  );
}

export default BrowseMaterialsPage;
