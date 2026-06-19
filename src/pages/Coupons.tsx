import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Tag, Plus, Archive } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';

export const Coupons: React.FC = () => {
  const { user } = useAuth();
  const isVendor = user?.role === Role.VENDOR;
  const isExecutive = user?.role === Role.EXECUTIVE;
  const analyticsEndpoint = isVendor ? '/vendor/coupons' : '/executive/analytics/coupons';

  const [analytics, setAnalytics] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageRate, setUsageRate] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountPercent: 10,
    maxUses: '',
    expiresAt: '',
    productId: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(analyticsEndpoint);
      const data = res.data.data;
      setAnalytics(data?.data || data?.items || []);
      setUsageRate(data?.couponUsageRate || 0);

      if (isExecutive || isVendor) {
        const couponsRes = await api.get('/coupons');
        setCoupons(couponsRes.data.data || []);
      }
      if (isVendor) {
        const prodRes = await api.get('/vendor/products');
        setVendorProducts(prodRes.data.data?.items || prodRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch coupons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [analyticsEndpoint, isExecutive]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/coupons', {
        code: newCoupon.code,
        discountPercent: Number(newCoupon.discountPercent),
        maxUses: newCoupon.maxUses ? Number(newCoupon.maxUses) : undefined,
        expiresAt: newCoupon.expiresAt ? new Date(newCoupon.expiresAt).toISOString() : undefined,
        productId: newCoupon.productId || undefined
      });
      setShowModal(false);
      setNewCoupon({ code: '', discountPercent: 10, maxUses: '', expiresAt: '', productId: '' });
      fetchData();
    } catch (err: any) {
      console.error('Failed to create coupon', err);
      alert(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await api.patch(`/coupons/${id}/deactivate`);
      fetchData();
    } catch (err) {
      console.error('Failed to deactivate coupon', err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h2>Coupons Management</h2>
          <p className="text-muted mt-md">View performance and manage discount coupons.</p>
        </div>
        {(isExecutive || isVendor) && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} /> Add Coupon
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="stat-card glass-panel animate-slide-up">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Tag size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{usageRate}%</h3>
            <p className="stat-label">Coupon Usage Rate (Orders with coupons)</p>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '1.5rem' }}>Coupon Analytics</h3>
        {loading ? (
          <div className="flex-center text-muted" style={{ padding: '3rem' }}>Loading analytics...</div>
        ) : analytics.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Times Used</th>
                  <th>Total Discount Given</th>
                  <th>Associated Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((coupon: any, idx: number) => (
                  <tr key={coupon.couponCode || idx}>
                    <td><span className="badge badge-primary">{coupon.couponCode}</span></td>
                    <td>{coupon.usedCount}</td>
                    <td>PKR {coupon.totalDiscountGiven}</td>
                    <td>PKR {coupon.associatedRevenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-center text-muted" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
            <Tag size={48} opacity={0.5} />
            <p>No coupon data found.</p>
          </div>
        )}
      </div>

      {(isExecutive || isVendor) && (
        <div className="glass-panel">
          <h3 style={{ marginBottom: '1.5rem' }}>All Coupons</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Scope</th>
                  <th>Max Uses</th>
                  <th>Uses</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td><span className="badge badge-primary">{c.code}</span></td>
                    <td>{c.discountPercent}%</td>
                    <td>
                      {c.productId ? <span className="badge badge-success">Product</span> : 
                       c.vendorId ? <span className="badge badge-primary">Store-Wide</span> : 
                       <span className="badge badge-danger">App-Wide</span>}
                    </td>
                    <td>{c.maxUses || '∞'}</td>
                    <td>{c.usesCount || c.usedCount}</td>
                    <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {c.isActive && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(c.id)}>
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-md">No coupons created yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Coupon Modal */}
      {showModal && ReactDOM.createPortal(
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ width: '400px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3>Create Coupon</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>Ã—</button>
            </div>
            <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Coupon Code</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newCoupon.code} 
                  onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} 
                  required 
                  minLength={3}
                />
              </div>
              <div className="form-group">
                <label>Discount Percent (%)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={newCoupon.discountPercent} 
                  onChange={e => setNewCoupon({ ...newCoupon, discountPercent: Number(e.target.value) })} 
                  required 
                  min={1}
                  max={100}
                />
              </div>
              <div className="form-group">
                <label>Max Uses (Optional)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={newCoupon.maxUses} 
                  onChange={e => setNewCoupon({ ...newCoupon, maxUses: e.target.value })} 
                  min={1}
                />
              </div>
              <div className="form-group">
                <label>Expiry Date (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="form-control" 
                  value={newCoupon.expiresAt} 
                  onChange={e => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })} 
                />
              </div>
              {isVendor && (
                <div className="form-group">
                  <label>Specific Product (Optional)</label>
                  <select 
                    className="form-control"
                    value={newCoupon.productId}
                    onChange={e => setNewCoupon({ ...newCoupon, productId: e.target.value })}
                  >
                    <option value="">-- Store-Wide (All Products) --</option>
                    {vendorProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
