/**
 * client/src/components/TextInput.jsx
 *
 * SmartBrick reusable TextInput — Phase 4D
 * ─────────────────────────────────────────────────────────────────────────────
 * A labelled text/email/password input matching the login and signup panel
 * style: a small ALL-CAPS label above, followed by a bordered input below.
 * All tokens come from styles/tokens.css.
 *
 * Props
 * ──────────────────────────────────────────────────────────────────────────
 * label       string — shown as a small uppercase label above the input.
 *
 * type        "text" | "email" | "password" | any valid HTML input type.
 *             Defaults to "text".
 *
 * placeholder string — placeholder text inside the input.
 *
 * value       string — controlled value.
 *
 * onChange    function — called with the native ChangeEvent.
 *
 * required    boolean — adds the required attribute and ARIA markers.
 *
 * error       string | null — when truthy, shifts the border to danger colour
 *             and renders the error message below the input.
 *
 * id          string — forwarded to the <input>.  Auto-generated from label
 *             when not provided (so the <label> htmlFor always resolves).
 *
 * className   Extra class(es) for the wrapper div (optional).
 *
 * All other props (autoComplete, autoFocus, disabled, …) are forwarded to
 * the underlying <input> element.
 *
 * Usage examples
 * ──────────────
 *   <TextInput label="Email" type="email" value={email} onChange={handleChange} />
 *   <TextInput label="Password" type="password" error="Incorrect password" />
 */

import { useId } from 'react';
import './TextInput.css';

/**
 * @param {object}        props
 * @param {string}        props.label
 * @param {string}        [props.type='text']
 * @param {string}        [props.placeholder]
 * @param {string}        [props.value]
 * @param {function}      [props.onChange]
 * @param {boolean}       [props.required]
 * @param {string|null}   [props.error]
 * @param {string}        [props.id]
 * @param {string}        [props.className]
 */
function TextInput({
  label,
  type      = 'text',
  placeholder,
  value,
  onChange,
  required  = false,
  error,
  id: idProp,
  className = '',
  ...rest   // autoComplete, autoFocus, disabled, name, …
}) {
  // React 18+ useId gives a stable, unique ID for every component instance
  const autoId  = useId();
  const inputId = idProp ?? `text-input-${autoId}`;
  const errorId = error ? `${inputId}-error` : undefined;

  const wrapperClasses = ['text-input', className].filter(Boolean).join(' ');
  const inputClasses   = ['text-input__control', error ? 'text-input__control--error' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      <label className="text-input__label" htmlFor={inputId}>
        {label}{required && <span className="text-input__required" aria-hidden="true"> *</span>}
      </label>

      <input
        id={inputId}
        className={inputClasses}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        {...rest}
      />

      {error && (
        <p id={errorId} className="text-input__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default TextInput;
