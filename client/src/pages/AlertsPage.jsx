/**
 * client/src/pages/AlertsPage.jsx
 *
 * Smart Alerts Dashboard — Phase 8D
 * ─────────────────────────────────────────────────────────────────────────────
 * Consumes GET /api/alerts and renders two alert categories:
 *
 *   Stock Alerts   — materials with quantity < reorderThreshold at a site
 *   Budget Alerts  — projects where spentSoFar > 90% of budget
 *
 * Visual design
 * ─────────────
 * Severity-coded alert cards consistent with WeatherAlertsPage pattern
 * (Phase 7D):
 *   critical → red/rose accent  (≥ 100% spent, or stock < 50% of threshold)
 *   warning  → amber accent     (90–99% spent)
 *   low      → amber accent     (stock 50–99% of threshold)
 *
 * Both loading/error states use the same pattern as Phase 7G.
 */

import { useState, useEffect } from 'react';
import { useLocation, Link }  from 'react-router-dom';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import Sidebar   from '../components/Sidebar';
import Card      from '../components/Card';
import apiClient from '../api/client';
import './DashboardPage.css';
import './AlertsPage.css';

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
function WeatherNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 14c0-1.1.9-2 2-2h6a2 2 0 110 4H7a2 2 0 01-2-2z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
function MapNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4l5 2 6-2 5 2v12l-5-2-6 2-5-2V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="7" y1="6" x2="7" y2="18" stroke="currentColor" strokeWidth="1.2" />
      <line x1="13" y1="2" x2="13" y2="16" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function LeafNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 4C16 4 14 12 8 14C5 15 3 16 3 16C3 16 4 12 7 9C10 6 16 4 16 4Z" fill="currentColor" opacity="0.6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M3 16C5 13 8 11 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

const NAV_ITEMS = [
  { icon: <OverviewIcon />,    label: 'Overview',       path: '/dashboard' },
  { icon: <SitesIcon />,       label: 'Sites',          path: '/dashboard/sites' },
  { icon: <VendorsIcon />,     label: 'Vendors',        path: '/dashboard/vendors' },
  { icon: <ReportsIcon />,     label: 'Analytics',      path: '/dashboard/analytics' },
  { icon: <AlertsIcon />,      label: 'Alerts',         path: '/dashboard/alerts' },
  { icon: <ScannerIcon />, label: 'Invoice OCR', path: '/dashboard/invoice-scanner', dividerBefore: true },
  { icon: <WeatherNavIcon />,  label: 'Weather Alerts', path: '/dashboard/weather' },
  { icon: <MapNavIcon />,      label: 'Logistics',      path: '/dashboard/logistics' },
  { icon: <LeafNavIcon />,     label: 'Sustainability',  path: '/dashboard/carbon' },
];

// ─── Severity helpers ─────────────────────────────────────────────────────────

/**
 * Returns CSS modifier class and color token based on severity string.
 */
function severityMeta(severity) {
  if (severity === 'critical') {
    return { cls: 'alert-item--critical', emoji: '🔴', label: 'CRITICAL' };
  }
  if (severity === 'warning') {
    return { cls: 'alert-item--warning', emoji: '🟠', label: 'WARNING' };
  }
  return { cls: 'alert-item--low', emoji: '🟡', label: 'LOW' };
}

// ─── Rupee formatter ──────────────────────────────────────────────────────────
function formatINR(value) {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (value >= 1_00_000)    return `₹${(value / 1_00_000).toFixed(2)} L`;
  return `₹${value.toLocaleString('en-IN')}`;
}

