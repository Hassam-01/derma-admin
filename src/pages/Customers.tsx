import React, { useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';

export const Customers: React.FC = () => {
  const { user } = useAuth();
  const isVendor = user?.role === Role.VENDOR;
  const endpoint = isVendor ? '/vendor/customers' : '/executive/analytics/customers';

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [repeatRate, setRepeatRate] = useState(0);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(endpoint);
      const data = res.data.data;
      setCustomers(data?.data || data?.items || []);
      setRepeatRate(data?.repeatCustomerRate || 0);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [endpoint]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h2>Customers Insights</h2>
          <p className="text-muted mt-md">View your top customers and their purchasing behavior.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="stat-card glass-panel animate-slide-up">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{repeatRate}%</h3>
            <p className="stat-label">Repeat Customer Rate</p>
          </div>
        </div>
        <div className="stat-card glass-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{customers.length}</h3>
            <p className="stat-label">Total Unique Customers (Page 1)</p>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        {loading ? (
          <div className="flex-center text-muted" style={{ padding: '3rem' }}>Loading customers...</div>
        ) : customers.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Location</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                  <th>Last Order</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer: any, idx: number) => {
                  const name = `${customer.firstName} ${customer.lastName}`;
                  const lastOrder = customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString() : '-';
                  
                  return (
                    <tr key={customer.customerId || customer.id || idx}>
                      <td>{name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.city || '-'}</td>
                      <td>{customer.totalOrders}</td>
                      <td>${customer.totalSpent}</td>
                      <td>{lastOrder}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-center text-muted" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
            <Users size={48} opacity={0.5} />
            <p>No customers found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
