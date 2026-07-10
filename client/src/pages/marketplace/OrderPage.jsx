import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import apiClient from '../../api/client';
import './OrderPage.css';

function OrderPage() {
  const { materialId } = useParams();
  const navigate = useNavigate();

  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let active = true;
    async function fetchMaterial() {
      try {
        const res = await apiClient.get(`/marketplace/materials/${materialId}`);
        if (!active) return;
        setMaterial(res.data.material);
      } catch (err) {
        if (!active) return;
        setFetchError(err?.response?.data?.message || 'Failed to load material.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchMaterial();
    return () => { active = false; };
  }, [materialId]);

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = [];
    if (!quantity || quantity < 1) errs.push('Quantity must be at least 1.');
    if (!deliveryAddress.trim()) errs.push('Delivery address is required.');
    if (!contactPhone.trim()) errs.push('Contact phone is required.');
    if (errs.length > 0) {
      setSubmitError(errs.join(' '));
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      await apiClient.post('/marketplace/orders', {
        materialId,
        quantity: Number(quantity),
        deliveryAddress: deliveryAddress.trim(),
        contactPhone: contactPhone.trim(),
        notes: notes.trim() || undefined,
      });
      navigate('/marketplace/builder/orders', { replace: true });
    } catch (err) {
      const data = err?.response?.data;
      setSubmitError(data?.message || data?.messages?.[0] || data?.error || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="order-page">
        <div className="order-page__skeleton pulse" />
      </div>
    );
  }

  if (fetchError || !material) {
    return (
      <div className="order-page">
        <Card surface="navy-secondary" padding="var(--space-6)" className="order-page__error">
          <p>{fetchError || 'Material not found.'}</p>
          <Button as={Link} to="/marketplace/builder/materials" variant="secondary">Back to Materials</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="order-page">
      <header className="order-page__header">
        <Link to="/marketplace/builder/materials" className="order-page__back">&larr; Back to Materials</Link>
        <h2 className="order-page__title">Place Order</h2>
      </header>

      <div className="order-page__content">
        <Card surface="navy" className="order-page__material-summary">
          <p className="order-page__material-name">{material.name}</p>
          {material.brand && <p className="order-page__material-brand">{material.brand}</p>}
          <p className="order-page__material-price">
            ₹{material.pricePerUnit.toLocaleString('en-IN')} <span className="order-page__unit">/{material.unit}</span>
          </p>
          <p className="order-page__material-vendor">Supplied by {material.vendor?.name || 'Unknown Vendor'}</p>
          {material.vendor?.email && <p className="order-page__material-vendor">Vendor email: {material.vendor.email}</p>}
        </Card>

        <form className="order-page__form" onSubmit={handleSubmit}>
          {submitError && <p className="order-page__form-error" role="alert">{submitError}</p>}

          <div className="order-page__field">
            <label className="order-page__label" htmlFor="order-qty">Quantity ({material.unit})</label>
            <input
              id="order-qty"
              type="number"
              className="order-page__input"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              required
            />
          </div>

          <div className="order-page__field">
            <label className="order-page__label" htmlFor="order-address">Delivery Address</label>
            <textarea
              id="order-address"
              className="order-page__textarea"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter full delivery address"
              rows="3"
              required
            />
          </div>

          <div className="order-page__field">
            <label className="order-page__label" htmlFor="order-phone">Contact Phone</label>
            <input
              id="order-phone"
              type="tel"
              className="order-page__input"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g. +91-9876543210"
              required
            />
          </div>

          <div className="order-page__field">
            <label className="order-page__label" htmlFor="order-notes">Notes (optional)</label>
            <textarea
              id="order-notes"
              className="order-page__textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions for the vendor"
              rows="2"
            />
          </div>

          <div className="order-page__total">
            <span>Total: </span>
            <span className="order-page__total-amount">₹{(quantity * material.pricePerUnit).toLocaleString('en-IN')}</span>
          </div>

          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Placing Order...' : 'Place Order'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default OrderPage;
