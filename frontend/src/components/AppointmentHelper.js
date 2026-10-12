import AIReport from './AIReport';
import FullAIExamples, { useFullAIExamples } from './FullAIExamples.jsx';
import React, { useState } from 'react';

const API_BASE = '';

function AppointmentHelper() {
  const fullAIExamples = useFullAIExamples();
  const [serviceType, setServiceType] = useState('');
  const [datesInput, setDatesInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const submit = async (e) => {
    e.preventDefault();
    if (!serviceType.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    const preferred_dates = datesInput
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    try {
      const res = await fetch(`${API_BASE}/api/chatbot/appointment-helper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ service_type: serviceType, preferred_dates }),
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
        <h1>{'\uD83D\uDCC5'} Appointment Helper</h1>
        <p>Get a personalized document checklist and scheduling guidance for any county service.</p>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: 24 }} data-full-ai-workspace="AppointmentHelper"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Service Type</label>
        <input
          type="text"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: serviceType, change: (e) => setServiceType(e.target.value), label: "serviceType", sample: ["Marriage license", "Building inspection", "Property tax appeal"] }, "serviceType")}
          placeholder="e.g., Marriage license, Building inspection, Property tax appeal"
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12 }}
          maxLength={200}
          required
        />
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Preferred Dates (comma-separated, optional)</label>
        <input
          type="text"
          value={datesInput}
          onChange={(e) => setDatesInput(e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: datesInput, change: (e) => setDatesInput(e.target.value), label: "datesInput", sample: ["2026-11-05, 2026-11-12", "2026-11-12, 2026-11-19", "2026-11-19, 2026-11-26"] }, "datesInput")}
          placeholder="e.g., 2025-05-10, 2025-05-15"
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !serviceType.trim()} style={{ marginTop: 16 }}>
          {loading ? 'Generating...' : 'Get Appointment Guide'}
        </button>
      </form>

      {error && <div className="alert alert-error" style={{ marginTop: 16, padding: 12, background: '#fee', color: '#c00', borderRadius: 8 }}>{error}</div>}

      {result && <AIReport response={result} title="Appointment guide" />}
    </div>
  );
}

export default AppointmentHelper;
