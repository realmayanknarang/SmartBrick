/**
 * client/src/pages/marketplace/ProgressTrackingPage.jsx
 *
 * Progress Tracking Page — Sub-phase M4E.
 * Read-only project progress view with milestones timeline, updates, and photos lightbox.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useSocket } from '../../hooks/useSocket';
import apiClient from '../../api/client';
import './ProgressTrackingPage.css';

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CheckmarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

// ─── Date Formatter Helper ───────────────────────────────────────────────────

function formatUpdateDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatDateOnly(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function ProgressTrackingPage() {
  const { id } = useParams();
  const { mongoUserId } = useOutletContext();
  const { onNotificationUpdate } = useSocket();

  // Data States
  const [project, setProject] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lightbox Modal State
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Fetch all data
  const fetchData = async () => {
    try {
      const [projRes, updRes, mileRes] = await Promise.all([
        apiClient.get(`/marketplace/projects/${id}`),
        apiClient.get(`/marketplace/progress/${id}`),
        apiClient.get(`/marketplace/milestones/${id}`)
      ]);
      setProject(projRes.data.project);
      setUpdates(updRes.data.updates || []);
      setMilestones(mileRes.data.milestones || []);
    } catch (err) {
      console.error('[ProgressTrackingPage] Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Socket listener for real-time progress update refresh
  useEffect(() => {
    if (!mongoUserId) return;
    const cleanup = onNotificationUpdate(({ recipientId }) => {
      if (recipientId === mongoUserId) {
        fetchData();
      }
    });
    return cleanup;
  }, [mongoUserId, onNotificationUpdate]);

  if (loading) {
    return (
      <div className="progress-tracking-page progress-tracking-page--loading">
        <div className="skeleton-header pulse" />
        <div className="skeleton-metrics-row">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} surface="navy" className="skeleton-metric-card pulse" />
          ))}
        </div>
        <Card surface="navy" className="skeleton-large-card pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="progress-tracking-page">
        <header className="progress-page-header">
          <Link to="/marketplace/owner/projects" className="progress-page-back" aria-label="Back">
            <ArrowLeftIcon />
          </Link>
        </header>
        <Card surface="navy" className="progress-error-card">
          <h3>Project Not Found</h3>
          <p>We couldn't retrieve the progress data for this project.</p>
        </Card>
      </div>
    );
  }

  // Derived States
  const latestUpdate = updates[0]; // sorted newest first
  const currentStage = latestUpdate ? latestUpdate.stage : 'Not started';
  const progressPercentage = latestUpdate ? latestUpdate.progressPercentage : 0;
  
  const completedMilestones = milestones.filter(m => m.isCompleted).length;
  const totalMilestones = milestones.length;

  const isProjectClosed = project.status !== 'open';

  return (
    <div className="progress-tracking-page">
      {/* Page Header */}
      <header className="progress-page-header">
        <div className="progress-page-header__left">
          <Link to={`/marketplace/owner/projects/${project._id}`} className="progress-page-back" aria-label="Back">
            <ArrowLeftIcon />
          </Link>
          <h2 className="progress-page-title">Progress Tracking: {project.title}</h2>
        </div>
        {isProjectClosed && (
          <Button
            as={Link}
            to={`/marketplace/owner/projects/${project._id}/chat`}
            variant="secondary"
            size="sm"
          >
            Go to Chat
          </Button>
        )}
      </header>

      {/* SECTION 1: PROGRESS OVERVIEW METRICS */}
      <section className="progress-metrics-section" aria-label="Progress metrics">
        <div className="progress-metrics-grid">
          {/* Card 1: Current Stage */}
          <Card surface="navy" className="progress-metric-card">
            <span className="progress-metric-label">Current Stage</span>
            <p className="progress-metric-value">{currentStage}</p>
          </Card>

          {/* Card 2: Progress Percentage with Bar */}
          <Card surface="navy" className="progress-metric-card progress-bar-card">
            <span className="progress-metric-label">Overall Progress</span>
            <div className="progress-bar-row">
              <div className="progress-bar-wrapper">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progressPercentage}%` }}
                  aria-valuenow={progressPercentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  role="progressbar"
                />
              </div>
              <span className="progress-percent-text">{progressPercentage}%</span>
            </div>
          </Card>

          {/* Card 3: Budget Spent */}
          <Card surface="navy" className="progress-metric-card">
            <span className="progress-metric-label">Budget Spent</span>
            <p className="progress-metric-value coming-soon">Feature coming soon</p>
          </Card>

          {/* Card 4: Milestones Count */}
          <Card surface="navy" className="progress-metric-card">
            <span className="progress-metric-label">Milestones Completed</span>
            <p className="progress-metric-value">
              {completedMilestones} of {totalMilestones}
            </p>
          </Card>
        </div>
      </section>

      <div className="progress-content-row">
        {/* SECTION 2: MILESTONES TIMELINE */}
        <Card surface="navy" className="milestones-card">
          <h3 className="progress-section-title">Milestones Timeline</h3>
          
          {milestones.length === 0 ? (
            <div className="timeline-empty">
              <p>No milestones added yet — your builder will add milestones as work progresses.</p>
            </div>
          ) : (
            <div className="timeline-list">
              {milestones.map(milestone => {
                const isCompleted = milestone.isCompleted;
                return (
                  <div key={milestone._id} className={`timeline-item ${isCompleted ? 'timeline-item--completed' : ''}`}>
                    <div className="timeline-item__badge">
                      {isCompleted ? <CheckmarkIcon /> : <CircleIcon />}
                    </div>
                    <div className="timeline-item__content">
                      <h4 className="timeline-item__title">{milestone.title}</h4>
                      {milestone.description && (
                        <p className="timeline-item__desc">{milestone.description}</p>
                      )}
                      <span className="timeline-item__date">
                        {isCompleted
                          ? `Completed: ${formatDateOnly(milestone.completedAt)}`
                          : milestone.dueDate
                            ? `Due: ${formatDateOnly(milestone.dueDate)}`
                            : 'No due date set'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* SECTION 3: RECENT UPDATES FEED */}
        <Card surface="navy" className="updates-card">
          <h3 className="progress-section-title">Recent Site Updates</h3>

          {updates.length === 0 ? (
            <div className="updates-empty">
              <p>No updates yet.</p>
            </div>
          ) : (
            <div className="updates-feed-list">
              {updates.map(update => (
                <div key={update._id} className="update-feed-item">
                  <div className="update-feed-item__header">
                    <span className="update-feed-item__stage-badge">{update.stage}</span>
                    <span className="update-feed-item__pct-badge">{update.progressPercentage}% Progress</span>
                  </div>

                  <span className="update-feed-item__date">
                    {formatUpdateDate(update.createdAt)}
                  </span>

                  {update.notes && (
                    <p className="update-feed-item__notes">{update.notes}</p>
                  )}

                  {update.sitePhotos && update.sitePhotos.length > 0 && (
                    <div className="site-photos-row">
                      {update.sitePhotos.map((photoUrl, pIdx) => (
                        <button
                          key={pIdx}
                          className="photo-thumbnail-btn"
                          onClick={() => setLightboxUrl(photoUrl)}
                          aria-label="View site photo full size"
                        >
                          <img
                            src={photoUrl}
                            alt={`Site thumbnail ${pIdx + 1}`}
                            className="photo-thumbnail"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* SITE PHOTO LIGHTBOX MODAL */}
      {lightboxUrl && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button
              className="lightbox-close"
              onClick={() => setLightboxUrl(null)}
              aria-label="Close image viewer"
            >
              ✕
            </button>
            <img src={lightboxUrl} alt="Site update full size" className="lightbox-image" />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgressTrackingPage;
