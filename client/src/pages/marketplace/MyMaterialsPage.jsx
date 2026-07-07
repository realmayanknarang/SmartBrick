/**
 * client/src/pages/marketplace/MyMaterialsPage.jsx
 *
 * Vendor "My Materials" list page — Phase M6B.
 * Route: /marketplace/vendor/materials
 *
 * Fetches GET /api/marketplace/materials/my (all vendor's materials, active + inactive).
 * Tabs filter client-side. Supports isActive toggle (PATCH), delete (soft-delete),
 * and navigates to Add/Edit forms.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import apiClient from '../../api/client';
import './MyMaterialsPage.css';

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

// ─── Category placeholder icons (SVG) ────────────────────────────────────────

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

// ─── Stock Badge ──────────────────────────────────────────────────────────────

function StockBadge({ stock, unit }) {
  if (stock === 0) {
    return <span className="mmp-stock mmp-stock--out">Out of stock</span>;
  }
  if (stock <= 10) {
    return <span className="mmp-stock mmp-stock--low">Low — {stock} {unit}</span>;
  }
  return <span className="mmp-stock mmp-stock--ok">{stock} {unit} in stock</span>;
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange, disabled, id }) {
  return (
    <label className="mmp-toggle" htmlFor={id} title={checked ? 'Active — click to deactivate' : 'Inactive — click to activate'}>
      <input
        id={id}
        type="checkbox"
        className="mmp-toggle__input"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="mmp-toggle__track">
        <span className="mmp-toggle__thumb" />
      </span>
      <span className="mmp-toggle__label">{checked ? 'Active' : 'Inactive'}</span>
    </label>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card surface="navy" padding="0" className="mmp-card mmp-card--skeleton">
      <div className="mmp-card__img-placeholder pulse" />
      <div className="mmp-card__body">
        <div className="skeleton-line pulse" style={{ width: '60%', height: '14px', marginBottom: '8px' }} />
        <div className="skeleton-line pulse" style={{ width: '85%', height: '18px', marginBottom: '8px' }} />
        <div className="skeleton-line pulse" style={{ width: '40%', height: '14px' }} />
      </div>
    </Card>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteModal({ material, onConfirm, onCancel, isDeleting }) {
  if (!material) return null;
  return (
    <div className="mmp-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
      <div className="mmp-modal">
        <h3 className="mmp-modal__title" id="delete-modal-title">Remove this material from listings?</h3>
        <p className="mmp-modal__body">
          Builders will no longer see <strong>{material.name}</strong>. This cannot be undone.
        </p>
        <div className="mmp-modal__actions">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isDeleting}
            id="delete-modal-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isDeleting}
            id="delete-modal-confirm-btn"
            className="mmp-modal__delete-btn"
          >
            {isDeleting ? 'Removing...' : 'Remove'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div className={`mmp-toast mmp-toast--${type}`} role="alert" aria-live="assertive">
      {message}
    </div>
  );
}

// ─── Material Card ────────────────────────────────────────────────────────────

function MaterialCard({ material, onToggleActive, onDelete, togglingId }) {
  const navigate = useNavigate();
  const catColors = CATEGORY_COLORS[material.category] || CATEGORY_COLORS.other;
  const imageUrl = material.images && material.images[0]?.url;
  const isToggling = togglingId === material._id;

  return (
    <Card
      surface="navy"
      padding="0"
      className={`mmp-card${!material.isActive ? ' mmp-card--inactive' : ''}`}
    >
      {/* Card image / placeholder */}
      {imageUrl ? (
        <div className="mmp-card__img-wrapper">
          <img
            src={imageUrl}
            alt={material.name}
            className="mmp-card__img"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement.classList.add('mmp-card__img-wrapper--fallback');
            }}
          />
        </div>
      ) : (
        <div className="mmp-card__img-placeholder">
          <CategoryIcon category={material.category} />
        </div>
      )}

      {/* Card body */}
      <div className="mmp-card__body">
        {/* Category badge */}
        <div className="mmp-card__badges">
          <span
            className="mmp-category-badge"
            style={{
              backgroundColor: catColors.bg,
              color:           catColors.color,
              border:          `1px solid ${catColors.border}`,
            }}
          >
            {material.category}
          </span>
        </div>

        {/* Name */}
        <p className="mmp-card__name">{material.name}</p>

        {/* Brand */}
        <p className="mmp-card__brand">
          {material.brand || <span className="mmp-card__brand--empty">No brand</span>}
        </p>

        {/* Price */}
        <p className="mmp-card__price">
          ₹{material.pricePerUnit.toLocaleString('en-IN')}
          <span className="mmp-card__unit"> {material.unit}</span>
        </p>

        {/* Stock */}
        <StockBadge stock={material.stock} unit={material.unit} />

        {/* Delivery time */}
        {material.deliveryTime && (
          <p className="mmp-card__delivery">🚚 {material.deliveryTime}</p>
        )}
      </div>

      {/* Card footer */}
      <div className="mmp-card__footer">
        <ToggleSwitch
          id={`toggle-${material._id}`}
          checked={material.isActive}
          onChange={() => onToggleActive(material)}
          disabled={isToggling}
        />

        <div className="mmp-card__footer-actions">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/marketplace/vendor/materials/${material._id}/edit`)}
            id={`edit-material-${material._id}`}
          >
            Edit
          </Button>
          <button
            className="mmp-delete-btn"
            onClick={() => onDelete(material)}
            id={`delete-material-${material._id}`}
            aria-label={`Delete ${material.name}`}
          >
            Delete
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function MyMaterialsPage() {
  const [materials, setMaterials]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('active'); // 'active' | 'inactive'
  const [togglingId, setTogglingId]       = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [isDeleting, setIsDeleting]       = useState(false);
  const [toast, setToast]                 = useState({ message: '', type: 'success' });

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  }

  // Fetch all vendor materials
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/marketplace/materials/my');
      setMaterials(res.data.materials || []);
    } catch (err) {
      console.error('[MyMaterialsPage] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Tab filtering (client-side)
  const activeMaterials   = materials.filter(m => m.isActive);
  const inactiveMaterials = materials.filter(m => !m.isActive);
  const displayed = activeTab === 'active' ? activeMaterials : inactiveMaterials;

  // isActive toggle
  async function handleToggleActive(material) {
    setTogglingId(material._id);
    try {
      const res = await apiClient.patch(`/api/marketplace/materials/${material._id}`, {
        isActive: !material.isActive,
      });
      const updated = res.data.material;
      setMaterials(prev => prev.map(m => m._id === updated._id ? { ...m, isActive: updated.isActive } : m));
      showToast(updated.isActive ? 'Listing activated.' : 'Listing deactivated.');
    } catch (err) {
      console.error('[MyMaterialsPage] toggle error:', err);
      showToast('Failed to update listing status.', 'error');
    } finally {
      setTogglingId(null);
    }
  }

  // Delete flow
  function handleDeleteClick(material) {
    setDeleteTarget(material);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.patch(`/api/marketplace/materials/${deleteTarget._id}`, { isActive: false });
      setMaterials(prev => prev.filter(m => m._id !== deleteTarget._id));
      showToast('Material removed from listings.');
      setDeleteTarget(null);
    } catch (err) {
      console.error('[MyMaterialsPage] delete error:', err);
      showToast('Failed to remove material.', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mmp-page">
      <Toast message={toast.message} type={toast.type} />

      {/* Page Header */}
      <header className="mmp-header">
        <div className="mmp-header__left">
          <h2 className="mmp-header__title">My Materials</h2>
        </div>
        <Button
          as={Link}
          to="/marketplace/vendor/materials/new"
          variant="primary"
          id="my-materials-add-btn"
        >
          + Add Material
        </Button>
      </header>

      {/* Tab Bar */}
      <div className="mmp-tabs" role="tablist" aria-label="Material status tabs">
        <button
          className={`mmp-tab${activeTab === 'active' ? ' mmp-tab--active' : ''}`}
          onClick={() => setActiveTab('active')}
          role="tab"
          aria-selected={activeTab === 'active'}
          id="tab-active-materials"
        >
          Active
          {!loading && (
            <span className="mmp-tab__count">{activeMaterials.length}</span>
          )}
        </button>
        <button
          className={`mmp-tab${activeTab === 'inactive' ? ' mmp-tab--active' : ''}`}
          onClick={() => setActiveTab('inactive')}
          role="tab"
          aria-selected={activeTab === 'inactive'}
          id="tab-inactive-materials"
        >
          Inactive
          {!loading && (
            <span className="mmp-tab__count">{inactiveMaterials.length}</span>
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="mmp-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : materials.length === 0 ? (
        /* Global empty state — no materials at all */
        <Card surface="navy" className="mmp-empty-state">
          <div className="mmp-empty-state__inner">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent, #fffa56)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <p className="mmp-empty-state__text">You haven't listed any materials yet.</p>
            <Button
              as={Link}
              to="/marketplace/vendor/materials/new"
              variant="primary"
              id="my-materials-empty-add-btn"
            >
              Add your first material
            </Button>
          </div>
        </Card>
      ) : displayed.length === 0 ? (
        /* Tab-specific empty state */
        <Card surface="navy" className="mmp-tab-empty">
          <p className="mmp-tab-empty__text">
            No {activeTab === 'active' ? 'active' : 'inactive'} materials.
          </p>
          {activeTab === 'active' && (
            <Button
              as={Link}
              to="/marketplace/vendor/materials/new"
              variant="primary"
              size="sm"
              id="my-materials-tab-empty-add-btn"
            >
              Add a material
            </Button>
          )}
        </Card>
      ) : (
        <div className="mmp-grid" role="list">
          {displayed.map(material => (
            <MaterialCard
              key={material._id}
              material={material}
              onToggleActive={handleToggleActive}
              onDelete={handleDeleteClick}
              togglingId={togglingId}
            />
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        material={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default MyMaterialsPage;
