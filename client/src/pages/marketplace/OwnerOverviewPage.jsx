/**
 * client/src/pages/marketplace/OwnerOverviewPage.jsx
 *
 * Owner Dashboard Overview Page — Sub-phase M4A.
 * Renders metrics, recent notifications feed, and a post-project CTA.
 */

import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import apiClient from '../../api/client';
import './OwnerOverviewPage.css';

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

function ActiveProjectsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v18" />
      <path d="M18 22H6" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01M8 18h.01" />
    </svg>
  );
}

function ProposalsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function BellCardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// ─── Notification Type Icons ──────────────────────────────────────────────────

function NotificationIcon({ type }) {
  const baseProps = { width: "16", height: "16", strokeWidth: "2", fill: "none", stroke: "currentColor", className: "activity-item__icon" };
  switch (type) {
    case 'proposal_received':
      return (
        <svg {...baseProps} viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      );
    case 'proposal_approved':
      return (
        <svg {...baseProps} viewBox="0 0 24 24" stroke="var(--color-success, #2ec4b6)">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'proposal_rejected':
      return (
        <svg {...baseProps} viewBox="0 0 24 24" stroke="var(--color-danger, #e71d36)">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    case 'progress_update':
      return (
        <svg {...baseProps} viewBox="0 0 24 24" stroke="var(--color-accent)">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    case 'new_message':
      return (
        <svg {...baseProps} viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'milestone_completed':
      return (
        <svg {...baseProps} viewBox="0 0 24 24" stroke="var(--color-success, #2ec4b6)">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      );
    default:
      return (
        <svg {...baseProps} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
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

function MetricCard({ label, value, icon, loading }) {
  if (loading) {
    return (
      <Card surface="navy" className="dash-metric-card metric-card--loading">
        <div className="skeleton-icon pulse" />
        <div className="skeleton-value pulse" />
        <div className="skeleton-label pulse" />
      </Card>
    );
  }

  return (
    <Card surface="navy" className="dash-metric-card">
      <div className="dash-metric-card__icon-row">
        <span className="dash-metric-card__icon" aria-hidden="true">{icon}</span>
      </div>
      <p className="dash-metric-card__value">{value}</p>
      <p className="dash-metric-card__label">{label}</p>
    </Card>
  );
}

function OwnerOverviewPage() {
  const { user } = useAuth();
  const { unreadCount, setUnreadCount } = useOutletContext();

  const [activeProjects, setActiveProjects] = useState(0);
  const [pendingProposals, setPendingProposals] = useState(0);

  const [projectsLoading, setProjectsLoading] = useState(true);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Owner';

  useEffect(() => {
    let active = true;

    // Fetch projects count & proposals count
    async function fetchDashboardMetrics() {
      try {
        setProjectsLoading(true);
        setProposalsLoading(true);

        const projectsRes = await apiClient.get('/marketplace/projects');
        if (!active) return;

        const ownerProjects = projectsRes.data.projects || [];
        const openProjectsCount = ownerProjects.filter(p => p.status === 'open').length;
        setActiveProjects(openProjectsCount);
        setProjectsLoading(false);

        // Fetch proposals for each project to sum pending proposals.
        // Handled client-side since there is no server-side summary endpoint
        // and we cannot modify the Phase M2 routes.
        if (ownerProjects.length === 0) {
          setPendingProposals(0);
          setProposalsLoading(false);
          return;
        }

        const proposalPromises = ownerProjects.map(project =>
          apiClient.get(`/marketplace/proposals/project/${project._id}`)
            .then(res => res.data.proposals || [])
            .catch(() => []) // swallow errors per project
        );

        const proposalsLists = await Promise.all(proposalPromises);
        if (!active) return;

        let pendingCount = 0;
        proposalsLists.forEach(list => {
          pendingCount += list.filter(prop => prop.status === 'pending').length;
        });

        setPendingProposals(pendingCount);
        setProposalsLoading(false);
      } catch (err) {
        console.error('[OwnerOverviewPage] Failed to fetch metrics:', err);
        if (active) {
          setProjectsLoading(false);
          setProposalsLoading(false);
        }
      }
    }

    // Fetch unread count & recent activity (5 notifications)
    async function fetchNotifications() {
      try {
        setNotificationsLoading(true);
        setActivityLoading(true);

        const response = await apiClient.get('/marketplace/notifications');
        if (!active) return;

        const allNotifications = response.data.notifications || [];
        setRecentActivity(allNotifications.slice(0, 5));
        setUnreadCount(response.data.unreadCount || 0);

        setNotificationsLoading(false);
        setActivityLoading(false);
      } catch (err) {
        console.error('[OwnerOverviewPage] Failed to fetch notifications:', err);
        if (active) {
          setNotificationsLoading(false);
          setActivityLoading(false);
        }
      }
    }

    fetchDashboardMetrics();
    fetchNotifications();

    return () => {
      active = false;
    };
  }, [setUnreadCount]);

  return (
    <div className="dash-content">
      {/* Welcome Banner */}
      <section className="dash-welcome" aria-label="Welcome message">
        <p className="dash-welcome__greeting">Welcome back,</p>
        <h2 className="dash-welcome__name">{displayName} 👋</h2>
        <p className="dash-welcome__sub">
          Manage your construction projects and review builder proposals.
        </p>
      </section>

      {/* Metrics Grid */}
      <section className="dash-metrics" aria-label="Overview metrics">
        <div className="dash-metrics__grid">
          <MetricCard
            label="Active Projects"
            value={activeProjects}
            icon={<ActiveProjectsIcon />}
            loading={projectsLoading}
          />
          <MetricCard
            label="Pending Proposals"
            value={pendingProposals}
            icon={<ProposalsIcon />}
            loading={proposalsLoading}
          />
          <MetricCard
            label="Unread Notifications"
            value={unreadCount}
            icon={<BellCardIcon />}
            loading={notificationsLoading}
          />
        </div>
      </section>

      {/* Recent Activity & CTA */}
      <div className="overview-row">
        {/* Recent Activity */}
        <Card surface="navy-secondary" className="activity-card" padding="var(--space-5)">
          <h3 className="activity-card__title">Recent Activity</h3>
          
          {activityLoading ? (
            <div className="activity-card__loading">
              <div className="skeleton-line pulse" />
              <div className="skeleton-line pulse" />
              <div className="skeleton-line pulse" />
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="activity-card__empty">No recent activity.</p>
          ) : (
            <ul className="activity-list" role="list">
              {recentActivity.map(item => (
                <li key={item._id} className="activity-item">
                  <div className="activity-item__icon-wrapper">
                    <NotificationIcon type={item.type} />
                  </div>
                  <div className="activity-item__details">
                    <p className={`activity-item__message ${!item.isRead ? 'activity-item__message--unread' : ''}`}>
                      {item.message}
                    </p>
                    <span className="activity-item__time">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  {!item.isRead && <span className="activity-item__dot" aria-hidden="true" />}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* CTA Card */}
        <Card surface="navy-secondary" className="cta-card" padding="var(--space-5)">
          <div className="cta-card__content">
            <h3 className="cta-card__title">Ready to Build?</h3>
            <p className="cta-card__text">
              Post your construction project, outline your timeline and budget, and receive detailed proposals from verified builders.
            </p>
            <Button
              as={Link}
              to="/marketplace/owner/projects/new"
              variant="primary"
              className="cta-card__button"
            >
              Post a new project
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default OwnerOverviewPage;
