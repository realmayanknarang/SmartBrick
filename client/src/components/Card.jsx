/**
 * client/src/components/Card.jsx
 *
 * SmartBrick reusable Card — Phase 4C
 * ─────────────────────────────────────────────────────────────────────────────
 * A surface container component.  All spacing, colour, and radius tokens come
 * from styles/tokens.css — no hard-coded values in this file.
 *
 * Props
 * ──────────────────────────────────────────────────────────────────────────
 * surface   "navy" | "navy-secondary" | "light"
 *           Controls the background colour:
 *             navy           → --color-surface-dark       (#1A2B3C)
 *             navy-secondary → --color-surface-dark-raised (#2E4154)
 *             light          → --color-surface-light      (#FFFFFF)
 *           Defaults to "navy-secondary".
 *
 * padding   Any valid CSS padding value string.
 *           Defaults to var(--space-5) (24px).
 *
 * className Extra CSS class(es) to merge in (optional).
 *
 * children  Anything renderable.
 *
 * All other props (onClick, data-*, aria-*, …) are forwarded to the <div>.
 *
 * Usage examples
 * ──────────────
 *   <Card>…content…</Card>
 *   <Card surface="light" padding="var(--space-6)">…</Card>
 *   <Card surface="navy" className="my-extra-class">…</Card>
 */

import './Card.css';

const SURFACE_CLASS = {
  'navy':           'card--navy',
  'navy-secondary': 'card--navy-secondary',
  'light':          'card--light',
};

/**
 * @param {object}                           props
 * @param {'navy'|'navy-secondary'|'light'}  [props.surface='navy-secondary']
 * @param {string}                           [props.padding]
 * @param {string}                           [props.className]
 * @param {React.ReactNode}                  props.children
 */
function Card({
  surface   = 'navy-secondary',
  padding,
  className = '',
  children,
  ...rest
}) {
  const surfaceCls = SURFACE_CLASS[surface] ?? SURFACE_CLASS['navy-secondary'];

  const classes = ['card', surfaceCls, className]
    .filter(Boolean)
    .join(' ');

  // Only add the inline padding override when the caller passes a custom value.
  // Otherwise let Card.css apply the default via --space-5.
  const style = padding ? { padding } : undefined;

  return (
    <div className={classes} style={style} {...rest}>
      {children}
    </div>
  );
}

export default Card;
