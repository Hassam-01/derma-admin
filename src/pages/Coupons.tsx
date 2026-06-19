import React, { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';

export const Coupons: React.FC = () => {
  const { user } = useAuth();
  const isVendor = user?.role === Role.VENDOR;
  const endpoint = isVendor ? '/vendor/coupons' : '/executive/analytics/coupons';

  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageRate, setUsageRate] = useState(0);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get(endpoint);
      const data = res.data.data;
      setCoupons(data?.data || data?.items || []);
      setUsageRate(data?.couponUsageRate || 0);
    } catch (err) {
      console.error('Failed to fetch coupons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [endpoint]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h2>Coupons Performance</h2>
          <p className="text-muted mt-md">View the performance and usage of discount coupons.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="stat-card glass-panel animate-slide-up">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Tag size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{usageRate}%</h3>
            <p className="stat-label">Coupon Usage Rate (Orders with coupons)</p>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        {loading ? (
          <div className="flex-center text-muted" style={{ padding: '3rem' }}>Loading coupons...</div>
        ) : coupons.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Times Used</th>
                  <th>Total Discount Given</th>
                  <th>Associated Revenue</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon: any, idx: number) => (
                  <tr key={coupon.couponCode || idx}>
                    <td><span className="badge badge-primary">{coupon.couponCode}</span></td>
                    <td>{coupon.usedCount}</td>
                    <td>${coupon.totalDiscountGiven}</td>
                    <td>${coupon.associatedRevenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-center text-muted" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
            <Tag size={48} opacity={0.5} />
            <p>No coupon data found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
