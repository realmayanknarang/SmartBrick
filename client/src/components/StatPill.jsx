/**
 * client/src/components/StatPill.jsx
 *
 * SmartBrick reusable StatPill — Phase 4C
 * ─────────────────────────────────────────────────────────────────────────────
 * A compact inline element combining an icon + a label, used for the stat
 * rows that appear on capability cards (e.g. "8 sites · 18 vendors · 6 mo data").
 *
 * Because no icon library is installed in this project, the `icon` prop
 * accepts ANY renderable React node — a plain SVG element, an emoji string,
 * a text character, or a future icon-library component.  The component itself
 * is icon-library-agnostic.
 *
 * Props
 * ──────────────────────────────────────────────────────────────────────────
 * icon      React.ReactNode — the icon to render on the left side.
 *           Examples:
 *             icon={<svg …/>}         (inline SVG)
 *             icon="📍"               (emoji)
 *             icon="▸"                (Unicode char)
 *
 * label     string — the text label rendered to the right of the icon.
 *
 * className Extra class(es) to merge in (optional).
 *
 * All other props (aria-label, data-*, …) are forwarded to the root <span>.
 *
 * Usage examples
 * ──────────────
 *   <StatPill icon="📍" label="8 sites" />
 *   <StatPill icon={<MySvgIcon />} label="18 vendors" />
 *   <StatPill icon="🗓" label="6 mo data" />
 */

import './StatPill.css';

/**
 * @param {object}          props
 * @param {React.ReactNode} props.icon
 * @param {string}          props.label
 * @param {string}          [props.className]
 */
function StatPill({ icon, label, className = '', ...rest }) {
  const classes = ['stat-pill', className].filter(Boolean).join(' ');

  return (
    <span className={classes} {...rest}>
      {icon !== undefined && (
        <span className="stat-pill__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="stat-pill__label">{label}</span>
    </span>
  );
}

export default StatPill;
