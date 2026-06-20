import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Package, ShoppingCart, Star, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';

/* ── helpers ── */
const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1)}K`
  : String(Math.round(n));

const statusColors: Record<string, string> = {
  PENDING:    '#F59E0B',
  PROCESSING: '#3B82F6',
  SHIPPED:    '#6366F1',
  DELIVERED:  '#10B981',
  CANCELLED:  '#EF4444',
  REFUNDED:   '#6B7280',
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isVendor = user?.role === Role.VENDOR;
  const dashEndpoint = isVendor ? '/vendor/dashboard' : '/executive/analytics/dashboard';
  const revEndpoint  = isVendor ? '/vendor/revenue'   : '/executive/analytics/revenue';

  const [dash, setDash]         = useState<any>(null);
  const [revData, setRevData]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [dashRes, revRes] = await Promise.all([
          api.get(dashEndpoint),
          api.get(revEndpoint, { params: { groupBy: 'day' } }),
        ]);
        setDash(dashRes.data.data);
        const revBody = revRes.data.data;
        setRevData(revBody?.data ?? []);
      } catch (err) {
        console.error('Dashboard load failed', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dashEndpoint, revEndpoint]);

  if (loading) {
    return (
      <div className="loading-row">
        <div className="spinner" />
        Loading dashboard…
      </div>
    );
  }

  if (!dash) {
    return <div className="empty-state"><p>No dashboard data available.</p></div>;
  }

  /* ── Derived values (matched to actual BE response) ── */
  const totalRevenue  = dash.totalRevenue ?? 0;
  const revenueChange = dash.revenueChange ?? 0;
  const totalOrders   = dash.totalOrders ?? 0;
  const totalProducts = dash.totalProducts ?? 0;
  const avgRating     = dash.averageProductRating ?? 0;
  const lowStock      = dash.lowStockProducts ?? 0;
  const outOfStock    = dash.outOfStockProducts ?? 0;
  const totalUnits    = dash.totalUnitsSold ?? 0;
  const avgOrderVal   = dash.averageOrderValue ?? 0;
  const cancelRate    = dash.cancellationRate ?? 0;
  const ordersByStatus: Record<string, number> = dash.ordersByStatus ?? {};
  const topProducts: any[] = dash.topSellingProducts ?? [];

  /* order status pie data */
  const orderPieData = Object.entries(ordersByStatus)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">{isVendor ? 'Your store performance' : 'Store-wide analytics'}</div>
        </div>
        <span className={`badge badge-${isVendor ? 'primary' : 'info'}`}>
          {isVendor ? 'Vendor' : 'Executive'}
        </span>
      </div>

      {/* ── KPI Row ── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Revenue</div>
          <div className="kpi-value">PKR {fmt(totalRevenue)}</div>
          <div className="kpi-sub">
            {revenueChange >= 0
              ? <><TrendingUp size={12} color="var(--success)" /> <span style={{ color: 'var(--success)' }}>+{revenueChange}%</span></>
              : <><TrendingDown size={12} color="var(--danger)" /> <span style={{ color: 'var(--danger)' }}>{revenueChange}%</span></>
            }
            <span>vs prev period</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Orders</div>
          <div className="kpi-value">{fmt(totalOrders)}</div>
          <div className="kpi-sub">
            <ShoppingCart size={12} />
            <span>Avg PKR {fmt(avgOrderVal)} / order</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Units Sold</div>
          <div className="kpi-value">{fmt(totalUnits)}</div>
          <div className="kpi-sub">
            <Package size={12} />
            <span>{totalProducts} products</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Avg Rating</div>
          <div className="kpi-value">{avgRating.toFixed(1)}</div>
          <div className="kpi-sub">
            <Star size={12} />
            <span>{dash.totalReviews ?? 0} reviews</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Stock Alerts</div>
          <div className="kpi-value" style={{ color: outOfStock > 0 ? 'var(--danger)' : 'var(--text)' }}>
            {outOfStock + lowStock}
          </div>
          <div className="kpi-sub">
            <AlertTriangle size={12} color={outOfStock > 0 ? 'var(--danger)' : 'var(--warning)'} />
            <span>{outOfStock} out · {lowStock} low</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Cancel Rate</div>
          <div className="kpi-value" style={{ color: cancelRate > 10 ? 'var(--danger)' : 'var(--text)' }}>
            {cancelRate}%
          </div>
          <div className="kpi-sub">
            <span>Return rate: {dash.returnRate ?? 0}%</span>
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="chart-grid chart-grid-2">
        {/* Revenue chart */}
        <div className="card">
          <div className="card-title">Revenue Over Time</div>
          {revData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${fmt(v)}`} width={44} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [`PKR ${fmt(v)}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '48px 0' }}>
              <p>No revenue data for this period</p>
            </div>
          )}
        </div>

        {/* Order status breakdown */}
        <div className="card">
          <div className="card-title">Orders by Status</div>
          {orderPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={orderPieData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} width={80} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {orderPieData.map((entry) => (
                    <Cell key={entry.name} fill={statusColors[entry.name] ?? '#9CA3AF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '48px 0' }}>
              <p>No order data</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Products + Payment breakdown ── */}
      {topProducts.length > 0 && (
        <div className="card">
          <div className="card-title">Top Products</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p: any, i: number) => (
                  <tr key={p.productId ?? i}>
                    <td className="text-muted">{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.productImage && (
                          <img src={p.productImage} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                        )}
                        <span style={{ fontWeight: 500 }}>{p.productName}</span>
                      </div>
                    </td>
                    <td>{p.unitsSold}</td>
                    <td style={{ fontWeight: 600 }}>PKR {fmt(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
