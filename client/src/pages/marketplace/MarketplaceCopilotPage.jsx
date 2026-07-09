import { useState, useRef, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import TextInput from '../../components/TextInput';
import ChatBubble from '../../components/ChatBubble';
import '../../pages/CopilotPage.css';

function TypingIndicator() {
  return (
    <div className="copilot-typing" aria-label="Copilot is typing" role="status">
      <span className="copilot-typing__dot" />
      <span className="copilot-typing__dot" />
      <span className="copilot-typing__dot" />
    </div>
  );
}

function MarketplaceCopilotPage() {
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
          role: 'assistant',
          content: answer,
          isWarning: Boolean(data?.degraded),
          isError: Boolean(data?.degraded),
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
    <div className="copilot-page" style={{ padding: '2rem' }}>
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
            {loading ? 'Sending\u2026' : 'Send'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default MarketplaceCopilotPage;
