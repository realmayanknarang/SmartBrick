import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';       // Phase 5C
import DashboardPage from './pages/DashboardPage';
import SelectRolePage from './pages/SelectRolePage';
import SSOCallbackPage from './pages/SSOCallbackPage'; // Phase 5B — OAuth callback
import StyleGuidePage from './pages/StyleGuidePage'; // Phase 4F — dev reference, intentionally kept
import apiClient from './api/client';

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
 *
 * States:
 *   • Clerk not loaded yet          → render nothing (avoid flash)
 *   • Not signed in                 → /login
 *   • Signed in, role check loading → render nothing (brief, one API call)
 *   • Signed in, role check error   → render nothing + log (avoids loop)
 *   • Signed in, role === null      → /select-role (Google OAuth new user)
 *   • Signed in, role is set        → render children ✓
 */
function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { role, loading } = useRole(isLoaded && isSignedIn);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  if (loading || role === undefined) return null;
  if (role === null) return <Navigate to="/select-role" replace />;
  return children;
}

/**
 * Redirects already-signed-in users away from public-only pages (e.g. /login).
 *
 * A signed-in user with NO role yet goes to /select-role, not /dashboard —
 * otherwise they'd hit ProtectedRoute on /dashboard and be sent straight
 * back to /select-role anyway, burning an extra render cycle.
 */
function PublicOnlyRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { role, loading } = useRole(isLoaded && isSignedIn);

  if (!isLoaded) return null;
  if (!isSignedIn) return children;          // signed out — show the page
  if (loading || role === undefined) return null; // waiting for role check
  if (role === null) return <Navigate to="/select-role" replace />;
  return <Navigate to="/dashboard" replace />;
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

        {/* Dashboard — signed-in AND role set */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
