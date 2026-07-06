import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import LandingPage         from './pages/LandingPage';
import LoginPage           from './pages/LoginPage';
import SignUpPage          from './pages/SignUpPage';          // Phase 5C
import DashboardPage       from './pages/DashboardPage';
import SelectRolePage      from './pages/SelectRolePage';
import SSOCallbackPage     from './pages/SSOCallbackPage';     // Phase 5B — OAuth callback
import StyleGuidePage      from './pages/StyleGuidePage';      // Phase 4F — dev reference
import InvoiceScannerPage  from './pages/InvoiceScannerPage';  // Phase 7C
import WeatherAlertsPage   from './pages/WeatherAlertsPage';   // Phase 7D
import LogisticsPage       from './pages/LogisticsPage';       // Phase 7E
import CarbonPage          from './pages/CarbonPage';          // Phase 7F
import SitesPage           from './pages/SitesPage';
import VendorsPage         from './pages/VendorsPage';
import AnalyticsPage       from './pages/AnalyticsPage';  // Phase 8C
import AlertsPage          from './pages/AlertsPage';      // Phase 8D
import CopilotPage         from './pages/CopilotPage';     // Phase 9C
import ForecastingPage     from './pages/ForecastingPage'; // Phase 10E
import ReportsPage         from './pages/ReportsPage';     // Phase 11B
import ApprovalsPage       from './pages/ApprovalsPage';   // Phase 11D
import PoolingPage         from './pages/PoolingPage';     // Phase 11E
import PrivacyPolicyPage   from './pages/PrivacyPolicyPage';   // Phase 13E
import TermsOfServicePage  from './pages/TermsOfServicePage';  // Phase 13E
import SitesVendorsPage    from './pages/SitesVendorsPage';    // Grouped wrapper Fix 1
import AnalyticsReportsPage from './pages/AnalyticsReportsPage'; // Grouped wrapper Fix 1
import OperationsPage      from './pages/OperationsPage';      // Grouped wrapper Fix 1
// Marketplace placeholder dashboards — Phase M1C (real UI comes in M4/M5/M6)
import OwnerDashboard   from './pages/marketplace/OwnerDashboard';
import BuilderDashboard from './pages/marketplace/BuilderDashboard';
import VendorDashboard  from './pages/marketplace/VendorDashboard';

// Marketplace Owner Sub-pages — Phase M4
import OwnerOverviewPage       from './pages/marketplace/OwnerOverviewPage';
import OwnerProjectsPage       from './pages/marketplace/OwnerProjectsPage';
import CreateProjectPage       from './pages/marketplace/CreateProjectPage';
import ProjectDetailPage       from './pages/marketplace/ProjectDetailPage';
import ProgressTrackingPage    from './pages/marketplace/ProgressTrackingPage';
import OwnerChatPage           from './pages/marketplace/OwnerChatPage';
import OwnerNotificationsPage  from './pages/marketplace/OwnerNotificationsPage';

import apiClient from './api/client';

// ---------------------------------------------------------------------------
// Marketplace role helpers — Phase M1C
// ---------------------------------------------------------------------------

/**
 * The three marketplace roles introduced in Phase M1A.
 * Stored as a Set for O(1) lookup in route guards.
 */
const MARKETPLACE_ROLES = new Set(['marketplace_owner', 'builder', 'vendor_supplier']);

/**
 * Returns the canonical post-sign-in path for a given role.
 *
 *   marketplace_owner → /marketplace/owner
 *   builder           → /marketplace/builder
 *   vendor_supplier   → /marketplace/vendor
 *   (all internal roles, null, undefined) → /dashboard
 *
 * Used by PublicOnlyRoute, ProtectedRoute, and MarketplaceRoute so that
 * the mapping is defined exactly once.
 *
 * @param {string|null|undefined} role
 * @returns {string}
 */
function getDefaultPath(role) {
  if (role === 'marketplace_owner') return '/marketplace/owner';
  if (role === 'builder')           return '/marketplace/builder';
  if (role === 'vendor_supplier')   return '/marketplace/vendor';
  return '/dashboard'; // internal roles + null + undefined
}

// ---------------------------------------------------------------------------
// useRole — resolves the signed-in user's MongoDB role after every sign-in
// ---------------------------------------------------------------------------

