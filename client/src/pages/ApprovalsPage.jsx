/**
 * client/src/pages/ApprovalsPage.jsx
 *
 * Purchase Order Approval Workflow — Phase 11D
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SignOutButton } from '@clerk/clerk-react';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import { NAV_ITEMS } from '../config/dashboardNav.jsx';
import apiClient from '../api/client';
import './DashboardPage.css';
import './ApprovalsPage.css';

function formatINR(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

function OrderCard({ order, onAction, acting }) {
  const isActing = acting === order._id;

  return (
    <article className="approvals-card">
      <p className="approvals-card__title">{order.material?.name ?? 'Material'}</p>
      <p className="approvals-card__meta">
        {order.project?.name} · {order.site?.name}
      </p>
      <p className="approvals-card__meta">
        Vendor: {order.vendor?.name}
      </p>
      <p className="approvals-card__meta">
        Qty: {order.quantity} · {new Date(order.orderDate).toLocaleDateString('en-IN')}
      </p>
      <p className="approvals-card__cost">{formatINR(order.totalCost)}</p>

      {order.canAct ? (
        <div className="approvals-card__actions">
          <button
            type="button"
            className="approvals-btn approvals-btn--advance"
            disabled={!!acting}
            onClick={() => onAction(order._id, 'advance')}
          >
            {isActing ? '…' : 'Advance'}
          </button>
          <button
            type="button"
            className="approvals-btn approvals-btn--reject"
            disabled={!!acting}
            onClick={() => onAction(order._id, 'reject')}
          >
            Reject
          </button>
        </div>
      ) : (
        <p className="approvals-card__meta">Awaiting action from {order.stageLabel}</p>
      )}
    </article>
  );
}

function ApprovalsPage() {
  const { pathname } = useLocation();
  const [orders, setOrders]       = useState([]);
  const [stages, setStages]       = useState([]);
  const [userRole, setUserRole]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [acting, setActing]       = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadOrders = useCallback(() => {
    setLoading(true);
    setError(null);
    return apiClient.get('/approvals/pending')
      .then(({ data }) => {
        setOrders(data.orders ?? []);
        setStages(data.stages ?? []);
        setUserRole(data.userRole);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load approvals.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleAction(orderId, action) {
    setActing(orderId);
    setActionError(null);
    try {
      await apiClient.patch(`/approvals/${orderId}/advance`, { action });
      await loadOrders();
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Action failed.');
    } finally {
      setActing(null);
    }
  }

  const ordersByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = orders.filter(o => o.approvalStage === stage.id);
    return acc;
  }, {});

  return (
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Approvals</h1>
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
            <h2 className="dash-welcome__name">Purchase Order Approvals</h2>
            <p className="dash-welcome__sub">
              {loading
                ? 'Loading pipeline…'
                : `${orders.length} order${orders.length !== 1 ? 's' : ''} in the approval pipeline`}
              {userRole && ` · Signed in as ${userRole.replace('_', ' ')}`}
            </p>
          </section>

          {loading && (
            <div className="approvals-full-state">Loading approvals…</div>
          )}

          {error && (
            <div className="approvals-full-state approvals-full-state--error">{error}</div>
          )}

          {!loading && !error && (
            <>
              {actionError && (
                <Card surface="navy-secondary" padding="var(--space-4)">
                  <p style={{ color: '#fca5a5', margin: 0 }}>{actionError}</p>
                </Card>
              )}

              <div className="approvals-board">
                {stages.map(stage => (
                  <section key={stage.id} className="approvals-column" aria-label={stage.label}>
                    <div className="approvals-column__header">
                      <h3 className="approvals-column__title">{stage.label}</h3>
                      <span className="approvals-column__count">
                        {(ordersByStage[stage.id] ?? []).length}
                      </span>
                    </div>
                    {(ordersByStage[stage.id] ?? []).length === 0 ? (
                      <div className="approvals-empty-col">No orders at this stage</div>
                    ) : (
                      (ordersByStage[stage.id] ?? []).map(order => (
                        <OrderCard
                          key={order._id}
                          order={order}
                          onAction={handleAction}
                          acting={acting}
                        />
                      ))
                    )}
                  </section>
                ))}
              </div>

              <p className="approvals-role-note">
                Role gating: site engineers act at Site Engineer stage, project managers at PM stage,
                finance (or owner) at Finance stage. Owner can act at any pipeline stage. Advance moves
                to the next stage; only Finance can reach Approved.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default ApprovalsPage;
