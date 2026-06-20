import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { FolderTree, Plus, Edit2, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';

interface Category { id: string; name: string; slug: string; description?: string; }

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [name, setName]             = useState('');
  const [description, setDesc]      = useState('');
  const [saving, setSaving]         = useState(false);

  const fetch = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/categories');
      setCategories(res.data.data ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setEditingId(null); setName(''); setDesc(''); setShowForm(true); };
  const openEdit = (c: Category) => { setEditingId(c.id); setName(c.name); setDesc(c.description ?? ''); setShowForm(true); };
  const closeForm = () => { setShowForm(false); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (editingId) {
        await api.patch(`/products/categories/${editingId}`, { name, description, slug });
      } else {
        await api.post('/products/categories', { name, description, slug });
      }
      closeForm();
      fetch();
    } catch { alert('Failed to save category'); } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try { await api.delete(`/products/categories/${id}`); fetch(); }
    catch { alert('Failed to delete'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Categories</div>
          <div className="page-subtitle">Organise your product taxonomy</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={14} /> Add Category
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-row"><div className="spinner" /> Loading…</div>
        ) : categories.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Slug</th><th>Description</th><th></th></tr></thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td className="mono text-muted">{c.slug}</td>
                    <td className="text-muted">{c.description ?? '—'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del(c.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><FolderTree size={36} color="var(--text-3)" /><p>No categories yet</p></div>
        )}
      </div>

      {/* Modal form */}
      {showForm && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editingId ? 'Edit Category' : 'New Category'}</div>
              <button className="btn btn-ghost btn-icon" onClick={closeForm}><X size={16} /></button>
            </div>
            <form onSubmit={submit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={description} onChange={(e) => setDesc(e.target.value)} rows={3} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
