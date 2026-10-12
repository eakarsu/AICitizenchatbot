import AIReport from './AIReport';
import FullAIExamples, { useFullAIExamples } from './FullAIExamples.jsx';
import React, { useState } from 'react';

const API_BASE = '';

function ComplaintClassifier() {
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
      const res = await fetch(`${API_BASE}/api/chatbot/complaint-classifier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ complaint_text: text }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError(data.error || 'Classification failed');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const priorityColor = (p) => ({
    critical: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#16a34a',
  })[p?.toLowerCase()] || '#6b7280';

  return (
    <div className="page">
      <div className="page-header">
        <h1>{'\uD83D\uDCDD'} Complaint Classifier</h1>
        <p>Submit a complaint; AI categorizes it, sets priority, and assigns a case number.</p>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: 24 }} data-full-ai-workspace="ComplaintClassifier"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Describe your complaint</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: text, change: (e) => setText(e.target.value), label: "text", sample: ["The streetlight at the Oak Street bus stop has been out for three nights, making the evening commute unsafe.", "Trash pickup on Pine Avenue was missed twice this month. Please advise the responsible department.", "Water is pooling across the crosswalk by the elementary school after rain and needs urgent inspection."] }, "text")}
          placeholder="e.g., There's a large pothole on Maple Street near 5th Ave that has been getting worse for two weeks."
          rows={6}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
          maxLength={2000}
          required
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <small>{text.length}/2000 characters</small>
          <button type="submit" className="btn btn-primary" disabled={loading || !text.trim()}>
            {loading ? 'Classifying...' : 'Classify Complaint'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error" style={{ marginTop: 16, padding: 12, background: '#fee', color: '#c00', borderRadius: 8 }}>{error}</div>}

      {result && <AIReport response={result} title="Complaint classification" />}
    </div>
  );
}

export default ComplaintClassifier;
