/**
 * client/src/pages/LandingPage.jsx
 *
 * SmartBrick public landing page — Phase 6
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Phase 6A  Hero section
 *   • Uses PublicNav (Phase 4E) — no inline nav logic
 *   • Background: --color-surface-dark (navy)
 *   • Headline: Barlow Condensed (--font-display), large display size
 *   • Sub-text: Inter (--font-body), --color-text-on-dark-muted
 *   • Primary CTA: <Button as={Link}> — Phase 6A Button extension (as prop)
 *     The `as` prop was added to Button.jsx in this phase so the CTA can
 *     render as a react-router <Link to="/signup"> without the invalid-HTML
 *     problem of nesting <a> inside <a>.
 *
 * Phase 6B  Value proposition section (3-up capability cards)
 *
 * Phase 6C  Capabilities grid — alternating numbered cards (NumberBadge)
 *           Capabilities are grounded in REAL backend models only:
 *             01 Demand Forecasting   — UsageHistory (26 wk / 6 mo weekly data)
 *             02 Vendor Scoring       — Vendor reliabilityScore/deliveryScore/qualityScore
 *             03 Purchase Approval    — PurchaseOrder multi-stage approvalStage workflow
 *             04 Site & Stock Tracking— Site + Material reorderThreshold alerts
 *           "Invoice OCR" and "Weather Risk" were NOT built — not mentioned here.
 *
 * All styled elements use Phase 4 components (PublicNav, Button, Card,
 * NumberBadge, StatPill) or LandingPage.css token-based classes.
 */

import { Link } from 'react-router-dom';
import PublicNav    from '../components/PublicNav';
import Button       from '../components/Button';
import Card         from '../components/Card';
import StatPill     from '../components/StatPill';
import NumberBadge  from '../components/NumberBadge';
import './LandingPage.css';

// ─── Nav links ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Platform',      to: '/#platform' },
  { label: 'How it works',  to: '/#how-it-works' },
  { label: 'For builders',  to: '/#for-builders' },
  { label: 'Contact',       to: '/#contact' },
];

// ─── Inline SVG icons (no icon library — consistent with Phase 4) ─────────────

function IconForecast() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="3"  y="12" width="4" height="9"  rx="1" fill="currentColor" opacity="0.5" />
      <rect x="10" y="7"  width="4" height="14" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="17" y="3"  width="4" height="18" rx="1" fill="currentColor" />
      <line x1="3" y1="21" x2="21" y2="21" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconVendor() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3 L13.5 6.5 L17.5 7 L14.75 9.5 L15.5 13.5 L12 11.5 L8.5 13.5 L9.25 9.5 L6.5 7 L10.5 6.5 Z"
        fill="currentColor" opacity="0.85" />
      <path d="M8 14 L5 21 L12 18 L19 21 L16 14" stroke="currentColor"
        strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 10 C6 6.69 8.69 4 12 4 S18 6.69 18 10 V15 L20 17 H4 L6 15 Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor"
        fillOpacity="0.15" />
      <path d="M10 17 C10 18.1 10.9 19 12 19 S14 18.1 14 17"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="18" cy="6" r="3" fill="var(--color-danger)" />
    </svg>
  );
}

// ─── 6B value-prop cards data ─────────────────────────────────────────────────
const CAPABILITIES = [
  {
    id:    'forecast',
    icon:  <IconForecast />,
    title: 'Demand Forecasting',
    desc:  'Predict material needs across all your active sites using historical consumption, project timelines, and seasonal trends — so you order right, not late.',
    pills: [
      { icon: '📅', label: '90-day outlook' },
      { icon: '📉', label: 'Waste reduction' },
    ],
  },
  {
    id:    'vendor',
    icon:  <IconVendor />,
    title: 'Vendor Scoring',
    desc:  'Rank and compare suppliers on price, delivery reliability, and quality. Surface the best deal for each material category before you commit.',
    pills: [
      { icon: '⭐', label: 'Live scorecards' },
      { icon: '📦', label: 'Multi-vendor bids' },
    ],
  },
  {
    id:    'alerts',
    icon:  <IconAlert />,
    title: 'Risk Alerts',
    desc:  'Get notified the moment a vendor misses a delivery window, a material price spikes, or a supply constraint threatens your project schedule.',
    pills: [
      { icon: '🔔', label: 'Real-time alerts' },
      { icon: '🛡️', label: 'Delay detection' },
    ],
  },
];

// ─── 6C numbered capabilities data ───────────────────────────────────────────
// Only capabilities backed by real Phase 2 models are listed.
// Stat numbers come from the Phase 2 seed.js file (do not invent):
//   8 sites, 18 vendors, 5 projects, 6 mo data (26 weeks), 6 material categories.

