/**
 * client/src/pages/marketplace/OwnerProjectsPage.jsx
 *
 * Owner Projects List Page — Sub-phase M4C.
 * Displays all projects posted by the authenticated marketplace owner.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import apiClient from '../../api/client';
import './OwnerProjectsPage.css';

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function EmptyStateIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-on-dark-muted, #9FB0BC)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

// ─── Format Currency helper (INR Lakhs format) ───────────────────────────────

function formatINR(val) {
  if (val === undefined || val === null) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}

function OwnerProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [proposalCounts, setProposalCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    let active = true;

    async function fetchProjectsAndProposals() {
      try {
        setLoading(true);
        setFetchError('');
        const res = await apiClient.get('/marketplace/projects');
        if (!active) return;

        const list = res.data.projects || [];
        setProjects(list);

        // Fetch proposal counts in parallel for each project
        if (list.length > 0) {
          const countPromises = list.map(project =>
            apiClient.get(`/marketplace/proposals/project/${project._id}`)
              .then(pRes => ({
                id: project._id,
                count: (pRes.data.proposals || []).length
              }))
              .catch(() => ({ id: project._id, count: 0 }))
          );

          const counts = await Promise.all(countPromises);
          if (!active) return;

          const countsMap = {};
          counts.forEach(item => {
            countsMap[item.id] = item.count;
          });
          setProposalCounts(countsMap);
        }
      } catch (err) {
        console.error('[OwnerProjectsPage] Failed to fetch data:', err);
        setFetchError(err?.response?.data?.message || err?.message || 'Failed to load projects.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchProjectsAndProposals();

    return () => {
      active = false;
    };
  }, []);

  // Badge mapping for construction types
  const typeBadgeClass = (type) => {
    switch (type) {
      case 'house': return 'type-badge--house';
      case 'villa': return 'type-badge--villa';
      case 'apartment': return 'type-badge--apartment';
      case 'commercial': return 'type-badge--commercial';
      case 'industrial': return 'type-badge--industrial';
      default: return 'type-badge--other';
    }
  };

  const formatTypeLabel = (type) => {
    if (!type) return '';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Status badge mappings
  const statusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="status-badge status-badge--open">Open for Proposals</span>;
      case 'locked':
        return <span className="status-badge status-badge--locked">Builder Selected</span>;
      case 'completed':
        return <span className="status-badge status-badge--completed">Completed</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  let body;
  if (loading) {
    body = (
      <div className="projects-grid" aria-label="Loading projects">
        {[1, 2, 3].map(i => (
          <Card key={i} surface="navy" className="project-card project-card--loading">
            <div className="skeleton-badge pulse" />
            <div className="skeleton-title pulse" />
            <div className="skeleton-text pulse" />
            <div className="skeleton-text pulse" style={{ width: '60%' }} />
            <div className="skeleton-footer pulse" />
          </Card>
        ))}
      </div>
    );
  } else if (fetchError) {
    body = (
      <Card surface="navy-secondary" className="projects-empty-card" padding="var(--space-6)">
        <div className="projects-empty-content">
          <h3 className="projects-empty-title" style={{ color: '#e71d36' }}>Failed to load projects</h3>
          <p className="projects-empty-subtitle">{fetchError}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </Card>
    );
  } else if (projects.length === 0) {
    body = (
      <Card surface="navy-secondary" className="projects-empty-card" padding="var(--space-6)">
        <div className="projects-empty-content">
          <div className="projects-empty-icon" aria-hidden="true"><EmptyStateIcon /></div>
          <h3 className="projects-empty-title">No projects yet</h3>
          <p className="projects-empty-subtitle">Post your first project to start receiving proposals from builders.</p>
          <Button as={Link} to="/marketplace/owner/projects/new" variant="primary">Post a Project</Button>
        </div>
      </Card>
    );
  } else {
    body = (
      <div className="projects-grid">
        {projects.map(project => {
          const count = proposalCounts[project._id] ?? 0;
          return (
            <Card key={project._id} surface="navy" className="project-card">
              <div className="project-card__top">
                <span className={`type-badge ${typeBadgeClass(project.constructionType)}`}>
                  {formatTypeLabel(project.constructionType)}
                </span>
                {statusBadge(project.status)}
              </div>
              <h3 className="project-card__title">{project.title}</h3>
              <div className="project-card__meta">
                <span className="project-card__meta-item"><PinIcon /> {project.location}</span>
                {project.timeline && (
                  <span className="project-card__meta-item"><CalendarIcon /> {project.timeline}</span>
                )}
              </div>
              <div className="project-card__budget">
                <span className="budget-label">Budget Range</span>
                <span className="budget-value">{formatINR(project.budgetMin)} – {formatINR(project.budgetMax)}</span>
              </div>
              <div className="project-card__footer">
                <span className="project-card__proposals-count">
                  {count} {count === 1 ? 'proposal' : 'proposals'} received
                </span>
                <div className="project-card__actions">
                  {(project.status === 'locked' || project.status === 'completed') ? (
                    <>
                      <Button as={Link} to={`/marketplace/owner/projects/${project._id}/progress`} variant="primary" size="sm">View Updates</Button>
                      <Button as={Link} to={`/marketplace/owner/projects/${project._id}/chat`} variant="secondary" size="sm">Go to Chat</Button>
                    </>
                  ) : (
                    <Button as={Link} to={`/marketplace/owner/projects/${project._id}`} variant="secondary" size="sm">View Details</Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="owner-projects-page">
      <header className="owner-projects-page__header">
        <h2 className="owner-projects-page__title">My Projects</h2>
        <Button as={Link} to="/marketplace/owner/projects/new" variant="primary" className="owner-projects-page__create-btn">
          <PlusIcon /> Post New Project
        </Button>
      </header>
      {body}
    </div>
  );
}

export default OwnerProjectsPage;
