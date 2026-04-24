import React, { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:3001';

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const token = localStorage.getItem('token');

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  useEffect(() => {
    fetchHistory();
  }, []); // eslint-disable-line

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/chatbot/history`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const historicalMessages = [];
        data.data.reverse().forEach((item) => {
          if (item.message) {
            historicalMessages.push({
              type: 'user',
              text: item.message,
              timestamp: item.created_at,
            });
          }
          if (item.response) {
            historicalMessages.push({
              type: 'ai',
              text: item.response,
              timestamp: item.created_at,
            });
          }
        });
        if (historicalMessages.length > 0) {
          setMessages(historicalMessages);
        }
      }
    } catch {
      // History fetch failed silently
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { type: 'user', text: userMessage, timestamp: new Date().toISOString() }]);
    setLoading(true);

    try {
      const startTime = Date.now();
      const res = await fetch(`${API_BASE}/api/chatbot`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMessage }),
      });
      const elapsed = Date.now() - startTime;
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            type: 'ai',
            text: data.data.response || 'No response received.',
            metadata: data.data,
            responseTime: elapsed,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { type: 'ai', text: data.message || 'Sorry, something went wrong.', timestamp: new Date().toISOString() },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { type: 'ai', text: 'Unable to connect to the AI service. Please try again.', timestamp: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const toggleSource = (msgIdx) => {
    setExpandedSources((prev) => ({ ...prev, [msgIdx]: !prev[msgIdx] }));
  };

  const formatTokens = (usage) => {
    if (!usage) return null;
    const prompt = usage.prompt_tokens || usage.input_tokens || 0;
    const completion = usage.completion_tokens || usage.output_tokens || 0;
    const total = usage.total_tokens || prompt + completion;
    return { prompt, completion, total };
  };

  return (
    <div className="chatbot-page">
      <div className="chatbot-header">
        <span className="chatbot-title-icon">{'\uD83E\uDD16'}</span>
        <div>
          <h1>AI Assistant</h1>
          <p>Ask questions about county services, permits, events, and more</p>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && !loading && (
            <div className="chat-welcome">
              <span className="welcome-icon">{'\uD83D\uDCAC'}</span>
              <h3>Welcome to the County AI Assistant</h3>
              <p>Ask me anything about county services, permits, meetings, events, or ordinances.</p>
              <div className="suggested-questions">
                <button onClick={() => { setInput('What permits do I need for home renovation?'); }}>
                  What permits do I need for home renovation?
                </button>
                <button onClick={() => { setInput('When is the next board meeting?'); }}>
                  When is the next board meeting?
                </button>
                <button onClick={() => { setInput('How do I apply for a business license?'); }}>
                  How do I apply for a business license?
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.type}`}>
              <div className="message-bubble">
                {msg.type === 'ai' && <span className="ai-avatar">{'\uD83E\uDD16'}</span>}
                <div className="message-content">
                  <p className="message-text">{msg.text}</p>

                  {msg.type === 'ai' && msg.metadata && (
                    <div className="ai-metadata">
                      {/* Model Badge */}
                      {(msg.metadata.model || msg.metadata.raw_ai_response?.model) && (
                        <span className="meta-badge model-badge">
                          {'\uD83E\uDDE0'} {msg.metadata.model || msg.metadata.raw_ai_response?.model}
                        </span>
                      )}

                      {/* Finish Reason */}
                      {msg.metadata.raw_ai_response?.finish_reason && (
                        <span className="meta-badge finish-badge">
                          {'\u2705'} {msg.metadata.raw_ai_response.finish_reason}
                        </span>
                      )}

                      {/* Response Time */}
                      {msg.responseTime && (
                        <span className="meta-badge time-badge">
                          {'\u23F1\uFE0F'} {(msg.responseTime / 1000).toFixed(1)}s
                        </span>
                      )}

                      {/* Token Usage */}
                      {(msg.metadata.usage || msg.metadata.raw_ai_response?.usage) && (() => {
                        const tokens = formatTokens(msg.metadata.usage || msg.metadata.raw_ai_response?.usage);
                        if (!tokens) return null;
                        return (
                          <div className="token-usage">
                            <div className="token-header">
                              <span>{'\uD83D\uDCCA'} Token Usage</span>
                              <span className="token-total">{tokens.total} total</span>
                            </div>
                            <div className="token-bar-container">
                              <div className="token-bar">
                                <div
                                  className="token-bar-prompt"
                                  style={{ width: tokens.total > 0 ? `${(tokens.prompt / tokens.total) * 100}%` : '0%' }}
                                  title={`Prompt: ${tokens.prompt}`}
                                ></div>
                                <div
                                  className="token-bar-completion"
                                  style={{ width: tokens.total > 0 ? `${(tokens.completion / tokens.total) * 100}%` : '0%' }}
                                  title={`Completion: ${tokens.completion}`}
                                ></div>
                              </div>
                              <div className="token-labels">
                                <span className="token-prompt-label">Prompt: {tokens.prompt}</span>
                                <span className="token-completion-label">Response: {tokens.completion}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Sources */}
                      {msg.metadata.sources && msg.metadata.sources.length > 0 && (
                        <div className="sources-section">
                          <button
                            className="sources-toggle"
                            onClick={() => toggleSource(idx)}
                          >
                            {'\uD83D\uDCDA'} {msg.metadata.sources.length} Source{msg.metadata.sources.length > 1 ? 's' : ''} Referenced
                            <span className={`toggle-arrow ${expandedSources[idx] ? 'expanded' : ''}`}>{'\u25BC'}</span>
                          </button>
                          {expandedSources[idx] && (
                            <div className="sources-list">
                              {msg.metadata.sources.map((source, sIdx) => {
                                const isString = typeof source === 'string';
                                const parts = isString ? source.split(': ') : [];
                                const sourceType = parts[0] || '';
                                const sourceText = parts.slice(1).join(': ') || source;
                                return (
                                  <div key={sIdx} className="source-card">
                                    <div className="source-header">
                                      <span className="source-icon">{'\uD83D\uDCC4'}</span>
                                      <span className="source-title">{isString ? sourceType : (source.title || source.name || `Source ${sIdx + 1}`)}</span>
                                    </div>
                                    <p className="source-content">
                                      {isString ? sourceText.substring(0, 200) : (source.description || '').substring(0, 200)}
                                      {(isString ? sourceText : (source.description || '')).length > 200 ? '...' : ''}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {msg.timestamp && (
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                {msg.type === 'user' && <span className="user-avatar">{'\uD83D\uDC64'}</span>}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-message ai">
              <div className="message-bubble">
                <span className="ai-avatar">{'\uD83E\uDD16'}</span>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={sendMessage}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={loading}
          />
          <button type="submit" className="send-btn" disabled={loading || !input.trim()}>
            {loading ? '\u23F3' : '\u27A4'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chatbot;
