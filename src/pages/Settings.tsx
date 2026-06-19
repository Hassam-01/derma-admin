import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { api } from '../lib/api';

export const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    currencyCode: 'USD',
    defaultShippingFee: 0,
    freeShippingThreshold: 0
  });

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/commerce/config');
      if (res.data.data) {
        setConfig({
          currencyCode: res.data.data.currencyCode || 'USD',
          defaultShippingFee: parseFloat(res.data.data.defaultShippingFee) || 0,
          freeShippingThreshold: parseFloat(res.data.data.freeShippingThreshold) || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch store config', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.patch('/commerce/config', {
        currencyCode: config.currencyCode,
        defaultShippingFee: Number(config.defaultShippingFee),
        freeShippingThreshold: Number(config.freeShippingThreshold)
      });
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save config', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h2>Store Settings</h2>
          <p className="text-muted mt-md">Configure global store rules like currency and shipping.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ maxWidth: '600px' }}>
        {loading ? (
          <div className="flex-center text-muted" style={{ padding: '3rem' }}>Loading settings...</div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Currency Code</label>
              <input 
                type="text" 
                className="form-control" 
                value={config.currencyCode} 
                onChange={e => setConfig({...config, currencyCode: e.target.value})} 
                required 
              />
              <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>e.g., USD, PKR, EUR</span>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Default Shipping Fee</label>
              <input 
                type="number" 
                step="0.01"
                className="form-control" 
                value={config.defaultShippingFee} 
                onChange={e => setConfig({...config, defaultShippingFee: parseFloat(e.target.value) || 0})} 
                required 
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Free Shipping Threshold</label>
              <input 
                type="number" 
                step="0.01"
                className="form-control" 
                value={config.freeShippingThreshold} 
                onChange={e => setConfig({...config, freeShippingThreshold: parseFloat(e.target.value) || 0})} 
              />
              <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>Set to 0 or empty to disable free shipping.</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
