/**
 * client/src/components/PublicNav.jsx
 *
 * SmartBrick reusable public navigation bar — Phase 4E
 * ─────────────────────────────────────────────────────────────────────────────
 * Extracted from the inline nav in LandingPage.jsx and generalised into a
 * reusable shell.  Handles the Clerk signed-in / signed-out state so that
 * every public page that uses PublicNav doesn't need to repeat this logic.
 *
 * Layout (left → right)
 * ──────────────────────────────────────────────────────────────────────────
 *   [Logo / wordmark]   [nav links …]   [auth actions]
 *
 * Auth actions rendered by Clerk state:
 *   Signed out  → "Sign in" (outline-light button) + "Get started" (primary)
 *   Signed in   → Clerk <UserButton> avatar + "Dashboard" link
 *
 * Props
 * ──────────────────────────────────────────────────────────────────────────
 * links        Array<{ label: string, to: string }> — optional internal nav
 *              links rendered between the logo and auth actions.
 *              Defaults to an empty array (no center links).
 *
 * logoText     string — wordmark text rendered next to the brand mark.
 *              Defaults to "SmartBrick".
 *
 * className    Extra class(es) merged onto the <nav> element (optional).
 *
 * Usage
 * ──────────────────────────────────────────────────────────────────────────
 *   // Minimal — just brand + auth
 *   <PublicNav />
 *
 *   // With centre links
 *   <PublicNav
 *     links={[
 *       { label: 'Features',  to: '/#features' },
 *       { label: 'Pricing',   to: '/pricing' },
 *       { label: 'About',     to: '/about' },
 *     ]}
 *   />
 */

import { Link } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/clerk-react';
import Button from './Button';
import './PublicNav.css';

// ─── Brand mark (inline SVG brick icon) ──────────────────────────────────────
function BrandMark() {
  return (
    <svg
      className="public-nav__brand-icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Two layered bricks — stylised SmartBrick mark */}
      <rect x="1" y="10" width="10" height="5" rx="1" fill="currentColor" />
      <rect x="13" y="10" width="10" height="5" rx="1" fill="currentColor" />
      <rect x="6" y="4" width="12" height="5" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="6" y="16" width="12" height="5" rx="1" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/**
 * @param {object}                          props
 * @param {Array<{label:string,to:string}>} [props.links=[]]
 * @param {string}                          [props.logoText='SmartBrick']
 * @param {string}                          [props.className]
 */
function PublicNav({ links = [], logoText = 'SmartBrick', className = '' }) {
  const navClasses = ['public-nav', className].filter(Boolean).join(' ');

  return (
    <nav className={navClasses} aria-label="Main navigation">
      {/* ── Logo / wordmark ─────────────────────────────── */}
      <Link to="/" className="public-nav__logo" aria-label="SmartBrick home">
        <BrandMark />
        <span className="public-nav__logo-text">{logoText}</span>
      </Link>

      {/* ── Centre nav links (optional) ─────────────────── */}
      {links.length > 0 && (
        <ul className="public-nav__links" role="list">
          {links.map(({ label, to }) => (
            <li key={to}>
              <Link to={to} className="public-nav__link">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* ── Spacer (pushes auth section to the right) ───── */}
      <div className="public-nav__spacer" aria-hidden="true" />

      {/* ── Auth actions (Clerk-aware) ───────────────────── */}
      <div className="public-nav__auth">
        {/* Signed-out: Sign in (ghost) + Get started (primary CTA) */}
        <SignedOut>
          {/*
           * Clerk's <SignInButton> / <SignUpButton> render plain <button>
           * elements by default.  Wrapping them in asChild mode lets us
           * use our own Button for full style control.
           */}
          <SignInButton mode="modal">
            <Button
              variant="secondary"
              size="sm"
              id="public-nav-signin-btn"
            >
              Sign in
            </Button>
          </SignInButton>

          <SignUpButton mode="modal">
            <Button
              variant="primary"
              size="sm"
              id="public-nav-signup-btn"
            >
              Get started
            </Button>
          </SignUpButton>
        </SignedOut>

        {/* Signed-in: avatar + dashboard link */}
        <SignedIn>
          <Link to="/dashboard" className="public-nav__dashboard-link">
            Dashboard
          </Link>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </nav>
  );
}

export default PublicNav;
