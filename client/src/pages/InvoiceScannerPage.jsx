/**
 * client/src/pages/InvoiceScannerPage.jsx
 *
 * Invoice OCR Scanner — Phase 7C (client)
 * ─────────────────────────────────────────────────────────────────────────────
 * Lets the user upload an invoice/bill image and extract structured data via
 * Groq's vision model (qwen/qwen3.6-27b) through the backend OCR route.
 *
 * Layout
 * ──────
 * • Drop-zone / file-picker (images only, ≤ 20 MB)
 * • Thumbnail preview of the selected image
 * • "Scan Invoice" CTA → POST /api/ocr/scan-invoice (multipart)
 * • Loading skeleton while the model processes
 * • Extracted data rendered in a clean Card layout
 * • Graceful error state with actionable message
 */

import { useState, useRef, useCallback } from 'react';
import { useLocation }                   from 'react-router-dom';
import { useUser, SignOutButton }         from '@clerk/clerk-react';
import { Link }                          from 'react-router-dom';
import Sidebar                           from '../components/Sidebar';
import Card                              from '../components/Card';
import apiClient                         from '../api/client';
import './InvoiceScannerPage.css';

// ─── Sidebar nav items (same set as DashboardPage) ────────────────────────────

function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" />
    </svg>
  );
}
function SitesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L3 7v11h4v-5h6v5h4V7L10 2z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
function VendorsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="6" r="3.5" fill="currentColor" />
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function ReportsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <line x1="6" y1="7"  x2="14" y2="7"  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="13" x2="11" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function AlertsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L2 16h16L10 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="currentColor" opacity="0.15" />
      <line x1="10" y1="8"  x2="10" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="0.9" fill="currentColor" />
    </svg>
  );
}
function ScannerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12h5M14.5 12v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function WeatherIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 14c0-1.1.9-2 2-2h6a2 2 0 110 4H7a2 2 0 01-2-2z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4l5 2 6-2 5 2v12l-5-2-6 2-5-2V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="7" y1="6" x2="7" y2="18" stroke="currentColor" strokeWidth="1.2" />
      <line x1="13" y1="2" x2="13" y2="16" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function LeafIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 4C16 4 14 12 8 14C5 15 3 16 3 16C3 16 4 12 7 9C10 6 16 4 16 4Z" fill="currentColor" opacity="0.6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M3 16C5 13 8 11 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

