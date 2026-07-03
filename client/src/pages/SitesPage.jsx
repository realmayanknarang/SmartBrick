/**
 * client/src/pages/SitesPage.jsx
 *
 * Sites Management — Phase 13 UI Fixes
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders a list of all seeded construction sites fetched from MongoDB.
 */

import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import Sidebar from '../components/Sidebar';
import { NAV_ITEMS } from '../config/dashboardNav.jsx';
import Card from '../components/Card';
import apiClient from '../api/client';
import './DashboardPage.css';
import './SitesPage.css';

function SitesPage() {
  const { pathname } = useLocation();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSites() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await apiClient.get('/sites');
        if (!cancelled) {
          setSites(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message || 'Failed to load construction sites.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSites();
    return () => {
      cancelled = true;
    };
  }, []);

  // Map phase name to CSS classes and display labels
  const phaseMap = {
    foundation: { label: 'Foundation', classModifier: 'foundation' },
    structure: { label: 'Structure', classModifier: 'structure' },
    finishing: { label: 'Finishing', classModifier: 'finishing' },
  };

  return (
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Sites</h1>
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
          <div className="sites-header-row">
            <section className="dash-welcome">
              <h2 className="dash-welcome__name">Construction Sites</h2>
              <p className="dash-welcome__sub">
                Live snapshot of active construction sites across your projects.
              </p>
            </section>
            {!loading && !error && sites.length > 0 && (
              <div className="sites-count-pill">
                {sites.length} {sites.length === 1 ? 'Site' : 'Sites'}
              </div>
            )}
          </div>

          {loading && (
            <div className="sites-state">
              <p className="sites-state__message">Loading construction sites...</p>
            </div>
          )}

          {error && (
            <div className="sites-state">
              <p className="sites-state__message" style={{ color: 'var(--color-danger)' }}>
                ⚠ {error}
              </p>
            </div>
          )}

          {!loading && !error && sites.length === 0 && (
            <div className="sites-state">
              <h3 className="sites-state__title">No sites found</h3>
              <p className="sites-state__message">
                There are no seeded construction sites in your workspace.
              </p>
            </div>
          )}

          {!loading && !error && sites.length > 0 && (
            <div className="sites-grid">
              {sites.map((site) => {
                const phase = phaseMap[site.currentPhase] || {
                  label: site.currentPhase,
                  classModifier: 'foundation',
                };
                return (
                  <Card key={site._id} surface="navy-secondary">
                    <div className="site-card">
                      <div className="site-card__header">
                        <div>
                          <h3 className="site-card__title">{site.name}</h3>
                          <div className="site-card__city">📍 {site.city}</div>
                        </div>
                        <span className={`site-badge site-badge--${phase.classModifier}`}>
                          {phase.label}
                        </span>
                      </div>

                      {site.project && (
                        <div className="site-card__project">
                          <span className="site-card__project-label">Parent Project</span>
                          <span className="site-card__project-name">{site.project.name}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SitesPage;
