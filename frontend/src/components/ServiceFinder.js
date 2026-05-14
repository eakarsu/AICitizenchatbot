import React, { useState } from 'react';

const API_BASE = 'http://localhost:3001';

function ServiceFinder() {
  const [need, setNeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const submit = async (e) => {
    e.preventDefault();
    if (!need.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/chatbot/service-finder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ citizen_description_of_need: need }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError(data.error || 'Service finder failed');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{'\uD83D\uDD0E'} Service Finder</h1>
        <p>Describe what you need; AI will route you to the correct department and steps.</p>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>What do you need help with?</label>
        <textarea
          value={need}
          onChange={(e) => setNeed(e.target.value)}
          placeholder="e.g., I need to renew my dog license and update my address"
          rows={4}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
          maxLength={1000}
          required
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <small>{need.length}/1000 characters</small>
          <button type="submit" className="btn btn-primary" disabled={loading || !need.trim()}>
            {loading ? 'Searching...' : 'Find Service'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error" style={{ marginTop: 16, padding: 12, background: '#fee', color: '#c00', borderRadius: 8 }}>{error}</div>}

      {result && (
        <div className="card" style={{ marginTop: 24, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>{'\u2705'} Recommendation</h2>
          {result.department && <div style={{ marginBottom: 12 }}><strong>Department:</strong> {result.department}</div>}
          {result.service && <div style={{ marginBottom: 12 }}><strong>Service:</strong> {result.service}</div>}
          {result.contact_info && (
            <div style={{ marginBottom: 12 }}>
              <strong>Contact:</strong>
              <div style={{ marginLeft: 16 }}>
                {result.contact_info.phone && <div>Phone: {result.contact_info.phone}</div>}
                {result.contact_info.email && <div>Email: {result.contact_info.email}</div>}
                {result.contact_info.website && <div>Web: <a href={result.contact_info.website} target="_blank" rel="noreferrer">{result.contact_info.website}</a></div>}
              </div>
            </div>
          )}
          {result.steps?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <strong>Steps:</strong>
              <ol style={{ marginTop: 8 }}>{result.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </div>
          )}
          {result.estimated_time && <div><strong>Estimated time:</strong> {result.estimated_time}</div>}
          {result.fees && <div><strong>Fees:</strong> {result.fees}</div>}
          {result.notes && <div style={{ marginTop: 12, padding: 12, background: '#f0f4f8', borderRadius: 8 }}><em>{result.notes}</em></div>}
          {result.raw && <pre style={{ background: '#f8f8f8', padding: 12, borderRadius: 8, overflowX: 'auto' }}>{result.raw}</pre>}
        </div>
      )}
    </div>
  );
}

export default ServiceFinder;
