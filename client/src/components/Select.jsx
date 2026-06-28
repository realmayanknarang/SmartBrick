/**
 * client/src/components/Select.jsx
 *
 * SmartBrick reusable Select — Phase 4D
 * ─────────────────────────────────────────────────────────────────────────────
 * A labelled native <select> dropdown following the same visual pattern as
 * TextInput: small uppercase label above, consistently styled control below.
 * Used primarily for the role-selection dropdown and any future selects.
 *
 * Props
 * ──────────────────────────────────────────────────────────────────────────
 * label     string — shown as a small uppercase label above the select.
 *
 * options   Array<{ value: string, label: string }> — the dropdown options.
 *           A "placeholder" option (value = "", disabled) is automatically
 *           prepended when a placeholder prop is provided.
 *
 * placeholder  string — optional placeholder text for the first/empty option.
 *
 * value     string — controlled value.
 *
 * onChange  function — called with the native ChangeEvent.
 *
 * required  boolean — adds the required attribute and ARIA markers.
 *
 * error     string | null — when truthy, shifts border to danger colour and
 *           renders the error message below the select.
 *
 * id        string — forwarded to the <select>.  Auto-generated from label
 *           when not provided.
 *
 * className Extra class(es) for the wrapper div (optional).
 *
 * All other props (disabled, name, …) are forwarded to the <select>.
 *
 * Usage examples
 * ──────────────
 *   <Select
 *     label="Role"
 *     options={[
 *       { value: 'owner',           label: 'Owner' },
 *       { value: 'project_manager', label: 'Project Manager' },
 *     ]}
 *     value={role}
 *     onChange={e => setRole(e.target.value)}
 *   />
 *   <Select label="Site" options={sites} error="Please select a site" />
 */

import { useId } from 'react';
import './Select.css';

/**
 * @param {object}                          props
 * @param {string}                          props.label
 * @param {Array<{value:string,label:string}>} props.options
 * @param {string}                          [props.placeholder]
 * @param {string}                          [props.value]
 * @param {function}                        [props.onChange]
 * @param {boolean}                         [props.required]
 * @param {string|null}                     [props.error]
 * @param {string}                          [props.id]
 * @param {string}                          [props.className]
 */
function Select({
  label,
  options      = [],
  placeholder,
  value,
  onChange,
  required     = false,
  error,
  id: idProp,
  className    = '',
  ...rest      // disabled, name, …
}) {
  const autoId   = useId();
  const selectId = idProp ?? `select-${autoId}`;
  const errorId  = error ? `${selectId}-error` : undefined;

  const wrapperClasses = ['select-field', className].filter(Boolean).join(' ');
  const selectClasses  = [
    'select-field__control',
    error ? 'select-field__control--error' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      <label className="select-field__label" htmlFor={selectId}>
        {label}
        {required && (
          <span className="select-field__required" aria-hidden="true"> *</span>
        )}
      </label>

      <div className="select-field__wrapper">
        <select
          id={selectId}
          className={selectClasses}
          value={value}
          onChange={onChange}
          required={required}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...rest}
        >
          {/* Placeholder option */}
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}

          {options.map(({ value: optVal, label: optLabel }) => (
            <option key={optVal} value={optVal}>
              {optLabel}
            </option>
          ))}
        </select>

        {/* Custom chevron — purely decorative, pointer-events: none in CSS */}
        <span className="select-field__chevron" aria-hidden="true">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      {error && (
        <p id={errorId} className="select-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default Select;
