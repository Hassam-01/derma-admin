import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../lib/api';

export const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [config, setConfig]   = useState({
    currencyCode: 'PKR',
    defaultShippingFee: 0,
    freeShippingThreshold: 0,
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/commerce/config');
        if (res.data.data) {
          setConfig({
            currencyCode:         res.data.data.currencyCode ?? 'PKR',
            defaultShippingFee:   parseFloat(res.data.data.defaultShippingFee) || 0,
            freeShippingThreshold: parseFloat(res.data.data.freeShippingThreshold) || 0,
          });
        }
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/commerce/config', {
        currencyCode: config.currencyCode,
        defaultShippingFee: Number(config.defaultShippingFee),
        freeShippingThreshold: Number(config.freeShippingThreshold),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { alert('Failed to save settings'); } finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Store Settings</div>
          <div className="page-subtitle">Global commerce configuration</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        {loading ? (
          <div className="loading-row"><div className="spinner" /> Loading…</div>
        ) : (
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="form-group">
              <label className="form-label">Currency Code</label>
              <input className="form-control" value={config.currencyCode}
                onChange={(e) => setConfig({ ...config, currencyCode: e.target.value })} required />
              <div className="text-sm text-muted" style={{ marginTop: 4 }}>e.g. PKR, USD, EUR</div>
            </div>

            <div className="form-group">
              <label className="form-label">Default Shipping Fee</label>
              <input type="number" step="0.01" className="form-control" value={config.defaultShippingFee}
                onChange={(e) => setConfig({ ...config, defaultShippingFee: parseFloat(e.target.value) || 0 })} required />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Free Shipping Threshold</label>
              <input type="number" step="0.01" className="form-control" value={config.freeShippingThreshold}
                onChange={(e) => setConfig({ ...config, freeShippingThreshold: parseFloat(e.target.value) || 0 })} />
              <div className="text-sm text-muted" style={{ marginTop: 4 }}>Set to 0 to disable free shipping</div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Settings'}
              </button>
              {saved && (
                <span style={{ fontSize: 13, color: 'var(--success)' }}>✓ Saved</span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
