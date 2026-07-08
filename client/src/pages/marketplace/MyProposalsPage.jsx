/**
 * client/src/pages/marketplace/MyProposalsPage.jsx
 *
 * My Proposals Page — Sub-phase M5D.
 * Lists all proposals submitted by the authenticated builder,
 * with client-side tab filtering and real-time status update via socket.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TabBar from '../../components/TabBar';
import Button from '../../components/Button';
import { useSocket } from '../../hooks/useSocket';
import apiClient from '../../api/client';
import './MyProposalsPage.css';

// ─── Icons ───────────────────────────────────────────────────────────────────

function EmptyIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-on-dark-muted, #9FB0BC)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(val) {
  if (val === undefined || val === null) return '—';
  return `₹${new Intl.NumberFormat('en-IN').format(val)}`;
}

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function typeBadgeClass(type) {
  switch (type) {
    case 'house':       return 'mp-type-badge--house';
    case 'villa':       return 'mp-type-badge--villa';
    case 'apartment':   return 'mp-type-badge--apartment';
    case 'commercial':  return 'mp-type-badge--commercial';
    case 'industrial':  return 'mp-type-badge--industrial';
    default:            return 'mp-type-badge--other';
  }
}

function formatTypeLabel(type) {
  if (!type) return 'Other';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    pending:   { cls: 'mp-status--pending',   label: 'Awaiting Decision' },
    approved:  { cls: 'mp-status--approved',  label: 'Approved ✓' },
    rejected:  { cls: 'mp-status--rejected',  label: 'Not Selected' },
    withdrawn: { cls: 'mp-status--withdrawn', label: 'Withdrawn' },
  };
  const { cls, label } = map[status] || { cls: '', label: status };
  return <span className={`mp-status-badge ${cls}`}>{label}</span>;
}

// ─── Loading Skeletons ────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div className="mp-skeleton-rows">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="mp-skeleton-row pulse" />
      ))}
    </div>
  );
}

// ─── Proposal Row (desktop table) ─────────────────────────────────────────────

function ProposalTableRow({ proposal }) {
  const project = proposal.project || {};
  const projectId = project._id || proposal.project;

  return (
    <tr className="mp-table-row">
      <td className="mp-table-cell mp-table-cell--title">
        <span className="mp-project-title">
          {project.title || 'Unknown Project'}
        </span>
      </td>
      <td className="mp-table-cell">
        <span className={`mp-type-badge ${typeBadgeClass(project.constructionType)}`}>
          {formatTypeLabel(project.constructionType)}
        </span>
      </td>
      <td className="mp-table-cell mp-table-cell--muted">
        {project.location || '—'}
      </td>
      <td className="mp-table-cell mp-table-cell--muted">
        {project.budgetMin && project.budgetMax
          ? `₹${new Intl.NumberFormat('en-IN').format(project.budgetMin)} – ₹${new Intl.NumberFormat('en-IN').format(project.budgetMax)}`
          : '—'
        }
      </td>
      <td className="mp-table-cell">
        <span className="mp-bid-value">{formatINR(proposal.estimatedBudget)}</span>
      </td>
      <td className="mp-table-cell mp-table-cell--muted">
        {proposal.estimatedDuration || '—'}
      </td>
      <td className="mp-table-cell">
        <StatusBadge status={proposal.status} />
      </td>
      <td className="mp-table-cell">
        {proposal.status === 'approved' ? (
          <Button
            as={Link}
            to={`/marketplace/builder/workspace/${projectId}`}
            variant="primary"
            size="sm"
            className="mp-action-btn"
            id={`proposal-workspace-${proposal._id}`}
          >
            Workspace <ArrowRightIcon />
          </Button>
        ) : (
          <Button
            as={Link}
            to={`/marketplace/builder/projects/${projectId}`}
            variant="secondary"
            size="sm"
            className="mp-action-btn"
            id={`proposal-view-${proposal._id}`}
          >
            View Project
          </Button>
        )}
      </td>
    </tr>
  );
}

// ─── Proposal Card (mobile) ───────────────────────────────────────────────────

function ProposalCard({ proposal }) {
  const project = proposal.project || {};
  const projectId = project._id || proposal.project;

  return (
    <div className="mp-proposal-card">
      <div className="mp-proposal-card__top">
        <span className="mp-proposal-card__title">
          {project.title || 'Unknown Project'}
        </span>
        <StatusBadge status={proposal.status} />
      </div>
      <div className="mp-proposal-card__meta">
        {project.location && (
          <span className="mp-proposal-card__meta-item">{project.location}</span>
        )}
        <span className="mp-proposal-card__meta-item mp-proposal-card__meta-item--date">
          {formatDate(proposal.createdAt)}
        </span>
      </div>
      <div className="mp-proposal-card__metrics">
        <div className="mp-proposal-card__metric">
          <span className="mp-proposal-card__metric-label">Your Bid</span>
          <span className="mp-proposal-card__metric-value">{formatINR(proposal.estimatedBudget)}</span>
        </div>
        <div className="mp-proposal-card__metric">
          <span className="mp-proposal-card__metric-label">Duration</span>
          <span className="mp-proposal-card__metric-value">{proposal.estimatedDuration || '—'}</span>
        </div>
      </div>
      <div className="mp-proposal-card__footer">
        {proposal.status === 'approved' ? (
          <Button
            as={Link}
            to={`/marketplace/builder/workspace/${projectId}`}
            variant="primary"
            size="sm"
            className="mp-action-btn--full"
            id={`proposal-card-workspace-${proposal._id}`}
          >
            Go to Workspace <ArrowRightIcon />
          </Button>
        ) : (
          <Button
            as={Link}
            to={`/marketplace/builder/projects/${projectId}`}
            variant="secondary"
            size="sm"
            className="mp-action-btn--full"
            id={`proposal-card-view-${proposal._id}`}
          >
            View Project
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Proposals List (renders table + cards) ───────────────────────────────────

function ProposalsList({ proposals }) {
  if (proposals.length === 0) {
    return (
      <div className="mp-tab-empty">
        <p>No proposals match this filter.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="mp-table-wrapper">
        <table className="mp-table" aria-label="Proposals list">
          <thead>
            <tr>
              <th className="mp-th">Project</th>
              <th className="mp-th">Type</th>
              <th className="mp-th">Location</th>
              <th className="mp-th">Budget Range</th>
              <th className="mp-th">Your Bid</th>
              <th className="mp-th">Duration</th>
              <th className="mp-th">Status</th>
              <th className="mp-th">Action</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map(p => (
              <ProposalTableRow key={p._id} proposal={p} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mp-cards-list">
        {proposals.map(p => (
          <ProposalCard key={p._id} proposal={p} />
        ))}
      </div>
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function MyProposalsPage() {
  const { mongoUserId } = useOutletContext();
  const { onNotificationUpdate } = useSocket();

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  const fetchProposals = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/marketplace/proposals/my');
      setProposals(res.data.proposals || []);
    } catch (err) {
      console.error('[MyProposalsPage] Failed to fetch proposals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Real-time update: refetch when a notification arrives for this user
  useEffect(() => {
    if (!mongoUserId) return;

    const cleanup = onNotificationUpdate(({ recipientId }) => {
      if (recipientId === mongoUserId) {
        fetchProposals();
      }
    });

    return cleanup;
  }, [mongoUserId, onNotificationUpdate, fetchProposals]);

  // Tab counts
  const pendingProposals  = proposals.filter(p => p.status === 'pending');
  const approvedProposals = proposals.filter(p => p.status === 'approved');
  const rejectedProposals = proposals.filter(p => p.status === 'rejected');

  // Tab content
  const tabs = [
    {
      label: `All (${proposals.length})`,
      content: <ProposalsList proposals={proposals} />
    },
    {
      label: `Pending (${pendingProposals.length})`,
      content: <ProposalsList proposals={pendingProposals} />
    },
    {
      label: `Approved (${approvedProposals.length})`,
      content: <ProposalsList proposals={approvedProposals} />
    },
    {
      label: `Rejected (${rejectedProposals.length})`,
      content: <ProposalsList proposals={rejectedProposals} />
    },
  ];

  return (
    <div className="my-proposals-page">
      {/* Header */}
      <header className="my-proposals-page__header">
        <div className="my-proposals-page__header-left">
          <h2 className="my-proposals-page__title">My Proposals</h2>
          {!loading && (
            <span className="my-proposals-page__count">
              {proposals.length} {proposals.length === 1 ? 'proposal' : 'proposals'}
            </span>
          )}
        </div>
      </header>

      {/* Loading */}
      {loading ? (
        <SkeletonRows />
      ) : proposals.length === 0 ? (
        /* Global empty state — no proposals at all */
        <div className="my-proposals-page__empty">
          <div className="my-proposals-page__empty-icon" aria-hidden="true">
            <EmptyIcon />
          </div>
          <h3 className="my-proposals-page__empty-title">No proposals yet</h3>
          <p className="my-proposals-page__empty-subtitle">
            You haven't submitted any proposals yet. Browse open projects to get started.
          </p>
          <Button
            as={Link}
            to="/marketplace/builder/projects"
            variant="primary"
            id="browse-projects-from-empty-proposals"
          >
            Browse Projects
          </Button>
        </div>
      ) : (
        /* Tab bar + filtered lists */
        <TabBar
          tabs={tabs}
          activeTab={activeTabIdx}
          onChange={setActiveTabIdx}
        />
      )}
    </div>
  );
}

export default MyProposalsPage;
