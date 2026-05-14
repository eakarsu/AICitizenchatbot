import React, { useState } from 'react';

const API_BASE = 'http://localhost:3001';

function AppointmentHelper() {
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

      <form onSubmit={submit} className="card" style={{ padding: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Service Type</label>
        <input
          type="text"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          placeholder="e.g., Marriage license, Building inspection, Property tax appeal"
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12 }}
          maxLength={200}
          required
        />
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Preferred Dates (comma-separated, optional)</label>
        <input
          type="text"
          value={datesInput}
          onChange={(e) => setDatesInput(e.target.value)}
          placeholder="e.g., 2025-05-10, 2025-05-15"
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !serviceType.trim()} style={{ marginTop: 16 }}>
          {loading ? 'Generating...' : 'Get Appointment Guide'}
        </button>
      </form>

      {error && <div className="alert alert-error" style={{ marginTop: 16, padding: 12, background: '#fee', color: '#c00', borderRadius: 8 }}>{error}</div>}

      {result && (
        <div className="card" style={{ marginTop: 24, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>{'\uD83D\uDCCB'} {result.service_name || serviceType}</h2>
          {result.department && <div style={{ marginBottom: 12 }}><strong>Department:</strong> {result.department}</div>}
          {result.document_checklist?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <strong>{'\u2705'} Document Checklist:</strong>
              <ul style={{ marginTop: 8 }}>
                {result.document_checklist.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}
          {result.appointment_tips?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <strong>{'\uD83D\uDCA1'} Tips:</strong>
              <ul style={{ marginTop: 8 }}>
                {result.appointment_tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            {result.estimated_duration_minutes && <div><strong>Duration:</strong> {result.estimated_duration_minutes} min</div>}
            {result.fee && <div><strong>Fee:</strong> {result.fee}</div>}
          </div>
          {result.scheduling_note && <div style={{ marginTop: 16, padding: 12, background: '#f0f4f8', borderRadius: 8 }}><strong>Scheduling:</strong> {result.scheduling_note}</div>}
          {result.availability_note && <div style={{ marginTop: 8, padding: 12, background: '#fef9c3', borderRadius: 8 }}><strong>Availability:</strong> {result.availability_note}</div>}
          {result.raw && <pre style={{ background: '#f8f8f8', padding: 12, borderRadius: 8, overflowX: 'auto' }}>{result.raw}</pre>}
        </div>
      )}
    </div>
  );
}

export default AppointmentHelper;
