import React, { useEffect, useState, useCallback } from 'react';
import { Users } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';

export const Customers: React.FC = () => {
  const { user }  = useAuth();
  const isVendor  = user?.role === Role.VENDOR;
  const endpoint  = isVendor ? '/vendor/customers' : '/executive/analytics/customers';

  const [customers, setCustomers]   = useState<any[]>([]);
  const [repeatRate, setRepeatRate] = useState(0);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(endpoint);
      const body = res.data.data;
      // Both endpoints return { data: CustomerInsight[], total, repeatCustomerRate }
      setCustomers(body?.data ?? []);
      setTotal(body?.total ?? 0);
      setRepeatRate(body?.repeatCustomerRate ?? 0);
    } catch (err) {
      console.error('Customers fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-subtitle">Top customers by spend and order count</div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
        <div className="kpi-card">
          <div className="kpi-label">Unique Customers</div>
          <div className="kpi-value">{total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Repeat Rate</div>
          <div className="kpi-value">{repeatRate}%</div>
          <div className="kpi-sub">made more than 1 order</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Showing (Page 1)</div>
          <div className="kpi-value">{customers.length}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-row"><div className="spinner" /> Loading customers…</div>
        ) : customers.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Last Order</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c: any, idx: number) => (
                  <tr key={c.customerId ?? c.id ?? idx}>
                    <td style={{ fontWeight: 500 }}>{c.firstName} {c.lastName}</td>
                    <td className="text-muted">{c.email}</td>
                    <td className="text-muted">{c.city ?? '—'}</td>
                    <td>{c.totalOrders}</td>
                    <td style={{ fontWeight: 500 }}>PKR {(c.totalSpent ?? 0).toLocaleString()}</td>
                    <td className="text-muted">
                      {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Users size={36} color="var(--text-3)" />
            <p>No customer data available</p>
          </div>
        )}
      </div>
    </div>
  );
};
