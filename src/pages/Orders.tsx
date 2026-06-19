import React, { useEffect, useState } from 'react';
import { ShoppingCart, Search, Filter } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';

export const Orders: React.FC = () => {
  const { user } = useAuth();
  const isVendor = user?.role === Role.VENDOR;
  const endpoint = isVendor ? '/vendor/orders' : '/orders/admin';

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get(endpoint, { params });
      
      const items = res.data.data?.data || res.data.data?.orders || res.data.data || [];
      setOrders(items);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [endpoint, statusFilter]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h2>Orders</h2>
          <p className="text-muted mt-md">View and manage customer orders.</p>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ margin: 0, width: '200px' }}>
            <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex-center text-muted" style={{ padding: '3rem' }}>Loading orders...</div>
        ) : orders.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  {isVendor && <th>Product</th>}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any, idx: number) => {
                  const id = order.id || order.orderId;
                  const status = order.status || order.orderStatus;
                  const paymentStatus = order.paymentStatus;
                  const total = order.totalAmount || order.lineTotal;
                  const date = new Date(order.createdAt || order.orderedAt).toLocaleDateString();
                  const customerName = order.user ? `${order.user.firstName} ${order.user.lastName}` : order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Unknown';
                  
                  return (
                    <tr key={`${id}-${idx}`}>
                      <td style={{ fontFamily: 'monospace' }}>{id.slice(-8).toUpperCase()}</td>
                      <td>{customerName}</td>
                      <td>{date}</td>
                      <td>
                        <span className={`badge badge-${status === 'DELIVERED' ? 'success' : status === 'CANCELLED' ? 'danger' : 'primary'}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${paymentStatus === 'COMPLETED' ? 'success' : 'secondary'}`}>
                          {paymentStatus}
                        </span>
                      </td>
                      {isVendor && (
                        <td>
                          {order.product ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {order.product.image && <img src={order.product.image} alt="product" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />}
                              <span style={{ fontSize: '0.875rem' }}>{order.product.name} (x{order.quantity})</span>
                            </div>
                          ) : '-'}
                        </td>
                      )}
                      <td>${total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-center text-muted" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
            <ShoppingCart size={48} opacity={0.5} />
            <p>No orders found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
