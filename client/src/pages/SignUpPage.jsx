
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthBrandPanel from '../components/AuthBrandPanel';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import './LoginPage.css';
import './SignUpPage.css';

const SIGNUP_BENEFITS = [
  'Choose your role — Owner, Builder, or Vendor',
  'Post projects, submit proposals, manage materials',
  'One account for the entire construction ecosystem',
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
        owner: '/marketplace/owner',
        builder: '/marketplace/builder',
        vendor: '/marketplace/vendor',
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

            <fieldset className="role-cards">
              <legend className="role-cards__legend">
                I want to join as a<span className="visually-hidden">:</span>
                <span className="select-field__required" aria-hidden="true"> *</span>
              </legend>

              {[
                { value: 'owner',   icon: '🏗️', title: 'Owner',           desc: 'Post projects, hire builders, manage budgets' },
                { value: 'builder', icon: '👷', title: 'Builder / Contractor', desc: 'Find projects, submit proposals, manage teams' },
                { value: 'vendor',  icon: '🏭', title: 'Material Supplier', desc: 'List materials, get leads, fulfill orders' },
              ].map(({ value: v, icon, title, desc }) => (
                <button
                  key={v}
                  type="button"
                  className={`role-card${role === v ? ' role-card--selected' : ''}`}
                  onClick={() => setRole(v)}
                  aria-pressed={role === v}
                >
                  <span className="role-card__icon">{icon}</span>
                  <span className="role-card__title">{title}</span>
                  <span className="role-card__desc">{desc}</span>
                </button>
              ))}

              {fieldErrors.role && (
                <p className="auth-form__error role-cards__error" role="alert">
                  {fieldErrors.role}
                </p>
              )}
            </fieldset>

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