// ─── Stock alert card ─────────────────────────────────────────────────────────
function StockAlertCard({ alert }) {
  const { cls, emoji, label } = severityMeta(alert.severity);
  const stockPct = alert.reorderThreshold > 0
    ? Math.round((alert.quantity / alert.reorderThreshold) * 100)
    : 0;

  return (
    <article className={`alert-item ${cls}`} role="listitem">
      <div className="alert-item__header">
        <span className="alert-item__severity-badge" aria-label={`Severity: ${label}`}>
          {emoji} {label}
        </span>
        <span className="alert-item__category-pill">{alert.category}</span>
      </div>

      <div className="alert-item__body">
        <p className="alert-item__title">{alert.materialName}</p>
        <p className="alert-item__subtitle">
          <span className="alert-item__label">Site:</span> {alert.siteName}, {alert.siteCity}
        </p>
      </div>

      <div className="alert-item__stock-row">
        <div className="alert-item__stock-numbers">
          <span className="alert-item__stock-current">{alert.quantity} {alert.unit}</span>
          <span className="alert-item__stock-threshold">
            threshold: {alert.reorderThreshold} {alert.unit}
          </span>
        </div>
        {/* Progress bar showing stock level relative to threshold */}
        <div className="alert-item__bar-track" aria-label={`${stockPct}% of reorder threshold`}>
          <div
            className={`alert-item__bar-fill alert-item__bar-fill--${alert.severity}`}
            style={{ width: `${Math.min(100, stockPct)}%` }}
          />
        </div>
        <p className="alert-item__bar-label">{stockPct}% of reorder threshold</p>
      </div>
    </article>
  );
}

// ─── Budget alert card ────────────────────────────────────────────────────────
function BudgetAlertCard({ alert }) {
  const { cls, emoji, label } = severityMeta(alert.severity);
  const barPct = Math.min(100, alert.percentUsed);

  return (
    <article className={`alert-item ${cls}`} role="listitem">
      <div className="alert-item__header">
        <span className="alert-item__severity-badge" aria-label={`Severity: ${label}`}>
          {emoji} {label}
        </span>
        <span className="alert-item__category-pill" style={{ textTransform: 'capitalize' }}>
          {alert.status}
        </span>
      </div>

      <div className="alert-item__body">
        <p className="alert-item__title">{alert.projectName}</p>
        <p className="alert-item__subtitle">
          <span className="alert-item__label">Spent:</span> {formatINR(alert.spentSoFar)}
          {' / '}
          <span className="alert-item__label">Budget:</span> {formatINR(alert.budget)}
        </p>
      </div>

      <div className="alert-item__stock-row">
        <div className="alert-item__stock-numbers">
          <span className="alert-item__stock-current">{alert.percentUsed}% used</span>
          <span className="alert-item__stock-threshold">
            {alert.percentUsed >= 100 ? '⚠ Over budget' : `${(100 - alert.percentUsed).toFixed(1)}% remaining`}
          </span>
        </div>
        <div className="alert-item__bar-track" aria-label={`${alert.percentUsed}% of budget used`}>
          <div
            className={`alert-item__bar-fill alert-item__bar-fill--${alert.severity}`}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <p className="alert-item__bar-label">{alert.percentUsed}% of budget consumed</p>
      </div>
    </article>
  );
}

