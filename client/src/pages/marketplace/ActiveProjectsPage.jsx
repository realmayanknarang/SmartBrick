import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import apiClient from '../../api/client';
import './ActiveProjectsPage.css';

function HardHatIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-on-dark-muted, #9FB0BC)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" />
      <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function formatINR(val) {
  if (val === undefined || val === null) return '';
  return new Intl.NumberFormat('en-IN').format(val);
}

function typeBadgeClass(type) {
  switch (type) {
    case 'house':       return 'ap-type-badge--house';
    case 'villa':       return 'ap-type-badge--villa';
    case 'apartment':   return 'ap-type-badge--apartment';
    case 'commercial':  return 'ap-type-badge--commercial';
    case 'industrial':  return 'ap-type-badge--industrial';
    default:            return 'ap-type-badge--other';
  }
}

function formatTypeLabel(type) {
  if (!type) return 'Other';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function ActiveProjectCard({ proposal }) {
  const project = proposal.project || {};
  const projectId = project._id || proposal.project;

  return (
    <Card surface="navy" className="ap-project-card">
      <div className="ap-project-card__top">
        <span className={`ap-type-badge ${typeBadgeClass(project.constructionType)}`}>
          {formatTypeLabel(project.constructionType)}
        </span>
        <span className="ap-status-badge ap-status-badge--active">Active</span>
      </div>

      <h3 className="ap-project-card__title">{project.title || 'Unknown Project'}</h3>

      <div className="ap-project-card__meta">
        {project.location && (
          <span className="ap-project-card__meta-item">
            <PinIcon /> {project.location}
          </span>
        )}
      </div>

      <div className="ap-project-card__budget">
        <span className="ap-budget-label">Your Bid</span>
        <span className="ap-budget-value">
          ₹{formatINR(proposal.estimatedBudget)}
        </span>
      </div>

      <div className="ap-project-card__footer">
        <Button
          as={Link}
          to={`/marketplace/builder/workspace/${projectId}`}
          variant="primary"
          className="ap-project-card__action"
          id={`workspace-btn-${proposal._id}`}
        >
          Open Workspace <ArrowRightIcon />
        </Button>
      </div>
    </Card>
  );
}

function ActiveProjectsPage() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function fetchActive() {
      try {
        setLoading(true);
        setError('');

        const res = await apiClient.get('/marketplace/proposals/my');
        if (!active) return;

        const allProposals = res.data.proposals || [];
        const approved = allProposals.filter(p => p.status === 'approved');
        setProposals(approved);
      } catch (err) {
        console.error('[ActiveProjectsPage] Fetch failed:', err);
        if (active) setError('Failed to load active projects.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchActive();
    return () => { active = false; };
  }, []);

  return (
    <div className="ap-page">
      <header className="ap-header">
        <div className="ap-header__left">
          <h2 className="ap-title">Active Projects</h2>
          {!loading && (
            <span className="ap-count">
              {proposals.length} {proposals.length === 1 ? 'project' : 'projects'}
            </span>
          )}
        </div>
      </header>

      {loading ? (
        <div className="ap-grid">
          {[1, 2, 3].map(i => (
            <Card key={i} surface="navy" className="ap-project-card ap-project-card--loading">
              <div className="ap-skeleton-badge pulse" />
              <div className="ap-skeleton-title pulse" />
              <div className="ap-skeleton-text pulse" />
              <div className="ap-skeleton-footer pulse" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card surface="navy-secondary" className="ap-error-card">
          <p>{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      ) : proposals.length === 0 ? (
        <Card surface="navy-secondary" className="ap-empty-card">
          <div className="ap-empty-icon" aria-hidden="true">
            <HardHatIcon />
          </div>
          <h3 className="ap-empty-title">No active projects yet</h3>
          <p className="ap-empty-subtitle">
            When an owner approves your proposal, the project will appear here.
          </p>
          <Button as={Link} to="/marketplace/builder/projects" variant="primary">
            Browse Projects
          </Button>
        </Card>
      ) : (
        <div className="ap-grid">
          {proposals.map(p => (
            <ActiveProjectCard key={p._id} proposal={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ActiveProjectsPage;
