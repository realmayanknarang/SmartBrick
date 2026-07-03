/**
 * client/src/pages/AnalyticsReportsPage.jsx
 *
 * Tabbed Wrapper for Analytics & Reports group — Phase 13 UI Fixes
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useLocation, Link } from 'react-router-dom';
import { SignOutButton } from '@clerk/clerk-react';
import Sidebar from '../components/Sidebar';
import { NAV_ITEMS } from '../config/dashboardNav.jsx';
import TabBar from '../components/TabBar';
import AnalyticsPage from './AnalyticsPage';
import ReportsPage from './ReportsPage';
import ForecastingPage from './ForecastingPage';
import AlertsPage from './AlertsPage';
import './DashboardPage.css';

function AnalyticsReportsPage() {
  const { pathname } = useLocation();

  const tabs = [
    { label: 'Analytics', content: <AnalyticsPage /> },
    { label: 'Reports', content: <ReportsPage /> },
    { label: 'Forecasting', content: <ForecastingPage /> },
    { label: 'Alerts', content: <AlertsPage /> },
  ];

  return (
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Analytics & Reports</h1>
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
          <TabBar tabs={tabs} />
        </div>
      </main>
    </div>
  );
}

export default AnalyticsReportsPage;