/**
 * Calls POST /api/auth/sync immediately after Clerk confirms the user is
 * signed in.  Returns { role, loading, error }.
 *
 * Why /auth/sync and not a separate endpoint?
 *   /auth/sync already does exactly what we need: it finds (or, for
 *   already-linked accounts, re-confirms) the MongoDB User document by
 *   clerkUserId and returns the role.  For Google OAuth users who have
 *   NO MongoDB document yet it returns 404 — we treat that as role === null,
 *   which triggers the /select-role flow.
 *
 * The hook re-runs whenever isSignedIn changes (i.e. on every fresh sign-in)
 * so a user who somehow still has no role on a later login is caught again.
 */
function useRole(isSignedIn) {
  const [role, setRole] = useState(undefined); // undefined = "not checked yet"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isSignedIn) {
      // Signed out — reset so the hook is clean for the next sign-in.
      setRole(undefined);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchRole() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await apiClient.post('/auth/sync');
        if (!cancelled) setRole(data.role ?? null);
      } catch (err) {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          // No MongoDB User record for this Clerk user yet.
          // This is the normal Google OAuth first-sign-in case.
          setRole(null);
        } else {
          // Unexpected server error — surface it so the UI can show something
          // rather than silently looping.
          setError(err?.response?.data?.message || 'Failed to load your account.');
          setRole(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRole();
    return () => { cancelled = true; };
  }, [isSignedIn]);

  return { role, loading, error };
}

// ---------------------------------------------------------------------------
// Route wrapper components
// ---------------------------------------------------------------------------

/**
 * Requires the user to be signed in AND to have a role set in MongoDB.
 * Used for /dashboard/* (internal team routes).
 *
 * States:
 *   • Clerk not loaded yet             → render nothing (avoid flash)
 *   • Not signed in                    → /login
 *   • Signed in, role check loading    → render nothing (brief, one API call)
 *   • Signed in, role check error      → render nothing + log (avoids loop)
 *   • Signed in, role === null         → /select-role (Google OAuth new user)
 *   • Signed in, marketplace role      → /marketplace/<role> (M1C: wrong door)
 *   • Signed in, internal role is set  → render children ✓
 */
function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { role, loading } = useRole(isLoaded && isSignedIn);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  if (loading || role === undefined) return null;
  if (role === null) return <Navigate to="/select-role" replace />;
  // Marketplace users who land on /dashboard get sent to their correct portal.
  if (MARKETPLACE_ROLES.has(role)) return <Navigate to={getDefaultPath(role)} replace />;
  return children;
}

/**
 * Redirects already-signed-in users away from public-only pages (e.g. /login,
 * /signup).
 *
 * Phase M1C: Marketplace roles are redirected to their own portal paths
 * instead of /dashboard.  Internal roles continue to go to /dashboard.
 * A signed-in user with NO role yet goes to /select-role.
 */
function PublicOnlyRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { role, loading } = useRole(isLoaded && isSignedIn);

  if (!isLoaded) return null;
  if (!isSignedIn) return children;               // signed out — show the page
  if (loading || role === undefined) return null;  // waiting for role check
  if (role === null) return <Navigate to="/select-role" replace />;
  // Route to the correct home for this role (internal → /dashboard, marketplace → their path).
  return <Navigate to={getDefaultPath(role)} replace />;
}

/**
 * Requires the user to be signed in, but deliberately does NOT check role.
 * Applied only to /select-role — checking role here would cause an infinite
 * redirect loop (no role → /select-role → check role → no role → /select-role…).
 */
function RoleGateRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  return children;
}

/**
 * Auth-only guard for /marketplace/* routes — Phase M1C.
 * Requires a valid Clerk session; does NOT restrict by role beyond that
 * (role-specific guards can be layered inside each marketplace page later).
 *
 * Signed-out visitors → /login
 * Signed-in, role loading → render nothing
 * Signed-in, no role yet → /select-role
 * Signed-in, role set → render children ✓
 */
function MarketplaceRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { role, loading } = useRole(isLoaded && isSignedIn);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  if (loading || role === undefined) return null;
  if (role === null) return <Navigate to="/select-role" replace />;
  return children;
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — no auth check */}
        <Route path="/" element={<LandingPage />} />

        {/*
         * SSO callback — must be public (no auth guard), Clerk needs to reach
         * this route after the OAuth provider redirects back to the app.
         */}
        <Route path="/sso-callback" element={<SSOCallbackPage />} />

        {/* Redirect to /dashboard (or /select-role) when already signed in */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        {/* Sign-up — Phase 5C */}
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <SignUpPage />
            </PublicOnlyRoute>
          }
        />

        {/* Role selection — signed-in only, no role check (this page IS the fix) */}
        <Route
          path="/select-role"
          element={
            <RoleGateRoute>
              <SelectRolePage />
            </RoleGateRoute>
          }
        />

        {/* ── Dashboard routes — signed-in AND role set ─────────────────── */}

        {/* Overview */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Sites & Vendors Group */}
        <Route
          path="/dashboard/sites-vendors"
          element={
            <ProtectedRoute>
              <SitesVendorsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard/sites" element={<Navigate to="/dashboard/sites-vendors" replace />} />
        <Route path="/dashboard/vendors" element={<Navigate to="/dashboard/sites-vendors" replace />} />
        <Route path="/dashboard/approvals" element={<Navigate to="/dashboard/sites-vendors" replace />} />
        <Route path="/dashboard/pooling" element={<Navigate to="/dashboard/sites-vendors" replace />} />

        {/* Analytics & Reports Group */}
        <Route
          path="/dashboard/analytics-reports"
          element={
            <ProtectedRoute>
              <AnalyticsReportsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard/analytics" element={<Navigate to="/dashboard/analytics-reports" replace />} />
        <Route path="/dashboard/reports" element={<Navigate to="/dashboard/analytics-reports" replace />} />
        <Route path="/dashboard/forecasting" element={<Navigate to="/dashboard/analytics-reports" replace />} />
        <Route path="/dashboard/alerts" element={<Navigate to="/dashboard/analytics-reports" replace />} />

        {/* Operations Group */}
        <Route
          path="/dashboard/operations"
          element={
            <ProtectedRoute>
              <OperationsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard/invoice-scanner" element={<Navigate to="/dashboard/operations" replace />} />
        <Route path="/dashboard/weather" element={<Navigate to="/dashboard/operations" replace />} />
        <Route path="/dashboard/logistics" element={<Navigate to="/dashboard/operations" replace />} />
        <Route path="/dashboard/carbon" element={<Navigate to="/dashboard/operations" replace />} />

        {/* AI Copilot — Phase 9C */}
        <Route
          path="/dashboard/copilot"
          element={
            <ProtectedRoute>
              <CopilotPage />
            </ProtectedRoute>
          }
        />

        {/*
         * Style guide — Phase 4F dev reference.
         * Public route (no auth guard); intentionally kept accessible post-Phase 4
         * so Phase 5/6 developers can cross-check against the design system.
         * Access-gate or remove before public launch.
         */}
        <Route path="/style-guide" element={<StyleGuidePage />} />

        {/* Legal pages — Phase 13E */}
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />

        {/* ── Marketplace routes — Phase M1C ───────────────────────────── */}
        {/*
         * Auth-only guard (MarketplaceRoute): requires a Clerk session but
         * does not restrict by specific role — each page can add fine-grained
         * access control in later phases.
         *
         * /marketplace/owner   → marketplace_owner role
         * /marketplace/builder → builder role
         * /marketplace/vendor  → vendor_supplier role
         *
         * Placeholder pages will be replaced in Phases M4/M5/M6.
         */}
        <Route
          path="/marketplace/owner"
          element={
            <MarketplaceRoute>
              <OwnerDashboard />
            </MarketplaceRoute>
          }
        >
          <Route path="overview" element={<OwnerOverviewPage />} />
          <Route path="projects" element={<OwnerProjectsPage />} />
          <Route path="projects/new" element={<CreateProjectPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:id/progress" element={<ProgressTrackingPage />} />
          <Route path="projects/:id/chat" element={<OwnerChatPage />} />
          <Route path="notifications" element={<OwnerNotificationsPage />} />
          <Route path="builders" element={<div style={{ padding: '2rem', color: '#fff' }}><h3>Find Builders Page Coming Soon</h3></div>} />
        </Route>
        <Route
          path="/marketplace/builder"
          element={
            <MarketplaceRoute>
              <BuilderDashboard />
            </MarketplaceRoute>
          }
        />
        <Route
          path="/marketplace/vendor"
          element={
            <MarketplaceRoute>
              <VendorDashboard />
            </MarketplaceRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
