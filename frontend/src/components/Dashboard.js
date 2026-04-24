import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import features from '../config/features';

const API_BASE = 'http://localhost:3001';

function Dashboard() {
  const [counts, setCounts] = useState({});
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchCounts = async () => {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const results = {};
      await Promise.allSettled(
        features.map(async (feature) => {
          try {
            const res = await fetch(`${API_BASE}${feature.endpoint}`, { headers });
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
              results[feature.key] = data.data.length;
            } else {
              results[feature.key] = 0;
            }
          } catch {
            results[feature.key] = 0;
          }
        })
      );
      setCounts(results);
    };

    fetchCounts();
  }, [token]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user.name || 'Admin'}</h1>
        <p>County Government AI-Powered Portal &mdash; Manage services, documents, and engage with citizens</p>
      </div>

      <div className="dashboard-grid">
        {features.map((feature) => (
          <div
            key={feature.key}
            className="dashboard-card"
            style={{ borderTopColor: feature.color }}
            onClick={() => navigate(`/${feature.key}`)}
          >
            <div className="card-icon" style={{ backgroundColor: feature.color + '15', color: feature.color }}>
              {feature.icon}
            </div>
            <div className="card-body">
              <h3>{feature.name}</h3>
              <p>{feature.description}</p>
            </div>
            <div className="card-footer">
              <span className="card-count" style={{ color: feature.color }}>
                {counts[feature.key] !== undefined ? counts[feature.key] : '\u2014'}
              </span>
              <span className="card-count-label">items</span>
            </div>
          </div>
        ))}

        <div
          className="dashboard-card chatbot-card"
          style={{ borderTopColor: '#4299e1' }}
          onClick={() => navigate('/chatbot')}
        >
          <div className="card-icon" style={{ backgroundColor: '#4299e115', color: '#4299e1' }}>
            {'\uD83E\uDD16'}
          </div>
          <div className="card-body">
            <h3>AI Chatbot</h3>
            <p>Ask questions about county services, permits, events, and more</p>
          </div>
          <div className="card-footer">
            <span className="card-count" style={{ color: '#4299e1' }}>AI</span>
            <span className="card-count-label">powered</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