const NAV_ITEMS = [
  { icon: <OverviewIcon />,  label: 'Overview',       path: '/dashboard' },
  { icon: <SitesIcon />,     label: 'Sites',          path: '/dashboard/sites' },
  { icon: <VendorsIcon />,   label: 'Vendors',        path: '/dashboard/vendors' },
  { icon: <ReportsIcon />,   label: 'Analytics',      path: '/dashboard/analytics' },
  { icon: <AlertsIcon />,    label: 'Alerts',         path: '/dashboard/alerts' },
  { icon: <ScannerIcon />, label: 'Invoice OCR', path: '/dashboard/invoice-scanner', dividerBefore: true },
  { icon: <WeatherIcon />,   label: 'Weather Alerts', path: '/dashboard/weather' },
  { icon: <MapIcon />,       label: 'Logistics',      path: '/dashboard/logistics' },
  { icon: <LeafIcon />,      label: 'Sustainability',  path: '/dashboard/carbon' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount, currency = 'INR') {
  if (amount == null) return '—';
  const symbol = currency === 'INR' ? '₹' : '$';
  return `${symbol}${Number(amount).toLocaleString('en-IN')}`;
}

// ─── Upload icon SVG ──────────────────────────────────────────────────────────
function UploadIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="23" fill="currentColor" opacity="0.07" />
      <path d="M24 32V20M24 20l-5 5M24 20l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="33" width="20" height="2.5" rx="1.25" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function InvoiceScannerPage() {
  const { pathname }    = useLocation();
  const { user }        = useUser();
  const fileInputRef    = useRef(null);

  const [selectedFile,   setSelectedFile]   = useState(null);
  const [previewUrl,     setPreviewUrl]     = useState(null);
  const [scanning,       setScanning]       = useState(false);
  const [result,         setResult]         = useState(null);   // extracted OCR data
  const [error,          setError]          = useState(null);
  const [dragOver,       setDragOver]       = useState(false);

  // ── File selection ──────────────────────────────────────────────────────────

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WEBP, etc.)');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Image must be under 20 MB.');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  }, []);

  const onFileChange = (e) => handleFile(e.target.files[0]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Scan ────────────────────────────────────────────────────────────────────

  async function handleScan() {
    if (!selectedFile) return;

    setScanning(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('invoice', selectedFile);

    try {
      const { data } = await apiClient.post('/ocr/scan-invoice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,  // vision models can take up to ~30–45 s
      });
      setResult(data.data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Scanning failed. Please check your connection and try again.';
      setError(msg);
    } finally {
      setScanning(false);
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    'there';

  return (
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        {/* Top bar */}
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Invoice Scanner</h1>
          </div>
          <div className="dash-topbar__right">
            <Link to="/dashboard" className="dash-topbar__link">Overview</Link>
            <Link to="/" className="dash-topbar__link">Home</Link>
            <SignOutButton>
              <button className="dash-topbar__signout" id="invoice-scanner-signout-btn">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </header>

        <div className="dash-content">

          {/* Page intro */}
          <section className="ocr-intro" aria-label="Invoice scanner description">
            <p className="ocr-intro__label">AI-Powered Extraction</p>
            <h2 className="ocr-intro__heading">Scan an Invoice or Bill</h2>
            <p className="ocr-intro__sub">
              Upload a clear photo or scan of any invoice. Our AI vision model
              extracts vendor details, line items, totals, and GSTIN automatically.
            </p>
          </section>

          <div className="ocr-layout">
            {/* ── Upload panel ─────────────────────────────────────────────── */}
            <Card surface="navy-secondary" className="ocr-upload-card">
              <h3 className="ocr-section-heading">Upload Invoice</h3>

              {/* Drop zone */}
              <div
                className={['ocr-dropzone', dragOver ? 'ocr-dropzone--over' : ''].filter(Boolean).join(' ')}
                role="button"
                tabIndex={0}
                aria-label="Click or drag to upload invoice image"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Selected invoice preview"
                    className="ocr-dropzone__preview"
                  />
                ) : (
                  <div className="ocr-dropzone__placeholder">
                    <span className="ocr-dropzone__icon" style={{ color: 'var(--color-accent)' }}>
                      <UploadIcon />
                    </span>
                    <p className="ocr-dropzone__primary">Drop your invoice here</p>
                    <p className="ocr-dropzone__secondary">or click to browse (JPEG, PNG, WEBP · max 20 MB)</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="ocr-file-input"
                id="ocr-file-input"
                aria-label="Invoice image file input"
              />

              {/* Selected file name */}
              {selectedFile && (
                <p className="ocr-filename">
                  📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </p>
              )}

              {/* Error banner */}
              {error && (
                <div className="ocr-error" role="alert">
                  <span className="ocr-error__icon">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="ocr-actions">
                <button
                  className="ocr-btn ocr-btn--primary"
                  id="ocr-scan-btn"
                  onClick={handleScan}
                  disabled={!selectedFile || scanning}
                >
                  {scanning ? (
                    <>
                      <span className="ocr-spinner" aria-hidden="true" />
                      Scanning…
                    </>
                  ) : (
                    '🔍 Scan Invoice'
                  )}
                </button>

                {(selectedFile || result) && (
                  <button
                    className="ocr-btn ocr-btn--ghost"
                    id="ocr-reset-btn"
                    onClick={handleReset}
                    disabled={scanning}
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Tips */}
              <div className="ocr-tips">
                <p className="ocr-tips__heading">Tips for best results</p>
                <ul className="ocr-tips__list">
                  <li>Use a clear, straight-on photo with good lighting</li>
                  <li>Ensure all text is in focus and readable</li>
                  <li>Works with printed and digital invoices</li>
                  <li>Supports English and bilingual (English + Hindi) invoices</li>
                </ul>
              </div>
            </Card>

            {/* ── Results panel ────────────────────────────────────────────── */}
            <div className="ocr-results-col">
              {!result && !scanning && !error && (
                <Card surface="navy-secondary" className="ocr-empty-state">
                  <div className="ocr-empty-state__inner">
                    <span className="ocr-empty-state__icon">📄</span>
                    <p className="ocr-empty-state__heading">Extraction results will appear here</p>
                    <p className="ocr-empty-state__sub">Upload an invoice and click "Scan Invoice" to begin</p>
                  </div>
                </Card>
              )}

              {scanning && (
                <Card surface="navy-secondary" className="ocr-scanning-state">
                  <div className="ocr-scanning-state__inner">
                    <div className="ocr-scanning-state__pulse" aria-hidden="true" />
                    <p className="ocr-scanning-state__heading">Analysing invoice…</p>
                    <p className="ocr-scanning-state__sub">
                      The AI model is reading your document. This typically takes 10–30 seconds.
                    </p>
                    {/* Animated bar */}
                    <div className="ocr-scanning-state__bar" aria-hidden="true">
                      <div className="ocr-scanning-state__bar-fill" />
                    </div>
                  </div>
                </Card>
              )}

              {result && !scanning && (
                <div className="ocr-result">
                  {/* Header */}
                  <Card surface="navy-secondary" className="ocr-result__header-card">
                    <div className="ocr-result__meta-row">
                      <div>
                        <p className="ocr-result__meta-label">Vendor</p>
                        <p className="ocr-result__meta-value ocr-result__meta-value--lg">
                          {result.vendorName || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="ocr-result__meta-label">Invoice No.</p>
                        <p className="ocr-result__meta-value">
                          {result.invoiceNumber || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="ocr-result__meta-label">Date</p>
                        <p className="ocr-result__meta-value">
                          {result.invoiceDate || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="ocr-result__meta-label">GSTIN</p>
                        <p className="ocr-result__meta-value">
                          {result.gstin || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="ocr-result__meta-label">Confidence</p>
                        <span
                          className={[
                            'ocr-confidence-badge',
                            `ocr-confidence-badge--${result.confidence ?? 'low'}`,
                          ].join(' ')}
                        >
                          {result.confidence ?? 'unknown'}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Line items */}
                  {result.lineItems?.length > 0 && (
                    <Card surface="navy-secondary" className="ocr-result__items-card">
                      <h3 className="ocr-section-heading">Line Items</h3>
                      <div className="ocr-table-wrap">
                        <table className="ocr-table" aria-label="Invoice line items">
                          <thead>
                            <tr>
                              <th>Description</th>
                              <th>Qty</th>
                              <th>Unit</th>
                              <th>Unit Price</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.lineItems.map((item, i) => (
                              <tr key={i}>
                                <td>{item.description || '—'}</td>
                                <td>{item.quantity ?? '—'}</td>
                                <td>{item.unit || '—'}</td>
                                <td>{item.unitPrice != null ? formatCurrency(item.unitPrice, result.currency) : '—'}</td>
                                <td>{item.amount    != null ? formatCurrency(item.amount,    result.currency) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}

                  {/* Totals */}
                  <Card surface="navy-secondary" className="ocr-result__totals-card">
                    <h3 className="ocr-section-heading">Totals</h3>
                    <div className="ocr-totals-grid">
                      {result.subtotal != null && (
                        <div className="ocr-totals-row">
                          <span className="ocr-totals-label">Subtotal</span>
                          <span className="ocr-totals-value">{formatCurrency(result.subtotal, result.currency)}</span>
                        </div>
                      )}
                      {result.taxAmount != null && (
                        <div className="ocr-totals-row">
                          <span className="ocr-totals-label">Tax {result.taxRate ? `(${result.taxRate})` : ''}</span>
                          <span className="ocr-totals-value">{formatCurrency(result.taxAmount, result.currency)}</span>
                        </div>
                      )}
                      <div className="ocr-totals-row ocr-totals-row--total">
                        <span className="ocr-totals-label">Total</span>
                        <span className="ocr-totals-value ocr-totals-value--highlight">
                          {result.total != null ? formatCurrency(result.total, result.currency) : '—'}
                        </span>
                      </div>
                    </div>
                    {result.paymentTerms && (
                      <p className="ocr-payment-terms">💳 {result.paymentTerms}</p>
                    )}
                    {result.notes && (
                      <p className="ocr-notes">📝 {result.notes}</p>
                    )}
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default InvoiceScannerPage;
