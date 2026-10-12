import AIReport from './AIReport';

import FullAIExamples, { useFullAIExamples } from "./FullAIExamples.jsx";
import React, { useState } from 'react';

const API_BASE = '';

function PermitEligibility() {
  const fullAIExamples = useFullAIExamples();

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

      <form onSubmit={submit} className="card" style={{ padding: 24 }} data-full-ai-workspace="PermitEligibility"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Permit Type</label>
        <input
          type="text"
          value={permitType}
          onChange={(e) => setPermitType(e.target.value)}
          placeholder="e.g., Building Permit / Business License / Garage Sale Permit"
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12 }}
          maxLength={200}
          required data-full-ai-field={fullAIExamples.bind({ current: permitType, change: (e) => setPermitType(e.target.value), label: "permitType", sample: ['Building permit', 'Business license', 'Garage sale permit'] }, "permit-type")}
        />

        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Citizen Profile (JSON)</label>
        <textarea
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
          rows={8}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', fontFamily: 'monospace', fontSize: 13 }} data-full-ai-field={fullAIExamples.bind({ current: profileText, change: (e) => setProfileText(e.target.value), label: "profileText", json: true, sample: [
            '{"name":"Sample resident","is_resident":true,"documents_supplied":[]}',
            '{"name":"Sample business owner","is_resident":true,"documents_supplied":[]}',
            '{"name":"Sample applicant","is_resident":false,"documents_supplied":[]}'
          ] }, "citizen-profile")}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={loading || !permitType.trim()}>
            {loading ? 'Checking...' : 'Check Eligibility'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error" style={{ marginTop: 16, padding: 12, background: '#fee', color: '#c00', borderRadius: 8 }}>{error}</div>}

      {result && <AIReport response={result} title="Eligibility result" />}
    </div>
  );
}

export default PermitEligibility;
