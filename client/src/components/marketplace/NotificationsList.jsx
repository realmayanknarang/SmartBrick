/**
 * client/src/components/marketplace/NotificationsList.jsx
 *
 * Shared Notifications List component — Sub-phase M5F.
 * Used by both OwnerNotificationsPage (M4F) and BuilderNotificationsPage (M5F).
 *
 * Props:
 *   notifications      {Array}    — array of notification objects
 *   onMarkAllRead      {Function} — callback to mark all as read
 *   onNotificationClick {Function} — (notification) => void, role-specific navigation
 *   isLoading          {boolean}  — show skeleton if true
 *   emptyDescription   {string}   — optional empty state description
 */

import Card from '../Card';
import Button from '../Button';
import './NotificationsList.css';

// ─── Icons ───────────────────────────────────────────────────────────────────

function ProposalReceivedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function ProposalApprovedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3CB57A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ProposalRejectedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E05C5C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function ProgressUpdateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function NewMessageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function MilestoneCompletedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3CB57A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function DefaultBellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

function notificationIcon(type) {
  switch (type) {
    case 'proposal_received':  return <ProposalReceivedIcon />;
    case 'proposal_approved':  return <ProposalApprovedIcon />;
    case 'proposal_rejected':  return <ProposalRejectedIcon />;
    case 'progress_update':    return <ProgressUpdateIcon />;
    case 'new_message':        return <NewMessageIcon />;
    case 'milestone_completed': return <MilestoneCompletedIcon />;
    default:                   return <DefaultBellIcon />;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function NotificationsList({
  notifications = [],
  onMarkAllRead,
  onNotificationClick,
  isLoading = false,
  emptyDescription = 'You will receive updates here when there is new activity.',
}) {
  return (
    <div className="notifications-list-root">
      {/* Header */}
      <header className="nl-header">
        <h2 className="nl-header__title">Notifications</h2>
        {!isLoading && notifications.some(n => !n.isRead) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onMarkAllRead}
            className="nl-mark-all-btn"
          >
            Mark all as read
          </Button>
        )}
      </header>

      {/* Loading skeletons */}
      {isLoading ? (
        <div className="nl-loading" aria-label="Loading notifications">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} surface="navy" className="nl-skeleton pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        /* Empty state */
        <Card surface="navy-secondary" className="nl-empty" padding="var(--space-6)">
          <div className="nl-empty__content">
            <div className="nl-empty__icon" aria-hidden="true">🔔</div>
            <h3 className="nl-empty__title">No notifications yet</h3>
            <p className="nl-empty__desc">{emptyDescription}</p>
          </div>
        </Card>
      ) : (
        /* Notifications list */
        <div className="nl-list">
          {notifications.map(item => {
            const isUnread = !item.isRead;
            return (
              <Card
                key={item._id}
                surface={isUnread ? 'navy-secondary' : 'navy'}
                className={`nl-item ${isUnread ? 'nl-item--unread' : ''}`}
                onClick={() => onNotificationClick && onNotificationClick(item)}
                padding="var(--space-4)"
              >
                {isUnread && (
                  <span className="nl-item__unread-dot" aria-label="Unread" />
                )}
                <div className="nl-item__icon-wrap">
                  {notificationIcon(item.type)}
                </div>
                <div className="nl-item__details">
                  <p className="nl-item__message">{item.message}</p>
                  <span className="nl-item__time">{formatRelativeTime(item.createdAt)}</span>
                </div>
                <span className="nl-item__arrow" aria-hidden="true">→</span>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NotificationsList;
