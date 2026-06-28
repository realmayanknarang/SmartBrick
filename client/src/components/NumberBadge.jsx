/**
 * client/src/components/NumberBadge.jsx
 *
 * SmartBrick reusable NumberBadge — Phase 4C
 * ─────────────────────────────────────────────────────────────────────────────
 * A small circular badge used for the "01 / 02 / 03" numbered markers on
 * capability cards.  36 × 36 px, 1 px border in --border-dark, centres
 * its content.
 *
 * Props
 * ──────────────────────────────────────────────────────────────────────────
 * children   The number or short label to display (e.g. "01", "02", or 1).
 *            Passed as children so the caller controls formatting.
 *
 * className  Extra class(es) to merge in (optional).
 *
 * All other props (aria-label, data-*, …) are forwarded to the <span>.
 *
 * Usage examples
 * ──────────────
 *   <NumberBadge>01</NumberBadge>
 *   <NumberBadge>02</NumberBadge>
 *   <NumberBadge aria-label="Step 3">03</NumberBadge>
 */

import './NumberBadge.css';

/**
 * @param {object}          props
 * @param {React.ReactNode} props.children
 * @param {string}          [props.className]
 */
function NumberBadge({ children, className = '', ...rest }) {
  const classes = ['number-badge', className].filter(Boolean).join(' ');

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}

export default NumberBadge;
