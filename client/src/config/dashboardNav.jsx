/**
 * client/src/config/dashboardNav.jsx
 *
 * Canonical sidebar navigation for all authenticated dashboard pages.
 * Grouped navigation sections - Phase 13 UI Fixes
 */

function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function SitesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L3 7v11h4v-5h6v5h4V7L10 2z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="10" width="3" height="7" rx="0.5" fill="currentColor" />
      <rect x="8.5" y="6" width="3" height="11" rx="0.5" fill="currentColor" opacity="0.85" />
      <rect x="14" y="3" width="3" height="14" rx="0.5" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function MapNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4l5 2 6-2 5 2v12l-5-2-6 2-5-2V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="7" y1="6" x2="7" y2="18" stroke="currentColor" strokeWidth="1.2" />
      <line x1="13" y1="2" x2="13" y2="16" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function CopilotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2a6 6 0 00-6 6v2.5a2.5 2.5 0 002.5 2.5h1.2a1.3 1.3 0 001.3-1.3V9.5A1.3 1.3 0 007.7 8.2H6.5A4.5 4.5 0 0110 3.5 4.5 4.5 0 0113.5 8.2h-1.2a1.3 1.3 0 00-1.3 1.3v2.2a1.3 1.3 0 001.3 1.3H13.5A2.5 2.5 0 0016 10.5V8a6 6 0 00-6-6z" fill="currentColor" opacity="0.85" />
      <rect x="7" y="14" width="6" height="3" rx="1.2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export const NAV_ITEMS = [
  { icon: <OverviewIcon />,    label: 'Overview',            path: '/dashboard', group: null },
  { icon: <CopilotIcon />,     label: 'Copilot',             path: '/dashboard/copilot', group: null },
  { icon: <SitesIcon />,       label: 'SITES & VENDORS',     path: '/dashboard/sites-vendors', group: 'PROCUREMENT' },
  { icon: <AnalyticsIcon />,   label: 'ANALYTICS & REPORTS', path: '/dashboard/analytics-reports', group: 'INSIGHTS' },
  { icon: <MapNavIcon />,      label: 'OPERATIONS',          path: '/dashboard/operations', group: 'OPERATIONS' },
];
