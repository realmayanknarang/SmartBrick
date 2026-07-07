/**
 * client/src/pages/marketplace/AddMaterialPage.jsx
 *
 * Add New Material page — Phase M6B.
 * Route: /marketplace/vendor/materials/new
 *
 * Uses the shared MaterialForm component.
 * On submit: POST /api/marketplace/materials
 * On success: toast + redirect to /marketplace/vendor/materials
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import MaterialForm from '../../components/marketplace/MaterialForm';
import './MaterialPageShared.css';

// ─── Back Arrow Icon ──────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div className={`msp-toast msp-toast--${type}`} role="alert" aria-live="assertive">
      {message}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

import apiClient from '../../api/client';

function AddMaterialPage() {
  const navigate    = useNavigate();
  const [isLoading, setIsLoading]   = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [toast, setToast]           = useState({ message: '', type: 'success' });

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  }

  async function handleSubmit(formData) {
    setIsLoading(true);
    setSubmitError('');
    try {
      await apiClient.post('/api/marketplace/materials', formData);
      showToast('Material added successfully!');
      setTimeout(() => navigate('/marketplace/vendor/materials'), 1000);
    } catch (err) {
      console.error('[AddMaterialPage] submit error:', err);
      const msg = err?.response?.data?.messages?.join(', ')
        || err?.response?.data?.message
        || 'Failed to add material. Please try again.';
      setSubmitError(msg);
      setIsLoading(false);
    }
  }

  return (
    <div className="msp-page">
      <Toast message={toast.message} type={toast.type} />

      {/* Header */}
      <header className="msp-header">
        <Link to="/marketplace/vendor/materials" className="msp-back-btn" aria-label="Back to My Materials">
          <ArrowLeftIcon />
        </Link>
        <h2 className="msp-title">Add New Material</h2>
      </header>

      <Card surface="navy-secondary" padding="var(--space-6)">
        {submitError && (
          <div className="msp-error-banner" role="alert">
            {submitError}
          </div>
        )}
        <MaterialForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Add Material"
        />
      </Card>
    </div>
  );
}

export default AddMaterialPage;
