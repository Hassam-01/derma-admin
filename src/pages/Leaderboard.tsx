import React, { useEffect, useState } from 'react';
import { TrendingUp, Trophy, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../lib/api';

export const Leaderboard: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('revenue');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/executive/analytics/vendor-leaderboard', {
          params: { sortBy, limit: 20 }
        });
        setVendors(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [sortBy]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h2>Vendor Leaderboard</h2>
          <p className="text-muted mt-md">Track performance across all active vendors.</p>
        </div>
        <select 
          className="form-control" 
          style={{ width: 'auto' }} 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="revenue">Sort by Revenue</option>
          <option value="units">Sort by Units Sold</option>
          <option value="orders">Sort by Orders</option>
        </select>
      </div>

      <div className="glass-panel">
        {loading ? (
          <div className="flex-center text-muted" style={{ padding: '3rem' }}>Loading leaderboard...</div>
        ) : vendors.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Vendor</th>
                  <th>Revenue</th>
                  <th>Units Sold</th>
                  <th>Orders</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor, index) => (
                  <tr key={vendor.id}>
                    <td>
                      <div className="flex-center" style={{ width: '32px', height: '32px', borderRadius: '50%', background: index < 3 ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-surface-elevated)', color: index < 3 ? 'var(--warning)' : 'var(--text-muted)' }}>
                        {index === 0 ? <Trophy size={16} /> : index + 1}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{vendor.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{vendor.email}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>PKR {vendor.revenue || 0}</td>
                    <td>{vendor.unitsSold || 0}</td>
                    <td>{vendor.orderCount || 0}</td>
                    <td>
                      <span className={`badge ${vendor.trend > 0 ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex', gap: '0.25rem' }}>
                        {vendor.trend > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        {Math.abs(vendor.trend || 0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-center text-muted" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
            <TrendingUp size={48} opacity={0.5} />
            <p>No vendor data available for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
};
