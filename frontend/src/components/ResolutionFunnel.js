import React, { useState, useEffect } from 'react';

const API_BASE = '';

// VIZ #2 — Department Routing Heatmap (topic x department)
function ResolutionFunnel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/custom-views/department-heatmap`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((j) => { setData(j.data || j); setLoading(false); })
      .catch((e) => { setError(String(e.message || e)); setLoading(false); });
  }, []);

  if (loading) return <div style={{ padding: 12 }}>Loading department routing heatmap…</div>;
  if (error) return <div style={{ padding: 12, color: '#b91c1c' }}>Error: {error}</div>;
  if (!data) return null;

  const { topics, departments, matrix, total_routings } = data;
  const max = Math.max(...matrix.flat());
  const color = (v) => {
    const t = max ? v / max : 0;
    const r = Math.round(220 - t * 180);
    const g = Math.round(240 - t * 180);
    const b = Math.round(255 - t * 80);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div data-testid="department-heatmap"
      style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <h3 style={{ margin: 0, color: '#111827' }}>Department Routing Heatmap</h3>
        <span style={{ color: '#6b7280', fontSize: 13 }}>
          Total routings: <strong>{total_routings}</strong>
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 8px', color: '#374151' }}>Topic \\ Dept</th>
              {departments.map((d) => (
                <th key={d} style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 500, minWidth: 60 }}>
                  {d.length > 10 ? d.slice(0, 10) + '…' : d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topics.map((t, ti) => (
              <tr key={t}>
                <td style={{ padding: '4px 8px', fontWeight: 600, color: '#111827' }}>{t}</td>
                {matrix[ti].map((v, di) => (
                  <td key={di} title={`${t} → ${departments[di]} = ${v}`}
                    style={{
                      background: color(v),
                      color: '#111827',
                      textAlign: 'center',
                      width: 60, height: 28, padding: 0,
                      border: '1px solid #fff', fontSize: 11, fontWeight: 600,
                    }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResolutionFunnel;
