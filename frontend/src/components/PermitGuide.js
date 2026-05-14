import React, { useState } from 'react';

const API_BASE = 'http://localhost:3001';

function PermitGuide() {
  const [project, setProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const submit = async (e) => {
    e.preventDefault();
    if (!project.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/chatbot/permit-guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ project_description: project }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError(data.error || 'Failed');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{'\uD83D\uDCDD'} Permit Guide</h1>
        <p>Get AI-curated permit requirements, fees, and timelines for your project.</p>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Project Description</label>
        <textarea
          value={project}
          onChange={(e) => setProject(e.target.value)}
          placeholder="e.g., I want to add a 200 sq ft deck to the back of my single-family home"
          rows={5}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
          maxLength={1000}
          required
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <small>{project.length}/1000 characters</small>
          <button type="submit" className="btn btn-primary" disabled={loading || !project.trim()}>
            {loading ? 'Researching...' : 'Get Permit Guide'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error" style={{ marginTop: 16, padding: 12, background: '#fee', color: '#c00', borderRadius: 8 }}>{error}</div>}

      {result && (
        <div className="card" style={{ marginTop: 24, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>{'\uD83D\uDCCB'} Permit Requirements</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
            {result.total_estimated_fees && <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8 }}><strong>Total Fees:</strong><div>{result.total_estimated_fees}</div></div>}
            {result.total_estimated_timeline && <div style={{ padding: 12, background: '#dbeafe', borderRadius: 8 }}><strong>Timeline:</strong><div>{result.total_estimated_timeline}</div></div>}
            {result.contact_department && <div style={{ padding: 12, background: '#f3e8ff', borderRadius: 8 }}><strong>Contact:</strong><div>{result.contact_department}</div></div>}
          </div>

          {result.required_permits?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h3>Required Permits</h3>
              {result.required_permits.map((p, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h4 style={{ marginTop: 0 }}>{p.name}</h4>
                  {p.description && <p style={{ color: '#666', fontSize: 14 }}>{p.description}</p>}
                  <div style={{ display: 'flex', gap: 12, fontSize: 14, color: '#374151', marginBottom: 8 }}>
                    {p.fee && <span><strong>Fee:</strong> {p.fee}</span>}
                    {p.processing_time && <span><strong>Processing:</strong> {p.processing_time}</span>}
                  </div>
                  {p.application_steps?.length > 0 && (
                    <div>
                      <strong>Steps:</strong>
                      <ol style={{ marginTop: 4 }}>{p.application_steps.map((s, j) => <li key={j}>{s}</li>)}</ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.additional_requirements?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <strong>Additional Requirements:</strong>
              <ul>{result.additional_requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}

          {result.notes && <div style={{ marginTop: 12, padding: 12, background: '#f0f4f8', borderRadius: 8 }}><em>{result.notes}</em></div>}
          {result.raw && <pre style={{ background: '#f8f8f8', padding: 12, borderRadius: 8, overflowX: 'auto' }}>{result.raw}</pre>}
        </div>
      )}
    </div>
  );
}

export default PermitGuide;
