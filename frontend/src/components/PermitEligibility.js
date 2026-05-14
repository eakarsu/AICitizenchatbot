import React, { useState } from 'react';

const API_BASE = 'http://localhost:3001';

function PermitEligibility() {
  const [permitType, setPermitType] = useState('');
  const [profileText, setProfileText] = useState('{\n  "name": "Jane Doe",\n  "is_resident": true,\n  "documents_supplied": ["ID", "Proof of address"]\n}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const submit = async (e) => {
    e.preventDefault();
    if (!permitType.trim()) return;
    let citizen_profile;
    try {
      citizen_profile = JSON.parse(profileText);
    } catch (err) {
      setError('Citizen profile must be valid JSON.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/ai/permit-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ permit_type: permitType, citizen_profile }),
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>{'✅'} Permit Eligibility</h1>
        <p>Enter a citizen profile and a permit type to receive eligibility, missing documents, and next steps.</p>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Permit Type</label>
        <input
          type="text"
          value={permitType}
          onChange={(e) => setPermitType(e.target.value)}
          placeholder="e.g., Building Permit / Business License / Garage Sale Permit"
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12 }}
          maxLength={200}
          required
        />

        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Citizen Profile (JSON)</label>
        <textarea
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
          rows={8}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', fontFamily: 'monospace', fontSize: 13 }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={loading || !permitType.trim()}>
            {loading ? 'Checking...' : 'Check Eligibility'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error" style={{ marginTop: 16, padding: 12, background: '#fee', color: '#c00', borderRadius: 8 }}>{error}</div>}

      {result && (
        <div className="card" style={{ marginTop: 24, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>{'📋'} Eligibility Result</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
            {result.eligible !== undefined && (
              <div style={{ padding: 12, background: result.eligible === true ? '#d1fae5' : (result.eligible === false ? '#fee2e2' : '#fef3c7'), borderRadius: 8 }}>
                <strong>Eligible:</strong>
                <div>{String(result.eligible)}</div>
              </div>
            )}
            {result.estimated_fee && <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8 }}><strong>Estimated Fee:</strong><div>{result.estimated_fee}</div></div>}
            {result.estimated_processing_time && <div style={{ padding: 12, background: '#dbeafe', borderRadius: 8 }}><strong>Processing Time:</strong><div>{result.estimated_processing_time}</div></div>}
          </div>

          {result.eligibility_reasons?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <strong>Reasons:</strong>
              <ul>{result.eligibility_reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}

          {result.missing_documents?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <strong>Missing Documents:</strong>
              <ul>{result.missing_documents.map((d, i) => <li key={i}>{d}</li>)}</ul>
            </div>
          )}

          {result.supplied_documents?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <strong>Supplied Documents:</strong>
              <ul>{result.supplied_documents.map((d, i) => <li key={i}>{d}</li>)}</ul>
            </div>
          )}

          {result.next_steps?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <strong>Next Steps:</strong>
              <ol>{result.next_steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </div>
          )}

          {result.notes && <div style={{ marginTop: 12, padding: 12, background: '#f0f4f8', borderRadius: 8 }}><em>{result.notes}</em></div>}
          {result.raw && <pre style={{ background: '#f8f8f8', padding: 12, borderRadius: 8, overflowX: 'auto' }}>{result.raw}</pre>}
        </div>
      )}
    </div>
  );
}

export default PermitEligibility;
