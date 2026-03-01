import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api.js';

function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState(
    task
      ? { title: task.title, description: task.description || '', status: task.status, priority: task.priority }
      : { title: '', description: '', status: 'pending', priority: 'medium' }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (task) {
        await api.tasks.update(task._id, form);
      } else {
        await api.tasks.create(form);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{task ? 'Edit Task' : 'New Task'}</div>
        {error && <div className="alert alert-error">⚠ {error}</div>}
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            className="form-input"
            placeholder="Task title"
            value={form.title}
            onChange={set('title')}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            rows={3}
            style={{ resize: 'vertical' }}
            placeholder="Optional description"
            value={form.description}
            onChange={set('description')}
            disabled={loading}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={set('status')} disabled={loading}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-select" value={form.priority} onChange={set('priority')} disabled={loading}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <span className="spinner" /> : task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [modal, setModal] = useState(null);
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pagination.page, limit: 10 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      const data = await api.tasks.list(params);
      setTasks(data.data);
      setPagination((p) => ({
        ...p,
        totalPages: data.pagination.totalPages,
        total: data.pagination.total,
      }));
    } catch (err) {
      setError(err.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.tasks.delete(id);
      showSuccess('Task deleted.');
      fetchTasks();
    } catch (err) {
      setError(err.message || 'Failed to delete task.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSave = () => {
    const wasCreate = modal === 'create';
    setModal(null);
    showSuccess(wasCreate ? 'Task created!' : 'Task updated!');
    fetchTasks();
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">My <span>Tasks</span></div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>+ New Task</button>
      </div>

      {success && <div className="alert alert-success">✓ {success}</div>}
      {error && <div className="alert alert-error">⚠ {error}</div>}

      <div className="filters">
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          className="filter-select"
          value={filters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setFilters({ status: '', priority: '' });
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          Reset
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">
            <span className="spinner" />
            <p style={{ marginTop: 12 }}>Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>No tasks found. Create your first task!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                {user.role === 'admin' && <th>Owner</th>}
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{task.title}</div>
                    {task.description && (
                      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                        {task.description.slice(0, 60)}{task.description.length > 60 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${task.status}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  </td>
                  {user.role === 'admin' && (
                    <td style={{ color: 'var(--text-muted)' }}>{task.user?.name || '—'}</td>
                  )}
                  <td style={{ color: 'var(--text-muted)' }}>
                    {new Date(task.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-secondary btn-sm" onClick={() => setModal(task)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="flex gap-2" style={{ marginTop: 16, justifyContent: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >← Prev</button>
            <span style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >Next →</button>
          </div>
        )}
      </div>

      {modal && (
        <TaskModal
          task={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
