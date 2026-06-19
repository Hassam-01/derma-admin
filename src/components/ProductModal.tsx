import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, UploadCloud } from 'lucide-react';
import { api } from '../lib/api';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  product?: any;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSaved, product }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    sku: '',
    imageUrls: [] as string[],
    tags: '',
    ingredientIds: [] as string[],
    discountPrice: '',
    discountPercent: '',
    discountEndDate: '',
  });
  
  const [categories, setCategories] = useState<any[]>([]);
  const [ingredientsList, setIngredientsList] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get('/products/categories').then(res => setCategories(res.data.data || []));
      api.get('/ingredients?status=APPROVED').then(res => setIngredientsList(res.data.data || []));

      if (product) {
        setFormData({
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
          discountEndDate: product.discountEndDate ? new Date(product.discountEndDate).toISOString().slice(0,16) : '',
        });
      } else {
        setFormData({
          name: '', description: '', price: '', stock: '', categoryId: '', sku: '', imageUrls: [], tags: '', ingredientIds: [],
          discountPrice: '', discountPercent: '', discountEndDate: ''
        });
      }
      setError('');
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError('');
      
      // 1. Get presigned URL
      const { data } = await api.post('/products/presigned-url', {
        filename: file.name,
        contentType: file.type
      });
      const { uploadUrl, publicUrl } = data.data;

      // 2. Upload file directly to S3/Cloudflare R2
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      // 3. Add public URL to state
      setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, publicUrl] }));
    } catch (err) {
      console.error('Image upload failed', err);
      setError('Failed to upload image. Ensure AWS settings are configured.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newUrls = [...prev.imageUrls];
      newUrls.splice(index, 1);
      return { ...prev, imageUrls: newUrls };
    });
  };

  const toggleIngredient = (id: string) => {
    setFormData(prev => {
      const isSelected = prev.ingredientIds.includes(id);
      if (isSelected) {
        return { ...prev, ingredientIds: prev.ingredientIds.filter(i => i !== id) };
      } else {
        return { ...prev, ingredientIds: [...prev.ingredientIds, id] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        stock: Number(formData.stock),
        categoryId: formData.categoryId,
        sku: formData.sku,
        imageUrls: formData.imageUrls,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        ingredientIds: formData.ingredientIds,
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        discountPercent: formData.discountPercent ? Number(formData.discountPercent) : undefined,
        discountEndDate: formData.discountEndDate ? new Date(formData.discountEndDate).toISOString() : undefined,
      };

      if (product) {
        await api.patch(`/products/${product.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <h3>{product ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        {error && <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Name</label>
              <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Category</label>
              <select className="form-control" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required>
                <option value="">Select a category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Price (PKR)</label>
              <input type="number" step="0.01" className="form-control" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Stock</label>
              <input type="number" className="form-control" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">SKU</label>
              <input type="text" className="form-control" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="Optional" />
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
            <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#3b82f6' }}>Promotional Discount (Optional)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Discount Price</label>
                <input type="number" step="0.01" className="form-control" value={formData.discountPrice} onChange={e => setFormData({...formData, discountPrice: e.target.value})} placeholder="e.g. 450" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Discount %</label>
                <input type="number" className="form-control" value={formData.discountPercent} onChange={e => setFormData({...formData, discountPercent: e.target.value})} placeholder="e.g. 15" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">End Date</label>
                <input type="datetime-local" className="form-control" value={formData.discountEndDate} onChange={e => setFormData({...formData, discountEndDate: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Images</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {formData.imageUrls.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden' }}>
                  <img src={url} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '2px', cursor: 'pointer' }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex-center" 
                style={{ width: '80px', height: '80px', borderRadius: '4px', border: '1px dashed var(--border)', cursor: 'pointer', background: 'var(--bg-surface)' }}
              >
                {uploadingImage ? <span className="text-muted" style={{ fontSize: '0.75rem' }}>Uploading...</span> : <UploadCloud size={24} className="text-muted" />}
              </div>
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Ingredients</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '100px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px' }}>
              {ingredientsList.map(ing => (
                <label key={ing.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0, padding: '0.25rem 0.5rem', background: 'var(--bg-surface-elevated)', borderRadius: '4px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.ingredientIds.includes(ing.id)} 
                    onChange={() => toggleIngredient(ing.id)} 
                  />
                  <span style={{ fontSize: '0.875rem' }}>{ing.name}</span>
                </label>
              ))}
              {ingredientsList.length === 0 && <span className="text-muted text-sm">No approved ingredients available.</span>}
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Tags (comma separated)</label>
            <input type="text" className="form-control" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="e.g. acne, oily-skin" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || uploadingImage}>
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
