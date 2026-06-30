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
import Card from '../components/Card';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import ChatBubble from '../components/ChatBubble';
import apiClient from '../api/client';
import './DashboardPage.css';
import './CopilotPage.css';

// ─── Sidebar nav icons (canonical set) ────────────────────────────────────────

function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" />
    </svg>
  );
}
function SitesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L3 7v11h4v-5h6v5h4V7L10 2z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
function VendorsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="6" r="3.5" fill="currentColor" />
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function ReportsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <line x1="6" y1="7"  x2="14" y2="7"  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="13" x2="11" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function AlertsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L2 16h16L10 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="currentColor" opacity="0.15" />
      <line x1="10" y1="8"  x2="10" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="0.9" fill="currentColor" />
    </svg>
  );
}
function ScannerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12h5M14.5 12v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function WeatherNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 14c0-1.1.9-2 2-2h6a2 2 0 110 4H7a2 2 0 01-2-2z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
function MapNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4l5 2 6-2 5 2v12l-5-2-6 2-5-2V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="7" y1="6" x2="7" y2="18" stroke="currentColor" strokeWidth="1.2" />
      <line x1="13" y1="2" x2="13" y2="16" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function LeafNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 4C16 4 14 12 8 14C5 15 3 16 3 16C3 16 4 12 7 9C10 6 16 4 16 4Z" fill="currentColor" opacity="0.6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M3 16C5 13 8 11 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function CopilotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2a6 6 0 00-6 6v2.5a2.5 2.5 0 002.5 2.5h1.2a1.3 1.3 0 001.3-1.3V9.5A1.3 1.3 0 007.7 8.2H6.5A4.5 4.5 0 0110 3.5 4.5 4.5 0 0113.5 8.2h-1.2a1.3 1.3 0 00-1.3 1.3v2.2a1.3 1.3 0 001.3 1.3H13.5A2.5 2.5 0 0016 10.5V8a6 6 0 00-6-6z" fill="currentColor" opacity="0.85"/>
      <rect x="7" y="14" width="6" height="3" rx="1.2" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}

const NAV_ITEMS = [
  { icon: <OverviewIcon />,    label: 'Overview',       path: '/dashboard' },
  { icon: <SitesIcon />,       label: 'Sites',          path: '/dashboard/sites' },
  { icon: <VendorsIcon />,     label: 'Vendors',        path: '/dashboard/vendors' },
  { icon: <ReportsIcon />,     label: 'Analytics',      path: '/dashboard/analytics' },
  { icon: <AlertsIcon />,      label: 'Alerts',         path: '/dashboard/alerts' },
  { icon: <ScannerIcon />,     label: 'Invoice OCR',    path: '/dashboard/invoice-scanner', dividerBefore: true },
  { icon: <WeatherNavIcon />,  label: 'Weather Alerts', path: '/dashboard/weather' },
  { icon: <MapNavIcon />,      label: 'Logistics',      path: '/dashboard/logistics' },
  { icon: <LeafNavIcon />,     label: 'Sustainability', path: '/dashboard/carbon' },
  { icon: <CopilotIcon />,     label: 'Copilot',        path: '/dashboard/copilot', dividerBefore: true },
];

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
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
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
