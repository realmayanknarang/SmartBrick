/**
 * client/src/pages/LoginPage.jsx
 *
 * SmartBrick custom Login screen — Phase 5B
 * ─────────────────────────────────────────────────────────────────────────────
 * Split-screen layout: AuthBrandPanel (left navy) + white form panel (right).
 *
 * Uses Clerk's headless hooks (useSignIn) rather than the pre-built <SignIn />
 * component removed from Phase 3's placeholder.  Clerk only handles
 * session/token logic underneath — we own all markup.
 *
 * Sign-in paths:
 *   1. Email + password  → signIn.create() → on complete, Clerk sets session
 *   2. Google OAuth      → signIn.authenticateWithRedirect() → /sso-callback
 *
 * On successful sign-in, the existing App.jsx role-check logic (useRole hook)
 * automatically routes the user to /dashboard or /select-role — we don't need
 * to replicate that logic here; Clerk's session change triggers it naturally.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import AuthBrandPanel from '../components/AuthBrandPanel';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import './LoginPage.css';

// ─── Benefit copy for the brand panel ────────────────────────────────────────

const LOGIN_BENEFITS = [
  'Role-based access for your entire team',
  'Live alerts on price changes and delays',
  'Vendor scorecard updated in real time',
];

// ─── Google icon SVG ──────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function OrDivider() {
  return (
    <div className="auth-form__divider" aria-hidden="true">
      <span className="auth-form__divider-line" />
      <span className="auth-form__divider-text">OR</span>
      <span className="auth-form__divider-line" />
    </div>
  );
}

// ─── LoginPage ────────────────────────────────────────────────────────────────

function LoginPage() {
  const { isLoaded, signIn } = useSignIn();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // ── Email/password submit ──────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isLoaded || loading) return;

    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        // Clerk sets the session; App.jsx's PublicOnlyRoute will redirect.
        // We don't navigate manually — the role-check hook in App.jsx handles it.
      } else {
        // Intermediate status (e.g. 2FA needed). Surface it.
        setError(`Sign-in requires additional steps: ${result.status}`);
      }
    } catch (err) {
      // Clerk returns error details in err.errors[]
      const clerkMsg = err?.errors?.[0]?.longMessage
        || err?.errors?.[0]?.message
        || 'Incorrect email or password. Please try again.';
      setError(clerkMsg);
    } finally {
      setLoading(false);
    }
  }

  // ── Google OAuth ───────────────────────────────────────────────────────────

  async function handleGoogleSignIn() {
    if (!isLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy:           'oauth_google',
        redirectUrl:        '/sso-callback',
        redirectUrlComplete: '/login',  // After SSO, App.jsx redirects based on role
      });
    } catch (err) {
      const clerkMsg = err?.errors?.[0]?.longMessage
        || err?.errors?.[0]?.message
        || 'Could not start Google sign-in. Please try again.';
      setError(clerkMsg);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="auth-layout">
      {/* ── Left: brand panel ─────────────────────────────────────────────── */}
      <div className="auth-layout__brand">
        <AuthBrandPanel
          headline="Procurement intelligence for every site you run"
          subtext="Sign in to your SmartBrick workspace."
          benefits={LOGIN_BENEFITS}
          activeDot={0}
        />
      </div>

      {/* ── Right: form panel ─────────────────────────────────────────────── */}
      <div className="auth-layout__form">
        <div className="auth-form">

          {/* Header */}
          <div className="auth-form__header">
            <h1 className="auth-form__title">Sign in</h1>
            <p className="auth-form__subtitle">
              Welcome back. Enter your credentials to continue.
            </p>
          </div>

          {/* Form */}
          <form className="auth-form__fields" onSubmit={handleSubmit} noValidate>
            <TextInput
              id="login-email"
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />

            <TextInput
              id="login-password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {/* Inline error */}
            {error && (
              <p className="auth-form__error" role="alert">
                {error}
              </p>
            )}

            <Button
              variant="dark"
              type="submit"
              disabled={!isLoaded || loading}
              className="auth-form__submit"
            >
              {loading ? (
                <span className="auth-form__spinner-wrap">
                  <span className="auth-form__spinner" aria-hidden="true" />
                  Signing in…
                </span>
              ) : (
                'Continue'
              )}
            </Button>
          </form>

          <OrDivider />

          {/* Google OAuth */}
          <Button
            variant="outline-light"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={!isLoaded}
            className="auth-form__google"
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          {/* Sign-up link */}
          <p className="auth-form__footer">
            Don&rsquo;t have an account?{' '}
            <Link to="/signup" className="auth-form__link">
              Sign up
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;
