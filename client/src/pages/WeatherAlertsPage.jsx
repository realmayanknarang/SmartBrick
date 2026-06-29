/**
 * client/src/pages/WeatherAlertsPage.jsx
 *
 * Weather Risk Alerts — Phase 7D (client)
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches weather risk alerts for all seeded construction sites via
 * GET /api/weather/sites and renders a live risk dashboard.
 *
 * Layout
 * ──────
 * • Site cards in a responsive grid — each shows:
 *     – Site name + city
 *     – Risk status badge (clear / at-risk)
 *     – Alert list with severity colours
 * • Auto-refreshes every 30 min (matching backend cache TTL)
 * • Graceful handling when OPENWEATHER_API_KEY is not configured
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link }                from 'react-router-dom';
import { useUser, SignOutButton }            from '@clerk/clerk-react';
import Sidebar                              from '../components/Sidebar';
import Card                                 from '../components/Card';
import apiClient                            from '../api/client';
import './WeatherAlertsPage.css';

// ─── Sidebar nav items (shared set) ──────────────────────────────────────────
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

const NAV_ITEMS = [
  { icon: <OverviewIcon />,  label: 'Overview',       path: '/dashboard' },
  { icon: <SitesIcon />,     label: 'Sites',          path: '/dashboard/sites' },
  { icon: <VendorsIcon />,   label: 'Vendors',        path: '/dashboard/vendors' },
  { icon: <ReportsIcon />,   label: 'Reports',        path: '/dashboard/reports' },
  { icon: <AlertsIcon />,    label: 'Alerts',         path: '/dashboard/alerts' },
  { icon: <ScannerIcon />,   label: 'Invoice OCR',    path: '/dashboard/invoice-scanner' },
  { icon: <WeatherIcon />,   label: 'Weather Alerts', path: '/dashboard/weather' },
  { icon: <MapIcon />,       label: 'Logistics',      path: '/dashboard/logistics' },
  { icon: <LeafIcon />,      label: 'Sustainability',  path: '/dashboard/carbon' },
];

// ─── Alert severity colour map ────────────────────────────────────────────────
const SEVERITY_CLASS = {
  high:   'wx-alert--high',
  medium: 'wx-alert--medium',
  low:    'wx-alert--low',
};

// ─── Single site weather card ─────────────────────────────────────────────────
function SiteWeatherCard({ site }) {
  const hasRisk = site.hasRisk;

  return (
    <Card surface="navy-secondary" className={['wx-site-card', hasRisk ? 'wx-site-card--risk' : ''].filter(Boolean).join(' ')}>
      {/* Header row */}
      <div className="wx-site-card__header">
        <div>
          <p className="wx-site-card__name">{site.siteName}</p>
          <p className="wx-site-card__city">{site.city}</p>
        </div>
        <span className={['wx-status-badge', hasRisk ? 'wx-status-badge--risk' : 'wx-status-badge--clear'].join(' ')}>
          {hasRisk ? '⚠ At Risk' : '✓ Clear'}
        </span>
      </div>

      {/* Error state for a single site */}
      {site.error && (
        <p className="wx-site-error">⚠ {site.error}</p>
      )}

      {/* Alert list */}
      {hasRisk && site.alerts?.length > 0 && (
        <ul className="wx-alerts-list" role="list" aria-label={`Alerts for ${site.siteName}`}>
          {site.alerts.map((alert, i) => (
            <li key={i} className={['wx-alert', SEVERITY_CLASS[alert.severity] ?? 'wx-alert--low'].join(' ')}>
              <span className="wx-alert__dot" aria-hidden="true" />
              <span className="wx-alert__msg">{alert.message}</span>
            </li>
          ))}
        </ul>
      )}

      {/* All clear */}
      {!hasRisk && !site.error && (
        <p className="wx-site-clear-msg">No weather risks detected for the next 48 hours.</p>
      )}

      {/* Footer metadata */}
      <p className="wx-site-card__footer">
        {site.lat != null && site.lon != null
          ? `📍 ${site.lat.toFixed(4)}, ${site.lon.toFixed(4)}`
          : ''}
        {site.fromCache ? '  · cached' : ''}
      </p>
    </Card>
  );
}

