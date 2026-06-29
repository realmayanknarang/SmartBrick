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
 * as       React element type — the underlying element/component to render.
 *          Defaults to "button".
 *          ── Phase 6A extension ──────────────────────────────────────────
 *          Pass as={Link} (from react-router-dom) to render the button
 *          as a router link, or as="a" for an external anchor.  When using
 *          react-router Link, pass a `to` prop; when using "a", pass `href`.
 *          This is the minimal change needed so the landing-page hero CTA
 *          can be both styled as a Button AND navigate to /signup without
 *          wrapping the button in an outer <Link> (which would produce
 *          invalid HTML: <a> inside <a>).
 *          Example:
 *            import { Link } from 'react-router-dom';
 *            <Button as={Link} to="/signup" variant="primary">
 *              Request demo
 *            </Button>
 *          ─────────────────────────────────────────────────────────────────
 *
 * All other standard props (onClick, type, disabled, href, to, …) are
 * forwarded to the underlying element via rest spreading.
 *
 * Usage examples
 * ──────────────
 *   <Button variant="primary">Get Started</Button>
 *   <Button variant="secondary" size="sm">Learn More</Button>
 *   <Button variant="dark" type="submit" disabled={loading}>Save</Button>
 *   <Button variant="outline-light" onClick={handleGoogle}>
 *     Continue with Google
 *   </Button>
 *   <Button as={Link} to="/signup" variant="primary">Request demo</Button>
 *   <Button as="a" href="https://example.com" variant="secondary">Docs</Button>
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
 * @param {string|React.ElementType}                     [props.as='button']
 * @param {string}                                       [props.className]
 * @param {React.ReactNode}                              props.children
 * @param {boolean}                                      [props.disabled]
 */
function Button({
  variant   = 'primary',
  size      = 'md',
  as: Tag   = 'button',   // Phase 6A: allows <Button as={Link} to="/signup">
  className = '',
  children,
  ...rest   // onClick, type, disabled, href, to, aria-*, data-*, etc.
}) {
  const variantCls = VARIANT_CLASS[variant] ?? VARIANT_CLASS['primary'];
  const sizeCls    = SIZE_CLASS[size]    ?? SIZE_CLASS['md'];

  const classes = ['btn', variantCls, sizeCls, className]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

export default Button;
