/**
 * client/src/pages/DashboardPage.jsx
 *
 * SmartBrick Dashboard Shell — Phase 7A
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders the full authenticated dashboard layout:
 *   • Phase 4E Sidebar on the left with the 5 core nav items
 *   • Main content area on the right, showing the Overview panel
 *
 * Overview panel
 * ──────────────
 *   • Personalised welcome using Clerk's useUser() hook (same pattern as
 *     the pre-Phase-7A DashboardPage placeholder)
 *   • 3 metric Cards (Phase 4C) fed by real data from
 *     GET /api/dashboard/summary (Phase 7A backend route)
 *
 * Active-path tracking
 * ────────────────────
 *   useLocation().pathname is passed to Sidebar as `activePath` so the
 *   correct nav item gets the gold left-border highlight.
 *
 * Icon convention
 * ───────────────
 *   Phase 4 uses only inline SVG icons — no external icon library is installed.
 *   Nav icons here follow the same pattern: hand-crafted 20×20 SVGs that match
 *   the visual weight of the brand mark in Sidebar.jsx.
 */

import { useState, useEffect } from 'react';
import { useLocation, Link }  from 'react-router-dom';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import Sidebar from '../components/Sidebar';
import { NAV_ITEMS } from '../config/dashboardNav.jsx';
import Card    from '../components/Card';
import apiClient from '../api/client';
import './DashboardPage.css';


// ─── Metric card helper ────────────────────────────────────────────────────────

/**
 * Renders a single KPI card.
 *
 * @param {{ label: string, value: string|number, icon: ReactNode, subtitle?: string }} props
 */
function MetricCard({ label, value, icon, subtitle }) {
  return (
    <Card surface="navy-secondary" className="dash-metric-card">
      <div className="dash-metric-card__icon-row">
        <span className="dash-metric-card__icon" aria-hidden="true">{icon}</span>
      </div>
      <p  className="dash-metric-card__value">{value}</p>
      <p  className="dash-metric-card__label">{label}</p>
      {subtitle && (
        <p className="dash-metric-card__subtitle">{subtitle}</p>
      )}
    </Card>
  );
}

// ─── Active sites icon (reused in metric card) ────────────────────────────────

function BuildingIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="20" height="14" rx="2" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9"  y="14" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="15" y="14" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
      <path d="M8 10V7a6 6 0 0112 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function VendorCardIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="10" r="5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 24c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SpendIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="11" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5" />
      <text x="14" y="19" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor">₹</text>
    </svg>
  );
}

function AlertsCardIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 3L3 22h22L14 3z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="14" cy="20" r="1.1" fill="currentColor" />
    </svg>
  );
}

/**
 * Formats a rupee amount using Indian locale short-form:
 *   < 1 Lakh  → ₹XX,XXX
 *   ≥ 1 Lakh  → ₹X.XX L
 *   ≥ 1 Crore → ₹X.XX Cr
 */
function formatRupees(amount) {
  if (amount == null || isNaN(amount)) return '—';
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)} Cr`;
  if (amount >= 1_00_000)    return `₹${(amount / 1_00_000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

// ─── DashboardPage ─────────────────────────────────────────────────────────────

function DashboardPage() {
  const { user }          = useUser();
  const { pathname }      = useLocation();

  // Summary metrics state
  const [metrics, setMetrics]   = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError,   setMetricsError]   = useState(null);

  // Alert count state (Phase 8D) — compact badge on Overview
  const [alertCount,     setAlertCount]     = useState(null);
  const [criticalCount,  setCriticalCount]  = useState(0);

  // Fetch summary once on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchSummary() {
      setMetricsLoading(true);
      setMetricsError(null);
      try {
        const { data } = await apiClient.get('/dashboard/summary');
        if (!cancelled) setMetrics(data);
      } catch (err) {
        if (!cancelled) {
          setMetricsError(
            err?.response?.data?.message || 'Failed to load dashboard metrics.'
          );
        }
      } finally {
        if (!cancelled) setMetricsLoading(false);
      }
    }

    fetchSummary();
    return () => { cancelled = true; };
  }, []);

  // Fetch alert counts for compact badge (Phase 8D)
  useEffect(() => {
    let cancelled = false;
    apiClient.get('/alerts')
      .then(({ data }) => {
        if (!cancelled) {
          const total = (data.stockAlerts?.length ?? 0) + (data.budgetAlerts?.length ?? 0);
          const critical = [
            ...(data.stockAlerts?.filter(a => a.severity === 'critical') ?? []),
            ...(data.budgetAlerts?.filter(a => a.severity === 'critical') ?? []),
          ].length;
          setAlertCount(total);
          setCriticalCount(critical);
        }
      })
      .catch(() => {
        // Non-critical — badge just won't render if alerts endpoint fails
        if (!cancelled) setAlertCount(0);
      });
    return () => { cancelled = true; };
  }, []);

  // Derive a friendly display name from Clerk user
  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    'there';

  return (
    <div className="dash-shell">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      {/* ── Main content area ────────────────────────────────────────────── */}
      <main className="dash-main" id="main-content">

        {/* Top bar */}
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Overview</h1>
          </div>
          <div className="dash-topbar__right">
            <Link to="/" className="dash-topbar__link">Home</Link>
            <SignOutButton>
              <button className="dash-topbar__signout" id="dashboard-sign-out-btn">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </header>

        {/* Content */}
        <div className="dash-content">

          {/* Welcome banner */}
          <section className="dash-welcome" aria-label="Welcome message">
            <p className="dash-welcome__greeting">Welcome back,</p>
            <h2 className="dash-welcome__name">{displayName} 👋</h2>
            <p className="dash-welcome__sub">
              Here's a live snapshot of your SmartBrick workspace.
            </p>
          </section>

          {/* Metric cards */}
          <section
            className="dash-metrics"
            aria-label="Key performance metrics"
            aria-live="polite"
            aria-busy={metricsLoading}
          >
            {metricsError && (
              <p className="dash-metrics__error" role="alert">
                ⚠ {metricsError}
              </p>
            )}

            {metricsLoading && !metricsError && (
              <p className="dash-metrics__loading">Loading metrics…</p>
            )}

            {!metricsLoading && !metricsError && metrics && (
              <div className="dash-metrics__grid">
                <MetricCard
                  label="Active Sites"
                  value={metrics.activeSites}
                  icon={<BuildingIcon />}
                  subtitle="Construction sites tracked"
                />
                <MetricCard
                  label="Active Vendors"
                  value={metrics.activeVendors}
                  icon={<VendorCardIcon />}
                  subtitle="Verified supplier network"
                />
                <MetricCard
                  label="Total Spend"
                  value={formatRupees(metrics.totalSpend)}
                  icon={<SpendIcon />}
                  subtitle="Across all projects"
                />
                {/* Phase 8D — alert count badge */}
                {alertCount != null && (
                  <Link to="/dashboard/alerts" className="dash-metric-card-link">
                    <MetricCard
                      label="Active Alerts"
                      value={alertCount}
                      icon={<AlertsCardIcon />}
                      subtitle={
                        alertCount === 0
                          ? 'All clear — no issues'
                          : criticalCount > 0
                            ? `${criticalCount} critical, ${alertCount - criticalCount} other`
                            : `${alertCount} need attention`
                      }
                    />
                  </Link>
                )}
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