// ─── WeatherAlertsPage ────────────────────────────────────────────────────────

function WeatherAlertsPage() {
  const { pathname } = useLocation();

  const [sites,   setSites]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/weather/sites');
      setSites(data.sites ?? []);
      setLastFetched(new Date());
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Failed to load weather alerts. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount; re-fetch every 30 min (matching backend cache TTL)
  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const atRiskCount = sites.filter(s => s.hasRisk).length;

  return (
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        {/* Top bar */}
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Weather Alerts</h1>
          </div>
          <div className="dash-topbar__right">
            <Link to="/dashboard" className="dash-topbar__link">Overview</Link>
            <Link to="/" className="dash-topbar__link">Home</Link>
            <SignOutButton>
              <button className="dash-topbar__signout" id="weather-alerts-signout-btn">Sign out</button>
            </SignOutButton>
          </div>
        </header>

        <div className="dash-content">

          {/* Intro */}
          <section className="wx-intro">
            <p className="wx-intro__label">Live Forecast · 48-Hour Window</p>
            <h2 className="wx-intro__heading">Site Weather Risk Monitor</h2>
            <p className="wx-intro__sub">
              Real-time risk alerts for all construction sites using OpenWeatherMap.
              Thresholds: heavy rain (&gt;3 mm/3h), extreme heat (&gt;40°C), strong winds (&gt;15 m/s), thunderstorms.
            </p>
          </section>

          {/* Summary row */}
          {!loading && !error && sites.length > 0 && (
            <div className="wx-summary-row">
              <Card surface="navy-secondary" className="wx-stat-card">
                <p className="wx-stat-card__value">{sites.length}</p>
                <p className="wx-stat-card__label">Sites Monitored</p>
              </Card>
              <Card surface="navy-secondary" className={['wx-stat-card', atRiskCount > 0 ? 'wx-stat-card--risk' : ''].join(' ')}>
                <p className="wx-stat-card__value">{atRiskCount}</p>
                <p className="wx-stat-card__label">{atRiskCount === 1 ? 'Site At Risk' : 'Sites At Risk'}</p>
              </Card>
              <Card surface="navy-secondary" className="wx-stat-card">
                <p className="wx-stat-card__value">{sites.length - atRiskCount}</p>
                <p className="wx-stat-card__label">Sites Clear</p>
              </Card>
            </div>
          )}

          {/* Controls */}
          <div className="wx-controls">
            <button
              className="wx-refresh-btn"
              id="wx-refresh-btn"
              onClick={fetchWeather}
              disabled={loading}
              aria-label="Refresh weather data"
            >
              {loading ? '⟳ Refreshing…' : '⟳ Refresh'}
            </button>
            {lastFetched && (
              <p className="wx-last-fetched">
                Last updated: {lastFetched.toLocaleTimeString('en-IN')}
              </p>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="wx-loading">
              <div className="wx-loading__spinner" aria-hidden="true" />
              <p className="wx-loading__text">Fetching weather forecasts for all sites…</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <Card surface="navy-secondary" className="wx-error-card">
              <p className="wx-error-card__icon" aria-hidden="true">⛅</p>
              <p className="wx-error-card__heading">Could not load weather data</p>
              <p className="wx-error-card__message">{error}</p>
              <button className="wx-retry-btn" id="wx-retry-btn" onClick={fetchWeather}>
                Try Again
              </button>
            </Card>
          )}

          {/* Site cards grid */}
          {!loading && !error && sites.length > 0 && (
            <div className="wx-sites-grid" aria-label="Construction site weather alerts">
              {sites.map(site => (
                <SiteWeatherCard key={site.siteId} site={site} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && sites.length === 0 && (
            <Card surface="navy-secondary" className="wx-empty-state">
              <p className="wx-empty-state__icon" aria-hidden="true">🏗</p>
              <p className="wx-empty-state__heading">No sites found</p>
              <p className="wx-empty-state__sub">
                Add construction sites to your workspace to monitor weather risks.
              </p>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}

export default WeatherAlertsPage;
