import React, { useEffect, useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';

export const Locations: React.FC = () => {
  const { user } = useAuth();
  const isVendor = user?.role === Role.VENDOR;
  const isExecutive = user?.role === Role.EXECUTIVE;
  const insightsEndpoint = isVendor ? '/vendor/locations' : '/executive/analytics/location-insights';

  const [insights, setInsights] = useState<any>(null);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCityModal, setShowCityModal] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCityState, setNewCityState] = useState('');

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get(insightsEndpoint);
      setInsights(res.data.data);
      
      if (isExecutive) {
        const citiesRes = await api.get('/locations/admin/cities');
        setCities(citiesRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch location insights', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [insightsEndpoint, isExecutive]);

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName) return;
    try {
      await api.post('/locations/cities', { name: newCityName, state: newCityState });
      setShowCityModal(false);
      setNewCityName('');
      setNewCityState('');
      fetchLocations();
    } catch (err) {
      console.error('Failed to add city', err);
      alert('Failed to add city');
    }
  };

  const handleToggleCityStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/locations/cities/${id}`, { isActive: !currentStatus });
      fetchLocations();
    } catch (err) {
      console.error('Failed to toggle city status', err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h2>Location Insights</h2>
          <p className="text-muted mt-md">View sales by city and state.</p>
        </div>
        {isExecutive && (
          <button className="btn btn-primary" onClick={() => setShowCityModal(true)}>
            <Plus size={20} /> Add City
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex-center text-muted glass-panel" style={{ padding: '3rem' }}>Loading location data...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {insights?.topCountry && (
            <div className="stat-card glass-panel">
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <MapPin size={24} />
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{insights.topCountry}</h3>
                <p className="stat-label">Top Performing Country</p>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Top Cities */}
            <div className="glass-panel">
              <h3 style={{ marginBottom: '1.5rem' }}>Top Cities</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>City</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights?.topCities?.map((city: any, idx: number) => (
                      <tr key={`${city.city}-${idx}`}>
                        <td>{city.city}, {city.state}</td>
                        <td>{city.orderCount}</td>
                        <td>PKR {city.revenue}</td>
                      </tr>
                    ))}
                    {(!insights?.topCities || insights.topCities.length === 0) && (
                      <tr>
                        <td colSpan={3} className="text-center text-muted py-md">No data</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top States */}
            <div className="glass-panel">
              <h3 style={{ marginBottom: '1.5rem' }}>Top States / Provinces</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>State</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights?.byState?.map((state: any, idx: number) => (
                      <tr key={`${state.state}-${idx}`}>
                        <td>{state.state}</td>
                        <td>{state.orderCount}</td>
                        <td>PKR {state.revenue}</td>
                      </tr>
                    ))}
                    {(!insights?.byState || insights.byState.length === 0) && (
                      <tr>
                        <td colSpan={3} className="text-center text-muted py-md">No data</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {isExecutive && (
            <div className="glass-panel">
              <h3 style={{ marginBottom: '1.5rem' }}>Managed Cities</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>City Name</th>
                      <th>State</th>
                      <th>Country</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cities.map(city => (
                      <tr key={city.id}>
                        <td>{city.name}</td>
                        <td>{city.state || '-'}</td>
                        <td>{city.country}</td>
                        <td>
                          <span className={`badge ${city.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {city.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleToggleCityStatus(city.id, city.isActive)}
                          >
                            Toggle
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cities.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-md">No managed cities found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Add City Modal */}
      {showCityModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ width: '400px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3>Add City</h3>
              <button className="btn-icon" onClick={() => setShowCityModal(false)}>Ã—</button>
            </div>
            <form onSubmit={handleAddCity} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>City Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newCityName} 
                  onChange={e => setNewCityName(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>State (Optional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newCityState} 
                  onChange={e => setNewCityState(e.target.value)} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCityModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
