import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ShoppingCart, X, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';

/* ── Badge helpers ── */
const orderStatusBadge: Record<string, string> = {
  PENDING:    'badge-pending',
  CONFIRMED:  'badge-processing',
  PROCESSING: 'badge-processing',
  SHIPPED:    'badge-shipped',
  DELIVERED:  'badge-delivered',
  CANCELLED:  'badge-cancelled',
  REFUNDED:   'badge-refunded',
};

const paymentBadge: Record<string, string> = {
  UNPAID:               'badge-unpaid',
  PENDING_VERIFICATION: 'badge-pending_verification',
  PAID:                 'badge-paid',
  REFUNDED:             'badge-refunded',
  FAILED:               'badge-failed',
};

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const PAYMENT_STATUSES = ['UNPAID', 'PENDING_VERIFICATION', 'PAID', 'REFUNDED', 'FAILED'];

/* ─── Order Detail Modal ──────────────────────────────────────────────────── */
interface OrderDetailProps {
  order: any;
  isExec: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const OrderDetailModal: React.FC<OrderDetailProps> = ({ order, isExec, onClose, onUpdated }) => {
  const [status, setStatus]         = useState(order.status ?? order.orderStatus ?? '');
  const [payStatus, setPayStatus]   = useState(order.paymentStatus ?? '');
  const [tracking, setTracking]     = useState(order.trackingNumber ?? '');
  const [refundReason, setRefund]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  const orderId = order.id ?? order.orderId;

  const save = async (fn: () => Promise<void>) => {
    try {
      setSaving(true);
      setError('');
      await fn();
      onUpdated();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Order Details</div>
            <div className="text-sm text-muted mono" style={{ marginTop: 2 }}>
              {orderId?.slice(-12).toUpperCase()}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '8px 12px', marginBottom: 14, fontSize: 13, color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          {/* Info rows */}
          <div className="detail-row">
            <div className="detail-label">Customer</div>
            <div className="detail-value">
              {order.user
                ? `${order.user.firstName} ${order.user.lastName}`
                : order.customer
                ? `${order.customer.firstName} ${order.customer.lastName}`
                : '—'}
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Date</div>
            <div className="detail-value">
              {order.createdAt ? new Date(order.createdAt).toLocaleString() : order.orderedAt ? new Date(order.orderedAt).toLocaleString() : '—'}
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Total Amount</div>
            <div className="detail-value" style={{ fontWeight: 600 }}>
              PKR {order.totalAmount ?? order.lineTotal ?? '—'}
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Payment Method</div>
            <div className="detail-value">{order.paymentMethod ?? '—'}</div>
          </div>

          {order.trackingNumber && (
            <div className="detail-row">
              <div className="detail-label">Tracking #</div>
              <div className="detail-value mono">{order.trackingNumber}</div>
            </div>
          )}

          {order.notes && (
            <div className="detail-row">
              <div className="detail-label">Notes</div>
              <div className="detail-value">{order.notes}</div>
            </div>
          )}

          <hr className="divider" />

          {/* Actions — executive only */}
          {isExec ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Status */}
              <div>
                <div className="form-label" style={{ marginBottom: 6 }}>Order Status</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    className="form-control"
                    style={{ width: 'auto', flex: '1 1 160px' }}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={saving}
                    onClick={() => save(() => api.patch(`/orders/admin/${orderId}/status`, { status }))}
                  >
                    Update Status
                  </button>
                </div>
              </div>

              {/* Payment status */}
              <div>
                <div className="form-label" style={{ marginBottom: 6 }}>Payment Status</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    className="form-control"
                    style={{ width: 'auto', flex: '1 1 160px' }}
                    value={payStatus}
                    onChange={(e) => setPayStatus(e.target.value)}
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={saving}
                    onClick={() => save(() => api.patch(`/orders/admin/${orderId}/payment-status`, { paymentStatus: payStatus }))}
                  >
                    Update Payment
                  </button>
                </div>
              </div>

              {/* Tracking */}
              <div>
                <div className="form-label" style={{ marginBottom: 6 }}>Tracking Number</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ flex: '1 1 160px' }}
                    placeholder="e.g. TCS-123456"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                  />
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={saving || !tracking.trim()}
                    onClick={() => save(() => api.patch(`/orders/admin/${orderId}/tracking`, { trackingNumber: tracking }))}
                  >
                    Save Tracking
                  </button>
                </div>
              </div>

              {/* Refund */}
              <div>
                <div className="form-label" style={{ marginBottom: 6 }}>Issue Refund</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ flex: '1 1 160px' }}
                    placeholder="Reason for refund…"
                    value={refundReason}
                    onChange={(e) => setRefund(e.target.value)}
                  />
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={saving || !refundReason.trim()}
                    onClick={() => save(() => api.patch(`/orders/admin/${orderId}/refund`, { refundReason }))}
                  >
                    Issue Refund
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Vendor read-only */
            <div style={{ display: 'flex', gap: 12 }}>
              <div>
                <div className="form-label">Order Status</div>
                <span className={`badge ${orderStatusBadge[status] ?? 'badge-neutral'}`} style={{ marginTop: 4 }}>{status}</span>
              </div>
              <div>
                <div className="form-label">Payment</div>
                <span className={`badge ${paymentBadge[payStatus] ?? 'badge-neutral'}`} style={{ marginTop: 4 }}>{payStatus}</span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ─── Orders Page ─────────────────────────────────────────────────────────── */
