/**
 * client/src/pages/PoolingPage.jsx
 *
 * Order Pooling Estimator — Phase 11E
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SignOutButton } from '@clerk/clerk-react';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import { NAV_ITEMS } from '../config/dashboardNav.jsx';
import apiClient from '../api/client';
import './DashboardPage.css';
import './PoolingPage.css';

const CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'cement', label: 'Cement' },
  { value: 'steel', label: 'Steel' },
  { value: 'sand', label: 'Sand' },
  { value: 'bricks', label: 'Bricks' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
];

function formatINR(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

function PoolingPage() {
  const { pathname } = useLocation();
  const [orders, setOrders]           = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selected, setSelected]       = useState(new Set());
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult]           = useState(null);
  const [calcError, setCalcError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);
    setSelected(new Set());

    const params = categoryFilter ? { category: categoryFilter } : {};
    apiClient.get('/pooling/orders', { params })
      .then(({ data }) => {
        if (!cancelled) {
          setOrders(data.orders ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load orders.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [categoryFilter]);

  const selectedCategories = useMemo(() => {
    const cats = new Set();
    for (const id of selected) {
      const order = orders.find(o => o._id === id);
      if (order?.category) cats.add(order.category);
    }
    return [...cats];
  }, [selected, orders]);

  const crossCategory = selectedCategories.length > 1;

  function toggleOrder(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setResult(null);
    setCalcError(null);
  }

  async function handleCalculate() {
    if (selected.size < 2) {
      setCalcError('Select at least 2 orders.');
      return;
    }
    if (crossCategory) {
      setCalcError('Selected orders span multiple categories — pooling only applies within one material type.');
      return;
    }

    setCalculating(true);
    setCalcError(null);
    setResult(null);

    try {
      const { data } = await apiClient.post('/pooling/estimate', {
        orderIds: [...selected],
      });
      setResult(data);
    } catch (err) {
      setCalcError(err?.response?.data?.message || 'Calculation failed.');
    } finally {
      setCalculating(false);
    }
  }

  return (
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Order Pooling</h1>
          </div>
          <div className="dash-topbar__right">
            <Link to="/dashboard" className="dash-topbar__link">Overview</Link>
            <SignOutButton>
              <button className="dash-topbar__signout">Sign out</button>
            </SignOutButton>
          </div>
        </header>

        <div className="dash-content">
          <section className="dash-welcome">
            <h2 className="dash-welcome__name">Pooling Estimator</h2>
            <p className="dash-welcome__sub">
              Select orders of the same material category to estimate bulk discount savings.
              No orders are actually combined — this is a what-if calculation.
            </p>
          </section>

          <div className="pooling-layout">
            <Card surface="navy-secondary" padding="var(--space-5)">
              <h3 className="reports-card__title">Select Orders</h3>

              <div className="pooling-filters">
                <label>
                  Material category
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value || 'all'} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              {loading && <p className="pooling-order-item__meta">Loading orders…</p>}
              {error && <p className="pooling-error">{error}</p>}

              {!loading && !error && (
                <>
                  <div className="pooling-order-list">
                    {orders.length === 0 ? (
                      <p className="pooling-order-item__meta">No orders match this filter.</p>
                    ) : (
                      orders.map(order => (
                        <label
                          key={order._id}
                          className={`pooling-order-item${selected.has(order._id) ? ' pooling-order-item--selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(order._id)}
                            onChange={() => toggleOrder(order._id)}
                          />
                          <div className="pooling-order-item__body">
                            <p className="pooling-order-item__title">{order.materialName}</p>
                            <p className="pooling-order-item__meta">
                              {order.projectName} · {order.vendorName}
                            </p>
                            <p className="pooling-order-item__meta">
                              Qty {order.quantity} {order.unit} · {formatINR(order.totalCost)}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>

                  {crossCategory && (
                    <p className="pooling-warn" role="alert">
                      Cross-category selection — pooling only applies within a single material type.
                    </p>
                  )}

                  <button
                    type="button"
                    className="pooling-calc-btn"
                    disabled={calculating || selected.size < 2 || crossCategory}
                    onClick={handleCalculate}
                  >
                    {calculating ? 'Calculating…' : 'Calculate Savings'}
                  </button>

                  {calcError && <p className="pooling-error" role="alert">{calcError}</p>}
                </>
              )}
            </Card>

            <Card surface="navy-secondary" padding="var(--space-5)">
              <h3 className="reports-card__title">Estimated Savings</h3>

              {!result ? (
                <p className="pooling-order-item__meta" style={{ marginTop: 'var(--space-4)' }}>
                  Select 2+ orders of the same category and click Calculate Savings.
                </p>
              ) : (
                <div className="pooling-results">
                  <div className="pooling-result-row">
                    <span className="pooling-result-row__label">Category</span>
                    <span className="pooling-result-row__value">{result.category}</span>
                  </div>
                  <div className="pooling-result-row">
                    <span className="pooling-result-row__label">Combined quantity</span>
                    <span className="pooling-result-row__value">{result.combinedQuantity}</span>
                  </div>
                  <div className="pooling-result-row">
                    <span className="pooling-result-row__label">Cost without pooling</span>
                    <span className="pooling-result-row__value">{formatINR(result.costWithoutPooling)}</span>
                  </div>
                  <div className="pooling-result-row">
                    <span className="pooling-result-row__label">Bulk discount</span>
                    <span className="pooling-result-row__value">{result.discountLabel}</span>
                  </div>
                  <div className="pooling-result-row pooling-result-row--savings">
                    <span className="pooling-result-row__label">Estimated savings</span>
                    <span className="pooling-result-row__value">{formatINR(result.savingsAmount)}</span>
                  </div>
                  <div className="pooling-result-row">
                    <span className="pooling-result-row__label">Cost with pooling</span>
                    <span className="pooling-result-row__value">{formatINR(result.costWithPooling)}</span>
                  </div>

                  <p className="pooling-rules">
                    Discount rule: 5% when combined quantity ≥ tier-1 threshold,
                    10% when ≥ tier-2 threshold (category-specific).
                    {result.thresholds && (
                      <> Tier 1: {result.thresholds.tier1} {result.thresholds.unit},
                      Tier 2: {result.thresholds.tier2} {result.thresholds.unit}.</>
                    )}
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PoolingPage;
