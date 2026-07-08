
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

function SidebarBrandMark() {
  return (
    <svg
      className="sidebar__brand-icon"
      width="22"
      height="22"
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

function HamburgerIcon({ isOpen }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      className="sidebar__hamburger-icon"
    >
      {isOpen ? (
        <>
          <line x1="4" y1="4" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="4" x2="4" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function Sidebar({
  items       = [],
  activePath  = '',
  logoText    = 'SmartBrick',
  className   = '',
  showSignOut = false,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    setMobileOpen(false);
  }, [activePath]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const rootClasses = ['sidebar', mobileOpen ? 'sidebar--mobile-open' : '', className]
    .filter(Boolean)
    .join(' ');

  const groupedItems = [];
  items.forEach(item => {
    const groupName = item.group || null;
    let group = groupedItems.find(g => g.name === groupName);
    if (!group) {
      group = { name: groupName, items: [] };
      groupedItems.push(group);
    }
    group.items.push(item);
  });

  const navList = (
    <nav aria-label="Sidebar navigation" className="sidebar__menu">
      {groupedItems.map((group, groupIdx) => (
        <div key={group.name || `top-${groupIdx}`} className="sidebar__group">
          {group.name && (
            <div className="sidebar__group-label">
              {group.name}
            </div>
          )}
          <ul className="sidebar__nav" role="list">
            {group.items.map(({ icon, label, path, badge }) => {
              const isActive = activePath === path || 
                (path === '/marketplace/owner/projects' && 
                 activePath.startsWith('/marketplace/owner/projects/') && 
                 !activePath.endsWith('/new'));

              return (
                <li key={path} className="sidebar__item">
                  <Link
                    to={path}
                    className={[
                      'sidebar__link',
                      isActive ? 'sidebar__link--active' : '',
                    ].filter(Boolean).join(' ')}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setMobileOpen(false)}
                  >
                    {icon && (
                      <span className="sidebar__item-icon" aria-hidden="true">
                        {icon}
                      </span>
                    )}
                    <span className="sidebar__item-label">{label}</span>
                    {badge !== undefined && badge !== null && (
                      <span className="sidebar__item-badge">{badge}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <div className="sidebar__mobile-bar" aria-hidden={!mobileOpen}>
        <Link to="/" className="sidebar__brand-link sidebar__brand-link--mobile" aria-label="SmartBrick home">
          <SidebarBrandMark />
          <span className="sidebar__brand-text">{logoText}</span>
        </Link>
        <button
          className="sidebar__hamburger"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          aria-controls="sidebar-nav-drawer"
          onClick={() => setMobileOpen(o => !o)}
        >
          <HamburgerIcon isOpen={mobileOpen} />
        </button>
      </div>

      {mobileOpen && (
        <div
          className="sidebar__overlay"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        id="sidebar-nav-drawer"
        className={rootClasses}
        aria-label="Dashboard navigation"
        aria-hidden={undefined}
      >
        <div className="sidebar__brand">
          <Link to="/" className="sidebar__brand-link" aria-label="SmartBrick home">
            <SidebarBrandMark />
            <span className="sidebar__brand-text">{logoText}</span>
          </Link>
        </div>

        {navList}

        {showSignOut && (
          <div className="sidebar__footer">
            <button className="sidebar__signout-btn" onClick={handleSignOut}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="sidebar__signout-icon">
                <path d="M5 3H19C20.1 3 21 3.9 21 5V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15H5V19H19V5H5V9H3V5C3 3.9 3.9 3 5 3Z" fill="currentColor" />
                <path d="M11 16L15 12L11 8V11H3V13H11V16Z" fill="currentColor" />
              </svg>
              <span className="sidebar__item-label">Sign Out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
