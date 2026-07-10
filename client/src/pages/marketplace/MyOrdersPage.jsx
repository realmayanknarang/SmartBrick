import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import apiClient from '../../api/client';
import './MyOrdersPage.css';

const STATUS_COLORS = {
  pending:    { bg: 'rgba(232,197,71,0.15)',  color: '#E8C547', label: 'Pending' },
  confirmed:  { bg: 'rgba(0,119,182,0.15)',   color: '#00b4d8', label: 'Confirmed' },
  shipped:    { bg: 'rgba(114,9,183,0.15)',   color: '#b5179e', label: 'Shipped' },
  delivered:  { bg: 'rgba(60,181,122,0.15)',  color: '#3CB57A', label: 'Delivered' },
  cancelled:  { bg: 'rgba(231,29,54,0.15)',   color: '#e71d36', label: 'Cancelled' },
};

function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    let active = true;
    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await apiClient.get('/marketplace/orders/my');
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

  function statusBadge(status) {
    const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
    return (
      <span className="mo-status-badge" style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.color}` }}>
        {s.label}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="mo-page">
        <h2 className="mo-page__title">My Orders</h2>
        <div className="mo-grid">
          {[1, 2, 3].map(i => (
            <Card key={i} surface="navy" className="mo-card mo-card--skeleton">
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
      <div className="mo-page">
        <h2 className="mo-page__title">My Orders</h2>
        <Card surface="navy-secondary" padding="var(--space-6)" className="mo-empty-card">
          <p className="mo-error-text">{fetchError}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mo-page">
        <h2 className="mo-page__title">My Orders</h2>
        <Card surface="navy-secondary" className="mo-empty-card" padding="var(--space-6)">
          <div className="mo-empty-content">
            <h3 className="mo-empty-title">No orders yet</h3>
            <p className="mo-empty-subtitle">Browse materials and place your first order.</p>
            <Button as={Link} to="/marketplace/builder/materials" variant="primary">Browse Materials</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mo-page">
      <header className="mo-page__header">
        <h2 className="mo-page__title">My Orders</h2>
        <Button as={Link} to="/marketplace/builder/materials" variant="secondary" size="sm">Browse Materials</Button>
      </header>

      <div className="mo-grid">
        {orders.map(order => (
          <Card key={order._id} surface="navy" className="mo-card">
            <div className="mo-card__top">
              <span className="mo-card__material-name">{order.material?.name || 'Material'}</span>
              {statusBadge(order.status)}
            </div>

            {order.material?.brand && (
              <p className="mo-card__brand">{order.material.brand}</p>
            )}

            <div className="mo-card__details">
              <div className="mo-card__detail">
                <span className="mo-detail-label">Quantity</span>
                <span className="mo-detail-value">{order.quantity} {order.material?.unit || ''}</span>
              </div>
              <div className="mo-card__detail">
                <span className="mo-detail-label">Total</span>
                <span className="mo-detail-value mo-detail-value--price">₹{order.totalCost?.toLocaleString('en-IN')}</span>
              </div>
              <div className="mo-card__detail">
                <span className="mo-detail-label">Vendor</span>
                <span className="mo-detail-value">{order.vendor?.name || 'N/A'}</span>
              </div>
            </div>

            <div className="mo-card__contact">
              <p className="mo-contact-row"><span className="mo-contact-label">Delivery:</span> {order.deliveryAddress}</p>
              <p className="mo-contact-row"><span className="mo-contact-label">Phone:</span> {order.contactPhone}</p>
            </div>

            {order.notes && (
              <p className="mo-card__notes">{order.notes}</p>
            )}

            {order.deliveryUpdates && order.deliveryUpdates.length > 0 && (
              <div className="mo-card__updates">
                <p className="mo-updates-title">Delivery Updates</p>
                {order.deliveryUpdates.map((u, i) => (
                  <p key={i} className="mo-update-item">
                    <span className="mo-update-time">{new Date(u.createdAt).toLocaleDateString()}</span>
                    {u.message}
                  </p>
                ))}
              </div>
            )}

            <p className="mo-card__date">Ordered {new Date(order.createdAt).toLocaleDateString()}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default MyOrdersPage;
