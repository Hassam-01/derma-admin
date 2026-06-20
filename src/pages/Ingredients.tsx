import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { FlaskConical, Check, X, Plus } from 'lucide-react';
import { api } from '../lib/api';

export const Ingredients: React.FC = () => {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState({
    name: '', aliases: '', isComedogenic: false, notRecommendedFor: '', benefits: '',
  });

  const fetch = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/ingredients', { params });
      setIngredients(res.data.data ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [statusFilter]);

  const approve = async (id: string) => {
    try {
      await api.patch(`/ingredients/${id}/approve`, {
        aliases: [], isComedogenic: false, notRecommendedFor: [], benefits: [],
      });
      fetch();
    } catch { alert('Failed to approve'); }
  };

  const reject = async (id: string) => {
    if (!window.confirm('Reject this ingredient?')) return;
    try { await api.patch(`/ingredients/${id}/reject`); fetch(); }
    catch { alert('Failed to reject'); }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const split = (s: string) => s ? s.split(',').map((x) => x.trim()).filter(Boolean) : [];
      await api.post('/ingredients', {
        name: form.name,
        aliases: split(form.aliases),
        isComedogenic: form.isComedogenic,
        notRecommendedFor: split(form.notRecommendedFor),
        benefits: split(form.benefits),
      });
      setShowModal(false);
      setForm({ name: '', aliases: '', isComedogenic: false, notRecommendedFor: '', benefits: '' });
      fetch();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to create');
    } finally { setSaving(false); }
  };

  const statusBadge: Record<string, string> = {
    APPROVED: 'badge-success',
    PENDING:  'badge-warning',
    REJECTED: 'badge-danger',
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Ingredients</div>
          <div className="page-subtitle">Manage the global ingredients dictionary and approve vendor requests</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add Ingredient
        </button>
      </div>

      <div className="toolbar">
        <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Requests</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-row"><div className="spinner" /> Loading…</div>
        ) : ingredients.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Comedogenic</th>
                  <th>Benefits</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing: any) => (
                  <tr key={ing.id}>
                    <td style={{ fontWeight: 500 }}>{ing.name}</td>
                    <td>
                      <span className={`badge ${statusBadge[ing.status] ?? 'badge-neutral'}`}>{ing.status}</span>
                    </td>
                    <td>{ing.isComedogenic ? <span className="badge badge-danger">Yes</span> : <span className="text-muted">No</span>}</td>
                    <td className="text-muted" style={{ maxWidth: 180 }}>
                      <span className="truncate">{ing.benefits?.join(', ') || '—'}</span>
                    </td>
                    <td className="text-muted">{new Date(ing.createdAt).toLocaleDateString()}</td>
                    <td>
                      {ing.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button className="btn btn-sm btn-primary" onClick={() => approve(ing.id)}>
                            <Check size={12} /> Approve
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => reject(ing.id)}>
                            <X size={12} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FlaskConical size={36} color="var(--text-3)" />
            <p>No ingredients found</p>
          </div>
        )}
      </div>

      {showModal && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Ingredient</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={create}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Aliases (comma-separated)</label>
                  <input className="form-control" placeholder="e.g. Retinol, Vitamin A" value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Benefits (comma-separated)</label>
                  <input className="form-control" placeholder="e.g. Anti-aging, Moisturizing" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Not Recommended For (comma-separated)</label>
                  <input className="form-control" placeholder="e.g. Sensitive skin, Rosacea" value={form.notRecommendedFor} onChange={(e) => setForm({ ...form, notRecommendedFor: e.target.value })} />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 0 }}>
                  <input type="checkbox" id="comed" checked={form.isComedogenic} onChange={(e) => setForm({ ...form, isComedogenic: e.target.checked })} />
                  <label htmlFor="comed" className="form-label" style={{ marginBottom: 0 }}>Comedogenic (clogs pores)</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
