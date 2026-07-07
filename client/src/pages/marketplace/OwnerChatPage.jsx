/**
 * client/src/pages/marketplace/OwnerChatPage.jsx
 *
 * Owner Chat Page Wrapper — Sub-phase M4F.
 * Shell that will host the ChatWindow component in Phase M7.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ChatWindow from '../../components/marketplace/ChatWindow';
import apiClient from '../../api/client';
import './OwnerChatPage.css';

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function OwnerChatPage() {
  const { id: projectId } = useParams();
  const { mongoUserId } = useOutletContext();
  const [project, setProject] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadChatData() {
      try {
        setLoading(true);
        setError('');

        // Fetch project and conversation in parallel
        const [projRes, convRes] = await Promise.allSettled([
          apiClient.get(`/api/marketplace/projects/${projectId}`),
          apiClient.get(`/api/marketplace/conversations/${projectId}`)
        ]);

        if (!active) return;

        if (projRes.status === 'fulfilled') {
          setProject(projRes.value.data.project);
        } else {
          console.error('[OwnerChatPage] Failed to fetch project:', projRes.reason);
          setError('Failed to fetch project details.');
        }

        if (convRes.status === 'fulfilled') {
          setConversation(convRes.value.data.conversation);
        } else {
          // If conversation is 404, that is expected for open projects.
          const status = convRes.reason?.response?.status;
          if (status !== 404) {
            console.error('[OwnerChatPage] Failed to fetch conversation:', convRes.reason);
          }
        }
      } catch (err) {
        console.error('[OwnerChatPage] Unexpected error:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadChatData();

    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="owner-chat-page owner-chat-page--loading">
        <div className="skeleton-header pulse" />
        <Card surface="navy-secondary" className="skeleton-chat pulse" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="owner-chat-page">
        <header className="chat-page-header">
          <Link to="/marketplace/owner/projects" className="chat-page-back" aria-label="Back">
            <ArrowLeftIcon />
          </Link>
        </header>
        <Card surface="navy-secondary" className="chat-error-card">
          <h3>Error Loading Chat</h3>
          <p>{error || 'Project not found.'}</p>
        </Card>
      </div>
    );
  }

  // Determine chat display message
  let displayMessage = '';
  let showChatPlaceholder = false;

  if (project.status === 'open') {
    displayMessage = 'Approve a builder first to enable project chat.';
  } else if (!conversation) {
    displayMessage = 'Chat is available after you approve a builder.';
  } else {
    showChatPlaceholder = true;
  }

  return (
    <div className="owner-chat-page">
      {/* Page Header */}
      <header className="chat-page-header">
        <Link to={`/marketplace/owner/projects/${project._id}`} className="chat-page-back" aria-label="Back to project">
          <ArrowLeftIcon />
        </Link>
        <h2 className="chat-page-title">Project Chat: {project.title}</h2>
      </header>

      {showChatPlaceholder ? (
        <ChatWindow
          conversationId={conversation._id}
          currentUserId={mongoUserId || ''}
          projectTitle={project.title}
          otherParticipantName={conversation.builder?.name || 'Builder'}
          otherParticipantId={conversation.builder?._id || conversation.builder || ''}
        />
      ) : (
        <Card surface="navy-secondary" className="chat-locked-card" padding="var(--space-6)">
          <div className="chat-locked-content">
            <div className="chat-locked-icon">🔒</div>
            <h3 className="chat-locked-title">Chat Locked</h3>
            <p className="chat-locked-desc">{displayMessage}</p>
            {project.status === 'open' && (
              <Button as={Link} to={`/marketplace/owner/projects/${project._id}`} variant="primary">
                View Proposals to Approve Builder
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default OwnerChatPage;
