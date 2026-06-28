/**
 * client/src/pages/StyleGuidePage.jsx
 *
 * SmartBrick Design System — Style Guide — Phase 4F
 * ─────────────────────────────────────────────────────────────────────────────
 * A single-page reference that renders EVERY component built in 4B–4E so the
 * full token + component library is visible in one place.
 *
 * This page is intentionally left accessible at /style-guide after Phase 4
 * is complete.  It serves as a living reference while Phase 5/6 build real
 * pages — developers can cross-check colours, spacing, and states without
 * reopening Figma.  It can be removed or access-gated before a public launch.
 *
 * Sections
 * ──────────────────────────────────────────────────────────────────────────
 * 0.  Colour tokens           — swatches for every --color-* token
 * 1.  Typography              — type scale from xs → 3xl on both surfaces
 * 2.  Buttons                 — all 4 variants × 2 sizes + disabled
 * 3.  Cards                   — all 3 surface variants with content
 * 4.  NumberBadge             — several number examples
 * 5.  StatPill                — icon + label combinations
 * 6.  TextInput               — default, with value, error state, disabled
 * 7.  Select                  — sample options + error state
 * 8.  PublicNav               — signed-out preview (static)
 * 9.  Sidebar                 — with sample items, active highlighted
 */

import { useState } from 'react';
import Button      from '../components/Button';
import Card        from '../components/Card';
import NumberBadge from '../components/NumberBadge';
import StatPill    from '../components/StatPill';
import TextInput   from '../components/TextInput';
import SelectField from '../components/Select';
import PublicNav   from '../components/PublicNav';
import Sidebar     from '../components/Sidebar';
import './StyleGuidePage.css';

// ─── Inline SVG icon helpers (no icon library required) ──────────────────────
const icons = {
  home: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  file: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V6L9 1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M9 1v5h5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  truck: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 3h9v8H1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M10 6h2.5L14 9v2h-4V6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <circle cx="4" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="12" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  chart: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 12l4-4 3 3 4-5 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  pin: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M7 2a3.5 3.5 0 010 7C4 9 2 7 2 5.5A5 5 0 017 0.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M7 9v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  vendor: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="5" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M4 5V4a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  calendar: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="2" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1 6h12M4 1v2M10 1v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
};

// ─── Sample sidebar items ─────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { icon: icons.home,     label: 'Overview',       path: '/dashboard' },
  { icon: icons.file,     label: 'Requisitions',   path: '/dashboard/requisitions' },
  { icon: icons.truck,    label: 'Vendors',        path: '/dashboard/vendors' },
  { icon: icons.chart,    label: 'Analytics',      path: '/dashboard/analytics' },
  { icon: icons.settings, label: 'Settings',       path: '/dashboard/settings' },
];

// ─── Sample nav links for PublicNav preview ───────────────────────────────────
const NAV_LINKS = [
  { label: 'Features', to: '/#features' },
  { label: 'Pricing',  to: '/pricing' },
  { label: 'About',    to: '/about' },
];

// ─── Colour swatch data ───────────────────────────────────────────────────────
const COLOR_SWATCHES = [
  { name: '--color-surface-dark',        hex: '#1A2B3C', label: 'Surface Dark (Navy)',       dark: true  },
  { name: '--color-surface-dark-raised', hex: '#2E4154', label: 'Surface Dark Raised',       dark: true  },
  { name: '--color-accent',              hex: '#E8C547', label: 'Accent (Gold)',              dark: false },
  { name: '--color-border-dark',         hex: '#4A5D6E', label: 'Border Dark',                dark: true  },
  { name: '--color-text-on-dark',        hex: '#FFFFFF', label: 'Text on Dark',              dark: true  },
  { name: '--color-text-on-dark-muted',  hex: '#9FB0BC', label: 'Text on Dark (Muted)',      dark: true  },
  { name: '--color-text-on-dark-faint',  hex: '#CBD5DD', label: 'Text on Dark (Faint)',      dark: true  },
  { name: '--color-surface-light',       hex: '#FFFFFF', label: 'Surface Light',             dark: false },
  { name: '--color-text-on-light',       hex: '#1A2B3C', label: 'Text on Light',             dark: false },
  { name: '--color-text-on-light-muted', hex: '#6B7680', label: 'Text on Light (Muted)',     dark: false },
  { name: '--color-border-light',        hex: '#E2E5E8', label: 'Border Light',              dark: false },
  { name: '--color-success',             hex: '#3CB57A', label: 'Success',                   dark: true  },
  { name: '--color-danger',              hex: '#E05C5C', label: 'Danger',                    dark: true  },
  { name: '--color-info',                hex: '#4A90D9', label: 'Info',                      dark: true  },
];

