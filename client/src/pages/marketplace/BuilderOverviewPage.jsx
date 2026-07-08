/**
 * client/src/pages/marketplace/BuilderOverviewPage.jsx
 *
 * Builder Dashboard Overview Page — Sub-phase M5A.
 * Renders metrics, recent proposals feed, and a browse-projects CTA.
 */

import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import apiClient from '../../api/client';
import './BuilderOverviewPage.css';

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

function OpenProjectsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

function ApprovedIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ActiveIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" />
      <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
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

// ─── Status Badge ─────────────────────────────────────────────────────────────

function ProposalStatusBadge({ status }) {
  const classMap = {
    pending:  'proposal-status--pending',
    approved: 'proposal-status--approved',
    rejected: 'proposal-status--rejected',
    withdrawn: 'proposal-status--withdrawn',
  };
  const labelMap = {
    pending:  'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };
  return (
    <span className={`proposal-status-badge ${classMap[status] || ''}`}>
      {labelMap[status] || status}
    </span>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, icon, loading, accent }) {
  if (loading) {
    return (
      <Card surface="navy" className="builder-metric-card builder-metric-card--loading">
        <div className="skeleton-icon pulse" />
        <div className="skeleton-value pulse" />
        <div className="skeleton-label pulse" />
      </Card>
    );
  }

  return (
    <Card surface="navy" className={`builder-metric-card${accent ? ' builder-metric-card--accent' : ''}`}>
      <div className="builder-metric-card__icon-row">
        <span className="builder-metric-card__icon" aria-hidden="true">{icon}</span>
      </div>
      <p className="builder-metric-card__value">{value}</p>
      <p className="builder-metric-card__label">{label}</p>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function BuilderOverviewPage() {
  const { user } = useAuth();
  const { setUnreadCount } = useOutletContext();

  const displayName = user?.name || user?.email?.split('@')[0] || 'Builder';

  const [openProjectsCount, setOpenProjectsCount] = useState(0);
  const [myProposals, setMyProposals] = useState([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  const [metricsLoading, setMetricsLoading] = useState(true);
  const [proposalsLoading, setProposalsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchMetrics() {
      try {
        setMetricsLoading(true);

        // Fetch all open projects count
        const projectsRes = await apiClient.get('/api/marketplace/projects');
        if (!active) return;
        const allProjects = projectsRes.data.projects || [];
        const openCount = allProjects.filter(p => p.status === 'open').length;
        setOpenProjectsCount(openCount);

        setMetricsLoading(false);
      } catch (err) {
        console.error('[BuilderOverviewPage] Failed to fetch open projects:', err);
        if (active) setMetricsLoading(false);
      }
    }

    async function fetchMyProposals() {
      try {
        setProposalsLoading(true);
        const res = await apiClient.get('/api/marketplace/proposals/my');
        if (!active) return;

        const proposals = res.data.proposals || [];
        setMyProposals(proposals);

        const approved = proposals.filter(p => p.status === 'approved').length;
        setApprovedCount(approved);
        setActiveCount(approved); // active workspaces = approved proposals

        setProposalsLoading(false);
      } catch (err) {
        console.error('[BuilderOverviewPage] Failed to fetch my proposals:', err);
        if (active) setProposalsLoading(false);
      }
    }

    async function fetchNotifications() {
      try {
        const res = await apiClient.get('/api/marketplace/notifications?isRead=false');
        if (!active) return;
        setUnreadCount(res.data.unreadCount || 0);
      } catch (err) {
        console.error('[BuilderOverviewPage] Failed to fetch notifications:', err);
      }
    }

    fetchMetrics();
    fetchMyProposals();
    fetchNotifications();

    return () => { active = false; };
  }, [setUnreadCount]);

  // 3 most recent proposals
  const recentProposals = myProposals.slice(0, 3);

  return (
    <div className="dash-content builder-overview">
      {/* Welcome Banner */}
      <section className="builder-welcome" aria-label="Welcome message">
        <p className="builder-welcome__greeting">Welcome back,</p>
        <h2 className="builder-welcome__name">{displayName} 👷</h2>
        <p className="builder-welcome__sub">
          Browse open construction projects, submit proposals, and manage your active builds.
        </p>
      </section>

      {/* Metrics Grid */}
      <section className="builder-metrics" aria-label="Overview metrics">
        <div className="builder-metrics__grid">
          <MetricCard
            label="Open Projects"
            value={openProjectsCount}
            icon={<OpenProjectsIcon />}
            loading={metricsLoading}
          />
          <MetricCard
            label="My Proposals"
            value={proposalsLoading ? '—' : myProposals.length}
            icon={<ProposalsIcon />}
            loading={proposalsLoading}
          />
          <MetricCard
            label="Approved"
            value={proposalsLoading ? '—' : approvedCount}
            icon={<ApprovedIcon />}
            loading={proposalsLoading}
            accent
          />
          <MetricCard
            label="Active Projects"
            value={proposalsLoading ? '—' : activeCount}
            icon={<ActiveIcon />}
            loading={proposalsLoading}
          />
        </div>
      </section>

      {/* Bottom Row: Recent Proposals + CTA */}
      <div className="builder-overview-row">
        {/* Recent Proposals */}
        <Card surface="navy-secondary" className="builder-recent-card" padding="var(--space-5)">
          <h3 className="builder-section-title">Recent Proposals</h3>

          {proposalsLoading ? (
            <div className="builder-recent-card__loading">
              <div className="skeleton-line pulse" />
              <div className="skeleton-line pulse" />
              <div className="skeleton-line pulse" />
            </div>
          ) : recentProposals.length === 0 ? (
            <p className="builder-recent-card__empty">
              You haven't submitted any proposals yet.
            </p>
          ) : (
            <ul className="builder-proposals-list" role="list">
              {recentProposals.map(proposal => (
                <li key={proposal._id} className="builder-proposal-item">
                  <div className="builder-proposal-item__info">
                    <p className="builder-proposal-item__title">
                      {proposal.project?.title || 'Untitled Project'}
                    </p>
                    <span className="builder-proposal-item__date">
                      {formatRelativeTime(proposal.createdAt)}
                    </span>
                  </div>
                  <ProposalStatusBadge status={proposal.status} />
                </li>
              ))}
            </ul>
          )}

          {!proposalsLoading && myProposals.length > 3 && (
            <Link to="/marketplace/builder/proposals" className="builder-view-all-link">
              View all proposals →
            </Link>
          )}
        </Card>

        {/* CTA Card */}
        <Card surface="navy-secondary" className="builder-cta-card" padding="var(--space-5)">
          <div className="builder-cta-card__content">
            <div className="builder-cta-card__icon-wrapper" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent, #E8C547)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="builder-cta-card__title">Find Your Next Project</h3>
            <p className="builder-cta-card__text">
              Browse open construction projects posted by owners. Filter by type, location, and budget to find the perfect fit.
            </p>
            <Button
              as={Link}
              to="/marketplace/builder/projects"
              variant="primary"
              className="builder-cta-card__button"
              id="browse-open-projects-btn"
            >
              Browse Open Projects
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default BuilderOverviewPage;
