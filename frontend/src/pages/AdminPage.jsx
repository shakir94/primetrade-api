import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api.js';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('stats');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, usersData] = await Promise.all([
        api.admin.stats(),
        api.admin.users(),
      ]);
      setStats(statsData.data);
      setUsers(usersData.data);
    } catch (err) {
      setError(err.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteUser = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This will also delete all their tasks.`)) return;
    try {
      await api.admin.deleteUser(id);
      setSuccess(`User ${name} deleted.`);
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const getStatusColor = (status) => ({
    pending: 'var(--warning)',
    in_progress: 'var(--accent2)',
    completed: 'var(--success)',
  }[status] || 'var(--text-muted)');

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <p style={{ marginTop: 12 }}>Loading admin data...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Admin <span>Panel</span></div>
        <span className="role-tag admin">Admin Only</span>
      </div>

      {success && <div className="alert alert-success">✓ {success}</div>}
      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠ {error}</span>
          <button
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}
            onClick={() => setError('')}
          >✕</button>
        </div>
      )}

      <div className="tab-bar">
        <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          Statistics
        </button>
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          Users ({users.length})
        </button>
      </div>

     
      {tab === 'stats' && !stats && (
        <div className="empty-state">
          <div className="icon">📊</div>
          <p>Could not load statistics. <button className="btn btn-secondary btn-sm" onClick={fetchData} style={{ marginTop: 8 }}>Retry</button></p>
        </div>
      )}

      {tab === 'stats' && stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalTasks}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
            {stats.tasksByStatus.map((s) => (
              <div className="stat-card" key={s.status}>
                <div className="stat-value" style={{ color: getStatusColor(s.status) }}>{s.count}</div>
                <div className="stat-label">{s.status.replace('_', ' ')}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Tasks by Priority</div>
            </div>
            {stats.tasksByPriority.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}>
                <p>No tasks yet.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr><th>Priority</th><th>Count</th><th>Distribution</th></tr>
                </thead>
                <tbody>
                  {stats.tasksByPriority.map((p) => (
                    <tr key={p.priority}>
                      <td><span className={`badge badge-${p.priority}`}>{p.priority}</span></td>
                      <td>{p.count}</td>
                      <td>
                        <div style={{ background: 'var(--surface2)', borderRadius: 2, height: 6, width: 200 }}>
                          <div style={{
                            width: `${stats.totalTasks ? (p.count / stats.totalTasks * 100) : 0}%`,
                            height: '100%',
                            background: 'var(--accent)',
                            borderRadius: 2,
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'users' && (
        <div className="card">
          {users.length === 0 ? (
            <div className="empty-state">
              <div className="icon">👤</div>
              <p>No users found.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Action</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 700 }}>{u.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td><span className={`role-tag ${u.role}`}>{u.role}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteUser(u._id, u.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
