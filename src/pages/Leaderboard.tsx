import React, { useEffect, useState } from 'react';
import { TrendingUp, Trophy } from 'lucide-react';
import { api } from '../lib/api';

export const Leaderboard: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // BE accepts: 'revenue' | 'units_sold' | 'orders'
  const [sortBy, setSortBy] = useState('revenue');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await api.get('/executive/analytics/vendor-leaderboard', {
          params: { sortBy, limit: 20 },
        });
        // Response: array of { vendorId, firstName, lastName, email, totalProducts, revenue, unitsSold, orderCount }
        setVendors(res.data.data ?? []);
      } catch (err) {
        console.error('Leaderboard fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sortBy]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Vendor Leaderboard</div>
          <div className="page-subtitle">Performance ranking across all active vendors</div>
        </div>
        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="revenue">By Revenue</option>
          <option value="units_sold">By Units Sold</option>
          <option value="orders">By Orders</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-row"><div className="spinner" /> Loading…</div>
        ) : vendors.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}>#</th>
                  <th>Vendor</th>
                  <th>Products</th>
                  <th>Revenue</th>
                  <th>Units Sold</th>
                  <th>Orders</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v: any, i: number) => (
                  <tr key={v.vendorId ?? i}>
                    <td>
                      {i === 0 ? (
                        <span style={{ color: '#F59E0B' }}><Trophy size={16} /></span>
                      ) : (
                        <span className="text-muted">{i + 1}</span>
                      )}
                    </td>
                    <td>
                      {/* BE returns firstName + lastName, NOT name */}
                      <div style={{ fontWeight: 500 }}>{v.firstName} {v.lastName}</div>
                      <div className="text-sm text-muted">{v.email}</div>
                    </td>
                    <td className="text-muted">{v.totalProducts}</td>
                    <td style={{ fontWeight: 600 }}>PKR {(v.revenue ?? 0).toLocaleString()}</td>
                    <td>{v.unitsSold ?? 0}</td>
                    <td>{v.orderCount ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <TrendingUp size={36} color="var(--text-3)" />
            <p>No vendor data available</p>
          </div>
        )}
      </div>
    </div>
  );
};
