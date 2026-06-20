import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Tag, Plus, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';

export const Coupons: React.FC = () => {
  const { user }    = useAuth();
  const isVendor    = user?.role === Role.VENDOR;
  const analyticsEp = isVendor ? '/vendor/coupons' : '/executive/analytics/coupons';

  const [analytics, setAnalytics]       = useState<any[]>([]);
  const [coupons, setCoupons]           = useState<any[]>([]);
  const [vendorProducts, setVProducts]  = useState<any[]>([]);
  const [usageRate, setUsageRate]       = useState(0);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [form, setForm]                 = useState({
    code: '', discountPercent: 10, maxUses: '', expiresAt: '', productId: '',
  });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [aRes, cRes] = await Promise.all([
        api.get(analyticsEp),
        api.get('/coupons'),
      ]);
      const aBody = aRes.data.data;
      setAnalytics(aBody?.data ?? []);
      setUsageRate(aBody?.couponUsageRate ?? 0);
      setCoupons(cRes.data.data ?? []);

      if (isVendor) {
        const pRes = await api.get('/vendor/products', { params: { limit: 50 } });
        setVProducts(pRes.data.data?.data ?? []);
      }
    } catch (err) {
      console.error('Coupons fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [analyticsEp]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/coupons', {
        code: form.code,
        discountPercent: Number(form.discountPercent),
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59.999Z`).toISOString() : undefined,
        productId: form.productId || undefined,
      });
      setShowModal(false);
      setForm({ code: '', discountPercent: 10, maxUses: '', expiresAt: '', productId: '' });
      fetchAll();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to create coupon');
    } finally { setSaving(false); }
  };

  const deactivate = async (id: string) => {
    try { await api.patch(`/coupons/${id}/deactivate`); fetchAll(); }
    catch { /* silent */ }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Coupons</div>
          <div className="page-subtitle">Manage discount codes and view performance</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add Coupon
        </button>
      </div>

      {/* Usage rate KPI */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
        <div className="kpi-card">
          <div className="kpi-label">Coupon Usage Rate</div>
          <div className="kpi-value">{usageRate}%</div>
          <div className="kpi-sub">of orders used a coupon</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Coupons</div>
          <div className="kpi-value">{coupons.filter((c) => c.isActive).length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Coupons</div>
          <div className="kpi-value">{coupons.length}</div>
        </div>
      </div>

      {/* Analytics table */}
      {analytics.length > 0 && (
        <div className="card" style={{ padding: 0, marginBottom: 12 }}>
          <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid var(--border)' }}>
            Coupon Analytics
          </div>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr><th>Code</th><th>Uses</th><th>Total Discount Given</th><th>Associated Revenue</th></tr>
              </thead>
              <tbody>
                {analytics.map((c: any, i: number) => (
                  <tr key={c.couponCode ?? i}>
                    <td><span className="badge badge-primary">{c.couponCode}</span></td>
                    <td>{c.usedCount}</td>
                    <td>PKR {(c.totalDiscountGiven ?? 0).toLocaleString()}</td>
                    <td>PKR {(c.associatedRevenue ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coupons list */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid var(--border)' }}>
          All Coupons
        </div>
        {loading ? (
          <div className="loading-row"><div className="spinner" /> Loading…</div>
        ) : coupons.length > 0 ? (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr><th>Code</th><th>Discount</th><th>Scope</th><th>Uses</th><th>Max</th><th>Expires</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {coupons.map((c: any) => (
                  <tr key={c.id}>
                    <td><span className="badge badge-primary mono">{c.code}</span></td>
                    <td style={{ fontWeight: 600 }}>{c.discountPercent}%</td>
                    <td>
                      {c.productId ? <span className="badge badge-info">Product</span>
                       : c.vendorId ? <span className="badge badge-primary">Store</span>
                       : <span className="badge badge-neutral">App-Wide</span>}
                    </td>
                    <td>{c.usesCount ?? c.usedCount ?? 0}</td>
                    <td className="text-muted">{c.maxUses ?? '∞'}</td>
                    <td className="text-muted">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`badge ${c.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {c.isActive && (
                        <button className="btn btn-danger btn-sm" onClick={() => deactivate(c.id)}>
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Tag size={36} color="var(--text-3)" />
            <p>No coupons yet</p>
          </div>
        )}
      </div>

      {showModal && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Create Coupon</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={create}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Coupon Code *</label>
                  <input className="form-control" value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required minLength={3} />
                </div>
                <div className="form-group">
                  <label className="form-label">Discount % *</label>
                  <input type="number" className="form-control" value={form.discountPercent} min={1} max={100}
                    onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Uses (leave blank = unlimited)</label>
                  <input type="number" className="form-control" value={form.maxUses} min={1}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date (optional)</label>
                  <input type="date" className="form-control" value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
                </div>
                {isVendor && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Specific Product (optional — blank = store-wide)</label>
                    <select className="form-control" value={form.productId}
                      onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                      <option value="">All Products</option>
                      {vendorProducts.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
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
