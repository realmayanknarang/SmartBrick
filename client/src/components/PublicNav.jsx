
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';
import './PublicNav.css';

function BrandMark() {
  return (
    <svg
      className="public-nav__brand-icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="10" width="10" height="5" rx="1" fill="currentColor" />
      <rect x="13" y="10" width="10" height="5" rx="1" fill="currentColor" />
      <rect x="6" y="4" width="12" height="5" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="6" y="16" width="12" height="5" rx="1" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function PublicNav({ links = [], logoText = 'SmartBrick', className = '' }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isSignedIn, signOut } = useAuth();
  const navClasses = ['public-nav', className].filter(Boolean).join(' ');

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className={navClasses} aria-label="Main navigation">
      <Link to="/" className="public-nav__logo" aria-label="SmartBrick home">
        <BrandMark />
        <span className="public-nav__logo-text">{logoText}</span>
      </Link>

      {links.length > 0 && (
        <ul className="public-nav__links" role="list">
          {links.map(({ label, to }) => {
            const isHash = to.startsWith('#') || to.includes('#');
            if (isHash) {
              const hashPart = to.substring(to.indexOf('#'));
              const href = pathname === '/' ? hashPart : `/${hashPart}`;
              return (
                <li key={to}>
                  <a href={href} className="public-nav__link">
                    {label}
                  </a>
                </li>
              );
            }
            return (
              <li key={to}>
                <Link to={to} className="public-nav__link">
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="public-nav__spacer" aria-hidden="true" />

      <div className="public-nav__auth">
        {!isSignedIn ? (
          <>
            <Button
              as={Link}
              to="/login"
              variant="secondary"
              size="sm"
              id="public-nav-signin-btn"
            >
              Sign in
            </Button>
            <Button
              as={Link}
              to="/signup"
              variant="primary"
              size="sm"
              id="public-nav-signup-btn"
            >
              Get started
            </Button>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="public-nav__dashboard-link">
              Dashboard
            </Link>
            <div className="public-nav__user-section">
              <span className="public-nav__user-name">{user?.firstName || 'User'}</span>
              <button className="public-nav__signout-btn" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

export default PublicNav;
