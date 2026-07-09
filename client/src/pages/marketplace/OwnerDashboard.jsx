/**
 * client/src/pages/marketplace/OwnerDashboard.jsx
 *
 * Root layout for the owner marketplace experience — Phase M4A.
 * Renders the Sidebar and main content area with nested routing.
 */

import { useState, useEffect } from 'react';
import { useLocation, Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useSocket } from '../../hooks/useSocket';
import apiClient from '../../api/client';
import '../../pages/DashboardPage.css'; // Reuse dashboard shell styles for consistent UI

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

function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="22" x2="9" y2="16" />
      <line x1="15" y1="22" x2="15" y2="16" />
      <line x1="9" y1="16" x2="15" y2="16" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01" />
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

function OwnerDashboard() {
  const { pathname } = useLocation();
  const {
    onNotificationUpdate,
    sendMessage,
    joinConversation,
    startTyping,
    stopTyping,
    onNewMessage,
    onTyping,
    onMessagesRead,
    onUserOnline,
    onUserOffline,
    markRead,
  } = useSocket();
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

        const notificationsResponse = await apiClient.get('/marketplace/notifications?isRead=false');
        if (active) {
          setUnreadCount(notificationsResponse.data.unreadCount || 0);
        }
      } catch (err) {
        console.error('[OwnerDashboard] Initialization failed:', err);
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

  // Redirect root path /marketplace/owner to overview
  if (pathname === '/marketplace/owner' || pathname === '/marketplace/owner/') {
    return <Navigate to="/marketplace/owner/overview" replace />;
  }

  const navItems = [
    {
      icon: <OverviewIcon />,
      label: 'Overview',
      path: '/marketplace/owner/overview',
      group: null
    },
    {
      icon: <BellIcon />,
      label: 'Notifications',
      path: '/marketplace/owner/notifications',
      badge: unreadCount > 0 ? unreadCount : null,
      group: null
    },
    {
      icon: <BuildingIcon />,
      label: 'My Projects',
      path: '/marketplace/owner/projects',
      group: 'PROJECTS'
    },
    {
      icon: <PlusIcon />,
      label: 'Create Project',
      path: '/marketplace/owner/projects/new',
      group: 'PROJECTS'
    },

  ];

  return (
    <div className="dash-shell">
      <Sidebar items={navItems} activePath={pathname} showSignOut={true} />
      <main className="dash-main" id="main-content">
        <Outlet
          context={{
            unreadCount,
            setUnreadCount,
            mongoUserId,
            sendMessage,
            joinConversation,
            startTyping,
            stopTyping,
            onNewMessage,
            onTyping,
            onMessagesRead,
            onUserOnline,
            onUserOffline,
            markRead,
          }}
        />
      </main>
    </div>
  );
}

export default OwnerDashboard;
