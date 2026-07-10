import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import apiClient from '../../api/client';
import './VendorOrdersPage.css';

const STATUS_COLORS = {
  pending:    { bg: 'rgba(232,197,71,0.15)',  color: '#E8C547', label: 'Pending' },
  confirmed:  { bg: 'rgba(0,119,182,0.15)',   color: '#00b4d8', label: 'Confirmed' },
  shipped:    { bg: 'rgba(114,9,183,0.15)',   color: '#b5179e', label: 'Shipped' },
  delivered:  { bg: 'rgba(60,181,122,0.15)',  color: '#3CB57A', label: 'Delivered' },
  cancelled:  { bg: 'rgba(231,29,54,0.15)',   color: '#e71d36', label: 'Cancelled' },
};

const NEXT_STATUS = {
  pending:   'confirmed',
  confirmed: 'shipped',
  shipped:   'delivered',
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span className="vo-status-badge" style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.color}` }}>
      {s.label}
    </span>
  );
}

function VendorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [updateMessage, setUpdateMessage] = useState({});

  useEffect(() => {
    let active = true;
    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await apiClient.get('/marketplace/orders/received');
        if (!active) return;
        setOrders(res.data.orders || []);
      } catch (err) {
        if (!active) return;
        const data = err?.response?.data;
        setFetchError(data?.message || data?.error || 'Failed to load orders.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchOrders();
    return () => { active = false; };
  }, []);

  async function handleStatusUpdate(orderId, newStatus) {
    try {
      const res = await apiClient.patch(`/marketplace/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o._id === orderId ? res.data.order : o));
    } catch (err) {
      const data = err?.response?.data;
      alert(data?.message || data?.messages?.[0] || 'Failed to update status.');
    }
  }

  async function handleAddUpdate(orderId) {
    const msg = updateMessage[orderId];
    if (!msg || !msg.trim()) return;
    try {
      const res = await apiClient.post(`/marketplace/orders/${orderId}/updates`, { message: msg.trim() });
      setOrders(prev => prev.map(o => o._id === orderId ? res.data.order : o));
      setUpdateMessage(prev => ({ ...prev, [orderId]: '' }));
    } catch (err) {
      const data = err?.response?.data;
      alert(data?.message || data?.messages?.[0] || 'Failed to add update.');
    }
  }

  if (loading) {
    return (
      <div className="vo-page">
        <h2 className="vo-page__title">Received Orders</h2>
        <div className="vo-grid">
          {[1, 2, 3].map(i => (
            <Card key={i} surface="navy" className="vo-card vo-card--skeleton">
              <div className="skeleton-line pulse" style={{ width: '60%' }} />
              <div className="skeleton-line pulse" style={{ width: '40%' }} />
              <div className="skeleton-line pulse" style={{ width: '80%' }} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="vo-page">
        <h2 className="vo-page__title">Received Orders</h2>
        <Card surface="navy-secondary" padding="var(--space-6)" className="vo-empty-card">
          <p className="vo-error-text">{fetchError}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="vo-page">
        <h2 className="vo-page__title">Received Orders</h2>
        <Card surface="navy-secondary" className="vo-empty-card" padding="var(--space-6)">
          <div className="vo-empty-content">
            <h3 className="vo-empty-title">No orders yet</h3>
            <p className="vo-empty-subtitle">Orders from builders will appear here once they place them.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="vo-page">
      <h2 className="vo-page__title">Received Orders ({orders.length})</h2>
      <div className="vo-grid">
        {orders.map(order => (
          <Card key={order._id} surface="navy" className="vo-card">
            <div className="vo-card__top">
              <div>
                <p className="vo-card__material-name">{order.material?.name || 'Material'}</p>
                {order.material?.brand && <p className="vo-card__brand">{order.material.brand}</p>}
              </div>
              <StatusBadge status={order.status} />
            </div>

            <p className="vo-card__builder">Ordered by {order.builder?.name || 'Unknown'}</p>
            {order.builder?.email && <p className="vo-card__builder-contact">{order.builder.email}</p>}

            <div className="vo-card__details">
              <div className="vo-card__detail">
                <span className="vo-detail-label">Qty</span>
                <span className="vo-detail-value">{order.quantity} {order.material?.unit || ''}</span>
              </div>
              <div className="vo-card__detail">
                <span className="vo-detail-label">Total</span>
                <span className="vo-detail-value vo-detail-value--price">₹{order.totalCost?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="vo-card__contact">
              <p className="vo-contact-row"><span className="vo-contact-label">Deliver to:</span> {order.deliveryAddress}</p>
              <p className="vo-contact-row"><span className="vo-contact-label">Phone:</span> {order.contactPhone}</p>
            </div>

            {order.notes && (
              <p className="vo-card__notes">Notes: {order.notes}</p>
            )}

            {order.deliveryUpdates && order.deliveryUpdates.length > 0 && (
              <div className="vo-card__updates">
                <p className="vo-updates-title">Delivery Updates</p>
                {order.deliveryUpdates.map((u, i) => (
                  <p key={i} className="vo-update-item">
                    <span className="vo-update-time">{new Date(u.createdAt).toLocaleDateString()}</span>
                    {u.message}
                  </p>
                ))}
              </div>
            )}

            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div className="vo-card__actions">
                <div className="vo-status-actions">
                  {NEXT_STATUS[order.status] && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStatusUpdate(order._id, NEXT_STATUS[order.status])}
                    >
                      Mark as {NEXT_STATUS[order.status]}
                    </Button>
                  )}
                  {order.status === 'pending' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                    >
                      Cancel Order
                    </Button>
                  )}
                </div>

                <div className="vo-update-form">
                  <input
                    className="vo-update-input"
                    type="text"
                    placeholder="Add delivery update..."
                    value={updateMessage[order._id] || ''}
                    onChange={(e) => setUpdateMessage(prev => ({ ...prev, [order._id]: e.target.value }))}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!updateMessage[order._id]?.trim()}
                    onClick={() => handleAddUpdate(order._id)}
                  >
                    Send
                  </Button>
                </div>
              </div>
            )}

            <p className="vo-card__date">Ordered {new Date(order.createdAt).toLocaleDateString()}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default VendorOrdersPage;
