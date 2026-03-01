import { useState } from 'react';
import { api } from '../utils/api.js';

export default function AuthPage({ onAuth }) {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  
  const switchTab = (newTab) => {
    setTab(newTab);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');

    
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }
    if (tab === 'register' && !form.name) {
      setError('Name is required.');
      return;
    }
    if (tab === 'register' && form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      let data;
      if (tab === 'login') {
        data = await api.auth.login({ email: form.email, password: form.password });
      } else {
        data = await api.auth.register(form);
      }
      localStorage.setItem('token', data.token);
      onAuth(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">PrimeTrade_</div>
        <div className="auth-sub">Task Management API Demo</div>

        <div className="tab-bar" style={{ marginBottom: 24 }}>
          <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>Login</button>
          <button className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>Register</button>
        </div>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        {tab === 'register' && (
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              placeholder="John Doe"
              value={form.name}
              onChange={set('name')}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>

        {tab === 'register' && (
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={set('role')} disabled={loading}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        )}

        <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner" /> : tab === 'login' ? '→ Login' : '→ Create Account'}
        </button>
      </div>
    </div>
  );
}
