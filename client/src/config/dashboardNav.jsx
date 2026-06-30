/**
 * client/src/config/dashboardNav.jsx
 *
 * Canonical sidebar navigation for all authenticated dashboard pages.
 * Phase 11B adds the Reports item (previously scaffolded but unwired).
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

function VendorsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="6" r="3.5" fill="currentColor" />
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function ReportsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 12l2.5 2.5L14 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="6" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ForecastIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 15L7 9l3 3 7-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3h3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L2 16h16L10 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="currentColor" opacity="0.15" />
      <line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

function ScannerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12h5M14.5 12v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function WeatherNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 14c0-1.1.9-2 2-2h6a2 2 0 110 4H7a2 2 0 01-2-2z" fill="currentColor" opacity="0.5" />
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

function LeafNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 4C16 4 14 12 8 14C5 15 3 16 3 16C3 16 4 12 7 9C10 6 16 4 16 4Z" fill="currentColor" opacity="0.6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M3 16C5 13 8 11 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

function ApprovalsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PoolingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 10h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export const NAV_ITEMS = [
  { icon: <OverviewIcon />,    label: 'Overview',       path: '/dashboard' },
  { icon: <SitesIcon />,       label: 'Sites',          path: '/dashboard/sites' },
  { icon: <VendorsIcon />,     label: 'Vendors',        path: '/dashboard/vendors' },
  { icon: <AnalyticsIcon />,   label: 'Analytics',      path: '/dashboard/analytics' },
  { icon: <ReportsIcon />,     label: 'Reports',        path: '/dashboard/reports' },
  { icon: <ForecastIcon />,    label: 'Forecasting',    path: '/dashboard/forecasting' },
  { icon: <AlertsIcon />,      label: 'Alerts',         path: '/dashboard/alerts' },
  { icon: <ApprovalsIcon />,   label: 'Approvals',      path: '/dashboard/approvals' },
  { icon: <PoolingIcon />,     label: 'Order Pooling',  path: '/dashboard/pooling' },
  { icon: <ScannerIcon />,     label: 'Invoice OCR',    path: '/dashboard/invoice-scanner', dividerBefore: true },
  { icon: <WeatherNavIcon />,  label: 'Weather Alerts', path: '/dashboard/weather' },
  { icon: <MapNavIcon />,      label: 'Logistics',      path: '/dashboard/logistics' },
  { icon: <LeafNavIcon />,     label: 'Sustainability', path: '/dashboard/carbon' },
  { icon: <CopilotIcon />,     label: 'Copilot',        path: '/dashboard/copilot', dividerBefore: true },
];
