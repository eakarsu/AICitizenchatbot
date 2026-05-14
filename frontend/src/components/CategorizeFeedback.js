import React, { useState } from 'react';

const API_BASE = 'http://localhost:3001';

function CategorizeFeedback() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/ai/categorize-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ feedback_text: text }),
      });
      const data = await res.json();
      if (res.status === 503) {
        setError(data.error || 'AI service is not configured (no OpenRouter API key). Please set OPENROUTER_API_KEY on the server.');
      } else if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || (data.errors && data.errors[0]?.msg) || 'Failed');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const sentimentColor = (s) => ({
    positive: '#d1fae5', negative: '#fee2e2', neutral: '#e5e7eb', mixed: '#fef3c7'
  }[String(s || '').toLowerCase()] || '#f3f4f6');

  const urgencyColor = (u) => ({
    low: '#d1fae5', medium: '#fef3c7', high: '#fed7aa', critical: '#fee2e2'
  }[String(u || '').toLowerCase()] || '#f3f4f6');

  return (
    <div className="page">
      <div className="page-header">
        <h1>{'🏷️'} Categorize Feedback</h1>
        <p>Auto-tag citizen feedback for routing — primary topic, sentiment, urgency, and recommended department.</p>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Citizen Feedback</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste citizen feedback here..."
          rows={6}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
          maxLength={4000}
          required
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <small>{text.length}/4000 characters</small>
          <button type="submit" className="btn btn-primary" disabled={loading || !text.trim()}>
            {loading ? 'Categorising...' : 'Categorize'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error" style={{ marginTop: 16, padding: 12, background: '#fee', color: '#c00', borderRadius: 8 }}>{error}</div>}

      {result && (
        <div className="card" style={{ marginTop: 24, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>{'📌'} Classification</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
            {result.primary_topic && <div style={{ padding: 12, background: '#dbeafe', borderRadius: 8 }}><strong>Topic:</strong><div>{result.primary_topic}</div></div>}
            {result.sentiment && <div style={{ padding: 12, background: sentimentColor(result.sentiment), borderRadius: 8 }}><strong>Sentiment:</strong><div>{result.sentiment}</div></div>}
            {result.urgency && <div style={{ padding: 12, background: urgencyColor(result.urgency), borderRadius: 8 }}><strong>Urgency:</strong><div>{result.urgency}</div></div>}
            {result.recommended_department && <div style={{ padding: 12, background: '#f3e8ff', borderRadius: 8 }}><strong>Department:</strong><div>{result.recommended_department}</div></div>}
            {result.recommended_action && <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8 }}><strong>Action:</strong><div>{result.recommended_action}</div></div>}
          </div>

          {result.tags?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <strong>Tags:</strong>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {result.tags.map((t, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: 999, background: '#e5e7eb', fontSize: 13 }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {result.summary && <div style={{ marginBottom: 12 }}><strong>Summary:</strong> {result.summary}</div>}
          {result.notes && <div style={{ marginTop: 12, padding: 12, background: '#f0f4f8', borderRadius: 8 }}><em>{result.notes}</em></div>}
          {result.raw && <pre style={{ background: '#f8f8f8', padding: 12, borderRadius: 8, overflowX: 'auto' }}>{result.raw}</pre>}
        </div>
      )}
    </div>
  );
}

export default CategorizeFeedback;
