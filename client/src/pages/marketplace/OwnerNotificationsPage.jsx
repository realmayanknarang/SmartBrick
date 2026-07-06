/**
 * client/src/pages/marketplace/OwnerNotificationsPage.jsx
 *
 * Owner Notifications Page — Sub-phase M4F.
 * Displays notifications history and manages unread states.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import apiClient from '../../api/client';
import './OwnerNotificationsPage.css';

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

function ProposalReceivedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function ProposalApprovedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3CB57A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ProposalRejectedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E05C5C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function ProgressUpdateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function NewMessageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function MilestoneCompletedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3CB57A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function DefaultBellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// ─── Relative Time Formatter ──────────────────────────────────────────────────

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (isNaN(date.getTime())) return '—';
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function OwnerNotificationsPage() {
  const navigate = useNavigate();
  const { setUnreadCount } = useOutletContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/marketplace/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('[OwnerNotificationsPage] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mark All As Read
  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/api/marketplace/notifications/mark-read');
      // Refresh list
      await fetchNotifications();
    } catch (err) {
      console.error('[OwnerNotificationsPage] Bulk mark read failed:', err);
    }
  };

  // Click Notification -> Navigate & Mark single read
  const handleNotificationClick = async (item) => {
    // If unread, mark read in background
    if (!item.isRead) {
      try {
        await apiClient.patch(`/api/marketplace/notifications/${item._id}/mark-read`);
      } catch (err) {
        console.error('[OwnerNotificationsPage] Mark read failed:', err);
      }
    }

    // Determine target route based on type
    let target = '/marketplace/owner/projects';
    if (item.relatedProject) {
      switch (item.type) {
        case 'proposal_received':
        case 'proposal_approved':
        case 'proposal_rejected':
          target = `/marketplace/owner/projects/${item.relatedProject}`;
          break;
        case 'progress_update':
        case 'milestone_completed':
          target = `/marketplace/owner/projects/${item.relatedProject}/progress`;
          break;
        case 'new_message':
          target = `/marketplace/owner/projects/${item.relatedProject}/chat`;
          break;
        default:
          target = `/marketplace/owner/projects/${item.relatedProject}`;
          break;
      }
    }

    navigate(target);
  };

  // Map icons based on notification type
  const notificationIcon = (type) => {
    switch (type) {
      case 'proposal_received':
        return <ProposalReceivedIcon />;
      case 'proposal_approved':
        return <ProposalApprovedIcon />;
      case 'proposal_rejected':
        return <ProposalRejectedIcon />;
      case 'progress_update':
        return <ProgressUpdateIcon />;
      case 'new_message':
        return <NewMessageIcon />;
      case 'milestone_completed':
        return <MilestoneCompletedIcon />;
      default:
        return <DefaultBellIcon />;
    }
  };

  return (
    <div className="owner-notifications-page">
      {/* Header Row */}
      <header className="notifications-header">
        <h2 className="notifications-header__title">Notifications</h2>
        {notifications.some(n => !n.isRead) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
            className="notifications-header__mark-all-btn"
          >
            Mark all as read
          </Button>
        )}
      </header>

      {/* Notifications list */}
      {loading ? (
        <div className="notifications-list-loading" aria-label="Loading notifications">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} surface="navy" className="skeleton-notification pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card surface="navy-secondary" className="notifications-empty" padding="var(--space-6)">
          <div className="notifications-empty-content">
            <div className="notifications-empty-icon" aria-hidden="true">🔔</div>
            <h3 className="notifications-empty-title">No notifications yet</h3>
            <p className="notifications-empty-desc">
              You will receive updates here when builders submit proposals or update project progress.
            </p>
          </div>
        </Card>
      ) : (
        <div className="notifications-list">
          {notifications.map(item => {
            const hasGoldDot = !item.isRead;
            return (
              <Card
                key={item._id}
                surface={item.isRead ? 'navy' : 'navy-secondary'}
                className={`notification-item ${hasGoldDot ? 'notification-item--unread' : ''}`}
                onClick={() => handleNotificationClick(item)}
                padding="var(--space-4)"
              >
                {/* Gold unread dot */}
                {hasGoldDot && (
                  <span className="notification-item__unread-dot" aria-label="Unread" />
                )}

                <div className="notification-item__icon-container">
                  {notificationIcon(item.type)}
                </div>

                <div className="notification-item__details">
                  <p className="notification-item__message">{item.message}</p>
                  <span className="notification-item__time">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>

                {/* Arrow indicator on hover */}
                <span className="notification-item__arrow" aria-hidden="true">→</span>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OwnerNotificationsPage;
