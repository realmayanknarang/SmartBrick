/**
 * client/src/pages/SelectRolePage.jsx
 *
 * Shown to users who signed in via Google OAuth (or any OAuth provider)
 * and therefore have no role set in MongoDB yet.
 *
 * This is intentionally UNSTYLED — bare HTML elements only.
 * Visual polish is deferred to Phase 5/6 design system work.
 *
 * Flow
 * ────
 *  1. User picks a role from the radio group
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

// The four roles defined by the MongoDB User schema enum.
const ROLES = [
  { value: 'owner',           label: 'Owner' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'site_engineer',   label: 'Site Engineer' },
  { value: 'finance',         label: 'Finance' },
];

function SelectRolePage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div>
      <h1>Select your role</h1>
      <p>
        Choose the role that best describes how you will use SmartBrick.
        This cannot be changed later without admin assistance.
      </p>

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Role</legend>

          {ROLES.map(({ value, label }) => (
            <label key={value} style={{ display: 'block' }}>
              <input
                type="radio"
                name="role"
                value={value}
                checked={selectedRole === value}
                onChange={() => setSelectedRole(value)}
              />
              {' '}{label}
            </label>
          ))}
        </fieldset>

        {error && (
          <p role="alert" style={{ color: 'red' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading || !selectedRole}>
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}

export default SelectRolePage;
