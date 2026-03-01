import { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import { api } from './utils/api.js';


const API_DOCS_URL = `${window.location.protocol}//${window.location.hostname}:5000/api-docs`;

function Sidebar({ user, page, setPage, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Prime<span>Trade_</span></div>
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${page === 'tasks' ? 'active' : ''}`}
          onClick={() => setPage('tasks')}
        >
          📋 My Tasks
        </button>
        {user.role === 'admin' && (
          <button
            className={`nav-item ${page === 'admin' ? 'active' : ''}`}
            onClick={() => setPage('admin')}
          >
            ⚡ Admin Panel
          </button>
        )}
        <a
          href={API_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="nav-item"
          style={{ textDecoration: 'none' }}
        >
          📖 API Docs
        </a>
      </nav>
      <div className="sidebar-footer">
        <div className="user-badge">
          <strong>{user.name}</strong>
          {user.email}
          <div style={{ marginTop: 6 }}>
            <span className={`role-tag ${user.role}`}>{user.role}</span>
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          style={{ marginTop: 12, width: '100%' }}
          onClick={onLogout}
        >
          → Logout
        </button>
      </div>
    </aside>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('tasks');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.auth.me()
        .then((data) => setUser(data.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPage('tasks');
  };

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuth={(u) => setUser(u)} />;
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} page={page} setPage={setPage} onLogout={handleLogout} />
      <main className="main-content">
        {page === 'tasks' && <TasksPage user={user} />}
        {page === 'admin' && user.role === 'admin' && <AdminPage />}
        {page === 'admin' && user.role !== 'admin' && (
          <div className="empty-state">
            <div className="icon">🚫</div>
            <p>Access denied. Admin only.</p>
          </div>
        )}
      </main>
    </div>
  );
}
