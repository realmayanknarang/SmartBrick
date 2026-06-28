/**
 * client/src/api/client.js
 *
 * Axios instance pre-configured for SmartBrick's backend.
 *
 * A request interceptor automatically reads the current Clerk session token
 * and injects it into every outgoing request's Authorization header:
 *
 *   Authorization: Bearer <clerk-session-token>
 *
 * This lets every component import `apiClient` directly without any
 * per-call token management.
 *
 * ── How the token is obtained outside a React component ──────────────────
 * Clerk's React SDK (useAuth / getToken) is hook-based and cannot be called
 * inside an Axios interceptor.  Instead we use the global `window.Clerk`
 * singleton that @clerk/clerk-react's <ClerkProvider> populates on mount.
 * `window.Clerk.session?.getToken()` is the officially supported way to get
 * a fresh, auto-refreshed JWT from non-React code in Clerk SDK v5+.
 *
 * Reference: https://clerk.com/docs/references/javascript/clerk/session-methods
 *
 * ── Behaviour when no session exists ─────────────────────────────────────
 * If the user is signed out (or Clerk hasn't finished loading) `getToken()`
 * resolves to null / undefined.  In that case the interceptor lets the
 * request through without an Authorization header.  Server-side middleware
 * (requireAuth) will reject the request with 401 if the route demands auth.
 */

import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// ---------------------------------------------------------------------------
// Request interceptor — attach Clerk session token when available
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  async (config) => {
    try {
      // window.Clerk is the singleton populated by <ClerkProvider>.
      // session?.getToken() returns a fresh, cached JWT or null if no session.
      const token = await window.Clerk?.session?.getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      // Don't block the request if token retrieval fails for any reason
      // (e.g. Clerk not yet initialised on the very first render).
      console.warn('[apiClient] Could not retrieve Clerk session token:', err);
    }

    return config;
  },
  // Pass through request errors unchanged.
  (err) => Promise.reject(err),
);

export default apiClient;
