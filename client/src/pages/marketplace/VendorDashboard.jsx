/**
 * client/src/pages/marketplace/VendorDashboard.jsx
 *
 * Root layout for the vendor marketplace experience — Phase M6A.
 * Renders the Sidebar and main content area with nested routing.
 * Mirrors the OwnerDashboard / BuilderDashboard pattern from M4A / M5A.
 */

import { useLocation, Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import '../../pages/DashboardPage.css'; // Reuse dashboard shell styles

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

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

function PackageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChartBarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

function ShoppingCartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="12" y1="9" x2="12" y2="9.01" />
      <line x1="8" y1="9" x2="8" y2="9.01" />
      <line x1="16" y1="9" x2="16" y2="9.01" />
    </svg>
  );
}

// ─── VendorDashboard Shell ───────────────────────────────────────────────────

function VendorDashboard() {
  const { pathname } = useLocation();

  // Redirect root /marketplace/vendor to overview
  if (pathname === '/marketplace/vendor' || pathname === '/marketplace/vendor/') {
    return <Navigate to="/marketplace/vendor/overview" replace />;
  }

  const navItems = [
    {
      icon: <OverviewIcon />,
      label: 'Overview',
      path: '/marketplace/vendor/overview',
      group: null,
    },
    {
      icon: <PackageIcon />,
      label: 'My Materials',
      path: '/marketplace/vendor/materials',
      group: 'MY LISTINGS',
    },
    {
      icon: <PlusIcon />,
      label: 'Add Material',
      path: '/marketplace/vendor/materials/new',
      group: 'MY LISTINGS',
    },
    {
      icon: <SearchIcon />,
      label: 'Browse All Materials',
      path: '/marketplace/vendor/browse',
      group: 'MARKETPLACE',
    },
    {
      icon: <ChartBarIcon />,
      label: 'Price Comparison',
      path: '/marketplace/vendor/compare',
      group: 'MARKETPLACE',
    },
    {
      icon: <ShoppingCartIcon />,
      label: 'Received Orders',
      path: '/marketplace/vendor/orders',
      group: 'MARKETPLACE',
    },
    {
      icon: <ChatIcon />,
      label: 'AI Chat',
      path: '/marketplace/vendor/ai-chat',
      group: 'TOOLS',
    },

  ];

  return (
    <div className="dash-shell">
      <Sidebar items={navItems} activePath={pathname} showSignOut={true} />
      <main className="dash-main" id="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default VendorDashboard;
