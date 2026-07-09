/**
 * client/src/pages/marketplace/EditMaterialPage.jsx
 *
 * Edit Material page — Phase M6B.
 * Route: /marketplace/vendor/materials/:id/edit
 *
 * On mount: fetches GET /marketplace/materials/:id to pre-fill form.
 * On submit: PATCH /marketplace/materials/:id
 * On success: toast "Changes saved!" + redirect to /marketplace/vendor/materials
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/Card';
import MaterialForm from '../../components/marketplace/MaterialForm';
import apiClient from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
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

// ─── Page ─────────────────────────────────────────────────────────────────────

function EditMaterialPage() {
  const navigate         = useNavigate();
  const { id }           = useParams();

  const [initialValues, setInitialValues] = useState(null);
  const [fetchLoading, setFetchLoading]   = useState(true);
  const [fetchError, setFetchError]       = useState('');
  const [isLoading, setIsLoading]         = useState(false);
  const [submitError, setSubmitError]     = useState('');
  const toast = useToast();

  // Fetch existing material on mount
  useEffect(() => {
    let active = true;
    async function fetchMaterial() {
      try {
        setFetchLoading(true);
        const res = await apiClient.get(`/marketplace/materials/${id}`);
        if (active) setInitialValues(res.data.material);
      } catch (err) {
        console.error('[EditMaterialPage] fetch error:', err);
        if (active) setFetchError('Failed to load material details. Please try again.');
      } finally {
        if (active) setFetchLoading(false);
      }
    }
    fetchMaterial();
    return () => { active = false; };
  }, [id]);

  async function handleSubmit(formData) {
    setIsLoading(true);
    setSubmitError('');
    try {
      await apiClient.patch(`/marketplace/materials/${id}`, formData);
      toast.success('Changes saved!');
      setTimeout(() => navigate('/marketplace/vendor/materials'), 1000);
    } catch (err) {
      console.error('[EditMaterialPage] submit error:', err);
      const msg = err?.response?.data?.messages?.join(', ')
        || err?.response?.data?.message
        || 'Failed to save changes. Please try again.';
      setSubmitError(msg);
      setIsLoading(false);
    }
  }

  return (
    <div className="msp-page">
      {/* Header */}
      <header className="msp-header">
        <Link to="/marketplace/vendor/materials" className="msp-back-btn" aria-label="Back to My Materials">
          <ArrowLeftIcon />
        </Link>
        <h2 className="msp-title">Edit Material</h2>
      </header>

      <Card surface="navy-secondary" padding="var(--space-6)">
        {fetchLoading ? (
          <div className="msp-loading">
            <div className="msp-skeleton-line pulse" />
            <div className="msp-skeleton-line pulse" style={{ width: '70%' }} />
            <div className="msp-skeleton-line pulse" style={{ width: '50%' }} />
          </div>
        ) : fetchError ? (
          <div className="msp-error-banner" role="alert">{fetchError}</div>
        ) : (
          <>
            {submitError && (
              <div className="msp-error-banner" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
                {submitError}
              </div>
            )}
            <MaterialForm
              initialValues={initialValues}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              submitLabel="Save Changes"
              loadingLabel="Saving Changes..."
            />
          </>
        )}
      </Card>
    </div>
  );
}

export default EditMaterialPage;
