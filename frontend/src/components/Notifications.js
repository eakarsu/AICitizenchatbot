import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001';

function Notifications() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', user_id: '' });

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, { headers });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : (data.notifications || data.items || []));
      try {
        const c = await fetch(`${API_BASE}/api/notifications/unread-count`, { headers });
        const cd = await c.json();
        setUnread(cd.count || cd.unread || 0);
      } catch (_) {}
    } catch (e) { setError('Failed to load'); }
    setLoading(false);
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, { method: 'POST', headers, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Save failed');
      setShowForm(false);
      setForm({ title: '', message: '', type: 'info', user_id: '' });
      load();
    } catch (e) { setError(e.message); }
  };

  const markRead = async (id) => { try { await fetch(`${API_BASE}/api/notifications/${id}/read`, { method: 'PUT', headers }); load(); } catch (e) { setError(e.message); } };
  const markAllRead = async () => { try { await fetch(`${API_BASE}/api/notifications/mark-all-read`, { method: 'POST', headers }); load(); } catch (e) { setError(e.message); } };
  const remove = async (id) => { if (!window.confirm('Delete?')) return; try { await fetch(`${API_BASE}/api/notifications/${id}`, { method: 'DELETE', headers }); load(); } catch (e) { setError(e.message); } };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{'🔔'} Notifications</h1>
        <p>{unread} unread</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn" onClick={markAllRead}>Mark all read</button>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Cancel' : 'New Notification'}</button>
      </div>

      {error && <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <form onSubmit={create} className="card" style={{ padding: 24, maxWidth: 600, marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Title</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12 }} />
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Message</label>
          <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={3} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12 }} />
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Type</label>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12 }}>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>User ID (optional)</label>
          <input value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12 }} />
          <button type="submit" className="btn btn-primary">Create</button>
        </form>
      )}

      {loading ? <div>Loading...</div> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f9fafb' }}><th style={{ padding: 12, textAlign: 'left' }}>Title</th><th style={{ padding: 12, textAlign: 'left' }}>Message</th><th style={{ padding: 12, textAlign: 'left' }}>Type</th><th style={{ padding: 12, textAlign: 'left' }}>Status</th><th style={{ padding: 12 }}></th></tr></thead>
            <tbody>
              {items.map(n => (
                <tr key={n.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 12 }}><strong>{n.title}</strong></td>
                  <td style={{ padding: 12 }}>{n.message}</td>
                  <td style={{ padding: 12 }}>{n.type || 'info'}</td>
                  <td style={{ padding: 12 }}>{n.read || n.is_read ? 'read' : 'unread'}</td>
                  <td style={{ padding: 12 }}>
                    {!(n.read || n.is_read) && <button className="btn" onClick={() => markRead(n.id)}>{'✓'}</button>}{' '}
                    <button className="btn" onClick={() => remove(n.id)}>{'🗑'}</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No notifications</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Notifications;
