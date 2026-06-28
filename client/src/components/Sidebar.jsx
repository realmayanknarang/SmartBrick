/**
 * client/src/components/Sidebar.jsx
 *
 * SmartBrick reusable dashboard sidebar — Phase 4E
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
  const rootClasses = ['sidebar', className].filter(Boolean).join(' ');

  return (
    <aside className={rootClasses} aria-label="Dashboard navigation">

      {/* ── Brand mark ─────────────────────────────────── */}
      <div className="sidebar__brand">
        <Link to="/" className="sidebar__brand-link" aria-label="SmartBrick home">
          <SidebarBrandMark />
          <span className="sidebar__brand-text">{logoText}</span>
        </Link>
      </div>

      {/* ── Nav items ──────────────────────────────────── */}
      <nav aria-label="Sidebar navigation">
        <ul className="sidebar__nav" role="list">
          {items.map(({ icon, label, path }) => {
            const isActive = activePath === path;

            return (
              <li key={path} className="sidebar__item">
                <Link
                  to={path}
                  className={[
                    'sidebar__link',
                    isActive ? 'sidebar__link--active' : '',
                  ].filter(Boolean).join(' ')}
                  aria-current={isActive ? 'page' : undefined}
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
    </aside>
  );
}

export default Sidebar;
