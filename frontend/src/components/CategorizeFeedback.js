import AIReport from './AIReport';

import FullAIExamples, { useFullAIExamples } from "./FullAIExamples.jsx";
import React, { useState } from 'react';

const API_BASE = '';

function CategorizeFeedback() {
  const fullAIExamples = useFullAIExamples();

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

      <form onSubmit={submit} className="card" style={{ padding: 24 }} data-full-ai-workspace="CategorizeFeedback"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Citizen Feedback</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste citizen feedback here..."
          rows={6}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
          maxLength={4000}
          required data-full-ai-field={fullAIExamples.bind({ current: text, change: (e) => setText(e.target.value), label: "text", sample: [
            'The streetlight beside the Oak Street bus stop has been out for three nights. Please arrange an inspection.',
            'Trash collection was missed on Pine Avenue twice this month. Residents need the revised pickup date.',
            'Water is pooling across the school crosswalk after rain. Please route this for urgent review.'
          ] }, "feedback-text")}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <small>{text.length}/4000 characters</small>
          <button type="submit" className="btn btn-primary" disabled={loading || !text.trim()}>
            {loading ? 'Categorising...' : 'Categorize'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error" style={{ marginTop: 16, padding: 12, background: '#fee', color: '#c00', borderRadius: 8 }}>{error}</div>}

      {result && <AIReport response={result} title="Classification" />}
    </div>
  );
}

export default CategorizeFeedback;
