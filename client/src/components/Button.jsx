/**
 * client/src/components/Button.jsx
 *
 * SmartBrick reusable Button — Phase 4B
 * ─────────────────────────────────────
 * A single component that covers every button context in the app via
 * `variant` and `size` props.  All styling lives in Button.css which
 * consumes design tokens from styles/tokens.css — no hard-coded values here.
 *
 * Props
 * ──────────────────────────────────────────────────────────────────────────
 * variant  "primary" | "secondary" | "dark" | "outline-light"
 *          Defaults to "primary".
 *
 *          primary       — Gold fill, navy text, pill shape.
 *                          Use on dark (navy) surfaces for main CTAs.
 *          secondary     — Ghost/outline, white text, pill shape.
 *                          Use on dark surfaces for secondary actions.
 *          dark          — Navy fill, white text, small radius.
 *                          Use on light (white) surfaces, e.g. form submit.
 *          outline-light — White fill, light border, dark text.
 *                          Use on light surfaces for tertiary actions
 *                          (e.g. "Continue with Google", "Cancel").
 *
 * size     "sm" | "md"
 *          Defaults to "md".
 *          sm — 32px min-height, 12px text, tighter padding.
 *          md — 40px min-height, 14px text, standard padding.
 *
 * All standard <button> props (onClick, type, disabled, …) are forwarded
 * to the underlying element via rest spreading.
 *
 * Usage examples
 * ──────────────
 *   <Button variant="primary">Get Started</Button>
 *   <Button variant="secondary" size="sm">Learn More</Button>
 *   <Button variant="dark" type="submit" disabled={loading}>Save</Button>
 *   <Button variant="outline-light" onClick={handleGoogle}>
 *     Continue with Google
 *   </Button>
 */

import './Button.css';

const VARIANT_CLASS = {
  'primary':       'btn--primary',
  'secondary':     'btn--secondary',
  'dark':          'btn--dark',
  'outline-light': 'btn--outline-light',
};

const SIZE_CLASS = {
  'sm': 'btn--sm',
  'md': 'btn--md',
};

/**
 * @param {object}  props
 * @param {'primary'|'secondary'|'dark'|'outline-light'} [props.variant='primary']
 * @param {'sm'|'md'}                                    [props.size='md']
 * @param {string}                                       [props.className]
 * @param {React.ReactNode}                              props.children
 * @param {boolean}                                      [props.disabled]
 */
function Button({
  variant  = 'primary',
  size     = 'md',
  className = '',
  children,
  ...rest   // onClick, type, disabled, aria-*, data-*, etc.
}) {
  const variantCls = VARIANT_CLASS[variant] ?? VARIANT_CLASS['primary'];
  const sizeCls    = SIZE_CLASS[size]    ?? SIZE_CLASS['md'];

  const classes = ['btn', variantCls, sizeCls, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

export default Button;
