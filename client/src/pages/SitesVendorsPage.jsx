/**
 * client/src/pages/SitesVendorsPage.jsx
 *
 * Tabbed Wrapper for Sites & Vendors group — Phase 13 UI Fixes
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useLocation, Link } from 'react-router-dom';
import { SignOutButton } from '@clerk/clerk-react';
import Sidebar from '../components/Sidebar';
import { NAV_ITEMS } from '../config/dashboardNav.jsx';
import TabBar from '../components/TabBar';
import SitesPage from './SitesPage';
import VendorsPage from './VendorsPage';
import ApprovalsPage from './ApprovalsPage';
import PoolingPage from './PoolingPage';
import './DashboardPage.css';

function SitesVendorsPage() {
  const { pathname } = useLocation();

  const tabs = [
    { label: 'Sites', content: <SitesPage /> },
    { label: 'Vendors', content: <VendorsPage /> },
    { label: 'Approvals', content: <ApprovalsPage /> },
    { label: 'Order Pooling', content: <PoolingPage /> },
  ];

  return (
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Sites & Vendors</h1>
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

export default SitesVendorsPage;
