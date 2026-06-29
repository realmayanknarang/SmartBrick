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
import './DashboardPage.css';

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
  { icon: <ReportsIcon />,   label: 'Analytics',      path: '/dashboard/analytics' },
  { icon: <AlertsIcon />,    label: 'Alerts',         path: '/dashboard/alerts' },
  { icon: <ScannerIcon />, label: 'Invoice OCR', path: '/dashboard/invoice-scanner', dividerBefore: true },
  { icon: <WeatherIcon />,   label: 'Weather Alerts', path: '/dashboard/weather' },
  { icon: <MapIcon />,       label: 'Logistics',      path: '/dashboard/logistics' },
  { icon: <LeafIcon />,      label: 'Sustainability',  path: '/dashboard/carbon' },
];

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
