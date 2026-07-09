/**
 * client/src/pages/marketplace/ProjectDetailPage.jsx
 *
 * Project Detail Page — Sub-phase M4D.
 * Displays project info, proposals list, and side-by-side proposal comparison.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import TabBar from '../../components/TabBar';
import apiClient from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import './ProjectDetailPage.css';

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Currency formatter (INR Lakhs format) ───────────────────────────────────

function formatINR(val) {
  if (val === undefined || val === null) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}

function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Data States
  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected proposals for comparison
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  // Approve / Reject Confirmation States
  const [confirmProposal, setConfirmProposal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  // Description expand/collapse state
  const [descExpanded, setDescExpanded] = useState(false);

  // Fetch project and proposals on mount/change
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [projRes, propRes] = await Promise.all([
        apiClient.get(`/marketplace/projects/${id}`),
        apiClient.get(`/marketplace/proposals/project/${id}`)
      ]);

      setProject(projRes.data.project);
      setProposals(propRes.data.proposals || []);
    } catch (err) {
      console.error('[ProjectDetailPage] Fetch failed:', err);
      setError(err?.response?.data?.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Reject Flow
  const handleReject = async (proposalId) => {
    try {
      setActionLoading(true);
      await apiClient.patch(`/marketplace/proposals/${proposalId}/reject`);
      toast.success('Proposal rejected.');
      // Refresh proposals list
      const propRes = await apiClient.get(`/marketplace/proposals/project/${id}`);
      setProposals(propRes.data.proposals || []);
    } catch (err) {
      console.error('[ProjectDetailPage] Reject failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to reject proposal.');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Flow (called after modal confirmation)
  const handleApproveConfirm = async () => {
    if (!confirmProposal) return;
    try {
      setActionLoading(true);
      await apiClient.patch(`/marketplace/proposals/${confirmProposal._id}/approve`);
      toast.success('Builder approved! Project is now locked.');
      setConfirmProposal(null);
      // Refresh both project and proposals
      await fetchData();
    } catch (err) {
      console.error('[ProjectDetailPage] Approve failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to approve builder.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle checkboxes for Comparison selection
  const handleToggleSelect = (pId) => {
    setSelectedIds(prev => {
      if (prev.includes(pId)) {
        return prev.filter(item => item !== pId);
      } else {
        if (prev.length >= 3) return prev; // Limit to max 3
        return [...prev, pId];
      }
    });
  };

  if (loading) {
    return (
      <div className="project-detail-page project-detail-page--loading">
        <div className="skeleton-header pulse" />
        <Card surface="navy-secondary" className="skeleton-card pulse" />
        <Card surface="navy-secondary" className="skeleton-card pulse" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-detail-page">
        <header className="project-detail-header">
          <Link to="/marketplace/owner/projects" className="project-detail-back" aria-label="Back">
            <ArrowLeftIcon />
          </Link>
        </header>
        <Card surface="navy-secondary" className="detail-error-card" padding="var(--space-6)">
          <h3>Error Loading Details</h3>
          <p>{error || 'Project not found.'}</p>
          <Button as={Link} to="/marketplace/owner/projects" variant="primary">
            Back to My Projects
          </Button>
        </Card>
      </div>
    );
  }

  const isProjectClosed = project.status !== 'open';
  const showEditBtn = project.status === 'open';

  // Format type labels
  const formatTypeLabel = (type) => {
    if (!type) return '';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Status Badge Helper
  const statusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="status-pill status-pill--open">Open for Proposals</span>;
      case 'locked':
        return <span className="status-pill status-pill--locked">Builder Selected</span>;
      case 'completed':
        return <span className="status-pill status-pill--completed">Completed</span>;
      default:
        return <span className="status-pill">{status}</span>;
    }
  };

  // Proposal List Components
  const proposalStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="proposal-badge proposal-badge--pending">Pending</span>;
      case 'approved':
        return <span className="proposal-badge proposal-badge--approved">Approved</span>;
      case 'rejected':
        return <span className="proposal-badge proposal-badge--rejected">Rejected</span>;
      default:
        return <span className="proposal-badge">{status}</span>;
    }
  };

  // Proposals filtered or mapped
  const selectedProposals = proposals.filter(p => selectedIds.includes(p._id));
  const minBudget = selectedProposals.length > 0 ? Math.min(...selectedProposals.map(p => p.estimatedBudget)) : 0;
  const maxBudget = selectedProposals.length > 0 ? Math.max(...selectedProposals.map(p => p.estimatedBudget)) : 0;
  const hasMultipleBudgets = selectedProposals.length > 1 && minBudget !== maxBudget;

  return (
    <div className="project-detail-page">
      {/* Header Row */}
      <header className="project-detail-header">
        <div className="project-detail-header__left">
          <Link to="/marketplace/owner/projects" className="project-detail-back" aria-label="Back">
            <ArrowLeftIcon />
          </Link>
          <h2 className="project-detail-title">{project.title}</h2>
          {statusBadge(project.status)}
        </div>
        {showEditBtn && (
          <Button
            as={Link}
            to={`/marketplace/owner/projects/${project._id}/edit`}
            variant="secondary"
            size="sm"
            className="project-detail-edit-btn"
          >
            <EditIcon /> Edit Project
          </Button>
        )}
      </header>

      {/* SECTION 1: PROJECT DETAILS */}
      <Card surface="navy" className="details-card" padding="var(--space-5)">
        <div className="details-grid">
          <div className="details-grid__item">
            <span className="details-grid__label">Location</span>
            <span className="details-grid__value">{project.location}</span>
          </div>
          <div className="details-grid__item">
            <span className="details-grid__label">Construction Type</span>
            <span className="details-grid__value">{formatTypeLabel(project.constructionType)}</span>
          </div>
          <div className="details-grid__item">
            <span className="details-grid__label">Budget Range</span>
            <span className="details-grid__value">
              {formatINR(project.budgetMin)} – {formatINR(project.budgetMax)}
            </span>
          </div>
          <div className="details-grid__item">
            <span className="details-grid__label">Plot Size</span>
            <span className="details-grid__value">{project.plotSize || '—'}</span>
          </div>
          <div className="details-grid__item">
            <span className="details-grid__label">Timeline</span>
            <span className="details-grid__value">{project.timeline || '—'}</span>
          </div>
        </div>

        <div className="details-description">
          <span className="details-grid__label">Description</span>
          <div className={`details-description__text ${descExpanded ? 'expanded' : ''}`}>
            {project.description}
          </div>
          {project.description && project.description.length > 250 && (
            <button
              className="details-description__toggle"
              onClick={() => setDescExpanded(!descExpanded)}
            >
              {descExpanded ? 'Show less' : 'Read full description'}
            </button>
          )}
        </div>

        {/* Builder selected banner */}
        {isProjectClosed && (
          <div className="locked-project-banner">
            <span className="locked-project-banner__icon">🔒</span>
            <div className="locked-project-banner__content">
              <strong>Builder selected — project is locked.</strong>
              <p>You have approved a proposal and this project is now active.</p>
            </div>
            <Link to={`/marketplace/owner/projects/${project._id}/chat`} className="locked-project-banner__link">
              Go to project chat →
            </Link>
          </div>
        )}
      </Card>

      {/* SECTION 2: PROPOSALS */}
      <section className="proposals-section" aria-label="Proposals section">
        <h3 className="proposals-section__title">Proposals Received</h3>

        {proposals.length === 0 ? (
          <Card surface="navy-secondary" className="proposals-empty" padding="var(--space-6)">
            <p>No proposals yet — your project is visible to builders and proposals will appear here.</p>
          </Card>
        ) : (
          <div className="proposals-container">
            <TabBar
              activeTab={activeTabIdx}
              onChange={setActiveTabIdx}
              tabs={[
                {
                  label: `All Proposals (${proposals.length})`,
                  content: (
                    <div className="proposals-list-tab">
                      {/* Compare Floating Button */}
                      {selectedIds.length >= 2 && (
                        <div className="compare-bar">
                          <span>{selectedIds.length} proposals selected</span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setActiveTabIdx(1)}
                          >
                            Compare Selected
                          </Button>
                        </div>
                      )}

                      <div className="proposals-list">
                        {proposals.map(proposal => {
                          const isChecked = selectedIds.includes(proposal._id);
                          const isCheckboxDisabled = !isChecked && selectedIds.length >= 3;
                          const showActions = proposal.status === 'pending' && !isProjectClosed;

                          return (
                            <Card key={proposal._id} surface="navy-secondary" className="proposal-card">
                              <div className="proposal-card__header">
                                <div className="proposal-card__builder-info">
                                  {/* Compare Checkbox */}
                                  {!isProjectClosed && (
                                    <label className="compare-checkbox-label">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        disabled={isCheckboxDisabled}
                                        onChange={() => handleToggleSelect(proposal._id)}
                                        className="compare-checkbox"
                                      />
                                      <span className="compare-checkbox-custom" />
                                    </label>
                                  )}
                                  <div>
                                    <h4 className="proposal-card__builder-name">
                                      {proposal.builder?.name || 'Builder'}
                                    </h4>
                                    <span className="proposal-card__builder-email">
                                      {proposal.builder?.email}
                                    </span>
                                  </div>
                                </div>
                                {proposalStatusBadge(proposal.status)}
                              </div>

                              <div className="proposal-card__metrics">
                                <div className="proposal-card__metric">
                                  <span className="proposal-card__metric-label">Estimated Budget</span>
                                  <span className="proposal-card__metric-value">{formatINR(proposal.estimatedBudget)}</span>
                                </div>
                                <div className="proposal-card__metric">
                                  <span className="proposal-card__metric-label">Duration</span>
                                  <span className="proposal-card__metric-value">{proposal.estimatedDuration}</span>
                                </div>
                              </div>

                              {proposal.notes && (
                                <div className="proposal-card__section">
                                  <span className="proposal-card__section-title">Notes</span>
                                  <p className="proposal-card__section-text">{proposal.notes}</p>
                                </div>
                              )}

                              {proposal.materialRecommendations && (
                                <div className="proposal-card__section">
                                  <span className="proposal-card__section-title">Material Recommendations</span>
                                  <p className="proposal-card__section-text">{proposal.materialRecommendations}</p>
                                </div>
                              )}

                              {showActions && (
                                <div className="proposal-card__actions">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="btn--reject"
                                    onClick={() => handleReject(proposal._id)}
                                    disabled={actionLoading}
                                  >
                                    <CrossIcon /> Reject
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    className="btn--approve"
                                    onClick={() => setConfirmProposal(proposal)}
                                    disabled={actionLoading}
                                  >
                                    <CheckIcon /> Approve
                                  </Button>
                                </div>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )
                },
                {
                  label: 'Compare',
                  content: (
                    <div className="compare-tab-content">
                      {selectedProposals.length < 2 ? (
                        <div className="compare-fallback">
                          <p>Select at least 2 proposals (max 3) using the checkboxes in the "All Proposals" tab to view their side-by-side comparison.</p>
                          <Button variant="secondary" size="sm" onClick={() => setActiveTabIdx(0)}>
                            Go to All Proposals
                          </Button>
                        </div>
                      ) : (
                        <div className="comparison-table-wrapper">
                          <table className="comparison-table">
                            <thead>
                              <tr>
                                <th>Feature</th>
                                {selectedProposals.map(proposal => (
                                  <th key={proposal._id}>
                                    {proposal.builder?.name || 'Builder'}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td><strong>Estimated Budget</strong></td>
                                {selectedProposals.map(proposal => {
                                  let highlightClass = '';
                                  if (hasMultipleBudgets) {
                                    if (proposal.estimatedBudget === minBudget) {
                                      highlightClass = 'compare-cell--min';
                                    } else if (proposal.estimatedBudget === maxBudget) {
                                      highlightClass = 'compare-cell--max';
                                    }
                                  }
                                  return (
                                    <td key={proposal._id} className={highlightClass}>
                                      <span className="compare-budget-value">{formatINR(proposal.estimatedBudget)}</span>
                                      {highlightClass === 'compare-cell--min' && <span className="compare-badge-pill min">Lowest</span>}
                                      {highlightClass === 'compare-cell--max' && <span className="compare-badge-pill max">Highest</span>}
                                    </td>
                                  );
                                })}
                              </tr>
                              <tr>
                                <td><strong>Duration</strong></td>
                                {selectedProposals.map(proposal => (
                                  <td key={proposal._id}>{proposal.estimatedDuration}</td>
                                ))}
                              </tr>
                              <tr>
                                <td><strong>Notes</strong></td>
                                {selectedProposals.map(proposal => (
                                  <td key={proposal._id} className="compare-notes-cell">
                                    {proposal.notes || '—'}
                                  </td>
                                ))}
                              </tr>
                              <tr>
                                <td><strong>Materials</strong></td>
                                {selectedProposals.map(proposal => (
                                  <td key={proposal._id} className="compare-notes-cell">
                                    {proposal.materialRecommendations || '—'}
                                  </td>
                                ))}
                              </tr>
                              {project.status === 'open' && (
                                <tr>
                                  <td><strong>Action</strong></td>
                                  {selectedProposals.map(proposal => (
                                    <td key={proposal._id}>
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        className="btn--approve"
                                        onClick={() => setConfirmProposal(proposal)}
                                        disabled={actionLoading}
                                      >
                                        Approve
                                      </Button>
                                    </td>
                                  ))}
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                }
              ]}
            />
          </div>
        )}
      </section>

      {/* APPROVE CONFIRMATION MODAL */}
      {confirmProposal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-card">
            <h3 id="modal-title" className="modal-card__title">Approve this builder?</h3>
            <p className="modal-card__body">
              This will lock your project. No more proposals will be accepted, and all other proposals will be rejected. This cannot be undone.
            </p>
            <div className="modal-card__footer">
              <Button
                variant="secondary"
                onClick={() => setConfirmProposal(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="btn--approve"
                onClick={handleApproveConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? 'Approving...' : 'Yes, approve'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetailPage;