// ─── Section panel ────────────────────────────────────────────────────────────
function AlertSection({ title, icon, count, children, emptyMessage }) {
  return (
    <section className="alerts-section" aria-label={title}>
      <div className="alerts-section__header">
        <h2 className="alerts-section__title">
          <span className="alerts-section__icon" aria-hidden="true">{icon}</span>
          {title}
        </h2>
        <span
          className={`alerts-section__count ${count > 0 ? 'alerts-section__count--active' : ''}`}
          aria-label={`${count} alert${count !== 1 ? 's' : ''}`}
        >
          {count}
        </span>
      </div>

      {count === 0 ? (
        <Card surface="navy-secondary" padding="var(--space-6)">
          <div className="alerts-empty">
            <span className="alerts-empty__icon">✅</span>
            <p className="alerts-empty__text">{emptyMessage}</p>
          </div>
        </Card>
      ) : (
        <div className="alerts-list" role="list">
          {children}
        </div>
      )}
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function AlertsPage() {
  const { pathname }   = useLocation();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiClient.get('/alerts')
      .then(({ data: d }) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load alerts.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dash-shell">
        <Sidebar items={NAV_ITEMS} activePath={pathname} />
        <main className="dash-main" id="main-content">
          <div className="alerts-full-state">
            <span className="alerts-full-state__icon">⏳</span>
            Checking for alerts…
          </div>
        </main>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="dash-shell">
        <Sidebar items={NAV_ITEMS} activePath={pathname} />
        <main className="dash-main" id="main-content">
          <div className="alerts-full-state alerts-full-state--error">
            <span className="alerts-full-state__icon">⚠️</span>
            {error}
          </div>
        </main>
      </div>
    );
  }

  const { stockAlerts = [], budgetAlerts = [] } = data ?? {};
  const totalAlerts = stockAlerts.length + budgetAlerts.length;
  const criticalCount = [
    ...stockAlerts.filter(a => a.severity === 'critical'),
    ...budgetAlerts.filter(a => a.severity === 'critical'),
  ].length;

  return (
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        {/* Top bar */}
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Alerts</h1>
          </div>
          <div className="dash-topbar__right">
            <Link to="/dashboard" className="dash-topbar__link">Overview</Link>
            <Link to="/" className="dash-topbar__link">Home</Link>
            <SignOutButton>
              <button className="dash-topbar__signout" id="alerts-sign-out-btn">Sign out</button>
            </SignOutButton>
          </div>
        </header>

        <div className="dash-content">
          {/* Page header */}
          <section className="dash-welcome" aria-label="Alerts summary">
            <h2 className="dash-welcome__name">Smart Alerts</h2>
            <p className="dash-welcome__sub">
              {totalAlerts === 0
                ? 'All systems clear — no active alerts.'
                : `${totalAlerts} active alert${totalAlerts !== 1 ? 's' : ''}${criticalCount > 0 ? ` · ${criticalCount} critical` : ''} — action required.`}
            </p>
          </section>

          {/* Summary badge row */}
          {totalAlerts > 0 && (
            <div className="alerts-summary-row" aria-label="Alert summary statistics">
              <Card surface="navy-secondary" padding="0">
                <div className="alerts-kpi-card">
                  <p className="alerts-kpi-card__label">Total Active</p>
                  <p className="alerts-kpi-card__value" id="alerts-total-count">{totalAlerts}</p>
                  <p className="alerts-kpi-card__sub">alerts detected</p>
                </div>
              </Card>
              <Card surface="navy-secondary" padding="0">
                <div className="alerts-kpi-card alerts-kpi-card--critical">
                  <p className="alerts-kpi-card__label">Critical</p>
                  <p className="alerts-kpi-card__value" id="alerts-critical-count">{criticalCount}</p>
                  <p className="alerts-kpi-card__sub">immediate action needed</p>
                </div>
              </Card>
              <Card surface="navy-secondary" padding="0">
                <div className="alerts-kpi-card">
                  <p className="alerts-kpi-card__label">Stock Alerts</p>
                  <p className="alerts-kpi-card__value" id="alerts-stock-count">{stockAlerts.length}</p>
                  <p className="alerts-kpi-card__sub">materials below threshold</p>
                </div>
              </Card>
              <Card surface="navy-secondary" padding="0">
                <div className="alerts-kpi-card">
                  <p className="alerts-kpi-card__label">Budget Alerts</p>
                  <p className="alerts-kpi-card__value" id="alerts-budget-count">{budgetAlerts.length}</p>
                  <p className="alerts-kpi-card__sub">projects ≥ 90% spent</p>
                </div>
              </Card>
            </div>
          )}

          {/* Stock alerts section */}
          <AlertSection
            title="Material Stock Alerts"
            icon="📦"
            count={stockAlerts.length}
            emptyMessage="All material stock levels are within safe thresholds."
          >
            {stockAlerts.map((alert, idx) => (
              <StockAlertCard
                key={`stock-${alert.materialId}-${alert.siteId}-${idx}`}
                alert={alert}
              />
            ))}
          </AlertSection>

          {/* Budget alerts section */}
          <AlertSection
            title="Budget Alerts"
            icon="💰"
            count={budgetAlerts.length}
            emptyMessage="All projects are tracking within 90% of their budget."
          >
            {budgetAlerts.map((alert) => (
              <BudgetAlertCard
                key={`budget-${alert.projectId}`}
                alert={alert}
              />
            ))}
          </AlertSection>

          {/* Role note */}
          <p className="alerts-role-note">
            📋 All authenticated users can view these alerts. Budget alerts can be restricted
            to Owner/Finance roles if required — flag this with your product team.
          </p>
        </div>
      </main>
    </div>
  );
}

export default AlertsPage;
