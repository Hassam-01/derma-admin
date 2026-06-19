import React, { useEffect, useState } from 'react';
import { FolderTree, Plus, Edit2, Trash2 } from 'lucide-react';
import { api } from '../lib/api';

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/categories');
      setCategories(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/products/categories/${editingId}`, { name, description });
      } else {
        await api.post('/products/categories', { name, description, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') });
      }
      setName('');
      setDescription('');
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      console.error('Failed to save category', err);
      alert('Failed to save category');
    }
  };

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description || '');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/products/categories/${id}`);
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category', err);
      alert('Failed to delete category');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h2>Categories</h2>
          <p className="text-muted mt-md">Manage product category hierarchy.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div className="glass-panel" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Category' : 'Add Category'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Name</label>
              <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Description</label>
              <textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Update' : 'Create'}</button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setName(''); setDescription(''); }}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="glass-panel">
          {loading ? (
            <div className="flex-center text-muted" style={{ padding: '3rem' }}>Loading categories...</div>
          ) : categories.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c: any) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td>{c.slug}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary btn-icon btn-sm" onClick={() => handleEdit(c)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(c.id)}>
                            <Trash2 size={16} />
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
              <FolderTree size={48} opacity={0.5} />
              <p>No categories found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
