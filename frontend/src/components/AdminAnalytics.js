import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001';

function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [satisfaction, setSatisfaction] = useState(null);
  const [unanswered, setUnanswered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [s, sat, u] = await Promise.all([
        fetch(`${API_BASE}/api/admin/stats`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/analytics/satisfaction`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/admin/unanswered?limit=50`, { headers }).then((r) => r.json()),
      ]);
      if (s.success) setStats(s.data);
      if (sat.success) setSatisfaction(sat.data);
      if (u.success) setUnanswered(u.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const markReviewed = async (id) => {
    try {
      await fetch(`${API_BASE}/api/admin/unanswered/${id}/reviewed`, { method: 'PATCH', headers });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="page"><p>Loading analytics...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{'\uD83D\uDCCA'} Admin Analytics</h1>
        <p>Chatbot usage, satisfaction, and unanswered question tracking.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['overview', 'satisfaction', 'unanswered'].map((t) => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: '#666' }}>Total Chats</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total_chats}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: '#666' }}>Avg Session Length</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.avg_session_length}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: '#666' }}>Unanswered Rate</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: stats.unanswered_rate_percent > 20 ? '#dc2626' : '#16a34a' }}>{stats.unanswered_rate_percent}%</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: '#666' }}>Unanswered Total</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.unanswered_count}</div>
            </div>
          </div>

          {stats.top_10_questions?.length > 0 && (
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h3>Top 10 Questions</h3>
              <ol>
                {stats.top_10_questions.map((q, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    <span>{q.message?.slice(0, 200)}</span>
                    <span style={{ marginLeft: 8, padding: '2px 8px', background: '#f3f4f6', borderRadius: 10, fontSize: 12 }}>{q.count}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {stats.chats_last_7_days?.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <h3>Chats Last 7 Days</h3>
              <table style={{ width: '100%' }}>
                <thead><tr><th style={{ textAlign: 'left' }}>Date</th><th style={{ textAlign: 'right' }}>Count</th></tr></thead>
                <tbody>
                  {stats.chats_last_7_days.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: 8 }}>{d.date?.split('T')[0]}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'satisfaction' && satisfaction && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: '#666' }}>Avg Rating</div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{'\u2B50'} {satisfaction.avg_rating}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: '#666' }}>Total Feedback</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{satisfaction.total_feedback}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: '#666' }}>Resolution Rate</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>{satisfaction.resolution_rate_percent}%</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: '#666' }}>Negative</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>{satisfaction.negative_count}</div>
            </div>
          </div>

          {satisfaction.rating_distribution?.length > 0 && (
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h3>Rating Distribution</h3>
              {satisfaction.rating_distribution.map((d) => (
                <div key={d.rating} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 60 }}>{d.rating} {'\u2B50'}</span>
                  <div style={{ flex: 1, height: 16, background: '#f3f4f6', borderRadius: 4 }}>
                    <div style={{
                      height: '100%',
                      width: `${(parseInt(d.count) / Math.max(...satisfaction.rating_distribution.map((x) => parseInt(x.count)))) * 100}%`,
                      background: '#3b82f6',
                      borderRadius: 4,
                    }} />
                  </div>
                  <span style={{ width: 40, textAlign: 'right' }}>{d.count}</span>
                </div>
              ))}
            </div>
          )}

          {satisfaction.recent_comments?.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <h3>Recent Comments</h3>
              {satisfaction.recent_comments.map((c, i) => (
                <div key={i} style={{ borderBottom: '1px solid #e5e7eb', padding: 12 }}>
                  <div><strong>{'\u2B50'} {c.rating}</strong> <small style={{ color: '#666' }}>· {new Date(c.created_at).toLocaleString()}</small></div>
                  <p style={{ marginTop: 4, marginBottom: 0 }}>{c.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'unanswered' && (
        <div className="card" style={{ padding: 24 }}>
          <h3>Unanswered Questions ({unanswered.length})</h3>
          {unanswered.length === 0 ? <p>{'\u2705'} No unanswered questions!</p> : (
            <div>
              {unanswered.map((q) => (
                <div key={q.id} style={{
                  border: q.reviewed ? '1px solid #d1fae5' : '1px solid #fee2e2',
                  background: q.reviewed ? '#f0fdf4' : '#fef2f2',
                  borderRadius: 8, padding: 16, marginBottom: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Question:</strong>
                    <small>{new Date(q.created_at).toLocaleString()}</small>
                  </div>
                  <p style={{ marginTop: 4, marginBottom: 8 }}>{q.question}</p>
                  {q.bot_response && <div style={{ background: '#fff', padding: 8, borderRadius: 4, fontSize: 13 }}><strong>Bot Response:</strong> {q.bot_response}</div>}
                  {!q.reviewed && (
                    <button className="btn btn-sm btn-primary" onClick={() => markReviewed(q.id)} style={{ marginTop: 8 }}>
                      Mark as Reviewed
                    </button>
                  )}
                  {q.reviewed && <span style={{ color: '#16a34a', fontSize: 12 }}>{'\u2705'} Reviewed</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminAnalytics;
