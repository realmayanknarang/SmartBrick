/**
 * client/src/pages/SSOCallbackPage.jsx
 *
 * OAuth redirect callback handler — Phase 5B
 * ─────────────────────────────────────────────────────────────────────────────
 * Clerk requires a dedicated route to finish the OAuth handshake after the
 * provider (e.g. Google) redirects back.  We render
 * <AuthenticateWithRedirectCallback /> which calls Clerk's JS SDK to exchange
 * the OAuth code for a session, then redirects the user to the URL originally
 * passed as `redirectUrlComplete` in authenticateWithRedirect().
 *
 * Both /login and /signup's Google buttons point here via redirectUrl:
 *   signIn.authenticateWithRedirect({ redirectUrl: '/sso-callback', … })
 *   signUp.authenticateWithRedirect({ redirectUrl: '/sso-callback', … })
 *
 * After Clerk completes the session, App.jsx's PublicOnlyRoute / ProtectedRoute
 * logic takes care of routing the user to /dashboard or /select-role.
 */

import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import './SSOCallbackPage.css';

function SSOCallbackPage() {
  return (
    <div className="sso-callback">
      {/* The actual heavy lifting — exchanges the OAuth code for a Clerk session */}
      <AuthenticateWithRedirectCallback />

      {/* Visual feedback while the handshake completes */}
      <div className="sso-callback__content">
        <div className="sso-callback__spinner" aria-hidden="true" />
        <p className="sso-callback__text">Completing sign-in…</p>
      </div>
    </div>
  );
}

export default SSOCallbackPage;
