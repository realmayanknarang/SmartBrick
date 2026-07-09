
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthBrandPanel from '../components/AuthBrandPanel';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import './LoginPage.css';

const LOGIN_BENEFITS = [
  'Role-based access for your entire team',
  'Live alerts on price changes and delays',
  'Vendor scorecard updated in real time',
];

function OrDivider() {
  return (
    <div className="auth-form__divider" aria-hidden="true">
      <span className="auth-form__divider-line" />
      <span className="auth-form__divider-text">OR</span>
      <span className="auth-form__divider-line" />
    </div>
  );
}

function LoginPage() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const navigate = useNavigate();
  const { signIn, isSignedIn } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (isDemo) {
      setEmail('owner@smartbrick-demo.com');
    }
  }, [isDemo]);

  useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isSignedIn, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const user = await signIn(email, password);
      const routes = {
        owner: '/marketplace/owner',
        builder: '/marketplace/builder',
        vendor: '/marketplace/vendor',
      };
      navigate(routes[user.role] || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-layout__brand">
        <AuthBrandPanel
          headline="Procurement intelligence for every site you run"
          subtext="Sign in to your SmartBrick workspace."
          benefits={LOGIN_BENEFITS}
          activeDot={0}
        />
      </div>

      <div className="auth-layout__form">
        <div className="auth-form">
          <div className="auth-form__header">
            <h1 className="auth-form__title">Sign in</h1>
            <p className="auth-form__subtitle">
              Welcome back. Enter your credentials to continue.
            </p>
          </div>

          <form className="auth-form__fields" onSubmit={handleSubmit} noValidate>
            {isDemo && (
              <div className="auth-form__demo-notice" style={{
                backgroundColor: 'rgba(232, 197, 71, 0.12)',
                border: '1px solid #E8C547',
                padding: '12px',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '14px',
                color: '#142127',
                lineHeight: '1.4'
              }}>
                ℹ️ Demo credentials pre-filled. Enter password: <strong>SmartBrick2026!</strong>
              </div>
            )}
            <TextInput
              id="login-email"
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />

            <TextInput
              id="login-password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <p className="auth-form__error" role="alert">
                {error}
              </p>
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
                  Signing in…
                </span>
              ) : (
                'Continue'
              )}
            </Button>
          </form>

          <p className="auth-form__footer">
            Don&rsquo;t have an account?{' '}
            <Link to="/signup" className="auth-form__link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
