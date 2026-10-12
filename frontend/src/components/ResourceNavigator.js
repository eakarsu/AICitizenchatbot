import AIReport from './AIReport';
import FullAIExamples, { useFullAIExamples } from './FullAIExamples.jsx';
import React, { useState } from 'react';

const API_BASE = '';

function ResourceNavigator() {
  const fullAIExamples = useFullAIExamples();
  const [needs, setNeeds] = useState({
    financial: false,
    housing: false,
    food: false,
    health: false,
    childcare: false,
    employment: false,
    transportation: false,
    legal: false,
  });
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const token = localStorage.getItem('token');

  const toggleNeed = (key) => setNeeds((n) => ({ ...n, [key]: !n[key] }));

  const submit = async (e) => {
    e.preventDefault();
    const selected = Object.entries(needs).filter(([, v]) => v).map(([k]) => k);
    if (selected.length === 0 && !details.trim()) return;
    const message = `I need help finding resources for: ${selected.join(', ')}. ${details}`;
    setLoading(true);
    setResponse('');
    try {
      const res = await fetch(`${API_BASE}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setResponse(data.data?.response || data.response || data.error || 'No response.');
    } catch (err) {
      setResponse('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{'\uD83C\uDF1F'} Resident Resource Navigator</h1>
        <p>Get connected to financial, housing, health, and other community resources matching your needs.</p>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: 24 }} data-full-ai-workspace="ResourceNavigator"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
        <h3>What do you need help with?</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          {Object.entries(needs).map(([key, val]) => (
            <label key={key} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: 12,
              border: val ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: 8, cursor: 'pointer', textTransform: 'capitalize',
              background: val ? '#dbeafe' : '#fff',
            }}>
              <input type="checkbox" checked={val} onChange={() => toggleNeed(key)} data-full-ai-field={fullAIExamples.bind({ current: val, change: () => toggleNeed(key), label: key, sample: {
                financial: [false, true, false], housing: [false, true, false], food: [true, false, false],
                health: [true, false, false], childcare: [false, false, true], employment: [false, false, true],
                transportation: [true, false, false], legal: [false, true, false]
              }[key] }, `need-${key}`)} />
              {key}
            </label>
          ))}
        </div>

        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Additional Details (optional)</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: details, change: (e) => setDetails(e.target.value), label: "details", sample: ["I need help finding food assistance and reliable transportation to a local clinic.", "My rent is overdue and I need housing and legal assistance options.", "I am looking for childcare and employment support while returning to work."] }, "details")}
          placeholder="e.g., I'm a senior living alone and need help with meal delivery and transportation to medical appointments."
          rows={4}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
          maxLength={1000}
        />

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 16 }}>
          {loading ? 'Finding resources...' : 'Find Resources'}
        </button>
      </form>

      {response && <AIReport response={response} title="Recommended resources" />}
    </div>
  );
}

export default ResourceNavigator;
