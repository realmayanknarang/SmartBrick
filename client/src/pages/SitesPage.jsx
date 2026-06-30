/**
 * client/src/pages/SitesPage.jsx
 *
 * Sites Management — Placeholder
 * ─────────────────────────────────────────────────────────────────────────────
 * Placeholder page for construction sites management.
 */

import { useLocation, Link } from 'react-router-dom';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import Sidebar from '../components/Sidebar';
import { NAV_ITEMS } from '../config/dashboardNav.jsx';
import './DashboardPage.css';


function SitesPage() {
  const { pathname } = useLocation();

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
          <section className="dash-welcome">
            <h2 className="dash-welcome__name">Construction Sites</h2>
            <p className="dash-welcome__sub">
              Manage your construction sites here. This feature is coming soon.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default SitesPage;
