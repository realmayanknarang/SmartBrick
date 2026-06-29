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
 * All styled elements use components from Phase 4 (PublicNav, Button, Card)
 * or class names in LandingPage.css — no one-off inline styles.
 */

import { Link } from 'react-router-dom';
import PublicNav   from '../components/PublicNav';
import Button      from '../components/Button';
import Card        from '../components/Card';
import StatPill    from '../components/StatPill';
import './LandingPage.css';

// ─── Nav links (anchor links to sections on this page) ───────────────────────
const NAV_LINKS = [
  { label: 'Platform',      to: '/#platform' },
  { label: 'How it works',  to: '/#how-it-works' },
  { label: 'For builders',  to: '/#for-builders' },
  { label: 'Contact',       to: '/#contact' },
];

// ─── Inline SVG icons (no icon library installed — consistent with Phase 4) ──

/** Bar-chart icon — Demand Forecasting */
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

/** Star / medal icon — Vendor Scoring */
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

/** Bell / alert icon — Risk Alerts */
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

// ─── Capability cards data ────────────────────────────────────────────────────
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

// ─── LandingPage ─────────────────────────────────────────────────────────────

function LandingPage() {
  return (
    <div className="landing-page">

      {/* ── Navigation (Phase 4E — no inline nav logic) ──────────────────── */}
      <PublicNav links={NAV_LINKS} />

      {/* ════════════════════════════════════════════════════════════════════
          PHASE 6A — HERO SECTION
          ════════════════════════════════════════════════════════════════ */}
      <section className="lp-hero" id="hero" aria-labelledby="hero-headline">

        <div className="lp-hero__inner">

          {/* Eyebrow label */}
          <p className="lp-hero__eyebrow" aria-hidden="true">
            ⚡ Procurement intelligence platform
          </p>

          {/* Main headline */}
          <h1 className="lp-hero__headline" id="hero-headline">
            Smarter procurement for{' '}
            <span className="lp-hero__headline-accent">every site</span>{' '}
            you run
          </h1>

          {/* Supporting sub-text */}
          <p className="lp-hero__subtext">
            SmartBrick gives construction teams real-time forecasting, vendor
            scoring, and supply-risk alerts — so nothing stalls your build.
          </p>

          {/* CTA row */}
          {/*
           * Phase 6A note — Button `as` prop extension:
           * Button.jsx was extended to accept an `as` prop (defaults to "button").
           * Here we render Button as react-router's <Link> so the element is a
           * native <a> tag, producing valid HTML without nesting <a> inside <a>.
           */}
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

        {/* Fade-out divider at section bottom */}
        <div className="lp-hero__divider" aria-hidden="true" />
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          PHASE 6B — VALUE PROPOSITION SECTION
          ════════════════════════════════════════════════════════════════ */}
      <section
        className="lp-value"
        id="platform"
        aria-labelledby="value-heading"
      >
        <div className="lp-value__inner">

          {/* Section header */}
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

          {/* 3-up capability cards */}
          <div className="lp-value__cards">
            {CAPABILITIES.map(({ id, icon, title, desc, pills }) => (
              <Card
                key={id}
                surface="navy-secondary"
                className="lp-cap-card"
              >
                {/* Icon */}
                <div className="lp-cap-card__icon-wrap" aria-hidden="true">
                  {icon}
                </div>

                {/* Title */}
                <h3 className="lp-cap-card__title">{title}</h3>

                {/* Description */}
                <p className="lp-cap-card__desc">{desc}</p>

                {/* StatPill row */}
                <div className="lp-cap-card__pills">
                  {pills.map(({ icon: pillIcon, label }) => (
                    <StatPill
                      key={label}
                      icon={pillIcon}
                      label={label}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}

export default LandingPage;
