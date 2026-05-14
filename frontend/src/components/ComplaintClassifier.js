import React, { useState } from 'react';

const API_BASE = 'http://localhost:3001';

function ComplaintClassifier() {
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

      <form onSubmit={submit} className="card" style={{ padding: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Describe your complaint</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
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

      {result && (
        <div className="card" style={{ marginTop: 24, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>{'\uD83D\uDCCB'} Classification</h2>
          {result.case_reference && (
            <div style={{ background: '#dbeafe', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <strong>Case Reference:</strong> <span style={{ fontFamily: 'monospace' }}>{result.case_reference}</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
            {result.category && <div><strong>Category:</strong><div style={{ marginTop: 4, padding: '4px 12px', background: '#f3f4f6', borderRadius: 8, display: 'inline-block' }}>{result.category}</div></div>}
            {result.priority && (
              <div><strong>Priority:</strong>
                <div style={{ marginTop: 4, padding: '4px 12px', background: priorityColor(result.priority), color: '#fff', borderRadius: 8, display: 'inline-block', textTransform: 'uppercase' }}>{result.priority}</div>
              </div>
            )}
            {result.department && <div><strong>Department:</strong><div style={{ marginTop: 4 }}>{result.department}</div></div>}
            {result.estimated_resolution_days != null && <div><strong>Est. resolution:</strong><div style={{ marginTop: 4 }}>{result.estimated_resolution_days} days</div></div>}
          </div>
          {result.summary && <div style={{ marginBottom: 12 }}><strong>Summary:</strong> {result.summary}</div>}
          {result.notes && <div style={{ marginTop: 12, padding: 12, background: '#f0f4f8', borderRadius: 8 }}><em>{result.notes}</em></div>}
          {result.raw && <pre style={{ background: '#f8f8f8', padding: 12, borderRadius: 8, overflowX: 'auto' }}>{result.raw}</pre>}
        </div>
      )}
    </div>
  );
}

export default ComplaintClassifier;