export const Orders: React.FC = () => {
  const { user } = useAuth();
  const isVendor = user?.role === Role.VENDOR;
  const isExec   = user?.role === Role.EXECUTIVE;
  const endpoint = isVendor ? '/vendor/orders' : '/orders/admin';

  const [orders, setOrders]             = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected]         = useState<any>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get(endpoint, { params });
      const body = res.data.data;
      // Both vendor and exec endpoints return { data: [], total }
      setOrders(Array.isArray(body) ? body : (body?.data ?? []));
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleUpdated = () => { setSelected(null); fetchOrders(); };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Orders</div>
          <div className="page-subtitle">
            {isExec ? 'Manage and update all customer orders' : 'Your product orders'}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-row"><div className="spinner" /> Loading orders…</div>
        ) : orders.length > 0 ? (
          <div className="table-wrap">
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
                  {isExec && <th></th>}
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any, idx: number) => {
                  const id          = order.id ?? order.orderId;
                  const status      = order.status ?? order.orderStatus ?? '';
                  const payStatus   = order.paymentStatus ?? '';
                  const total       = order.totalAmount ?? order.lineTotal ?? '—';
                  const dateStr     = order.createdAt ?? order.orderedAt;
                  const date        = dateStr ? new Date(dateStr).toLocaleDateString() : '—';
                  const customerName = order.user
                    ? `${order.user.firstName} ${order.user.lastName}`
                    : order.customer
                    ? `${order.customer.firstName} ${order.customer.lastName}`
                    : '—';

                  return (
                    <tr key={`${id}-${idx}`} className="clickable" onClick={() => setSelected(order)}>
                      <td className="mono" style={{ color: 'var(--text-2)' }}>
                        {id ? id.slice(-8).toUpperCase() : '—'}
                      </td>
                      <td style={{ fontWeight: 500 }}>{customerName}</td>
                      <td className="text-muted">{date}</td>
                      <td>
                        <span className={`badge ${orderStatusBadge[status] ?? 'badge-neutral'}`}>{status || '—'}</span>
                      </td>
                      <td>
                        <span className={`badge ${paymentBadge[payStatus] ?? 'badge-neutral'}`}>{payStatus || '—'}</span>
                      </td>
                      {isVendor && (
                        <td>
                          {order.product ? (
                            <div className="flex items-center gap-2">
                              {order.product.image && (
                                <img src={order.product.image} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                              )}
                              <span>{order.product.name}</span>
                            </div>
                          ) : '—'}
                        </td>
                      )}
                      <td style={{ fontWeight: 500 }}>PKR {total}</td>
                      {isExec && (
                        <td style={{ width: 32 }}>
                          <ChevronRight size={14} color="var(--text-3)" />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ShoppingCart size={36} color="var(--text-3)" />
            <p>No orders found</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <OrderDetailModal
          order={selected}
          isExec={isExec}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
};
