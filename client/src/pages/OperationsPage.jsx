/**
 * client/src/pages/OperationsPage.jsx
 *
 * Tabbed Wrapper for Operations group — Phase 13 UI Fixes
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useLocation, Link } from 'react-router-dom';
import { SignOutButton } from '@clerk/clerk-react';
import Sidebar from '../components/Sidebar';
import { NAV_ITEMS } from '../config/dashboardNav.jsx';
import TabBar from '../components/TabBar';
import InvoiceScannerPage from './InvoiceScannerPage';
import WeatherAlertsPage from './WeatherAlertsPage';
import LogisticsPage from './LogisticsPage';
import CarbonPage from './CarbonPage';
import './DashboardPage.css';

function OperationsPage() {
  const { pathname } = useLocation();

  const tabs = [
    { label: 'Invoice OCR', content: <InvoiceScannerPage /> },
    { label: 'Weather Alerts', content: <WeatherAlertsPage /> },
    { label: 'Logistics', content: <LogisticsPage /> },
    { label: 'Sustainability', content: <CarbonPage /> },
  ];

  return (
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Operations</h1>
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

export default OperationsPage;
