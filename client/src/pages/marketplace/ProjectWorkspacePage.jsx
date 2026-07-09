/**
 * client/src/pages/marketplace/ProjectWorkspacePage.jsx
 *
 * Builder Project Workspace — Sub-phase M5E.
 * The builder's command center for an approved project.
 * 4 tabs: Progress | Milestones | Chat | Project Details
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import TextInput from '../../components/TextInput';
import TabBar from '../../components/TabBar';
import ChatWindow from '../../components/marketplace/ChatWindow';
import apiClient from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import './ProjectWorkspacePage.css';

// ─── Icons ───────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CheckmarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
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
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function formatUpdateDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    month: 'long', day: 'numeric', year: 'numeric'
  }) + ' at ' + date.toLocaleTimeString('en-IN', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });
}

function formatDateOnly(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTypeLabel(type) {
  if (!type) return 'Other';
  return type.charAt(0).toUpperCase() + type.slice(1);
}



// ─── Project Status Badge ─────────────────────────────────────────────────────

function ProjectStatusBadge({ status }) {
  const map = {
    open:      { cls: 'pw-proj-status--open',      label: 'Open' },
    locked:    { cls: 'pw-proj-status--locked',    label: 'Builder Selected' },
    completed: { cls: 'pw-proj-status--completed', label: 'Completed' },
  };
  const { cls, label } = map[status] || { cls: '', label: status };
  return <span className={`pw-proj-status-badge ${cls}`}>{label}</span>;
}

// ─── TAB 1: Progress ──────────────────────────────────────────────────────────

function ProgressTab({ projectId, updates, setUpdates, onToast }) {
  const [stage, setStage] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  function validate() {
    const errs = {};
    if (!stage.trim()) errs.stage = 'Please enter the current construction stage.';
    if (progressPct < 0 || progressPct > 100) errs.progress = 'Progress must be between 0 and 100.';
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
      const payload = {
        stage: stage.trim(),
        progressPercentage: Number(progressPct),
        notes: notes.trim() || undefined,
        sitePhotos: photoUrl.trim() ? [{ url: photoUrl.trim() }] : undefined,
      };
      const res = await apiClient.post(`/marketplace/progress/${projectId}`, payload);
      const newUpdate = res.data.update;
      setUpdates(prev => [newUpdate, ...prev]);
      setStage('');
      setProgressPct(0);
      setNotes('');
      setPhotoUrl('');
      setErrors({});
      onToast('Progress updated!', 'success');
    } catch (err) {
      setApiError(err?.response?.data?.message || 'Failed to post update. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pw-progress-tab">
      <Card surface="navy-secondary" className="pw-section-card">
        <h3 className="pw-section-title">Post Update</h3>
        <form className="pw-update-form" onSubmit={handleSubmit} noValidate>
          <TextInput
            label="Stage"
            type="text"
            placeholder="e.g. Foundation pouring, Column work"
            value={stage}
            onChange={e => setStage(e.target.value)}
            required
            error={errors.stage}
            id="update-stage"
          />
          <div className="pw-progress-field">
            <label className="pw-field-label" htmlFor="update-progress-slider">
              Progress %
            </label>
            <div className="pw-progress-input-row">
              <input
                id="update-progress-slider"
                type="range"
                min="0"
                max="100"
                step="1"
                value={progressPct}
                onChange={e => setProgressPct(Number(e.target.value))}
                className="pw-range-slider"
                aria-label="Progress percentage slider"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={progressPct}
                onChange={e => setProgressPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="pw-progress-number"
                aria-label="Progress percentage number"
                id="update-progress-number"
              />
              <span className="pw-progress-pct-label">%</span>
            </div>
            {errors.progress && <p className="pw-field-error">{errors.progress}</p>}
          </div>
          <div className="pw-form-field">
            <label className="pw-field-label" htmlFor="update-notes">
              Notes <span className="pw-optional">(optional)</span>
            </label>
            <textarea
              id="update-notes"
              className="pw-textarea"
              rows={3}
              placeholder="Describe what was done, any challenges, next steps..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <div className="pw-photo-note">
            <span className="pw-photo-coming-soon">Photo upload coming soon</span> — enter a URL to attach an image for now.
          </div>
          <TextInput
            label="Site Photo URL (optional)"
            type="url"
            placeholder="https://example.com/site-photo.jpg"
            value={photoUrl}
            onChange={e => setPhotoUrl(e.target.value)}
            id="update-photo-url"
          />
          {apiError && <p className="pw-form-error" role="alert">{apiError}</p>}
          <Button variant="primary" type="submit" disabled={submitting} className="pw-submit-btn" id="post-update-btn">
            {submitting ? 'Posting...' : 'Post Update'}
          </Button>
        </form>
      </Card>
      <Card surface="navy" className="pw-section-card pw-section-card--mt">
        <h3 className="pw-section-title">Update History</h3>
        {updates.length === 0 ? (
          <div className="pw-empty-section">
            <p>No updates posted yet. Post the first update above.</p>
          </div>
        ) : (
          <div className="pw-updates-feed">
            {updates.map(update => (
              <div key={update._id} className="pw-update-item">
                <div className="pw-update-item__header">
                  <span className="pw-update-stage-badge">{update.stage}</span>
                  <span className="pw-update-pct-badge">{update.progressPercentage}% Progress</span>
                </div>
                <span className="pw-update-date">{formatUpdateDate(update.createdAt)}</span>
                {update.notes && <p className="pw-update-notes">{update.notes}</p>}
                {update.sitePhotos && update.sitePhotos.length > 0 && (
                  <div className="pw-update-photos">
                    {update.sitePhotos.map((photo, idx) => (
                      <a
                        key={idx}
                        href={typeof photo === 'string' ? photo : photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pw-photo-link"
                      >
                        View Photo {idx + 1} &rarr;
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── TAB 2: Milestones ────────────────────────────────────────────────────────

function MilestonesTab({ projectId, milestones, setMilestones, onToast }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [markingId, setMarkingId] = useState(null);

  function validate() {
    const errs = {};
    if (!title.trim()) errs.title = 'Please enter a milestone title.';
    return errs;
  }

  async function handleAddMilestone(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    setApiError('');
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
      };
      const res = await apiClient.post(`/marketplace/milestones/${projectId}`, payload);
      setMilestones(prev => [...prev, res.data.milestone]);
      setTitle('');
      setDescription('');
      setDueDate('');
      setErrors({});
      onToast('Milestone added!', 'success');
    } catch (err) {
      setApiError(err?.response?.data?.message || 'Failed to add milestone.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkComplete(milestoneId) {
    setMarkingId(milestoneId);
    try {
      const res = await apiClient.patch(`/marketplace/milestones/${milestoneId}/complete`);
      const updated = res.data.milestone;
      setMilestones(prev => prev.map(m => m._id === milestoneId ? { ...m, ...updated } : m));
      onToast('Milestone marked complete!', 'success');
    } catch (err) {
      onToast('Failed to mark milestone complete.', 'error');
    } finally {
      setMarkingId(null);
    }
  }

  const pending   = milestones.filter(m => !m.isCompleted);
  const completed = milestones.filter(m => m.isCompleted);

  return (
    <div className="pw-milestones-tab">
      <Card surface="navy-secondary" className="pw-section-card">
        <h3 className="pw-section-title">Add Milestone</h3>
        <form className="pw-milestone-form" onSubmit={handleAddMilestone} noValidate>
          <TextInput
            label="Title"
            type="text"
            placeholder="e.g. Foundation complete"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            error={errors.title}
            id="milestone-title"
          />
          <div className="pw-form-field">
            <label className="pw-field-label" htmlFor="milestone-desc">
              Description <span className="pw-optional">(optional)</span>
            </label>
            <textarea
              id="milestone-desc"
              className="pw-textarea"
              rows={2}
              placeholder="Brief description of what this milestone entails"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <TextInput
            label="Due Date (optional)"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            id="milestone-due-date"
          />
          {apiError && <p className="pw-form-error" role="alert">{apiError}</p>}
          <Button variant="primary" type="submit" disabled={submitting} className="pw-submit-btn" id="add-milestone-btn">
            {submitting ? 'Adding...' : 'Add Milestone'}
          </Button>
        </form>
      </Card>
      <Card surface="navy" className="pw-section-card pw-section-card--mt">
        <h3 className="pw-section-title">Milestone Timeline</h3>
        {milestones.length === 0 ? (
          <div className="pw-empty-section">
            <p>No milestones yet. Add your first milestone to help the owner track progress.</p>
          </div>
        ) : (
          <div className="pw-timeline">
            {pending.length > 0 && (
              <div className="pw-timeline-group">
                {pending.map(m => (
                  <div key={m._id} className="pw-timeline-item">
                    <div className="pw-timeline-item__badge pw-timeline-item__badge--pending">
                      <CircleIcon />
                    </div>
                    <div className="pw-timeline-item__content">
                      <div className="pw-timeline-item__header-row">
                        <h4 className="pw-timeline-item__title">{m.title}</h4>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleMarkComplete(m._id)}
                          disabled={markingId === m._id}
                          className="pw-mark-complete-btn"
                          id={`mark-complete-${m._id}`}
                        >
                          {markingId === m._id ? '...' : 'Mark Complete'}
                        </Button>
                      </div>
                      {m.description && <p className="pw-timeline-item__desc">{m.description}</p>}
                      <span className="pw-timeline-item__date">
                        {m.dueDate ? `Due: ${formatDateOnly(m.dueDate)}` : 'No due date set'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {completed.length > 0 && (
              <>
                {pending.length > 0 && <div className="pw-timeline-section-divider">Completed</div>}
                <div className="pw-timeline-group">
                  {completed.map(m => (
                    <div key={m._id} className="pw-timeline-item pw-timeline-item--completed">
                      <div className="pw-timeline-item__badge pw-timeline-item__badge--done">
                        <CheckmarkIcon />
                      </div>
                      <div className="pw-timeline-item__content">
                        <h4 className="pw-timeline-item__title">{m.title}</h4>
                        {m.description && <p className="pw-timeline-item__desc">{m.description}</p>}
                        <span className="pw-timeline-item__date">
                          Completed: {formatDateOnly(m.completedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── TAB 3: Chat ─────────────────────────────────────────────────────────────

function ChatTab({
  conversation,
  projectTitle,
  currentUserId,
  sendMessage,
  joinConversation,
  startTyping,
  stopTyping,
  onNewMessage,
  onTyping,
  onMessagesRead,
  onUserOnline,
  onUserOffline,
  markRead,
}) {
  if (!conversation) {
    return (
      <Card surface="navy" className="pw-section-card">
        <div className="pw-empty-section pw-empty-section--centered">
          <p>Chat unavailable for this project.</p>
        </div>
      </Card>
    );
  }
  return (
    <ChatWindow
      conversationId={conversation._id}
      currentUserId={currentUserId || ''}
      projectTitle={projectTitle}
      otherParticipantName={conversation.owner?.name || 'Owner'}
      otherParticipantId={conversation.owner?._id || conversation.owner || ''}
      sendMessage={sendMessage}
      joinConversation={joinConversation}
      startTyping={startTyping}
      stopTyping={stopTyping}
      onNewMessage={onNewMessage}
      onTyping={onTyping}
      onMessagesRead={onMessagesRead}
      onUserOnline={onUserOnline}
      onUserOffline={onUserOffline}
      markRead={markRead}
    />
  );
}

// ─── TAB 4: Project Details ───────────────────────────────────────────────────

function ProjectDetailsTab({ project, proposal }) {
  return (
    <div className="pw-project-details-tab">
      <Card surface="navy" className="pw-section-card">
        <div className="pw-approved-badge">
          <span className="pw-approved-badge__icon">✓</span>
          You are the approved builder for this project
        </div>
        <h3 className="pw-section-title pw-section-title--mt">Project Information</h3>
        <div className="pw-detail-grid">
          <div className="pw-detail-item">
            <span className="pw-detail-label">Title</span>
            <span className="pw-detail-value">{project.title}</span>
          </div>
          <div className="pw-detail-item">
            <span className="pw-detail-label">Status</span>
            <span className="pw-detail-value"><ProjectStatusBadge status={project.status} /></span>
          </div>
          <div className="pw-detail-item">
            <span className="pw-detail-label">Type</span>
            <span className="pw-detail-value">{formatTypeLabel(project.constructionType)}</span>
          </div>
          {project.location && (
            <div className="pw-detail-item">
              <span className="pw-detail-label">Location</span>
              <span className="pw-detail-value pw-detail-value--icon">
                <PinIcon /> {project.location}
              </span>
            </div>
          )}
          <div className="pw-detail-item">
            <span className="pw-detail-label">Budget Range</span>
            <span className="pw-detail-value">
              {formatINR(project.budgetMin)} – {formatINR(project.budgetMax)}
            </span>
          </div>
          {project.plotSize && (
            <div className="pw-detail-item">
              <span className="pw-detail-label">Plot Size</span>
              <span className="pw-detail-value">{project.plotSize}</span>
            </div>
          )}
          {project.timeline && (
            <div className="pw-detail-item">
              <span className="pw-detail-label">Timeline</span>
              <span className="pw-detail-value pw-detail-value--icon">
                <CalendarIcon /> {project.timeline}
              </span>
            </div>
          )}
          <div className="pw-detail-item">
            <span className="pw-detail-label">Owner</span>
            <span className="pw-detail-value">
              {project.owner?.name?.split(' ')[0] || project.owner?.name || 'Owner'}
            </span>
          </div>
          <div className="pw-detail-item">
            <span className="pw-detail-label">Posted On</span>
            <span className="pw-detail-value">{formatDate(project.createdAt)}</span>
          </div>
        </div>
        {project.description && (
          <div className="pw-detail-description">
            <span className="pw-detail-label">Description</span>
            <p className="pw-detail-desc-text">{project.description}</p>
          </div>
        )}
      </Card>
      {proposal && (
        <Card surface="navy-secondary" className="pw-section-card pw-section-card--mt">
          <h3 className="pw-section-title">Your Winning Proposal</h3>
          <div className="pw-detail-grid">
            <div className="pw-detail-item">
              <span className="pw-detail-label">Your Bid</span>
              <span className="pw-detail-value pw-detail-value--accent">{formatINR(proposal.estimatedBudget)}</span>
            </div>
            <div className="pw-detail-item">
              <span className="pw-detail-label">Duration</span>
              <span className="pw-detail-value">{proposal.estimatedDuration || '—'}</span>
            </div>
            <div className="pw-detail-item">
              <span className="pw-detail-label">Submitted On</span>
              <span className="pw-detail-value">{formatDate(proposal.createdAt)}</span>
            </div>
          </div>
          {proposal.notes && (
            <div className="pw-detail-description">
              <span className="pw-detail-label">Your Notes</span>
              <p className="pw-detail-desc-text">{proposal.notes}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProjectWorkspacePage() {
  const { projectId } = useParams();
  const {
    mongoUserId,
    sendMessage,
    joinConversation,
    startTyping,
    stopTyping,
    onNewMessage,
    onTyping,
    onMessagesRead,
    onUserOnline,
    onUserOffline,
    markRead,
  } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState('');

  const [project, setProject]           = useState(null);
  const [updates, setUpdates]           = useState([]);
  const [milestones, setMilestones]     = useState([]);
  const [conversation, setConversation] = useState(null);
  const [myProposal, setMyProposal]     = useState(null);

  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const toastContext = useToast();

  function showToast(message, type) {
    if (type === 'error') {
      toastContext.error(message);
    } else {
      toastContext.success(message);
    }
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Access control: builder must have approved proposal for this project
      const proposalsRes = await apiClient.get('/marketplace/proposals/my');
      const allProposals = proposalsRes.data.proposals || [];
      const approvedProposal = allProposals.find(
        p => (p.project?._id || p.project) === projectId && p.status === 'approved'
      );

      if (!approvedProposal) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setMyProposal(approvedProposal);

      const [projRes, updRes, mileRes, convRes] = await Promise.allSettled([
        apiClient.get(`/marketplace/projects/${projectId}`),
        apiClient.get(`/marketplace/progress/${projectId}`),
        apiClient.get(`/marketplace/milestones/${projectId}`),
        apiClient.get(`/marketplace/conversations/${projectId}`),
      ]);

      if (projRes.status === 'fulfilled') setProject(projRes.value.data.project);
      else throw new Error('Failed to load project details.');

      if (updRes.status === 'fulfilled')  setUpdates(updRes.value.data.updates || []);
      if (mileRes.status === 'fulfilled') setMilestones(mileRes.value.data.milestones || []);
      if (convRes.status === 'fulfilled') setConversation(convRes.value.data.conversation || null);
    } catch (err) {
      console.error('[ProjectWorkspacePage] Fetch failed:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load workspace data.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="pw-page pw-page--loading">
        <div className="pw-skeleton-bar pulse" />
        <div className="pw-skeleton-tabs pulse" />
        <div className="pw-skeleton-body pulse" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="pw-page">
        <Card surface="navy-secondary" className="pw-access-denied-card">
          <div className="pw-access-denied__icon" aria-hidden="true">🔒</div>
          <h3 className="pw-access-denied__title">Access Denied</h3>
          <p className="pw-access-denied__text">
            You are not the approved builder for this project. Only the selected builder can access the workspace.
          </p>
          <Button as={Link} to="/marketplace/builder/proposals" variant="primary" id="access-denied-back-btn">
            Back to My Proposals
          </Button>
        </Card>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="pw-page">
        <Card surface="navy-secondary" className="pw-access-denied-card">
          <h3>Failed to Load Workspace</h3>
          <p>{error || 'Project not found.'}</p>
          <Button as={Link} to="/marketplace/builder/proposals" variant="primary">
            Back to My Proposals
          </Button>
        </Card>
      </div>
    );
  }

  const tabs = [
    {
      label: 'Progress',
      content: (
        <ProgressTab
          projectId={projectId}
          updates={updates}
          setUpdates={setUpdates}
          onToast={showToast}
        />
      ),
    },
    {
      label: 'Milestones',
      content: (
        <MilestonesTab
          projectId={projectId}
          milestones={milestones}
          setMilestones={setMilestones}
          onToast={showToast}
        />
      ),
    },
    {
      label: 'Chat',
      content: (
        <ChatTab
          conversation={conversation}
          projectTitle={project.title}
          currentUserId={mongoUserId}
          sendMessage={sendMessage}
          joinConversation={joinConversation}
          startTyping={startTyping}
          stopTyping={stopTyping}
          onNewMessage={onNewMessage}
          onTyping={onTyping}
          onMessagesRead={onMessagesRead}
          onUserOnline={onUserOnline}
          onUserOffline={onUserOffline}
          markRead={markRead}
        />
      ),
    },
    {
      label: 'Project Details',
      content: <ProjectDetailsTab project={project} proposal={myProposal} />,
    },
  ];

  return (
    <div className="pw-page">
      <header className="pw-header">
        <div className="pw-header__left">
          <Link to="/marketplace/builder/proposals" className="pw-back-link" aria-label="Back to My Proposals">
            <ArrowLeftIcon />
            <span>My Proposals</span>
          </Link>
          <div className="pw-header__title-row">
            <h2 className="pw-project-title">{project.title}</h2>
            <ProjectStatusBadge status={project.status} />
          </div>
        </div>
      </header>
      <TabBar tabs={tabs} activeTab={activeTabIdx} onChange={setActiveTabIdx} />
    </div>
  );
}

export default ProjectWorkspacePage;
