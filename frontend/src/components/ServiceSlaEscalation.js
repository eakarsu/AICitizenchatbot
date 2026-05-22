import React, { useEffect, useState } from 'react';

export default function ServiceSlaEscalation() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/service-sla-escalation').then((res) => res.json()).then(setData).catch(() => setData(null));
  }, []);
  return (
    <div className="page">
      <h1>311 SLA Escalation Board</h1>
      <p>Identify citizen service requests nearing SLA breach and route department escalations.</p>
      <div className="stats-grid">
        {data && Object.entries(data.summary).map(([key, value]) => <div className="stat-card" key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{value}</strong></div>)}
      </div>
      <div className="card">
        {(data?.requests || []).map((item) => <div key={item.ticket} style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}><strong>{item.ticket}</strong><div>{item.service} - {item.ward} - {item.hours_left}h left - {item.action}</div></div>)}
      </div>
    </div>
  );
}
