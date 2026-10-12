import AIReport from './AIReport';
import FullAIExamples, { useFullAIExamples } from './FullAIExamples.jsx';
import React, { useState } from 'react';

const API_BASE = '';

function ServiceFinder() {
  const fullAIExamples = useFullAIExamples();
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

      <form onSubmit={submit} className="card" style={{ padding: 24 }} data-full-ai-workspace="ServiceFinder"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>What do you need help with?</label>
        <textarea
          value={need}
          onChange={(e) => setNeed(e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: need, change: (e) => setNeed(e.target.value), label: "need", sample: ["I need to renew my vehicle registration and need to know the county office, required documents, and fees.", "My sidewalk is damaged near the public library. Which service handles repair requests and what information should I provide?", "I am opening a small restaurant and need a checklist of local licenses, inspections, and application steps."] }, "need")}
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

      {result && <AIReport response={result} title="Service recommendations" />}
    </div>
  );
}

export default ServiceFinder;
