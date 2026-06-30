/**
 * client/src/components/ChatBubble.jsx
 *
 * Copilot chat message bubble — Phase 9C
 * ─────────────────────────────────────────────────────────────────────────────
 * Small presentational component for user vs assistant messages in the
 * Copilot chat panel.  Styling follows SmartBrick navy/gold tokens.
 */

import ReactMarkdown from 'react-markdown';
import './ChatBubble.css';

/**
 * @param {{ role: 'user' | 'assistant', content: string, isError?: boolean, isWarning?: boolean }} props
 */
function ChatBubble({ role, content, isError = false, isWarning = false }) {
  const classes = [
    'chat-bubble',
    role === 'user' ? 'chat-bubble--user' : 'chat-bubble--assistant',
    isError ? 'chat-bubble--error' : '',
    isWarning ? 'chat-bubble--warning' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`chat-bubble-row chat-bubble-row--${role}`}>
      <div className={classes} role={isError ? 'alert' : undefined}>
        <div className="chat-bubble__text">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default ChatBubble;
