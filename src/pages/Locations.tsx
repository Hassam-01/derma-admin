import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { MapPin, Plus, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';

export const Locations: React.FC = () => {
  const { user }    = useAuth();
  const isVendor    = user?.role === Role.VENDOR;
  const isExec      = user?.role === Role.EXECUTIVE;
  const endpoint    = isVendor ? '/vendor/location-insights' : '/executive/analytics/location-insights';

  const [insights, setInsights]   = useState<any>(null);
  const [cities, setCities]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cityName, setCityName]   = useState('');
  const [cityState, setCityState] = useState('');
  const [saving, setSaving]       = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [insRes, ...rest] = await Promise.all([
        api.get(endpoint),
        ...(isExec ? [api.get('/locations/admin/cities')] : []),
      ]);
      setInsights(insRes.data.data);
      if (rest[0]) setCities(rest[0].data.data ?? []);
    } catch (err) {
      console.error('Locations fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, isExec]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addCity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/locations/cities', { name: cityName, state: cityState || undefined });
      setShowModal(false);
      setCityName(''); setCityState('');
      fetchAll();
    } catch { alert('Failed to add city'); } finally { setSaving(false); }
  };

  const toggleCity = async (id: string, isActive: boolean) => {
    try { await api.patch(`/locations/cities/${id}`, { isActive: !isActive }); fetchAll(); }
    catch { alert('Failed to toggle city'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Location Insights</div>
          <div className="page-subtitle">Sales breakdown by city and state</div>
        </div>
        {isExec && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add City
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-row"><div className="spinner" /> Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {insights?.topCountry && (
            <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <MapPin size={18} color="var(--accent)" />
              <span>Top country: <strong>{insights.topCountry}</strong></span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Cities */}
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                Top Cities
              </div>
              <div className="table-wrap" style={{ border: 'none' }}>
                <table>
                  <thead><tr><th>City</th><th>Orders</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {(insights?.topCities ?? []).map((c: any, i: number) => (
                      <tr key={i}>
                        <td>{c.city}{c.state ? `, ${c.state}` : ''}</td>
                        <td>{c.orderCount}</td>
                        <td>PKR {(c.revenue ?? 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!insights?.topCities?.length) && (
                      <tr><td colSpan={3}><div className="empty-state" style={{ padding: 24 }}><p>No data</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* States */}
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                By State
              </div>
              <div className="table-wrap" style={{ border: 'none' }}>
                <table>
                  <thead><tr><th>State</th><th>Orders</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {(insights?.byState ?? []).map((s: any, i: number) => (
                      <tr key={i}>
                        <td>{s.state}</td>
                        <td>{s.orderCount}</td>
                        <td>PKR {(s.revenue ?? 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!insights?.byState?.length) && (
                      <tr><td colSpan={3}><div className="empty-state" style={{ padding: 24 }}><p>No data</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Managed cities */}
          {isExec && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                Managed Cities
              </div>
              <div className="table-wrap" style={{ border: 'none' }}>
                <table>
                  <thead><tr><th>Name</th><th>State</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {cities.map((c: any) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 500 }}>{c.name}</td>
                        <td className="text-muted">{c.state ?? '—'}</td>
                        <td>
                          <span className={`badge ${c.isActive ? 'badge-success' : 'badge-neutral'}`}>
                            {c.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => toggleCity(c.id, c.isActive)}>
                            {c.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!cities.length && (
                      <tr><td colSpan={4}><div className="empty-state" style={{ padding: 24 }}><p>No cities configured</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add City Modal */}
      {showModal && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add City</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={addCity}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">City Name *</label>
                  <input className="form-control" value={cityName} onChange={(e) => setCityName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">State (optional)</label>
                  <input className="form-control" value={cityState} onChange={(e) => setCityState(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add City'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
