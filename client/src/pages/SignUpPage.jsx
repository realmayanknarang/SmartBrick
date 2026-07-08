
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthBrandPanel from '../components/AuthBrandPanel';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import './LoginPage.css';
import './SignUpPage.css';

const SIGNUP_BENEFITS = [
  'Role-based access across every site you manage',
  'Live price and delay alerts for your whole team',
  'One shared vendor list, synced in real time',
];

const INTERNAL_ROLES = [
  { value: 'owner',           label: 'Owner' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'site_engineer',   label: 'Site Engineer' },
  { value: 'finance',         label: 'Finance' },
];

const MARKETPLACE_ROLES = [
  { value: 'marketplace_owner', label: 'I want to build a property (Owner)' },
  { value: 'builder',           label: 'Builder / Contractor' },
  { value: 'vendor_supplier',   label: 'Material Supplier' },
];

function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, isSignedIn } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [role,      setRole]      = useState('');

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isSignedIn, navigate]);

  function validate() {
    const errors = {};
    if (!firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!email.trim()) {
      errors.email = 'Email is required';
    }
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!role) {
      errors.role = 'Please select a role';
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the errors below');
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const user = await signUp({ firstName, lastName, email, password, role });
      const routes = {
        marketplace_owner: '/marketplace/owner',
        builder: '/marketplace/builder',
        vendor_supplier: '/marketplace/vendor',
      };
      navigate(routes[user.role] || '/dashboard', { replace: true });
    } catch (err) {
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      }
      setError(err.response?.data?.error || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-layout__brand">
        <AuthBrandPanel
          headline="One account, every site you run"
          subtext="Create your SmartBrick workspace in under 2 minutes."
          benefits={SIGNUP_BENEFITS}
          activeDot={1}
        />
      </div>

      <div className="auth-layout__form signup-form-panel">
        <div className="auth-form signup-form">
          <div className="auth-form__header">
            <h1 className="auth-form__title">Create your account</h1>
            <p className="auth-form__subtitle">
              Join your team on SmartBrick.
            </p>
          </div>

          <form className="auth-form__fields" onSubmit={handleSubmit} noValidate>
            <div className="auth-form__name-row">
              <TextInput
                id="signup-first-name"
                label="First name"
                type="text"
                placeholder="Arjun"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                error={fieldErrors.firstName}
                required
                autoComplete="given-name"
                autoFocus
              />
              <TextInput
                id="signup-last-name"
                label="Last name"
                type="text"
                placeholder="Sharma"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                error={fieldErrors.lastName}
                required
                autoComplete="family-name"
              />
            </div>

            <TextInput
              id="signup-email"
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              error={fieldErrors.email}
              required
              autoComplete="email"
            />

            <TextInput
              id="signup-password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              error={fieldErrors.password}
              required
              autoComplete="new-password"
            />

            <div className="select-field">
              <label className="select-field__label" htmlFor="signup-role">
                Your role
                <span className="select-field__required" aria-hidden="true"> *</span>
              </label>
              <div className="select-field__wrapper">
                <select
                  id="signup-role"
                  className="select-field__control"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  required
                  aria-required="true"
                >
                  <option value="" disabled>
                    Select your role…
                  </option>
                  <optgroup label="INTERNAL TEAM">
                    {INTERNAL_ROLES.map(({ value: v, label: l }) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </optgroup>
                  <optgroup label="MARKETPLACE">
                    {MARKETPLACE_ROLES.map(({ value: v, label: l }) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </optgroup>
                </select>
                <span className="select-field__chevron" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              {fieldErrors.role && (
                <p className="auth-form__error" role="alert" style={{ marginTop: '4px', marginBottom: 0 }}>
                  {fieldErrors.role}
                </p>
              )}
            </div>

            {error && (
              <p className="auth-form__error" role="alert">{error}</p>
            )}

            <Button
              variant="dark"
              type="submit"
              disabled={loading}
              className="auth-form__submit"
            >
              {loading ? (
                <span className="auth-form__spinner-wrap">
                  <span className="auth-form__spinner" aria-hidden="true" />
                  Creating account…
                </span>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <p className="auth-form__footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-form__link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
