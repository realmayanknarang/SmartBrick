/**
 * client/src/components/Sidebar.jsx
 *
 * SmartBrick reusable dashboard sidebar — Phase 4E / Phase 7G (mobile polish)
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders the left-hand navigation panel used in the dashboard shell.
 *
 * Design
 * ──────────────────────────────────────────────────────────────────────────
 * •  Navy-secondary background (#2E4154), sits on the primary navy page bg
 * •  Brand mark at the top (same BrickIcon + wordmark as PublicNav)
 * •  Scrollable list of nav items, each: icon (left) + label (right)
 * •  Active item: gold left-border accent + slightly brighter background
 * •  Hover: subtle background lift
 * •  Mobile (≤ 768px): collapses to a top bar with hamburger toggle
 *
 * Responsibility boundary
 * ──────────────────────────────────────────────────────────────────────────
 * This component ONLY renders what it is given.  It does NOT:
 *   • Filter items by role (the dashboard shell does that)
 *   • Track active path itself (it receives `activePath` as a prop)
 *   • Handle navigation (items use react-router <Link> internally)
 *
 * Props
 * ──────────────────────────────────────────────────────────────────────────
 * items        Array<{ icon: ReactNode, label: string, path: string }>
 *              The list of nav items to render.  Pass only the items the
 *              current user's role should see — this component renders all
 *              of them unconditionally.
 *
 * activePath   string — the current URL path (e.g. "/dashboard").
 *              An item whose `.path` matches this string gets the active style.
 *              Typically supplied via useLocation().pathname from react-router.
 *
 * logoText     string — wordmark, defaults to "SmartBrick".
 *
 * className    Extra class(es) merged onto the root element (optional).
 *
 * Usage
 * ──────────────────────────────────────────────────────────────────────────
 *   import { useLocation } from 'react-router-dom';
 *
 *   const { pathname } = useLocation();
 *   const items = [
 *     { icon: <HomeIcon />, label: 'Overview',  path: '/dashboard' },
 *     { icon: <FileIcon />, label: 'Requisitions', path: '/dashboard/requisitions' },
 *   ];
 *
 *   <Sidebar items={items} activePath={pathname} />
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

// ─── Brand mark (same inline SVG as PublicNav for consistency) ────────────────
function SidebarBrandMark() {
  return (
    <svg
      className="sidebar__brand-icon"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="10" width="10" height="5" rx="1" fill="currentColor" />
      <rect x="13" y="10" width="10" height="5" rx="1" fill="currentColor" />
      <rect x="6" y="4" width="12" height="5" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="6" y="16" width="12" height="5" rx="1" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

// ─── Hamburger icon ──────────────────────────────────────────────────────────
function HamburgerIcon({ isOpen }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      className="sidebar__hamburger-icon"
    >
      {isOpen ? (
        // X icon when open
        <>
          <line x1="4" y1="4" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="4" x2="4" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        // Hamburger lines
        <>
          <line x1="3" y1="6"  x2="19" y2="6"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/**
 * @param {object}                                    props
 * @param {Array<{icon:ReactNode,label:string,path:string}>} props.items
 * @param {string}                                    props.activePath
 * @param {string}                                    [props.logoText='SmartBrick']
 * @param {string}                                    [props.className]
 */
function Sidebar({
  items      = [],
  activePath = '',
  logoText   = 'SmartBrick',
  className  = '',
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer when navigating to a new path
  useEffect(() => {
    setMobileOpen(false);
  }, [activePath]);

  // Lock body scroll when the mobile overlay is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const rootClasses = ['sidebar', mobileOpen ? 'sidebar--mobile-open' : '', className]
    .filter(Boolean)
    .join(' ');

  const navList = (
    <nav aria-label="Sidebar navigation">
      <ul className="sidebar__nav" role="list">
        {items.map(({ icon, label, path, dividerBefore }) => {
          const isActive = activePath === path;

          return (
            <li key={path} className="sidebar__item">
              {/* Optional group divider */}
              {dividerBefore && <hr className="sidebar__divider" aria-hidden="true" />}
              <Link
                to={path}
                className={[
                  'sidebar__link',
                  isActive ? 'sidebar__link--active' : '',
                ].filter(Boolean).join(' ')}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setMobileOpen(false)}
              >
                {/* Icon slot */}
                {icon && (
                  <span className="sidebar__item-icon" aria-hidden="true">
                    {icon}
                  </span>
                )}

                {/* Label */}
                <span className="sidebar__item-label">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      {/* ── Mobile top bar (visible only on narrow screens) ─────────────── */}
      <div className="sidebar__mobile-bar" aria-hidden={!mobileOpen}>
        <Link to="/" className="sidebar__brand-link sidebar__brand-link--mobile" aria-label="SmartBrick home">
          <SidebarBrandMark />
          <span className="sidebar__brand-text">{logoText}</span>
        </Link>
        <button
          className="sidebar__hamburger"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          aria-controls="sidebar-nav-drawer"
          onClick={() => setMobileOpen(o => !o)}
        >
          <HamburgerIcon isOpen={mobileOpen} />
        </button>
      </div>

      {/* ── Overlay backdrop for mobile ──────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="sidebar__overlay"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar panel (desktop: always visible; mobile: drawer) ──────── */}
      <aside
        id="sidebar-nav-drawer"
        className={rootClasses}
        aria-label="Dashboard navigation"
        aria-hidden={undefined} // always rendered in DOM for transitions
      >
        {/* ── Brand mark ─────────────────────────────────── */}
        <div className="sidebar__brand">
          <Link to="/" className="sidebar__brand-link" aria-label="SmartBrick home">
            <SidebarBrandMark />
            <span className="sidebar__brand-text">{logoText}</span>
          </Link>
        </div>

        {/* ── Nav items ──────────────────────────────────── */}
        {navList}
      </aside>
    </>
  );
}

export default Sidebar;
