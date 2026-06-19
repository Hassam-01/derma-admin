import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#10b981'];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isVendor = user?.role === Role.VENDOR;
  const endpoint = isVendor ? '/vendor/dashboard' : '/executive/analytics/dashboard';
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(endpoint);
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [endpoint]);

  if (loading) return <div className="text-muted">Loading dashboard...</div>;
  if (!data) return <div className="text-muted">No data available</div>;

  const { kpis, revenueChart, orderBreakdown } = data; // Assuming these exist in the response based on backend description

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <h2>Dashboard Overview</h2>
        <div className="badge badge-primary">{isVendor ? 'Vendor View' : 'Executive View'}</div>
      </div>

      {/* KPIs Grid */}
      <div className="grid-cards">
        <div className="glass-panel flex-center" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>Total Revenue</div>
          <h3 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>${kpis?.revenue?.total || 0}</h3>
          <span className={`badge ${kpis?.revenue?.change > 0 ? 'badge-success' : 'badge-danger'}`}>
            {kpis?.revenue?.change > 0 ? '+' : ''}{kpis?.revenue?.change || 0}%
          </span>
        </div>
        <div className="glass-panel flex-center" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>Total Orders</div>
          <h3 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{kpis?.orders?.total || 0}</h3>
          <span className="badge badge-primary">{kpis?.orders?.completed || 0} Completed</span>
        </div>
        <div className="glass-panel flex-center" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>Average Rating</div>
          <h3 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{kpis?.rating || 0} / 5.0</h3>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Revenue Chart */}
        <div className="glass-panel" style={{ height: '400px' }}>
          <h4 style={{ marginBottom: '1.5rem' }}>Revenue Trends</h4>
          {revenueChart && revenueChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <RechartsTooltip 
                  contentStyle={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }} 
                  itemStyle={{ color: 'var(--text-main)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-center h-full text-muted">No revenue data</div>
          )}
        </div>

        {/* Order Breakdown */}
        <div className="glass-panel" style={{ height: '400px' }}>
          <h4 style={{ marginBottom: '1.5rem' }}>Order Status</h4>
          {orderBreakdown && orderBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {orderBreakdown.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-center h-full text-muted">No order data</div>
          )}
        </div>
      </div>
    </div>
  );
};
