import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';

export const Locations: React.FC = () => {
  const { user } = useAuth();
  const isVendor = user?.role === Role.VENDOR;
  const endpoint = isVendor ? '/vendor/locations' : '/executive/analytics/location-insights';

  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get(endpoint);
      setInsights(res.data.data);
    } catch (err) {
      console.error('Failed to fetch location insights', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [endpoint]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h2>Location Insights</h2>
          <p className="text-muted mt-md">View sales by city and state.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-center text-muted glass-panel" style={{ padding: '3rem' }}>Loading location data...</div>
      ) : insights ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {insights.topCountry && (
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
                    {insights.topCities?.map((city: any, idx: number) => (
                      <tr key={`${city.city}-${idx}`}>
                        <td>{city.city}, {city.state}</td>
                        <td>{city.orderCount}</td>
                        <td>${city.revenue}</td>
                      </tr>
                    ))}
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
                    {insights.byState?.map((state: any, idx: number) => (
                      <tr key={`${state.state}-${idx}`}>
                        <td>{state.state}</td>
                        <td>{state.orderCount}</td>
                        <td>${state.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-center text-muted glass-panel" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
          <MapPin size={48} opacity={0.5} />
          <p>No location data found.</p>
        </div>
      )}
    </div>
  );
};
