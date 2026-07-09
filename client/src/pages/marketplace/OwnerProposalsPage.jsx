import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import TabBar from '../../components/TabBar';
import apiClient from '../../api/client';
import './OwnerProposalsPage.css';

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

function StatusBadge({ status }) {
  const map = {
    pending:   { cls: 'op-status--pending',   label: 'Pending' },
    approved:  { cls: 'op-status--approved',  label: 'Approved' },
    rejected:  { cls: 'op-status--rejected',  label: 'Rejected' },
  };
  const { cls, label } = map[status] || { cls: '', label: status };
  return <span className={`op-status-badge ${cls}`}>{label}</span>;
}

function ProjectBadge({ status }) {
  const map = {
    open:       { cls: 'op-project-badge--open',      label: 'Open' },
    locked:     { cls: 'op-project-badge--locked',    label: 'Locked' },
    completed:  { cls: 'op-project-badge--completed', label: 'Completed' },
  };
  const { cls, label } = map[status] || { cls: '', label: status };
  return <span className={`op-project-badge ${cls}`}>{label}</span>;
}

function SkeletonRows() {
  return (
    <div className="op-skeleton-rows">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="op-skeleton-row pulse" />
      ))}
    </div>
  );
}

function ProposalRow({ proposal }) {
  const project = proposal.project || {};
  const projectId = project._id || proposal.project;
  const builder = proposal.builder || {};

  return (
    <tr className="op-table-row">
      <td className="op-table-cell op-table-cell--title">
        <span className="op-builder-name">{builder.name || 'Builder'}</span>
        <span className="op-builder-email">{builder.email || ''}</span>
      </td>
      <td className="op-table-cell">
        <span className="op-project-title-link">{project.title || 'Unknown'}</span>
      </td>
      <td className="op-table-cell">
        <span className="op-project-location">{project.location || '—'}</span>
      </td>
      <td className="op-table-cell">
        <span className="op-bid-value">{formatINR(proposal.estimatedBudget)}</span>
      </td>
      <td className="op-table-cell">
        {proposal.estimatedDuration || '—'}
      </td>
      <td className="op-table-cell">
        <span className="op-proposal-date">{formatDate(proposal.createdAt)}</span>
      </td>
      <td className="op-table-cell">
        <StatusBadge status={proposal.status} />
      </td>
      <td className="op-table-cell">
        <Button
          as={Link}
          to={`/marketplace/owner/projects/${projectId}`}
          variant="secondary"
          size="sm"
          className="op-action-btn"
        >
          View Project
        </Button>
      </td>
    </tr>
  );
}

function ProposalCard({ proposal }) {
  const project = proposal.project || {};
  const projectId = project._id || proposal.project;
  const builder = proposal.builder || {};

  return (
    <div className="op-proposal-card">
      <div className="op-proposal-card__top">
        <span className="op-builder-name">{builder.name || 'Builder'}</span>
        <StatusBadge status={proposal.status} />
      </div>
      <div className="op-proposal-card__project">
        <span className="op-project-title-link">{project.title || 'Unknown'}</span>
        <ProjectBadge status={project.status} />
      </div>
      <div className="op-proposal-card__meta">
        {project.location && <span>{project.location}</span>}
        <span>{formatDate(proposal.createdAt)}</span>
      </div>
      <div className="op-proposal-card__metrics">
        <div className="op-proposal-card__metric">
          <span className="op-proposal-card__metric-label">Bid</span>
          <span className="op-proposal-card__metric-value">{formatINR(proposal.estimatedBudget)}</span>
        </div>
        <div className="op-proposal-card__metric">
          <span className="op-proposal-card__metric-label">Duration</span>
          <span className="op-proposal-card__metric-value">{proposal.estimatedDuration || '—'}</span>
        </div>
      </div>
      <div className="op-proposal-card__footer">
        <Button
          as={Link}
          to={`/marketplace/owner/projects/${projectId}`}
          variant="secondary"
          size="sm"
          className="op-action-btn--full"
        >
          View Project
        </Button>
      </div>
    </div>
  );
}

function ProposalsList({ proposals }) {
  if (proposals.length === 0) {
    return (
      <div className="op-tab-empty">
        <p>No proposals match this filter.</p>
      </div>
    );
  }

  return (
    <>
      <div className="op-table-wrapper">
        <table className="op-table" aria-label="Proposals received">
          <thead>
            <tr>
              <th className="op-th">Builder</th>
              <th className="op-th">Project</th>
              <th className="op-th">Location</th>
              <th className="op-th">Bid</th>
              <th className="op-th">Duration</th>
              <th className="op-th">Submitted</th>
              <th className="op-th">Status</th>
              <th className="op-th">Action</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map(p => (
              <ProposalRow key={p._id} proposal={p} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="op-cards-list">
        {proposals.map(p => (
          <ProposalCard key={p._id} proposal={p} />
        ))}
      </div>
    </>
  );
}

function OwnerProposalsPage() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/marketplace/proposals/owner');
      setProposals(res.data.proposals || []);
    } catch (err) {
      console.error('[OwnerProposalsPage] Failed to fetch proposals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const pendingProposals  = proposals.filter(p => p.status === 'pending');
  const approvedProposals = proposals.filter(p => p.status === 'approved');
  const rejectedProposals = proposals.filter(p => p.status === 'rejected');

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
    <div className="owner-proposals-page">
      <header className="op-header">
        <div className="op-header__left">
          <h2 className="op-header__title">Proposals Received</h2>
          {!loading && (
            <span className="op-header__count">
              {proposals.length} {proposals.length === 1 ? 'proposal' : 'proposals'}
            </span>
          )}
        </div>
      </header>

      {loading ? (
        <SkeletonRows />
      ) : proposals.length === 0 ? (
        <Card surface="navy-secondary" padding="var(--space-6)" className="op-empty-state">
          <div className="op-empty-state__icon" aria-hidden="true">
            <EmptyIcon />
          </div>
          <h3 className="op-empty-state__title">No proposals yet</h3>
          <p className="op-empty-state__subtitle">
            Builders will submit proposals for your projects once they are posted.
          </p>
          <Button
            as={Link}
            to="/marketplace/owner/projects/new"
            variant="primary"
          >
            Post a Project
          </Button>
        </Card>
      ) : (
        <TabBar
          tabs={tabs}
          activeTab={activeTabIdx}
          onChange={setActiveTabIdx}
        />
      )}
    </div>
  );
}

export default OwnerProposalsPage;
