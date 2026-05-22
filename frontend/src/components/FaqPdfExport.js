import React, { useState } from 'react';

const API_BASE = '';

// NON-VIZ #1 — Citizen Response Letter PDF generator
function FaqPdfExport() {
  const [form, setForm] = useState({
    citizen_name: 'Jane Citizen',
    case_id: '',
    subject: 'Pothole on Main Street',
    department: 'Public Works',
    officer: 'Citizen Services Officer',
    body: '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const download = async () => {
    setBusy(true); setMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/custom-views/response-letter-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `response-letter-${form.case_id || 'citizen'}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setMsg('PDF downloaded.');
    } catch (e) { setMsg('Error: ' + (e.message || e)); }
    setBusy(false);
  };

  const inputStyle = { width: '100%', padding: 8, marginBottom: 8, border: '1px solid #d1d5db', borderRadius: 4, boxSizing: 'border-box' };

  return (
    <div data-testid="response-letter-pdf"
      style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
      <h3 style={{ margin: '0 0 8px', color: '#111827' }}>Citizen Response Letter (PDF)</h3>
      <p style={{ color: '#6b7280', fontSize: 13, marginTop: 0 }}>
        Compose an official letter acknowledging a citizen inquiry and download as PDF.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input placeholder="Citizen Name" value={form.citizen_name}
          onChange={(e) => update('citizen_name', e.target.value)} style={inputStyle} />
        <input placeholder="Case ID (optional)" value={form.case_id}
          onChange={(e) => update('case_id', e.target.value)} style={inputStyle} />
        <input placeholder="Subject" value={form.subject}
          onChange={(e) => update('subject', e.target.value)} style={inputStyle} />
        <input placeholder="Department" value={form.department}
          onChange={(e) => update('department', e.target.value)} style={inputStyle} />
      </div>
      <input placeholder="Officer Name" value={form.officer}
        onChange={(e) => update('officer', e.target.value)} style={inputStyle} />
      <textarea placeholder="Letter body (leave blank to auto-generate)" rows={4}
        value={form.body} onChange={(e) => update('body', e.target.value)} style={inputStyle} />

      <button onClick={download} disabled={busy}
        style={{ padding: '8px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: busy ? 'not-allowed' : 'pointer' }}>
        {busy ? 'Generating…' : 'Download Response Letter (PDF)'}
      </button>
      {msg && <div style={{ marginTop: 8, fontSize: 13, color: msg.startsWith('Error') ? '#b91c1c' : '#059669' }}>{msg}</div>}
    </div>
  );
}

export default FaqPdfExport;
