import AIReport from './AIReport';
import FullAIExamples, { useFullAIExamples } from './FullAIExamples.jsx';
import React, { useState } from 'react';

const API_BASE = '';

function PermitGuide() {
  const fullAIExamples = useFullAIExamples();
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

      <form onSubmit={submit} className="card" style={{ padding: 24 }} data-full-ai-workspace="PermitGuide"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Project Description</label>
        <textarea
          value={project}
          onChange={(e) => setProject(e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: project, change: (e) => setProject(e.target.value), label: "project", sample: ["I plan to replace my home deck with a larger deck and need to know permit and inspection steps.", "I am converting a garage into a home office; explain zoning and building permit requirements.", "I plan to open a small bakery in an existing storefront; identify likely licenses and inspections."] }, "project")}
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

      {result && <AIReport response={result} title="Permit guide" />}
    </div>
  );
}

export default PermitGuide;
