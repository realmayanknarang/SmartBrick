import { useState, useRef, useEffect } from 'react';
import apiClient from '../api/client';
import ChatBubble from './ChatBubble';
import './AIChatWidget.css';

const ROLE_CONFIG = {
  owner: {
    title: 'AI Assistant',
    subtitle: 'Ask about your projects, proposals, or construction advice.',
    placeholder: 'e.g. What is the status of my projects?',
    welcome: "Hi! I'm your AI assistant. Ask me about your projects, proposals, or any construction-related questions.",
  },
  builder: {
    title: 'AI Assistant',
    subtitle: 'Ask about projects, materials, or construction techniques.',
    placeholder: 'e.g. Help me write a proposal',
    welcome: "Hi! I'm your AI assistant. Ask me about projects, proposals, materials, or construction best practices.",
  },
  vendor: {
    title: 'AI Assistant',
    subtitle: 'Ask about your materials, orders, or pricing.',
    placeholder: 'e.g. How can I improve my listings?',
    welcome: "Hi! I'm your AI assistant. Ask me about your material listings, orders, pricing, or inventory management.",
  },
};

function TypingIndicator() {
  return (
    <div className="ai-chat-typing" aria-label="AI is typing" role="status">
      <span className="ai-chat-typing__dot" />
      <span className="ai-chat-typing__dot" />
      <span className="ai-chat-typing__dot" />
    </div>
  );
}

function AIChatWidget({ role = 'owner' }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.owner;
  const [messages, setMessages] = useState([
    { role: 'assistant', content: config.welcome },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(e) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInputError(null);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setLoading(true);
    try {
      const { data } = await apiClient.post('/copilot/role-ask', { question: trimmed });
      const answer = data?.answer?.trim() || 'Sorry, I did not receive a response. Please try again.';
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
          isWarning: Boolean(data?.degraded),
          isError: Boolean(data?.degraded),
        },
      ]);
    } catch (err) {
      const msg =
        err?.response?.status === 429
          ? 'Too many requests — please wait a few minutes and try again.'
          : err?.response?.data?.message ||
            'Could not reach AI assistant. Check your connection and try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: msg, isError: true }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  return (
    <div className="ai-chat-widget">
      <div className="ai-chat-widget__header">
        <h3 className="ai-chat-widget__title">{config.title}</h3>
        <p className="ai-chat-widget__subtitle">{config.subtitle}</p>
      </div>

      <div className="ai-chat-widget__messages" aria-live="polite" aria-busy={loading}>
        {messages.map((msg, idx) => (
          <ChatBubble
            key={`${msg.role}-${idx}`}
            role={msg.role}
            content={msg.content}
            isError={msg.isError}
            isWarning={msg.isWarning}
          />
        ))}
        {loading && (
          <div className="chat-bubble-row chat-bubble-row--assistant">
            <TypingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="ai-chat-widget__input-row" onSubmit={handleSend}>
        <div className="ai-chat-widget__input-wrap">
          <input
            className="ai-chat-widget__input"
            type="text"
            placeholder={config.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            aria-label="Ask AI assistant"
          />
        </div>
        <button
          className="ai-chat-widget__send"
          type="submit"
          disabled={loading || !input.trim()}
        >
          {loading ? '...' : 'Send'}
        </button>
      </form>
      {inputError && <p className="ai-chat-widget__error" role="alert">{inputError}</p>}
    </div>
  );
}

export default AIChatWidget;
