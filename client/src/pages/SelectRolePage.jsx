/**
 * client/src/pages/SelectRolePage.jsx
 *
 * Shown to users who signed in via Google OAuth (or any OAuth provider)
 * and therefore have no role set in MongoDB yet.
 *
 * Phase 5D: Restyled using Phase 4 design system components.
 * ─────────────────────────────────────────────────────────────────────────────
 * All underlying logic from Phase 3's addendum is UNCHANGED:
 *   • radio inputs replaced with Phase 4 Select component (see design note)
 *   • POST /api/auth/set-role on submit
 *   • 403 re-selection guard still works (server-side)
 *   • redirect to /dashboard on success
 *
 * Design note — Select vs radio group:
 *   A Select dropdown was chosen over styled radio buttons because:
 *   (a) It's shorter vertically — the page is a one-quick-action page, not a
 *       comparison or assessment.  Less vertical space feels lighter.
 *   (b) The Phase 4 Select component is already token-compliant and accessible.
 *   (c) Radio groups work best when options need to be compared side-by-side;
 *       four mutually-exclusive org roles don't benefit from that layout.
 *
 * Layout: dark full-screen background (navy) → centered Card (surface light)
 *   Chose surface="light" Card on navy background so the form card reads
 *   clearly against the dark page, consistent with the right panel of /login
 *   and /signup which is always white on navy.
 *
 * Flow
 * ────
 *  1. User picks a role from the Select
 *  2. Submit → POST /api/auth/set-role { role }
 *  3. On 200 → navigate to /dashboard
 *  4. On error → show the error message inline, stay on the page
 *
 * Route protection
 * ─────────────────
 * This route must be signed-in gated (can't set a role without a Clerk
 * session) but must NOT check for an existing role — that would loop back
 * here infinitely. See App.jsx's <RoleGateRoute> for the signed-in-only
 * wrapper that's applied to this page.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import Select from '../components/Select';
import Button from '../components/Button';
import './SelectRolePage.css';

// The four roles defined by the MongoDB User schema enum (exact strings).
const ROLE_OPTIONS = [
  { value: 'owner',           label: 'Owner' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'site_engineer',   label: 'Site Engineer' },
  { value: 'finance',         label: 'Finance' },
];

// ─── Brand mark (minimal, reuses the same SVG path as AuthBrandPanel) ─────────

function BrickIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      className="role-page__logo-icon"
    >
      <rect x="1"  y="10" width="10" height="5" rx="1" fill="currentColor" />
      <rect x="13" y="10" width="10" height="5" rx="1" fill="currentColor" />
      <rect x="6"  y="4"  width="12" height="5" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="6"  y="16" width="12" height="5" rx="1" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function SelectRolePage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Submit (logic from Phase 3 — unchanged) ────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select a role before continuing.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/set-role', { role: selectedRole });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="role-page">
      <div className="role-page__card">

        {/* Logo mark */}
        <div className="role-page__logo">
          <BrickIcon />
          <span className="role-page__logo-text">SmartBrick</span>
        </div>

        {/* Heading */}
        <div className="role-page__header">
          <h1 className="role-page__title">Select your role</h1>
          <p className="role-page__subtitle">
            Choose the role that best describes how you will use SmartBrick.
            This cannot be changed later without admin assistance.
          </p>
        </div>

        {/* Form */}
        <form className="role-page__form" onSubmit={handleSubmit}>
          <Select
            id="role-select"
            label="Your role"
            placeholder="Choose a role"
            options={ROLE_OPTIONS}
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            required
          />

          {error && (
            <p className="role-page__error" role="alert">{error}</p>
          )}

          <Button
            variant="dark"
            type="submit"
            disabled={loading || !selectedRole}
            className="role-page__submit"
          >
            {loading ? (
              <span className="role-page__spinner-wrap">
                <span className="role-page__spinner" aria-hidden="true" />
                Saving…
              </span>
            ) : (
              'Continue'
            )}
          </Button>
        </form>

      </div>
    </div>
  );
}

export default SelectRolePage;