// ─── Reusable section wrapper ─────────────────────────────────────────────────
function Section({ title, dark = false, children }) {
  return (
    <section className={`sg-section ${dark ? 'sg-section--dark' : 'sg-section--light'}`}>
      <div className="sg-section__inner">
        <h2 className="sg-section__title">{title}</h2>
        {children}
      </div>
    </section>
  );
}

// ─── Label helper ─────────────────────────────────────────────────────────────
function SgLabel({ children, dark = false }) {
  return (
    <p className={`sg-label ${dark ? 'sg-label--dark' : 'sg-label--light'}`}>
      {children}
    </p>
  );
}

// ─── Row helper ──────────────────────────────────────────────────────────────
function SgRow({ children, wrap = true }) {
  return (
    <div className={`sg-row${wrap ? ' sg-row--wrap' : ''}`}>
      {children}
    </div>
  );
}

// ─── Swatch ──────────────────────────────────────────────────────────────────
function Swatch({ name, hex, label, dark }) {
  return (
    <div className="sg-swatch" style={{ backgroundColor: hex }}>
      <div className={`sg-swatch__info ${dark ? 'sg-swatch__info--dark' : 'sg-swatch__info--light'}`}>
        <span className="sg-swatch__label">{label}</span>
        <span className="sg-swatch__hex">{hex}</span>
        <code className="sg-swatch__var">{name}</code>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────────────────────

function StyleGuidePage() {
  // Controlled state for interactive form demos
  const [textVal,   setTextVal]   = useState('');
  const [emailVal,  setEmailVal]  = useState('name@company.com');
  const [selectVal, setSelectVal] = useState('');

  const ROLE_OPTIONS = [
    { value: 'owner',           label: 'Owner' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'site_engineer',   label: 'Site Engineer' },
    { value: 'finance',         label: 'Finance' },
  ];

  return (
    <div className="sg-page">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <header className="sg-header">
        <div className="sg-header__inner">
          <div className="sg-header__eyebrow">SmartBrick · Phase 4</div>
          <h1 className="sg-header__title">Design System</h1>
          <p className="sg-header__sub">
            Every token and component in one place. Navy/gold direction.
            Reference this page while building Phase 5–6 real pages.
          </p>
          <div className="sg-header__meta">
            <span className="sg-header__badge">Dev reference · /style-guide</span>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 0. COLOUR TOKENS                                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section title="0 · Colour Tokens" dark>
        <div className="sg-swatches">
          {COLOR_SWATCHES.map(s => <Swatch key={s.name} {...s} />)}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 1. TYPOGRAPHY                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section title="1 · Typography" dark>
        <SgLabel dark>Display font (Barlow Condensed) — headings</SgLabel>
        <div className="sg-type-stack">
          {[
            ['--text-3xl', '28px', 'display'],
            ['--text-2xl', '24px', 'display'],
            ['--text-xl',  '20px', 'display'],
            ['--text-lg',  '18px', 'display'],
          ].map(([token, _size, _font]) => (
            <div key={token} className="sg-type-row">
              <code className="sg-type-token">{token}</code>
              <span className="sg-type-sample" style={{ fontFamily: 'var(--font-display)', fontSize: `var(${token})`, fontWeight: 700, color: 'var(--color-text-on-dark)', letterSpacing: '0.04em' }}>
                SmartBrick AI Procurement
              </span>
            </div>
          ))}
        </div>

        <SgLabel dark>Body font (Inter) — UI text</SgLabel>
        <div className="sg-type-stack">
          {[
            ['--text-md',   '16px'],
            ['--text-base', '14px'],
            ['--text-sm',   '12px'],
            ['--text-xs',   '11px'],
          ].map(([token]) => (
            <div key={token} className="sg-type-row">
              <code className="sg-type-token">{token}</code>
              <span className="sg-type-sample" style={{ fontFamily: 'var(--font-body)', fontSize: `var(${token})`, color: 'var(--color-text-on-dark)' }}>
                The quick brown fox jumps over the lazy dog
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 2. BUTTONS                                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section title="2 · Buttons" dark>
        <SgLabel dark>variant="primary" — gold/navy, pill — on dark surfaces</SgLabel>
        <SgRow>
          <Button variant="primary" size="md">Get Started  ↗</Button>
          <Button variant="primary" size="sm">Get Started sm</Button>
          <Button variant="primary" size="md" disabled>Disabled</Button>
        </SgRow>

        <SgLabel dark>variant="secondary" — ghost/outline, pill — on dark surfaces</SgLabel>
        <SgRow>
          <Button variant="secondary" size="md">Learn More</Button>
          <Button variant="secondary" size="sm">Learn More sm</Button>
          <Button variant="secondary" size="md" disabled>Disabled</Button>
        </SgRow>
      </Section>

      <Section title="" dark={false}>
        <SgLabel>variant="dark" — navy fill, small radius — on light surfaces</SgLabel>
        <SgRow>
          <Button variant="dark" size="md">Submit Form</Button>
          <Button variant="dark" size="sm">Submit sm</Button>
          <Button variant="dark" size="md" disabled>Disabled</Button>
        </SgRow>

        <SgLabel>variant="outline-light" — white fill, light border — on light surfaces</SgLabel>
        <SgRow>
          <Button variant="outline-light" size="md">Continue with Google</Button>
          <Button variant="outline-light" size="sm">Cancel</Button>
          <Button variant="outline-light" size="md" disabled>Disabled</Button>
        </SgRow>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 3. CARDS                                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section title="3 · Cards" dark>
        <div className="sg-cards-grid">

          <div>
            <SgLabel dark>surface="navy" — primary dark (#1A2B3C)</SgLabel>
            <Card surface="navy">
              <NumberBadge>01</NumberBadge>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-on-dark)', margin: 'var(--space-3) 0 var(--space-2)', letterSpacing: '0.03em' }}>
                Demand Forecasting
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--color-text-on-dark-muted)', margin: '0 0 var(--space-4)', lineHeight: 1.5 }}>
                Predict material needs before they arise using project history and supplier lead times.
              </p>
              <div className="sg-stat-row">
                <StatPill icon={icons.pin}      label="8 sites" />
                <StatPill icon={icons.vendor}   label="18 vendors" />
                <StatPill icon={icons.calendar} label="6 mo data" />
              </div>
            </Card>
          </div>

          <div>
            <SgLabel dark>surface="navy-secondary" — raised (#2E4154) — default</SgLabel>
            <Card surface="navy-secondary">
              <NumberBadge>02</NumberBadge>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-on-dark)', margin: 'var(--space-3) 0 var(--space-2)', letterSpacing: '0.03em' }}>
                Smart Requisitions
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--color-text-on-dark-muted)', margin: '0 0 var(--space-4)', lineHeight: 1.5 }}>
                Auto-generate purchase orders from bill-of-materials across active projects.
              </p>
              <div className="sg-stat-row">
                <StatPill icon={icons.pin}      label="12 projects" />
                <StatPill icon={icons.calendar} label="48 h cycle" />
              </div>
            </Card>
          </div>

          <div>
            <SgLabel>surface="light" — white (#FFFFFF)</SgLabel>
            <div className="sg-light-bg-wrap">
              <Card surface="light">
                <NumberBadge style={{ borderColor: 'var(--color-border-light)', color: 'var(--color-text-on-light-muted)' }}>03</NumberBadge>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-on-light)', margin: 'var(--space-3) 0 var(--space-2)', letterSpacing: '0.03em' }}>
                  Vendor Intelligence
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--color-text-on-light-muted)', margin: '0 0 var(--space-4)', lineHeight: 1.5 }}>
                  Score and rank suppliers by price, reliability, and compliance in real time.
                </p>
                <Button variant="dark" size="sm">View Vendors</Button>
              </Card>
            </div>
          </div>

        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 4. NUMBERBADGE                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section title="4 · NumberBadge" dark>
        <SgLabel dark>36×36 px circle, dark border, display font</SgLabel>
        <SgRow>
          <NumberBadge>01</NumberBadge>
          <NumberBadge>02</NumberBadge>
          <NumberBadge>03</NumberBadge>
          <NumberBadge>04</NumberBadge>
          <NumberBadge>✓</NumberBadge>
        </SgRow>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 5. STATPILL                                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section title="5 · StatPill" dark>
        <SgLabel dark>Icon accepts any ReactNode (inline SVG shown here)</SgLabel>
        <SgRow>
          <StatPill icon={icons.pin}      label="8 sites" />
          <StatPill icon={icons.vendor}   label="18 vendors" />
          <StatPill icon={icons.calendar} label="6 mo data" />
          <StatPill icon="📊"             label="Real-time" />
          <StatPill icon="🏗"             label="14 active projects" />
        </SgRow>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 6. TEXT INPUT                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section title="6 · TextInput" dark={false}>
        <div className="sg-form-grid">

          <div>
            <SgLabel>Default — empty (interactive)</SgLabel>
            <TextInput
              label="Full Name"
              placeholder="e.g. Arjun Mehta"
              value={textVal}
              onChange={e => setTextVal(e.target.value)}
            />
          </div>

          <div>
            <SgLabel>With value — email</SgLabel>
            <TextInput
              label="Email Address"
              type="email"
              value={emailVal}
              onChange={e => setEmailVal(e.target.value)}
            />
          </div>

          <div>
            <SgLabel>Required — password</SgLabel>
            <TextInput
              label="Password"
              type="password"
              placeholder="Min 8 characters"
              required
            />
          </div>

          <div>
            <SgLabel>Error state</SgLabel>
            <TextInput
              label="Email Address"
              type="email"
              value="not-an-email"
              onChange={() => {}}
              error="Please enter a valid email address."
            />
          </div>

          <div>
            <SgLabel>Disabled</SgLabel>
            <TextInput
              label="Company (locked)"
              value="SmartBrick Construction Ltd."
              disabled
            />
          </div>

        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 7. SELECT                                                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section title="7 · Select" dark={false}>
        <div className="sg-form-grid">

          <div>
            <SgLabel>Default with placeholder (interactive)</SgLabel>
            <SelectField
              label="Your Role"
              placeholder="Choose a role…"
              options={ROLE_OPTIONS}
              value={selectVal}
              onChange={e => setSelectVal(e.target.value)}
            />
          </div>

          <div>
            <SgLabel>Required</SgLabel>
            <SelectField
              label="Site"
              placeholder="Select a site…"
              options={[
                { value: 'site-a', label: 'Site A — Mumbai' },
                { value: 'site-b', label: 'Site B — Pune' },
                { value: 'site-c', label: 'Site C — Bangalore' },
              ]}
              value="site-a"
              onChange={() => {}}
              required
            />
          </div>

          <div>
            <SgLabel>Error state</SgLabel>
            <SelectField
              label="Category"
              placeholder="Select category…"
              options={[{ value: 'cement', label: 'Cement' }, { value: 'steel', label: 'Steel' }]}
              value=""
              onChange={() => {}}
              error="Please select a material category."
            />
          </div>

          <div>
            <SgLabel>Disabled</SgLabel>
            <SelectField
              label="Region (locked)"
              options={[{ value: 'west', label: 'West India' }]}
              value="west"
              onChange={() => {}}
              disabled
            />
          </div>

        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 8. PUBLICNAV                                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section title="8 · PublicNav" dark>
        <SgLabel dark>
          Live component — Clerk-aware (sign in/out to see state change)
        </SgLabel>
        <div className="sg-nav-preview">
          <PublicNav links={NAV_LINKS} />
        </div>

        <SgLabel dark style={{ marginTop: 'var(--space-4)' }}>
          Minimal variant — no centre links
        </SgLabel>
        <div className="sg-nav-preview">
          <PublicNav />
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 9. SIDEBAR                                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section title="9 · Sidebar" dark>
        <SgLabel dark>
          "Overview" active · 5 items (role filtering not applied — dashboard
          shell's responsibility)
        </SgLabel>
        <div className="sg-sidebar-preview">
          <Sidebar
            items={SIDEBAR_ITEMS}
            activePath="/dashboard"
          />
          <Sidebar
            items={SIDEBAR_ITEMS}
            activePath="/dashboard/vendors"
          />
        </div>
      </Section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="sg-footer">
        <p>
          SmartBrick Design System · Phase 4 · Navy <code>#1A2B3C</code> / Gold <code>#E8C547</code>
        </p>
        <p className="sg-footer__note">
          This page is intentionally left at <code>/style-guide</code> as a living
          reference for Phase 5/6 development. Remove or access-gate before public launch.
        </p>
      </footer>

    </div>
  );
}

export default StyleGuidePage;
