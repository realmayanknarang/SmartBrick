/**
 * client/src/pages/CopilotPage.jsx
 *
 * AI Copilot Chat — Phase 9C
 * ─────────────────────────────────────────────────────────────────────────────
 * Simple chat UI backed by POST /api/copilot/ask (Phase 9B).
 * Conversation lives in React state only — clears on refresh.
 */

import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SignOutButton } from '@clerk/clerk-react';
import Sidebar from '../components/Sidebar';
import { NAV_ITEMS } from '../config/dashboardNav.jsx';
import Card from '../components/Card';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import ChatBubble from '../components/ChatBubble';
import apiClient from '../api/client';
import './DashboardPage.css';
import './CopilotPage.css';


function TypingIndicator() {
  return (
    <div className="copilot-typing" aria-label="Copilot is typing" role="status">
      <span className="copilot-typing__dot" />
      <span className="copilot-typing__dot" />
      <span className="copilot-typing__dot" />
    </div>
  );
}

function CopilotPage() {
  const { pathname } = useLocation();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi — I\'m SmartBrick Copilot. Ask about vendors, stock levels, budgets, or recent orders. I answer from your live workspace data only.',
    },
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
      const { data } = await apiClient.post('/copilot/ask', { question: trimmed });
      const answer = data?.answer?.trim() || 'Sorry, I did not receive a response. Please try again.';
      setMessages(prev => [
        ...prev,
        {
          role:      'assistant',
          content:   answer,
          isWarning: Boolean(data?.degraded),
          isError:   Boolean(data?.degraded),
        },
      ]);
    } catch (err) {
      const msg =
        err?.response?.status === 429
          ? 'Too many Copilot requests — please wait a few minutes and try again.'
          : err?.response?.data?.message ||
            'Could not reach Copilot. Check your connection and try again.';
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
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Copilot</h1>
          </div>
          <div className="dash-topbar__right">
            <Link to="/" className="dash-topbar__link">Home</Link>
            <SignOutButton>
              <button className="dash-topbar__signout" type="button">Sign out</button>
            </SignOutButton>
          </div>
        </header>

        <div className="dash-content copilot-page">
          <Card surface="navy-secondary" className="copilot-panel">
            <div className="copilot-panel__header">
              <h2 className="copilot-panel__title">Procurement assistant</h2>
              <p className="copilot-panel__subtitle">
                Answers are grounded in your current vendors, alerts, orders, and budgets.
              </p>
            </div>

            <div className="copilot-messages" aria-live="polite" aria-busy={loading}>
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

            <form className="copilot-input-row" onSubmit={handleSend}>
              <TextInput
                label="Ask Copilot"
                placeholder="e.g. Which sites are low on cement?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                error={inputError}
                className="copilot-input-row__field"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !input.trim()}
                className="copilot-input-row__send"
              >
                {loading ? 'Sending…' : 'Send'}
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default CopilotPage;
