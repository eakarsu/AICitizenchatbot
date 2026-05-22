import React, { useState, useEffect } from 'react';

const API_BASE = '';

// VIZ #1 — Query Topic Distribution (bar chart)
function TopicHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/custom-views/topic-distribution`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((j) => { setData(j.data || j); setLoading(false); })
      .catch((e) => { setError(String(e.message || e)); setLoading(false); });
  }, []);

  if (loading) return <div style={{ padding: 12 }}>Loading topic distribution…</div>;
  if (error) return <div style={{ padding: 12, color: '#b91c1c' }}>Error: {error}</div>;
  if (!data) return null;

  const { distribution, total_queries, top_topic } = data;
  const max = Math.max(...distribution.map((d) => d.count));
  const palette = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

  return (
    <div data-testid="topic-distribution"
      style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: '#111827' }}>Query Topic Distribution</h3>
        <span style={{ color: '#6b7280', fontSize: 13 }}>
          Total: <strong>{total_queries}</strong> · Top: <strong>{top_topic}</strong>
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {distribution.map((d, i) => (
          <div key={d.topic} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 110, fontSize: 13, color: '#374151', fontWeight: 600 }}>{d.topic}</div>
            <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 22, position: 'relative', overflow: 'hidden' }}>
              <div style={{
                width: `${(d.count / max) * 100}%`,
                background: palette[i % palette.length],
                height: '100%',
                transition: 'width .3s',
              }} />
              <span style={{
                position: 'absolute', right: 8, top: 2,
                fontSize: 12, color: '#111827', fontWeight: 600,
              }}>{d.count.toLocaleString()} ({d.percent}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TopicHeatmap;
