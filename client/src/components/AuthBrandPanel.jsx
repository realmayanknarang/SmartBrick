/**
 * client/src/components/AuthBrandPanel.jsx
 *
 * SmartBrick shared auth brand panel — Phase 5A
 * ─────────────────────────────────────────────────────────────────────────────
 * The left-hand navy panel shared by both /login and /signup screens.
 * Displays the brand mark, a configurable headline, subtext, benefit list,
 * and decorative progress dots.
 *
 * Props
 * ──────────────────────────────────────────────────────────────────────────
 * headline   string   — large display-font heading (use \n for line breaks
 *                       or pass JSX children in the headline prop if needed)
 *
 * subtext    string   — muted paragraph below the headline.
 *
 * benefits   string[] — optional list of benefit lines rendered with a gold
 *                       checkmark icon.  Defaults to [].
 *
 * activeDot  number   — which progress dot (0-indexed) is highlighted gold.
 *                       Defaults to 0.  Pass null to hide the dot row.
 *
 * Usage
 * ──────────────────────────────────────────────────────────────────────────
 *   // Login variant
 *   <AuthBrandPanel
 *     headline="Procurement intelligence for every site you run"
 *     subtext="Sign in to your SmartBrick workspace."
 *     benefits={[
 *       'Role-based access for your entire team',
 *       'Live alerts on price changes and delays',
 *       'Vendor scorecard updated in real time',
 *     ]}
 *     activeDot={0}
 *   />
 *
 *   // Signup variant
 *   <AuthBrandPanel
 *     headline="Join 800+ builders using AI procurement"
 *     subtext="Create your account in under 2 minutes."
 *     benefits={[
 *       'Free 30-day trial, no credit card required',
 *       'Invite your team from day one',
 *       'Import your vendor list in minutes',
 *     ]}
 *     activeDot={1}
 *   />
 */

import './AuthBrandPanel.css';

// ─── Brand mark (same inline SVG as PublicNav for consistency) ─────────────────
function BrickIcon() {
  return (
    <svg
      className="auth-brand__logo-icon"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1"  y="10" width="10" height="5" rx="1" fill="currentColor" />
      <rect x="13" y="10" width="10" height="5" rx="1" fill="currentColor" />
      <rect x="6"  y="4"  width="12" height="5" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="6"  y="16" width="12" height="5" rx="1" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

// ─── Checkmark icon for benefit items ─────────────────────────────────────────
function CheckIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.5 5L4 7.5L8.5 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const DOT_COUNT = 3;

/**
 * @param {object}   props
 * @param {string}   props.headline
 * @param {string}   props.subtext
 * @param {string[]} [props.benefits=[]]
 * @param {number}   [props.activeDot=0]
 */
function AuthBrandPanel({
  headline  = '',
  subtext   = '',
  benefits  = [],
  activeDot = 0,
}) {
  return (
    <div className="auth-brand" aria-label="SmartBrick brand panel">

      {/* ── Logo / wordmark ─────────────────────────────────────────────── */}
      <div className="auth-brand__logo" aria-hidden="true">
        <BrickIcon />
        <span className="auth-brand__logo-text">SmartBrick</span>
      </div>

      {/* ── Headline + subtext + benefits ───────────────────────────────── */}
      <div className="auth-brand__body">
        <h2 className="auth-brand__headline">
          {headline}
        </h2>

        {subtext && (
          <p className="auth-brand__subtext">{subtext}</p>
        )}

        {benefits.length > 0 && (
          <ul className="auth-brand__benefits" role="list">
            {benefits.map((item, i) => (
              <li key={i} className="auth-brand__benefit">
                <span className="auth-brand__benefit-icon" aria-hidden="true">
                  <CheckIcon />
                </span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Progress dots ───────────────────────────────────────────────── */}
      {activeDot !== null && (
        <div className="auth-brand__dots" aria-hidden="true">
          {Array.from({ length: DOT_COUNT }, (_, i) => (
            <span
              key={i}
              className={[
                'auth-brand__dot',
                i === activeDot ? 'auth-brand__dot--active' : '',
              ].filter(Boolean).join(' ')}
            />
          ))}
        </div>
      )}

    </div>
  );
}

export default AuthBrandPanel;
