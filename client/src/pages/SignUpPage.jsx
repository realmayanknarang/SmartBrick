/**
 * client/src/pages/SignUpPage.jsx
 *
 * SmartBrick custom Signup screen — Phase 5C
 * ─────────────────────────────────────────────────────────────────────────────
 * Split-screen layout (same grid as LoginPage) with AuthBrandPanel on the
 * left and a white form panel on the right.
 *
 * Uses Clerk's headless hook (useSignUp) rather than any pre-built component.
 * Handles:
 *   • email/password sign-up  → signUp.create()
 *   • email verification step → prepareEmailAddressVerification + attempt
 *   • role persistence        → POST /api/auth/set-role (existing Phase 3 endpoint)
 *   • Google OAuth            → signUp.authenticateWithRedirect() → /sso-callback
 *                              → new Google users land on /select-role (Phase 3)
 *
 * Role values must match the MongoDB User schema enum exactly:
 *   'owner' | 'project_manager' | 'site_engineer' | 'finance'
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignUp } from '@clerk/clerk-react';
import AuthBrandPanel from '../components/AuthBrandPanel';
import TextInput from '../components/TextInput';
import Select from '../components/Select';
import Button from '../components/Button';
import apiClient from '../api/client';
import './LoginPage.css';    // shared auth-layout + auth-form utilities
import './SignUpPage.css';   // signup-specific overrides

// ─── Constants ────────────────────────────────────────────────────────────────

const SIGNUP_BENEFITS = [
  'Role-based access across every site you manage',
  'Live price and delay alerts for your whole team',
  'One shared vendor list, synced in real time',
];

const ROLE_OPTIONS = [
  { value: 'owner',           label: 'Owner' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'site_engineer',   label: 'Site Engineer' },
  { value: 'finance',         label: 'Finance' },
];

// ─── Google icon (same as LoginPage) ─────────────────────────────────────────

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
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

// ─── OR divider (same as LoginPage) ──────────────────────────────────────────

function OrDivider() {
  return (
    <div className="auth-form__divider" aria-hidden="true">
      <span className="auth-form__divider-line" />
      <span className="auth-form__divider-text">OR</span>
      <span className="auth-form__divider-line" />
    </div>
  );
}

// ─── SignUpPage ───────────────────────────────────────────────────────────────

function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [role,      setRole]      = useState('');

  // ── Verification step state ────────────────────────────────────────────────
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');

  // ── UI state ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Step 1: create the Clerk account ──────────────────────────────────────

  async function handleSignUpSubmit(e) {
    e.preventDefault();
    if (!isLoaded || loading) return;

    if (!role) {
      setError('Please select a role before continuing.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      // Trigger the verification email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      const clerkMsg = err?.errors?.[0]?.longMessage
        || err?.errors?.[0]?.message
        || 'Could not create account. Please check your details and try again.';
      setError(clerkMsg);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: verify the email code ─────────────────────────────────────────

  async function handleVerifySubmit(e) {
    e.preventDefault();
    if (!isLoaded || loading) return;

    setLoading(true);
    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({ code: verifyCode });

      if (result.status === 'complete') {
        // Activate the Clerk session — this makes the auth token available
        await setActive({ session: result.createdSessionId });

        // Save the role via the Phase 3 endpoint
        await apiClient.post('/auth/set-role', { role });

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        setError(`Verification incomplete: ${result.status}. Please try again.`);
      }
    } catch (err) {
      const clerkMsg = err?.errors?.[0]?.longMessage
        || err?.errors?.[0]?.message
        || (err?.response?.data?.message)
        || 'Verification failed. Please check the code and try again.';
      setError(clerkMsg);
    } finally {
      setLoading(false);
    }
  }

  // ── Google OAuth ───────────────────────────────────────────────────────────
  // New Google signups are role-less; App.jsx routes them to /select-role.

  async function handleGoogleSignUp() {
    if (!isLoaded) return;
    try {
      await signUp.authenticateWithRedirect({
        strategy:           'oauth_google',
        redirectUrl:        '/sso-callback',
        redirectUrlComplete: '/login',
      });
    } catch (err) {
      const clerkMsg = err?.errors?.[0]?.longMessage
        || err?.errors?.[0]?.message
        || 'Could not start Google sign-up. Please try again.';
      setError(clerkMsg);
    }
  }

  // ── Render: email verification step ───────────────────────────────────────

  if (pendingVerification) {
    return (
      <div className="auth-layout">
        <div className="auth-layout__brand">
          <AuthBrandPanel
            headline="One account, every site you run"
            subtext="Verify your email to complete sign-up."
            benefits={SIGNUP_BENEFITS}
            activeDot={1}
          />
        </div>

        <div className="auth-layout__form">
          <div className="auth-form">
            <div className="auth-form__header">
              <h1 className="auth-form__title">Check your email</h1>
              <p className="auth-form__subtitle">
                We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
              </p>
            </div>

            <form className="auth-form__fields" onSubmit={handleVerifySubmit} noValidate>
              <TextInput
                id="verify-code"
                label="Verification code"
                type="text"
                placeholder="123456"
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.trim())}
                required
                autoComplete="one-time-code"
                autoFocus
                inputMode="numeric"
                maxLength={6}
              />

              {error && (
                <p className="auth-form__error" role="alert">{error}</p>
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
                    Verifying…
                  </span>
                ) : (
                  'Verify email'
                )}
              </Button>
            </form>

            <p className="auth-form__footer">
              Wrong email?{' '}
              <button
                type="button"
                className="auth-form__link"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                onClick={() => { setPendingVerification(false); setError(''); }}
              >
                Go back
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: sign-up form ───────────────────────────────────────────────────

  return (
    <div className="auth-layout">
      <div className="auth-layout__brand">
        <AuthBrandPanel
          headline="One account, every site you run"
          subtext="Create your SmartBrick workspace in under 2 minutes."
          benefits={SIGNUP_BENEFITS}
          activeDot={1}
        />
      </div>

      <div className="auth-layout__form signup-form-panel">
        <div className="auth-form signup-form">

          <div className="auth-form__header">
            <h1 className="auth-form__title">Create your account</h1>
            <p className="auth-form__subtitle">
              Join your team on SmartBrick.
            </p>
          </div>

          <form className="auth-form__fields" onSubmit={handleSignUpSubmit} noValidate>
            {/* Name row */}
            <div className="auth-form__name-row">
              <TextInput
                id="signup-first-name"
                label="First name"
                type="text"
                placeholder="Arjun"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
                autoFocus
              />
              <TextInput
                id="signup-last-name"
                label="Last name"
                type="text"
                placeholder="Sharma"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                autoComplete="family-name"
              />
            </div>

            <TextInput
              id="signup-email"
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <TextInput
              id="signup-password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <Select
              id="signup-role"
              label="Your role"
              placeholder="Select a role"
              options={ROLE_OPTIONS}
              value={role}
              onChange={e => setRole(e.target.value)}
              required
            />

            {error && (
              <p className="auth-form__error" role="alert">{error}</p>
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
                  Creating account…
                </span>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <OrDivider />

          <Button
            variant="outline-light"
            type="button"
            onClick={handleGoogleSignUp}
            disabled={!isLoaded}
            className="auth-form__google"
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <p className="auth-form__footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-form__link">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
