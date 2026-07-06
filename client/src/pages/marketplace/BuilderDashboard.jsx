/**
 * client/src/pages/marketplace/BuilderDashboard.jsx
 *
 * Root layout for the builder marketplace experience — Phase M5A.
 * Renders the Sidebar and main content area with nested routing.
 * Mirrors the OwnerDashboard pattern from Phase M4A.
 */

import { useState, useEffect } from 'react';
import { useLocation, Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useSocket } from '../../hooks/useSocket';
import apiClient from '../../api/client';
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

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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

function FileTextIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function HardHatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" />
      <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
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

// ─── BuilderDashboard Shell ───────────────────────────────────────────────────

function BuilderDashboard() {
  const { pathname } = useLocation();
  const { onNotificationUpdate } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mongoUserId, setMongoUserId] = useState(null);

  // Fetch initial unread count and MongoDB User ID
  useEffect(() => {
    let active = true;

    async function initializeData() {
      try {
        const syncResponse = await apiClient.post('/auth/sync');
        if (active) {
          setMongoUserId(syncResponse.data.id);
        }

        const notificationsResponse = await apiClient.get('/api/marketplace/notifications?isRead=false');
        if (active) {
          setUnreadCount(notificationsResponse.data.unreadCount || 0);
        }
      } catch (err) {
        console.error('[BuilderDashboard] Initialization failed:', err);
      }
    }

    initializeData();

    return () => {
      active = false;
    };
  }, []);

  // Listen to real-time notification socket updates
  useEffect(() => {
    if (!mongoUserId) return;

    const cleanup = onNotificationUpdate(({ recipientId }) => {
      if (recipientId === mongoUserId) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return cleanup;
  }, [mongoUserId, onNotificationUpdate]);

  // Redirect root /marketplace/builder to overview
  if (pathname === '/marketplace/builder' || pathname === '/marketplace/builder/') {
    return <Navigate to="/marketplace/builder/overview" replace />;
  }

  const navItems = [
    {
      icon: <OverviewIcon />,
      label: 'Overview',
      path: '/marketplace/builder/overview',
      group: null
    },
    {
      icon: <BellIcon />,
      label: 'Notifications',
      path: '/marketplace/builder/notifications',
      badge: unreadCount > 0 ? unreadCount : null,
      group: null
    },
    {
      icon: <SearchIcon />,
      label: 'Browse Projects',
      path: '/marketplace/builder/projects',
      group: 'PROJECTS'
    },
    {
      icon: <FileTextIcon />,
      label: 'My Proposals',
      path: '/marketplace/builder/proposals',
      group: 'PROJECTS'
    },
    {
      icon: <HardHatIcon />,
      label: 'Active Projects',
      path: '/marketplace/builder/workspace',
      group: 'PROJECTS'
    },
    {
      icon: <PackageIcon />,
      label: 'Browse Materials',
      path: '/marketplace/builder/materials',
      group: 'MATERIALS'
    }
  ];

  return (
    <div className="dash-shell">
      <Sidebar items={navItems} activePath={pathname} showSignOut={true} />
      <main className="dash-main" id="main-content">
        <Outlet context={{ unreadCount, setUnreadCount, mongoUserId }} />
      </main>
    </div>
  );
}

export default BuilderDashboard;