const NUMBERED_CAPS = [
  {
    num:   '01',
    title: 'Demand Forecasting',
    eyebrow: 'CAPABILITY',
    desc:  '26 weeks of weekly material consumption data per site, adjusted for construction phase and monsoon season, power a rolling demand model that tells you what to order before stock runs out.',
    pills: [
      { icon: '📈', label: '26 wk history' },
      { icon: '🏗️', label: '8 sites tracked' },
      { icon: '📦', label: '6 material types' },
    ],
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none"
        aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        {/* Trend line */}
        <polyline points="6,38 16,28 24,32 34,14 42,10"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          strokeLinejoin="round" fill="none" />
        {/* Area fill under trend */}
        <path d="M6 38 L16 28 L24 32 L34 14 L42 10 L42 42 L6 42 Z"
          fill="currentColor" fillOpacity="0.12" />
        {/* Axis */}
        <line x1="6" y1="42" x2="42" y2="42" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="6" y1="10" x2="6"  y2="42" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        {/* Highlight dot at latest point */}
        <circle cx="42" cy="10" r="3.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    num:   '02',
    title: 'Vendor Scoring',
    eyebrow: 'CAPABILITY',
    desc:  '18 pre-loaded suppliers scored across reliability, delivery speed, and quality. See exactly which vendor wins for each material category before raising a purchase order.',
    pills: [
      { icon: '🏆', label: '18 vendors' },
      { icon: '📊', label: 'Reliability score' },
      { icon: '🚚', label: 'Delivery tracking' },
    ],
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none"
        aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        {/* Podium */}
        <rect x="6"  y="28" width="10" height="14" rx="2"
          fill="currentColor" fillOpacity="0.4" />
        <rect x="19" y="18" width="10" height="24" rx="2"
          fill="currentColor" fillOpacity="0.85" />
        <rect x="32" y="32" width="10" height="10" rx="2"
          fill="currentColor" fillOpacity="0.4" />
        {/* Crown on #1 */}
        <path d="M19 16 L24 10 L29 16 Z" fill="currentColor" opacity="0.9" />
        <circle cx="24" cy="9" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    num:   '03',
    title: 'Purchase Approval Workflow',
    eyebrow: 'CAPABILITY',
    desc:  'Every purchase order moves through a gated four-stage approval chain — site engineer → project manager → finance → approved — with delivery status tracked end-to-end.',
    pills: [
      { icon: '✅', label: '4-stage approval' },
      { icon: '📋', label: '5 projects' },
      { icon: '⏱️', label: 'Status tracking' },
    ],
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none"
        aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        {/* Workflow nodes */}
        <circle cx="8"  cy="24" r="5" stroke="currentColor" strokeWidth="2"
          fill="currentColor" fillOpacity="0.2" />
        <circle cx="22" cy="24" r="5" stroke="currentColor" strokeWidth="2"
          fill="currentColor" fillOpacity="0.4" />
        <circle cx="36" cy="24" r="5" stroke="currentColor" strokeWidth="2"
          fill="currentColor" fillOpacity="0.7" />
        <circle cx="44" cy="14" r="4" fill="currentColor" />
        {/* Checkmark in final node */}
        <path d="M41 14 L43.5 16.5 L47 12" stroke="var(--color-surface-dark)"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Connectors */}
        <line x1="13" y1="24" x2="17" y2="24" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="27" y1="24" x2="31" y2="24" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="39.5" y1="21" x2="41.5" y2="17" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    num:   '04',
    title: 'Site & Stock Tracking',
    eyebrow: 'CAPABILITY',
    desc:  'Monitor live stock levels against reorder thresholds across all 8 active sites. Catch low-stock warnings before they become work stoppages.',
    pills: [
      { icon: '📍', label: '8 sites' },
      { icon: '⚠️', label: 'Reorder alerts' },
      { icon: '🔩', label: '6 mo data' },
    ],
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none"
        aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        {/* Map pin */}
        <path d="M24 4 C17.37 4 12 9.37 12 16 C12 24 24 42 24 42 C24 42 36 24 36 16 C36 9.37 30.63 4 24 4 Z"
          stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
        {/* Inner circle */}
        <circle cx="24" cy="16" r="5" fill="currentColor" />
        {/* Pulse rings */}
        <circle cx="24" cy="16" r="9" stroke="currentColor"
          strokeWidth="1" strokeDasharray="3 3" opacity="0.35" fill="none" />
      </svg>
    ),
  },
];

// ─── LandingPage ─────────────────────────────────────────────────────────────

