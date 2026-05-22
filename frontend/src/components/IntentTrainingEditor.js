import React, { useState, useEffect } from 'react';

const API_BASE = '';

// NON-VIZ #2 — Intent Routing Rules Editor (CRUD)
function IntentTrainingEditor() {
  const [rules, setRules] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ id: '', intent: '', keywords: '', department: '', priority: 3 });

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${API_BASE}/api/custom-views/routing-rules`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const j = await r.json();
      setRules((j.data && j.data.rules) || []);
      setDepartments((j.data && j.data.departments) || []);
    } catch (e) { setMsg('Load error: ' + (e.message || e)); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      const keywords = form.keywords.split(',').map((s) => s.trim()).filter(Boolean);
      const r = await fetch(`${API_BASE}/api/custom-views/routing-rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: form.id || undefined,
          intent: form.intent,
          keywords,
          department: form.department,
          priority: Number(form.priority) || 5,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || 'Save failed');
      setMsg('Saved: ' + j.data.rule.id);
      setForm({ id: '', intent: '', keywords: '', department: '', priority: 3 });
      load();
    } catch (e) { setMsg('Error: ' + (e.message || e)); }
  };

  const editRow = (rule) => {
    setForm({
      id: rule.id,
      intent: rule.intent,
      keywords: (rule.keywords || []).join(', '),
      department: rule.department,
      priority: rule.priority,
    });
  };

  const removeRow = async (id) => {
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${API_BASE}/api/custom-views/routing-rules/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error || 'Delete failed');
      setMsg('Removed ' + id);
      load();
    } catch (e) { setMsg('Error: ' + (e.message || e)); }
  };

  const inputStyle = { padding: 8, border: '1px solid #d1d5db', borderRadius: 4, boxSizing: 'border-box' };

  return (
    <div data-testid="routing-rules-editor"
      style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
      <h3 style={{ margin: '0 0 8px', color: '#111827' }}>Intent Routing Rules Editor</h3>
      <p style={{ color: '#6b7280', fontSize: 13, marginTop: 0 }}>
        Configure how citizen inquiries are routed to county departments.
      </p>

      {loading ? <div>Loading routing rules…</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 12 }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
              <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>Intent</th>
              <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>Keywords</th>
              <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>→ Department</th>
              <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>Pri</th>
              <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 8, fontFamily: 'monospace', color: '#374151' }}>{r.intent}</td>
                <td style={{ padding: 8, color: '#6b7280' }}>{(r.keywords || []).join(', ')}</td>
                <td style={{ padding: 8, fontWeight: 600, color: '#1e40af' }}>{r.department}</td>
                <td style={{ padding: 8, textAlign: 'center' }}>{r.priority}</td>
                <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                  <button onClick={() => editRow(r)}
                    style={{ fontSize: 11, padding: '4px 8px', background: '#eef2ff', color: '#1e40af', border: '1px solid #c7d2fe', borderRadius: 4, cursor: 'pointer', marginRight: 4 }}>
                    Edit
                  </button>
                  <button onClick={() => removeRow(r.id)}
                    style={{ fontSize: 11, padding: '4px 8px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={save} style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, display: 'grid', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input required placeholder="intent_id (e.g. report_pothole)" value={form.intent}
            onChange={(e) => setForm({ ...form, intent: e.target.value })} style={inputStyle} />
          <select required value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })} style={inputStyle}>
            <option value="">Select department…</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <input placeholder="keywords (comma-separated)" value={form.keywords}
          onChange={(e) => setForm({ ...form, keywords: e.target.value })} style={inputStyle} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
          <input type="number" min={1} max={9} placeholder="priority" value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })} style={inputStyle} />
          <button type="submit"
            style={{ padding: '8px 14px', background: '#059669', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Save Routing Rule
          </button>
        </div>
        {msg && <div style={{ fontSize: 13, color: msg.startsWith('Error') ? '#b91c1c' : '#059669' }}>{msg}</div>}
      </form>
    </div>
  );
}

export default IntentTrainingEditor;
