/**
 * client/src/pages/marketplace/BuilderProjectDetailPage.jsx
 *
 * Builder Project Detail Page — Sub-phase M5C.
 * Displays project info to builders with a proposal submission panel.
 * Three panel states: submit form / already submitted / project locked.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import TextInput from '../../components/TextInput';
import apiClient from '../../api/client';
import './BuilderProjectDetailPage.css';

// ─── Icons ───────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
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

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(val) {
  if (val === undefined || val === null) return '';
  return new Intl.NumberFormat('en-IN').format(val);
}

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function typeBadgeClass(type) {
  switch (type) {
    case 'house':       return 'bpd-type-badge--house';
    case 'villa':       return 'bpd-type-badge--villa';
    case 'apartment':   return 'bpd-type-badge--apartment';
    case 'commercial':  return 'bpd-type-badge--commercial';
    case 'industrial':  return 'bpd-type-badge--industrial';
    default:            return 'bpd-type-badge--other';
  }
}

function formatTypeLabel(type) {
  if (!type) return 'Other';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// ─── Status Badges ────────────────────────────────────────────────────────────

function ProjectStatusBadge({ status }) {
  const map = {
    open:      { cls: 'bpd-status--open',      label: 'Open for Proposals' },
    locked:    { cls: 'bpd-status--locked',    label: 'Builder Selected' },
    completed: { cls: 'bpd-status--completed', label: 'Completed' },
  };
  const { cls, label } = map[status] || { cls: '', label: status };
  return <span className={`bpd-status-pill ${cls}`}>{label}</span>;
}

function ProposalStatusBadge({ status }) {
  const map = {
    pending:   { cls: 'bpd-prop-status--pending',   label: 'Awaiting Decision' },
    approved:  { cls: 'bpd-prop-status--approved',  label: 'Approved ✓' },
    rejected:  { cls: 'bpd-prop-status--rejected',  label: 'Not Selected' },
    withdrawn: { cls: 'bpd-prop-status--withdrawn', label: 'Withdrawn' },
  };
  const { cls, label } = map[status] || { cls: '', label: status };
  return <span className={`bpd-prop-status-badge ${cls}`}>{label}</span>;
}

// ─── Proposal Submission Form (State 1) ───────────────────────────────────────

function ProposalForm({ projectId, onSubmitSuccess }) {
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [materials, setMaterials] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  function validate() {
    const errs = {};
    if (!budget || isNaN(Number(budget)) || Number(budget) <= 0) {
      errs.budget = 'Please enter a valid positive budget amount.';
    }
    if (!duration.trim()) {
      errs.duration = 'Please enter an estimated duration.';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setApiError('');
    try {
      const res = await apiClient.post('/api/marketplace/proposals', {
        projectId,
        estimatedBudget: Number(budget),
        estimatedDuration: duration.trim(),
        notes: notes.trim() || undefined,
        materialRecommendations: materials.trim() || undefined,
      });
      onSubmitSuccess(res.data.proposal);
    } catch (err) {
      setApiError(
        err?.response?.data?.message || 'Failed to submit proposal. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="bpd-proposal-form" onSubmit={handleSubmit} noValidate>
      <h3 className="bpd-panel-title">Submit Your Proposal</h3>
      <p className="bpd-panel-subtitle">
        Provide your estimated budget, timeline, and approach. The project owner will review and respond.
      </p>

      <div className="bpd-form-fields">
        <TextInput
          label="Estimated Budget (₹)"
          type="number"
          placeholder="e.g. 2500000"
          value={budget}
          onChange={e => setBudget(e.target.value)}
          required
          error={errors.budget}
          id="proposal-budget"
          min="1"
        />

        <TextInput
          label="Estimated Duration"
          type="text"
          placeholder="e.g. 8 months"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          required
          error={errors.duration}
          id="proposal-duration"
        />

        <div className="bpd-form-field">
          <label className="bpd-textarea-label" htmlFor="proposal-notes">
            Proposal Notes <span className="bpd-optional">(optional)</span>
          </label>
          <textarea
            id="proposal-notes"
            className="bpd-textarea"
            rows={4}
            placeholder="Describe your approach, experience, and why you're the right fit for this project"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="bpd-form-field">
          <label className="bpd-textarea-label" htmlFor="proposal-materials">
            Material Recommendations <span className="bpd-optional">(optional)</span>
          </label>
          <textarea
            id="proposal-materials"
            className="bpd-textarea"
            rows={3}
            placeholder="List key materials and brands you recommend"
            value={materials}
            onChange={e => setMaterials(e.target.value)}
          />
        </div>
      </div>

      {apiError && (
        <p className="bpd-form-error" role="alert">{apiError}</p>
      )}

      <Button
        variant="primary"
        type="submit"
        disabled={submitting}
        className="bpd-submit-btn"
        id="submit-proposal-btn"
      >
        {submitting ? 'Submitting…' : 'Submit Proposal'}
      </Button>
    </form>
  );
}

// ─── Existing Proposal Status Panel (State 2) ─────────────────────────────────

function ExistingProposalPanel({ proposal, projectId }) {
  return (
    <div className="bpd-existing-proposal">
      <h3 className="bpd-panel-title">Your Proposal</h3>

      <div className="bpd-existing-proposal__status-row">
        <ProposalStatusBadge status={proposal.status} />
      </div>

      <div className="bpd-existing-proposal__metrics">
        <div className="bpd-metric-item">
          <span className="bpd-metric-label">Your Bid</span>
          <span className="bpd-metric-value">₹{formatINR(proposal.estimatedBudget)}</span>
        </div>
        <div className="bpd-metric-item">
          <span className="bpd-metric-label">Duration</span>
          <span className="bpd-metric-value">{proposal.estimatedDuration}</span>
        </div>
        <div className="bpd-metric-item">
          <span className="bpd-metric-label">Submitted On</span>
          <span className="bpd-metric-value">{formatDate(proposal.createdAt)}</span>
        </div>
      </div>

      {proposal.status === 'approved' && (
        <>
          <div className="bpd-approved-banner" role="status">
            <span className="bpd-approved-banner__emoji">🎉</span>
            <div>
              <strong>Your proposal was approved!</strong>
              <p>You have been selected as the builder for this project.</p>
            </div>
          </div>
          <Button
            as={Link}
            to={`/marketplace/builder/workspace/${projectId}`}
            variant="primary"
            className="bpd-workspace-btn"
            id="go-to-workspace-btn"
          >
            Go to Project Workspace
          </Button>
        </>
      )}

      {proposal.status === 'rejected' && (
        <p className="bpd-status-message bpd-status-message--muted">
          This proposal was not selected by the owner.
        </p>
      )}

      {proposal.status === 'pending' && (
        <p className="bpd-status-message bpd-status-message--muted">
          Your proposal is under review. Awaiting the owner's decision.
        </p>
      )}
    </div>
  );
}

// ─── Locked Project Panel (State 3) ───────────────────────────────────────────

function LockedProjectPanel({ isApprovedBuilder, projectId }) {
  return (
    <div className="bpd-locked-panel">
      <div className="bpd-locked-panel__icon" aria-hidden="true">
        <LockIcon />
      </div>
      {isApprovedBuilder ? (
        <>
          <h3 className="bpd-panel-title">You're the approved builder</h3>
          <p className="bpd-locked-panel__text">
            You have been selected as the builder for this project.
          </p>
          <Button
            as={Link}
            to={`/marketplace/builder/workspace/${projectId}`}
            variant="primary"
            className="bpd-workspace-btn"
            id="go-to-workspace-locked-btn"
          >
            Go to Workspace
          </Button>
        </>
      ) : (
        <>
          <h3 className="bpd-panel-title">No Longer Accepting Proposals</h3>
          <p className="bpd-locked-panel__text">
            This project has selected a builder and is no longer accepting new proposals.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div className={`bpd-toast bpd-toast--${type}`} role="alert" aria-live="assertive">
      {message}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function BuilderProjectDetailPage() {
  const { id } = useParams();
  const { mongoUserId } = useOutletContext();

  const [project, setProject] = useState(null);
  const [myProposal, setMyProposal] = useState(null); // the builder's proposal for THIS project (if any)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [descExpanded, setDescExpanded] = useState(false);

  const [toast, setToast] = useState({ message: '', type: 'success' });

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  }

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');

        const [projRes, myProposalsRes] = await Promise.all([
          apiClient.get(`/api/marketplace/projects/${id}`),
          apiClient.get('/api/marketplace/proposals/my'),
        ]);

        if (!active) return;

        setProject(projRes.data.project);

        // Find if this builder already has a proposal for this project
        const allMyProposals = myProposalsRes.data.proposals || [];
        const existing = allMyProposals.find(
          p => (p.project?._id || p.project) === id
        );
        setMyProposal(existing || null);
      } catch (err) {
        console.error('[BuilderProjectDetailPage] Fetch failed:', err);
        if (active) {
          setError(err?.response?.data?.message || 'Failed to load project details.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => { active = false; };
  }, [id]);

  function handleProposalSubmitted(newProposal) {
    setMyProposal(newProposal);
    showToast('Proposal submitted successfully! The owner will review it shortly.');
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="bpd-page bpd-page--loading">
        <div className="skeleton-header pulse" />
        <div className="bpd-layout">
          <div className="bpd-left-col">
            <div className="skeleton-card-tall pulse" />
          </div>
          <div className="bpd-right-col">
            <div className="skeleton-card-tall pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !project) {
    return (
      <div className="bpd-page">
        <header className="bpd-header">
          <Link to="/marketplace/builder/projects" className="bpd-back-link" aria-label="Back to projects">
            <ArrowLeftIcon />
            <span>Back to Projects</span>
          </Link>
        </header>
        <Card surface="navy-secondary" className="bpd-error-card" padding="var(--space-6)">
          <h3>Error Loading Project</h3>
          <p>{error || 'Project not found.'}</p>
          <Button as={Link} to="/marketplace/builder/projects" variant="primary">
            Browse Projects
          </Button>
        </Card>
      </div>
    );
  }

  const isOpen = project.status === 'open';
  const isApprovedBuilder = myProposal?.status === 'approved';

  // Determine right-panel state
  // State 1: project open + no existing proposal → show form
  // State 2: builder has a proposal (any status) → show status panel
  // State 3: project locked/closed and no proposal → locked panel
  const rightPanelState =
    !isOpen ? 'locked' :
    myProposal  ? 'existing' :
    'form';

  const descText = project.description || '';
  const descIsLong = descText.length > 300;

  return (
    <div className="bpd-page">
      <Toast message={toast.message} type={toast.type} />

      {/* Page Header */}
      <header className="bpd-header">
        <Link to="/marketplace/builder/projects" className="bpd-back-link" aria-label="Back to open projects">
          <ArrowLeftIcon />
          <span>Browse Projects</span>
        </Link>
      </header>

      {/* Two-column layout */}
      <div className="bpd-layout">
        {/* ── LEFT COLUMN: Project Details ── */}
        <div className="bpd-left-col">
          {/* Title row */}
          <div className="bpd-title-row">
            <span className={`bpd-type-badge ${typeBadgeClass(project.constructionType)}`}>
              {formatTypeLabel(project.constructionType)}
            </span>
            <ProjectStatusBadge status={project.status} />
          </div>
          <h2 className="bpd-project-title">{project.title}</h2>

          {/* Detail grid */}
          <Card surface="navy" className="bpd-details-card">
            <div className="bpd-details-grid">
              {project.location && (
                <div className="bpd-detail-item">
                  <span className="bpd-detail-label">Location</span>
                  <span className="bpd-detail-value bpd-detail-value--icon">
                    <PinIcon /> {project.location}
                  </span>
                </div>
              )}
              <div className="bpd-detail-item">
                <span className="bpd-detail-label">Budget Range</span>
                <span className="bpd-detail-value">
                  ₹{formatINR(project.budgetMin)} – ₹{formatINR(project.budgetMax)}
                </span>
              </div>
              {project.plotSize && (
                <div className="bpd-detail-item">
                  <span className="bpd-detail-label">Plot Size</span>
                  <span className="bpd-detail-value">{project.plotSize}</span>
                </div>
              )}
              {project.timeline && (
                <div className="bpd-detail-item">
                  <span className="bpd-detail-label">Timeline</span>
                  <span className="bpd-detail-value bpd-detail-value--icon">
                    <CalendarIcon /> {project.timeline}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {descText && (
              <div className="bpd-description">
                <span className="bpd-detail-label">Description</span>
                <p className={`bpd-description__text${descExpanded || !descIsLong ? ' bpd-description__text--expanded' : ''}`}>
                  {descText}
                </p>
                {descIsLong && (
                  <button
                    type="button"
                    className="bpd-description__toggle"
                    onClick={() => setDescExpanded(prev => !prev)}
                  >
                    {descExpanded ? 'Show less' : 'Read full description'}
                  </button>
                )}
              </div>
            )}

            {/* Posted info */}
            <div className="bpd-posted-row">
              <div className="bpd-posted-item">
                <span className="bpd-detail-label">Posted by</span>
                <span className="bpd-detail-value">
                  {project.owner?.name?.split(' ')[0] || project.owner?.name || 'Owner'}
                </span>
              </div>
              <div className="bpd-posted-item">
                <span className="bpd-detail-label">Posted On</span>
                <span className="bpd-detail-value">{formatDate(project.createdAt)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* ── RIGHT COLUMN: Proposal Panel ── */}
        <div className="bpd-right-col">
          <Card surface="navy-secondary" className="bpd-proposal-panel" padding="var(--space-5)">
            {rightPanelState === 'form' && (
              <ProposalForm
                projectId={id}
                onSubmitSuccess={handleProposalSubmitted}
              />
            )}
            {rightPanelState === 'existing' && (
              <ExistingProposalPanel
                proposal={myProposal}
                projectId={id}
              />
            )}
            {rightPanelState === 'locked' && (
              <LockedProjectPanel
                isApprovedBuilder={isApprovedBuilder}
                projectId={id}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default BuilderProjectDetailPage;
