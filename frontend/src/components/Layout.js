import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import features from '../config/features';

function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className={`layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">{'\uD83C\uDFDB\uFE0F'}</span>
          {!sidebarCollapsed && <span className="sidebar-title">County Gov</span>}
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '\u25B6' : '\u25C0'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{'\uD83C\uDFE0'}</span>
            {!sidebarCollapsed && <span className="nav-label">Dashboard</span>}
          </NavLink>

          {features.map((feature) => (
            <NavLink
              key={feature.key}
              to={`/${feature.key}`}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{feature.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{feature.name}</span>}
            </NavLink>
          ))}

          <NavLink to="/chatbot" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{'\uD83E\uDD16'}</span>
            {!sidebarCollapsed && <span className="nav-label">AI Chatbot</span>}
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{(user.name || 'U').charAt(0).toUpperCase()}</div>
            {!sidebarCollapsed && (
              <div className="user-details">
                <span className="user-name">{user.name || 'User'}</span>
                <span className="user-role">{user.role || 'admin'}</span>
              </div>
            )}
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Sign Out">
            {sidebarCollapsed ? '\uD83D\uDEAA' : 'Sign Out'}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
