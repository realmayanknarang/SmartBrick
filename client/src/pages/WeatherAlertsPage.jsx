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
import { NAV_ITEMS } from '../config/dashboardNav.jsx';
import Card                                 from '../components/Card';
import apiClient                            from '../api/client';
import './WeatherAlertsPage.css';


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