function LandingPage() {
  return (
    <div className="landing-page">

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <PublicNav links={NAV_LINKS} />

      {/* ══════════════════════════════════════════════════════════════════════
          PHASE 6A — HERO SECTION
          ════════════════════════════════════════════════════════════════ */}
      <section className="lp-hero" id="hero" aria-labelledby="hero-headline">
        <div className="lp-hero__inner">

          <p className="lp-hero__eyebrow" aria-hidden="true">
            ⚡ Procurement intelligence platform
          </p>

          <h1 className="lp-hero__headline" id="hero-headline">
            Smarter procurement for{' '}
            <span className="lp-hero__headline-accent">every site</span>{' '}
            you run
          </h1>

          <p className="lp-hero__subtext">
            SmartBrick gives construction teams real-time forecasting, vendor
            scoring, and supply-risk alerts — so nothing stalls your build.
          </p>

          <div className="lp-hero__cta-row">
            <Button
              as={Link}
              to="/signup"
              variant="primary"
              className="lp-hero__cta-primary"
              id="hero-cta-primary"
            >
              Request demo
            </Button>
            <Button
              as={Link}
              to="/#how-it-works"
              variant="secondary"
              id="hero-cta-secondary"
            >
              See how it works
            </Button>
          </div>
        </div>

        <div className="lp-hero__divider" aria-hidden="true" />
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PHASE 6B — VALUE PROPOSITION SECTION
          ════════════════════════════════════════════════════════════════ */}
      <section className="lp-value" id="platform" aria-labelledby="value-heading">
        <div className="lp-value__inner">

          <header className="lp-value__header">
            <h2 className="lp-value__heading" id="value-heading">
              End-to-end intelligence for{' '}
              <span className="lp-value__heading-accent">every order</span>
            </h2>
            <p className="lp-value__subtext">
              Three core capabilities that work together to keep your supply
              chain moving — from forecast to delivery.
            </p>
          </header>

          <div className="lp-value__cards">
            {CAPABILITIES.map(({ id, icon, title, desc, pills }) => (
              <Card key={id} surface="navy-secondary" className="lp-cap-card">
                <div className="lp-cap-card__icon-wrap" aria-hidden="true">
                  {icon}
                </div>
                <h3 className="lp-cap-card__title">{title}</h3>
                <p className="lp-cap-card__desc">{desc}</p>
                <div className="lp-cap-card__pills">
                  {pills.map(({ icon: pillIcon, label }) => (
                    <StatPill key={label} icon={pillIcon} label={label} />
                  ))}
                </div>
              </Card>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PHASE 6C — CAPABILITIES GRID (NUMBERED ALTERNATING CARDS)
          ════════════════════════════════════════════════════════════════ */}
      <section
        className="lp-caps"
        id="how-it-works"
        aria-labelledby="caps-heading"
      >
        <div className="lp-caps__inner">

          <header className="lp-caps__header">
            <h2 className="lp-caps__heading" id="caps-heading">
              How SmartBrick{' '}
              <span className="lp-caps__heading-accent">works</span>
            </h2>
            <p className="lp-caps__subtext">
              Four integrated capabilities, each grounded in your actual project
              and site data — not generic estimates.
            </p>
          </header>

          {/* Alternating numbered capability rows */}
          {NUMBERED_CAPS.map(({ num, title, eyebrow, desc, pills, icon }, idx) => {
            const isEven = idx % 2 === 1;   // 0=left-icon, 1=right-icon, alternating

            return (
              <article
                key={num}
                className={`lp-caps__row ${isEven ? 'lp-caps__row--reversed' : ''}`}
                aria-label={`Capability ${num}: ${title}`}
              >
                {/* ── Visual block (icon in Card) ───────────────────────── */}
                <div className="lp-caps__visual">
                  <Card surface="navy-secondary" className="lp-caps__icon-card">
                    <div className="lp-caps__icon-inner" aria-hidden="true">
                      {icon}
                    </div>
                  </Card>
                </div>

                {/* ── Text block ────────────────────────────────────────── */}
                <div className="lp-caps__text">
                  {/* Number badge + eyebrow row */}
                  <div className="lp-caps__meta">
                    <NumberBadge aria-label={`Step ${num}`}>{num}</NumberBadge>
                    <span className="lp-caps__eyebrow">{eyebrow}</span>
                  </div>

                  <h3 className="lp-caps__title">{title}</h3>
                  <p className="lp-caps__desc">{desc}</p>

                  {/* StatPill row — seed-accurate numbers */}
                  <div className="lp-caps__pills">
                    {pills.map(({ icon: pillIcon, label }) => (
                      <StatPill key={label} icon={pillIcon} label={label} />
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

    </div>
  );
}

export default LandingPage;
