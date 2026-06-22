import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, UploadCloud } from 'lucide-react';
import { api } from '../lib/api';
import { compressImageToWebp } from '../lib/image';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  product?: any;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSaved, product }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', description: '', price: '', stock: '', categoryId: '', sku: '',
    imageUrls: [] as string[], tags: '', ingredientIds: [] as string[],
    discountPrice: '', discountPercent: '', discountEndDate: '',
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get('/products/categories').then((res) => setCategories(res.data.data ?? []));
      api.get('/ingredients', { params: { status: 'APPROVED' } }).then((res) => setIngredients(res.data.data ?? []));

      if (product) {
        setForm({
          name: product.name || '',
          description: product.description || '',
          price: product.price?.toString() || '',
          stock: product.stock?.toString() || '',
          categoryId: product.category?.id || '',
          sku: product.sku || '',
          imageUrls: product.imageUrls || [],
          tags: product.tags?.join(', ') || '',
          ingredientIds: product.ingredients?.map((pi: any) => pi.ingredientId) || [],
          discountPrice: product.discountPrice?.toString() || '',
          discountPercent: product.discountPercent?.toString() || '',
          discountEndDate: product.discountEndDate ? new Date(product.discountEndDate).toISOString().slice(0, 16) : '',
        });
      } else {
        setForm({
          name: '', description: '', price: '', stock: '', categoryId: '', sku: '',
          imageUrls: [], tags: '', ingredientIds: [],
          discountPrice: '', discountPercent: '', discountEndDate: '',
        });
      }
      setError('');
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      const compressedFile = await compressImageToWebp(file, 0.8);
      const { data } = await api.post('/products/presigned-url', { filename: compressedFile.name, contentType: compressedFile.type });
      const { uploadUrl, publicUrl } = data.data;

      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': compressedFile.type }, body: compressedFile });
      setForm((p) => ({ ...p, imageUrls: [...p.imageUrls, publicUrl] }));
    } catch {
      setError('Failed to upload image. Ensure AWS settings are configured.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImg = (i: number) => {
    setForm((p) => {
      const u = [...p.imageUrls];
      u.splice(i, 1);
      return { ...p, imageUrls: u };
    });
  };

  const toggleIng = (id: string) => {
    setForm((p) => ({
      ...p,
      ingredientIds: p.ingredientIds.includes(id) ? p.ingredientIds.filter((x) => x !== id) : [...p.ingredientIds, id],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        categoryId: form.categoryId,
        sku: form.sku,
        imageUrls: form.imageUrls,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        ingredientIds: form.ingredientIds,
        discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
        discountPercent: form.discountPercent ? Number(form.discountPercent) : undefined,
        discountEndDate: form.discountEndDate ? new Date(form.discountEndDate).toISOString() : undefined,
      };

      if (product) await api.patch(`/products/${product.id}`, payload);
      else await api.post('/products', payload);

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{product ? 'Edit Product' : 'Add Product'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '8px 12px', margin: '0 24px 16px', borderRadius: 6, color: 'var(--danger)', fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="modal-body">
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Name *</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category *</label>
                <select className="form-control" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                  <option value="">Select a category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Price (PKR) *</label>
                <input type="number" step="0.01" className="form-control" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Stock *</label>
                <input type="number" className="form-control" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">SKU</label>
                <input className="form-control" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Optional" />
              </div>
            </div>

            <div style={{ marginTop: 24, padding: 16, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Promotional Discount (Optional)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Discount Price</label>
                  <input type="number" step="0.01" className="form-control" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Discount %</label>
                  <input type="number" className="form-control" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">End Date</label>
                  <input type="datetime-local" className="form-control" value={form.discountEndDate} onChange={(e) => setForm({ ...form, discountEndDate: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Description *</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Images</label>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {form.imageUrls.map((url, i) => (
                  <div key={i} style={{ position: 'relative', width: 64, height: 64, borderRadius: 6, overflow: 'hidden' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeImg(i)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', padding: 2, cursor: 'pointer' }}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <div onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center clickable" style={{ width: 64, height: 64, borderRadius: 6, border: '1px dashed var(--border)', background: 'var(--surface-2)' }}>
                  {uploading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 1 }} /> : <UploadCloud size={20} color="var(--text-3)" />}
                </div>
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleUpload} />
            </div>

            <div className="form-group">
              <label className="form-label">Ingredients</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 120, overflowY: 'auto', padding: 8, border: '1px solid var(--border)', borderRadius: 6 }}>
                {ingredients.map((ing) => (
                  <label key={ing.id} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, padding: '4px 8px', background: 'var(--surface-2)', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={form.ingredientIds.includes(ing.id)} onChange={() => toggleIng(ing.id)} />
                    {ing.name}
                  </label>
                ))}
                {ingredients.length === 0 && <span className="text-muted text-sm">No approved ingredients.</span>}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tags (comma separated)</label>
              <input className="form-control" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. acne, oily-skin" />
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || uploading}>{loading ? 'Saving…' : 'Save Product'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
