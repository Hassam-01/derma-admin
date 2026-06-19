import React, { useEffect, useState } from 'react';
import { Package, Search, Plus, Archive, Edit2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';

export const Products: React.FC = () => {
  const { user } = useAuth();
  const isVendor = user?.role === Role.VENDOR;
  const endpoint = isVendor ? '/vendor/products' : '/executive/analytics/products';

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get(endpoint, { params: { search } });
      // Depending on backend structure, data might be in res.data.data.items or similar.
      setProducts(res.data.data?.items || res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [endpoint, search]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h2>Products Management</h2>
          <p className="text-muted mt-md">Manage your product catalog, view analytics and stock.</p>
        </div>
        {isVendor && (
          <button className="btn btn-primary">
            <Plus size={20} /> Add Product
          </button>
        )}
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, maxWidth: '400px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
          {isVendor && (
            <select className="form-control" style={{ width: 'auto' }}>
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex-center text-muted" style={{ padding: '3rem' }}>Loading products...</div>
        ) : products.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Stock</th>
                  <th>Price</th>
                  {isVendor && <th>Revenue</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', overflow: 'hidden' }}>
                          {product.imageUrls?.[0] ? (
                            <img src={product.imageUrls[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div className="flex-center" style={{ height: '100%' }}><Package size={20} className="text-muted" /></div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{product.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{product.category?.name || 'Uncategorized'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${product.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td>{product.stock} units</td>
                    <td>${product.price}</td>
                    {isVendor && <td>${product.analytics?.revenue || 0}</td>}
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-icon" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-danger btn-icon" title="Archive">
                          <Archive size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-center text-muted" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
            <Package size={48} opacity={0.5} />
            <p>No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
