import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Megaphone, Trash2, Power, Plus, X } from 'lucide-react';
import { api } from '../lib/api';

export const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [form, setForm]                   = useState({ title: '', body: '' });
  const [saving, setSaving]               = useState(false);

  const fetch = async () => {
    try { setLoading(true); const res = await api.get('/announcement'); setAnnouncements(res.data.data ?? []); }
    catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/announcement', form);
      setShowModal(false);
      setForm({ title: '', body: '' });
      fetch();
    } catch { alert('Failed to create'); } finally { setSaving(false); }
  };

  const toggle = async (id: string, isActive: boolean) => {
    try { await api.patch(`/announcement/${id}/toggle`, { isActive: !isActive }); fetch(); }
    catch { /* silent */ }
  };

  const del = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try { await api.delete(`/announcement/${id}`); fetch(); }
    catch { /* silent */ }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Announcements</div>
          <div className="page-subtitle">App-wide banners shown to all users</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> New Announcement
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-row"><div className="spinner" /> Loading…</div>
        ) : announcements.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Title</th><th>Body</th><th>Status</th><th>Created</th><th></th></tr>
              </thead>
              <tbody>
                {announcements.map((ann) => (
                  <tr key={ann.id}>
                    <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{ann.title}</td>
                    <td className="text-muted" style={{ maxWidth: 300 }}>
                      <span className="truncate" style={{ display: 'block' }}>{ann.body}</span>
                    </td>
                    <td>
                      <span className={`badge ${ann.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {ann.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-muted">{new Date(ann.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-icon btn-sm" title={ann.isActive ? 'Deactivate' : 'Activate'} onClick={() => toggle(ann.id, ann.isActive)}>
                          <Power size={14} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del(ann.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Megaphone size={36} color="var(--text-3)" />
            <p>No announcements yet</p>
          </div>
        )}
      </div>

      {showModal && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">New Announcement</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={create}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Body *</label>
                  <textarea className="form-control" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
