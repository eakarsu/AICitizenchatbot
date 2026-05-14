import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001';

function Exports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/exports/summary`, { headers });
      const data = await res.json();
      setSummary(data);
    } catch (e) { setError('Failed to load'); }
    setLoading(false);
  };

  const downloadCsv = (resource) => {
    fetch(`${API_BASE}/api/exports/${resource}.csv`, { headers })
      .then(r => r.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${resource}.csv`;
        document.body.appendChild(a); a.click(); a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(e => setError(e.message));
  };

  const csvs = ['services', 'permits', 'announcements', 'feedback'];

  return (
    <div className="page">
      <div className="page-header">
        <h1>{'📄'} Reports & Exports</h1>
        <p>Resource counts and CSV downloads</p>
      </div>

      {error && <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {loading ? <div>Loading...</div> : (
        <>
          {summary && (
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <h3>Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 12 }}>
                {Object.entries(summary).map(([k, v]) => (
                  <div key={k} style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{typeof v === 'number' ? v : '-'}</div>
                    <div style={{ color: '#6b7280', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 24 }}>
            <h3>CSV Exports</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {csvs.map(c => (
                <button key={c} className="btn" onClick={() => downloadCsv(c)}>{'⬇️'} {c}.csv</button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Exports;
