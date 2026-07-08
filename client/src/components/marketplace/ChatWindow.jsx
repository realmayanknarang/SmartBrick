import { useEffect, useMemo, useRef, useState } from 'react';
import Card from '../Card';
import Button from '../Button';
import apiClient from '../../api/client';
import './ChatWindow.css';

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const MAX_TEXTAREA_HEIGHT = 72;

function ChatIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.2a2 2 0 1 1-2.82-2.83l8.48-8.48" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4Z" />
    </svg>
  );
}

function getFirstName(name) {
  return name?.trim()?.split(/\s+/)?.[0] || 'Participant';
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function isGrouped(prevMessage, nextMessage) {
  if (!prevMessage || !nextMessage) return false;

  const prevSenderId = prevMessage.sender?._id || prevMessage.sender;
  const nextSenderId = nextMessage.sender?._id || nextMessage.sender;
  const prevTimestamp = new Date(prevMessage.createdAt).getTime();
  const nextTimestamp = new Date(nextMessage.createdAt).getTime();

  if (!prevSenderId || !nextSenderId) return false;
  if (prevSenderId !== nextSenderId) return false;
  if (Number.isNaN(prevTimestamp) || Number.isNaN(nextTimestamp)) return false;

  return Math.abs(nextTimestamp - prevTimestamp) <= GROUP_WINDOW_MS;
}

function buildBubbleLayout(messages, currentUserId) {
  return messages.map((message, index) => {
    const prevMessage = messages[index - 1];
    const nextMessage = messages[index + 1];
    const senderId = message.sender?._id || message.sender;
    const isSent = senderId === currentUserId;

    return {
      ...message,
      isSent,
      startsGroup: !isGrouped(prevMessage, message),
      endsGroup: !isGrouped(message, nextMessage),
    };
  });
}

function readByIncludes(readBy = [], userId) {
  const normalizedUserId = userId?.toString?.() || userId;

  return readBy.some((entry) => {
    if (!entry) return false;
    if (typeof entry === 'string') return entry === normalizedUserId;
    return entry._id === normalizedUserId || entry.toString?.() === normalizedUserId;
  });
}

function ChatWindow({
  conversationId,
  currentUserId,
  projectTitle,
  otherParticipantName,
  sendMessage,
  joinConversation,
  startTyping,
  stopTyping,
  onNewMessage,
  onTyping,
  onMessagesRead,
  markRead,
}) {
  const normalizedCurrentUserId = currentUserId?.toString?.() || currentUserId;
  const [draft, setDraft] = useState('');
  const [showAttachTip, setShowAttachTip] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOtherParticipantOnline] = useState(false);
  const [isOtherParticipantTyping, setIsOtherParticipantTyping] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [showNewMessageNudge, setShowNewMessageNudge] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messageListRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const attachTipTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const scrollBehaviorRef = useRef(null);
  const normalizedOtherParticipantId = useMemo(() => {
    const otherMessage = messages.find((message) => {
      const senderId = message.sender?._id || message.sender;
      return senderId && senderId !== normalizedCurrentUserId;
    });

    const derivedSenderId = otherMessage?.sender?._id || otherMessage?.sender;
    return derivedSenderId?.toString?.() || derivedSenderId || '';
  }, [messages, normalizedCurrentUserId]);

  const normalizedMessages = useMemo(
    () => buildBubbleLayout(messages, normalizedCurrentUserId),
    [messages, normalizedCurrentUserId]
  );

  const canSend = draft.trim().length > 0;

  useEffect(() => {
    if (!scrollBehaviorRef.current) return;

    const behavior = scrollBehaviorRef.current;
    scrollBehaviorRef.current = null;

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior });
    });
  }, [isLoading, isOtherParticipantTyping, normalizedMessages.length]);

  useEffect(() => {
    if (!conversationId) return;

    let active = true;

    async function fetchMessages() {
      try {
        setIsLoading(true);
        setError('');

        const response = await apiClient.get(`/api/marketplace/messages/${conversationId}`);
        if (!active) return;

        setMessages(Array.isArray(response.data?.messages) ? response.data.messages : []);
        setShowNewMessageNudge(false);
        scrollBehaviorRef.current = 'auto';
        markRead?.(conversationId);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || 'Failed to load messages.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchMessages();

    return () => {
      active = false;
    };
  }, [conversationId, reloadToken, markRead]);

  useEffect(() => {
    if (!conversationId) return;
    joinConversation?.(conversationId);
  }, [conversationId, joinConversation]);

  useEffect(() => {
    if (!conversationId) return;

    const cleanup = onNewMessage?.((message) => {
      const messageConversationId = message?.conversation?._id || message?.conversation;
      if (!messageConversationId) return;
      if (messageConversationId.toString?.() !== conversationId.toString?.()) return;

      const shouldScroll = isNearBottom();
      setMessages((prev) => {
        if (prev.some((entry) => entry._id === message._id)) return prev;
        return [...prev, message];
      });

      if (shouldScroll) {
        scrollBehaviorRef.current = 'smooth';
        setShowNewMessageNudge(false);
      } else {
        setShowNewMessageNudge(true);
      }

      const senderId = message.sender?._id || message.sender;
      if (senderId && senderId.toString?.() !== normalizedCurrentUserId) {
        markRead?.(conversationId);
      }
    });

    return () => {
      cleanup?.();
    };
  }, [conversationId, markRead, normalizedCurrentUserId, onNewMessage]);

  useEffect(() => {
    const cleanup = onTyping?.(({ userId, isTyping }) => {
      if (!userId) return;
      if (userId.toString?.() === normalizedCurrentUserId) return;
      setIsOtherParticipantTyping(Boolean(isTyping));
    });

    return () => {
      cleanup?.();
    };
  }, [normalizedCurrentUserId, onTyping]);

  useEffect(() => {
    if (!conversationId) return;

    const cleanup = onMessagesRead?.(({ conversationId: cId, readBy }) => {
      if (!cId) return;
      if (cId.toString?.() !== conversationId.toString?.()) return;

      setMessages((prev) =>
        prev.map((msg) => {
          if (readByIncludes(msg.readBy || [], readBy)) return msg;
          return {
            ...msg,
            readBy: [...(msg.readBy || []), readBy],
          };
        })
      );
    });

    return () => {
      cleanup?.();
    };
  }, [conversationId, onMessagesRead]);

  useEffect(() => {
    const textareaNode = textareaRef.current;
    if (!textareaNode) return;

    textareaNode.style.height = '0px';
    textareaNode.style.height = `${Math.min(textareaNode.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    textareaNode.style.overflowY = textareaNode.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }, [draft]);

  useEffect(() => {
    return () => {
      if (attachTipTimeoutRef.current) {
        clearTimeout(attachTipTimeoutRef.current);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTypingRef.current && conversationId) {
        stopTyping?.(conversationId);
      }
    };
  }, [conversationId, stopTyping]);

  function isNearBottom() {
    const container = messageListRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  }

  function scrollToBottom(behavior = 'smooth') {
    bottomRef.current?.scrollIntoView({ behavior });
  }

  function handleMessagesScroll() {
    if (showNewMessageNudge && isNearBottom()) {
      setShowNewMessageNudge(false);
    }
  }

  async function submitDraft() {
    const trimmedDraft = draft.trim();
    if (!trimmedDraft) return;

    setDraft('');
    setShowNewMessageNudge(false);
    scrollToBottom('smooth');

    if (!conversationId || !sendMessage) return;

    try {
      setIsSending(true);
      await sendMessage(conversationId, trimmedDraft);
    } catch (err) {
      console.error('[ChatWindow] Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitDraft();
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        submitDraft();
      }
    }
  }

  function handleDraftChange(event) {
    const value = event.target.value;
    setDraft(value);

    if (!conversationId || !startTyping || !stopTyping) return;

    if (!isTypingRef.current) {
      startTyping(conversationId);
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
      isTypingRef.current = false;
    }, 900);
  }

  function handleAttachmentClick() {
    setShowAttachTip(true);

    if (attachTipTimeoutRef.current) {
      clearTimeout(attachTipTimeoutRef.current);
    }

    attachTipTimeoutRef.current = setTimeout(() => {
      setShowAttachTip(false);
    }, 2200);
  }

  function handleRetry() {
    setError('');
    setReloadToken((prev) => prev + 1);
  }

  function handleNewMessageNudgeClick() {
    setShowNewMessageNudge(false);
    scrollToBottom('smooth');
  }

  function renderMessages() {
    if (isLoading) {
      return (
        <div className="chat-window__skeletons" aria-hidden="true">
          {['left', 'right', 'left', 'right', 'left', 'right'].map((side, index) => (
            <div
              key={`${side}-${index}`}
              className={`chat-window__skeleton-row chat-window__skeleton-row--${side}`}
            >
              <div className="chat-window__skeleton-label pulse" />
              <div className="chat-window__skeleton-bubble pulse" />
              <div className="chat-window__skeleton-time pulse" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="chat-window__state chat-window__state--error" role="alert">
          <p className="chat-window__state-title">Failed to load messages. Check your connection.</p>
          <Button type="button" variant="primary" size="sm" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      );
    }

    if (normalizedMessages.length === 0) {
      return (
        <div className="chat-window__state chat-window__state--empty">
          <div className="chat-window__empty-icon" aria-hidden="true">
            <ChatIcon />
          </div>
          <p className="chat-window__state-heading">No messages yet</p>
          <p className="chat-window__state-copy">Send the first message to get started</p>
        </div>
      );
    }

    return (
      <div className="chat-window__thread">
        {normalizedMessages.map((message) => {
          const senderName = message.isSent
            ? 'You'
            : getFirstName(message.sender?.name || otherParticipantName);
          const hasOtherReadReceipt = normalizedOtherParticipantId
            ? readByIncludes(message.readBy, normalizedOtherParticipantId)
            : false;
          const readReceipt = hasOtherReadReceipt ? '✓✓' : '✓';

          return (
            <div
              key={message._id}
              className={`chat-window__message chat-window__message--${message.isSent ? 'sent' : 'received'}`}
            >
              {message.startsGroup && (
                <span className="chat-window__sender-label">{senderName}</span>
              )}
              <div
                className={[
                  'chat-window__bubble',
                  message.isSent ? 'chat-window__bubble--sent' : 'chat-window__bubble--received',
                  message.startsGroup ? 'chat-window__bubble--group-start' : 'chat-window__bubble--group-mid',
                  message.endsGroup ? 'chat-window__bubble--group-end' : 'chat-window__bubble--group-mid',
                ].join(' ')}
              >
                <p className="chat-window__bubble-text">{message.content}</p>
              </div>
              {message.endsGroup && (
                <div className="chat-window__meta-row">
                  <span className="chat-window__timestamp">{formatTime(message.createdAt)}</span>
                  {message.isSent && (
                    <span className="chat-window__receipt" aria-label={hasOtherReadReceipt ? 'Read' : 'Sent'}>
                      {readReceipt}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card surface="navy-secondary" className="chat-window-card" padding="0">
      <section className="chat-window" aria-label={`Conversation ${conversationId}`}>
        <header className="chat-window__header">
          <div className="chat-window__header-left">
            <button
              type="button"
              className="chat-window__back-button"
              aria-label="Back"
              onClick={() => window.history.back()}
            >
              <ArrowLeftIcon />
            </button>
            <div className="chat-window__header-copy">
              <p className="chat-window__project-title">{projectTitle || 'Project Chat'}</p>
              <h3 className="chat-window__participant-title">
                {otherParticipantName ? `Chatting with ${otherParticipantName}` : 'Project conversation'}
              </h3>
            </div>
          </div>
          <div className="chat-window__presence" aria-live="polite">
            <span
              className={`chat-window__presence-dot ${
                isOtherParticipantOnline
                  ? 'chat-window__presence-dot--online'
                  : 'chat-window__presence-dot--offline'
              }`}
              aria-hidden="true"
            />
            <span className="chat-window__presence-text">
              {isOtherParticipantOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </header>

        <div ref={messageListRef} className="chat-window__messages" onScroll={handleMessagesScroll}>
          {renderMessages()}
          <div className="chat-window__typing-zone" aria-live="polite">
            {isOtherParticipantTyping && (
              <div className="chat-window__typing-indicator" role="status">
                <span className="chat-window__typing-text">
                  {getFirstName(otherParticipantName)} is typing...
                </span>
                <span className="chat-window__typing-dots" aria-hidden="true">
                  <span className="chat-window__typing-dot" />
                  <span className="chat-window__typing-dot" />
                  <span className="chat-window__typing-dot" />
                </span>
              </div>
            )}
          </div>
          {showNewMessageNudge && !isLoading && !error && (
            <button
              type="button"
              className="chat-window__new-message"
              onClick={handleNewMessageNudgeClick}
            >
              ↓ New message
            </button>
          )}
          <div ref={bottomRef} />
        </div>

        <form className="chat-window__composer" onSubmit={handleSubmit}>
          <div className="chat-window__attach-wrap">
            <button
              type="button"
              className="chat-window__icon-button"
              aria-label="Attach file"
              title="File sharing coming soon"
              onClick={handleAttachmentClick}
            >
              <PaperclipIcon />
            </button>
            {showAttachTip && (
              <span className="chat-window__tooltip" role="status">
                File sharing coming soon
              </span>
            )}
          </div>

          <div className="chat-window__input-shell">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={handleDraftChange}
              onKeyDown={handleKeyDown}
              className="chat-window__textarea"
              placeholder="Type a message..."
              rows={1}
            />
          </div>

          <button
            type="submit"
            className="chat-window__send-button"
            disabled={!canSend || isSending}
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </form>
      </section>
    </Card>
  );
}

export default ChatWindow;
