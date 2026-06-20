import React, { useEffect, useState, useCallback } from 'react';
import { Package, Search, Plus, Archive, Edit2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';
import { ProductModal } from '../components/ProductModal';

export const Products: React.FC = () => {
  const { user } = useAuth();
  const isVendor = user?.role === Role.VENDOR;
  const endpoint = isVendor ? '/vendor/products' : '/products';

  const [products, setProducts]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { search };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get(endpoint, { params });
      const body = res.data.data;
      setProducts(body?.items ?? body?.data ?? body ?? []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, search, statusFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const archive = async (id: string) => {
    if (!window.confirm('Archive this product?')) return;
    try { await api.delete(`/products/${id}`); fetchProducts(); }
    catch { alert('Failed to archive'); }
  };

  const edit = async (product: any) => {
    try {
      setLoadingProduct(product.id);
      const res = await api.get(`/products/${product.id}`);
      setEditingProduct(res.data.data);
      setIsModalOpen(true);
    } catch {
      alert('Could not load product details');
    } finally {
      setLoadingProduct(null);
    }
  };

  const add = () => { setEditingProduct(null); setIsModalOpen(true); };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Products</div>
          <div className="page-subtitle">Manage catalog, view stock and revenue</div>
        </div>
        {isVendor && (
          <button className="btn btn-primary" onClick={add}>
            <Plus size={14} /> Add Product
          </button>
        )}
      </div>

      <div className="toolbar" style={{ flexWrap: 'nowrap' }}>
        <div className="form-group" style={{ margin: 0, flex: 1, maxWidth: 320, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="form-control" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-row"><div className="spinner" /> Loading…</div>
        ) : products.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Stock</th>
                  <th>Price</th>
                  {isVendor && <th>Revenue</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--surface-2)', overflow: 'hidden', flexShrink: 0 }}>
                          {p.imageUrls?.[0] ? (
                            <img src={p.imageUrls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div className="flex items-center justify-center w-full" style={{ height: '100%' }}><Package size={16} color="var(--text-3)" /></div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.name}</div>
                          <div className="text-sm text-muted">{p.category?.name ?? 'Uncategorized'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>{p.status}</span>
                    </td>
                    <td>
                      <div className={p.stock < 10 ? 'text-danger' : ''}>{p.stock} units</div>
                    </td>
                    <td>
                      {p.discountPrice && (!p.discountEndDate || new Date(p.discountEndDate) > new Date()) ? (
                        <div>
                          <div style={{ color: 'var(--text)', fontWeight: 600 }}>PKR {p.discountPrice}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-3)', fontSize: 11 }}>PKR {p.price}</span>
                            {p.discountPercent && <span className="badge badge-success" style={{ fontSize: 10, padding: '0 4px' }}>-{p.discountPercent}%</span>}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontWeight: 500 }}>PKR {p.price}</div>
                      )}
                    </td>
                    {isVendor && <td style={{ fontWeight: 600 }}>PKR {p.analytics?.revenue ?? 0}</td>}
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => edit(p)} disabled={loadingProduct === p.id}>
                          {loadingProduct === p.id ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1 }} /> : <Edit2 size={14} />}
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => archive(p.id)}>
                          <Archive size={14} />
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
            <Package size={36} color="var(--text-3)" />
            <p>No products found</p>
          </div>
        )}
      </div>

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaved={fetchProducts} product={editingProduct} />
    </div>
  );
};
