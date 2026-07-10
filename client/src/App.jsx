

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LandingPage         from './pages/LandingPage';
import LoginPage           from './pages/LoginPage';
import SignUpPage          from './pages/SignUpPage';
import DashboardPage       from './pages/DashboardPage';
import StyleGuidePage      from './pages/StyleGuidePage';
import InvoiceScannerPage  from './pages/InvoiceScannerPage';
import WeatherAlertsPage   from './pages/WeatherAlertsPage';
import LogisticsPage       from './pages/LogisticsPage';
import CarbonPage          from './pages/CarbonPage';
import SitesPage           from './pages/SitesPage';
import VendorsPage         from './pages/VendorsPage';
import AnalyticsPage       from './pages/AnalyticsPage';
import AlertsPage          from './pages/AlertsPage';
import CopilotPage         from './pages/CopilotPage';
import ForecastingPage     from './pages/ForecastingPage';
import ReportsPage         from './pages/ReportsPage';
import ApprovalsPage       from './pages/ApprovalsPage';
import PoolingPage         from './pages/PoolingPage';
import PrivacyPolicyPage   from './pages/PrivacyPolicyPage';
import TermsOfServicePage  from './pages/TermsOfServicePage';
import SitesVendorsPage    from './pages/SitesVendorsPage';
import AnalyticsReportsPage from './pages/AnalyticsReportsPage';
import OperationsPage      from './pages/OperationsPage';
// Marketplace
import OwnerDashboard   from './pages/marketplace/OwnerDashboard';
import BuilderDashboard from './pages/marketplace/BuilderDashboard';
import VendorDashboard  from './pages/marketplace/VendorDashboard';
import OwnerOverviewPage       from './pages/marketplace/OwnerOverviewPage';
import OwnerProjectsPage       from './pages/marketplace/OwnerProjectsPage';
import CreateProjectPage       from './pages/marketplace/CreateProjectPage';
import ProjectDetailPage       from './pages/marketplace/ProjectDetailPage';
import ProgressTrackingPage    from './pages/marketplace/ProgressTrackingPage';
import OwnerChatPage           from './pages/marketplace/OwnerChatPage';
import OwnerNotificationsPage  from './pages/marketplace/OwnerNotificationsPage';
import OwnerProposalsPage      from './pages/marketplace/OwnerProposalsPage';
import BuilderOverviewPage          from './pages/marketplace/BuilderOverviewPage';
import BrowseProjectsPage           from './pages/marketplace/BrowseProjectsPage';
import BuilderProjectDetailPage     from './pages/marketplace/BuilderProjectDetailPage';
import MyProposalsPage              from './pages/marketplace/MyProposalsPage';
import ActiveProjectsPage           from './pages/marketplace/ActiveProjectsPage';
import ProjectWorkspacePage         from './pages/marketplace/ProjectWorkspacePage';
import BuilderNotificationsPage     from './pages/marketplace/BuilderNotificationsPage';

// Marketplace Vendor Sub-pages — Phase M6
import VendorOverviewPage     from './pages/marketplace/VendorOverviewPage';
import MyMaterialsPage        from './pages/marketplace/MyMaterialsPage';
import AddMaterialPage        from './pages/marketplace/AddMaterialPage';
import EditMaterialPage       from './pages/marketplace/EditMaterialPage';
import BrowseMaterialsPage    from './pages/marketplace/BrowseMaterialsPage';
import PriceComparisonPage    from './pages/marketplace/PriceComparisonPage';
import MarketplaceCopilotPage from './pages/marketplace/MarketplaceCopilotPage';
import MarketplaceSitesVendorsPage from './pages/marketplace/MarketplaceSitesVendorsPage';
import MarketplaceAnalyticsReportsPage from './pages/marketplace/MarketplaceAnalyticsReportsPage';
import MarketplaceOperationsPage from './pages/marketplace/MarketplaceOperationsPage';
import OrderPage            from './pages/marketplace/OrderPage';
import MyOrdersPage         from './pages/marketplace/MyOrdersPage';
import VendorOrdersPage     from './pages/marketplace/VendorOrdersPage';

import apiClient from './api/client';

// ---------------------------------------------------------------------------
// Marketplace role helpers — Phase M1C
// ---------------------------------------------------------------------------

/**
 * The three marketplace roles introduced in Phase M1A.
 * Stored as a Set for O(1) lookup in route guards.
 */
const MARKETPLACE_ROLES = new Set(['owner', 'builder', 'vendor']);

function getDefaultPath(role) {
  if (role === 'owner')   return '/marketplace/owner';
  if (role === 'builder') return '/marketplace/builder';
  if (role === 'vendor')  return '/marketplace/vendor';
  return '/dashboard';
}

function redirectByRole(role, navigate) {
  navigate(getDefaultPath(role), { replace: true });
}

function RoleBasedRedirect() {
  const { user } = useAuth();
  const role = user?.role;

  return <Navigate to={getDefaultPath(role)} replace />;
}

function ProtectedRoute({ children }) {
  const { isSignedIn, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { isSignedIn, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) return children;

  return <RoleBasedRedirect />;
}

function MarketplaceRoute({ children }) {
  const { isSignedIn, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) return <Navigate to="/login" replace />;

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <SignUpPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/sites-vendors"
          element={
            <ProtectedRoute>
              <SitesVendorsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard/sites" element={<Navigate to="/dashboard/sites-vendors" replace />} />
        <Route path="/dashboard/vendors" element={<Navigate to="/dashboard/sites-vendors" replace />} />
        <Route path="/dashboard/approvals" element={<Navigate to="/dashboard/sites-vendors" replace />} />
        <Route path="/dashboard/pooling" element={<Navigate to="/dashboard/sites-vendors" replace />} />

        <Route
          path="/dashboard/analytics-reports"
          element={
            <ProtectedRoute>
              <AnalyticsReportsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard/analytics" element={<Navigate to="/dashboard/analytics-reports" replace />} />
        <Route path="/dashboard/reports" element={<Navigate to="/dashboard/analytics-reports" replace />} />
        <Route path="/dashboard/forecasting" element={<Navigate to="/dashboard/analytics-reports" replace />} />
        <Route path="/dashboard/alerts" element={<Navigate to="/dashboard/analytics-reports" replace />} />

        <Route
          path="/dashboard/operations"
          element={
            <ProtectedRoute>
              <OperationsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard/invoice-scanner" element={<Navigate to="/dashboard/operations" replace />} />
        <Route path="/dashboard/weather" element={<Navigate to="/dashboard/operations" replace />} />
        <Route path="/dashboard/logistics" element={<Navigate to="/dashboard/operations" replace />} />
        <Route path="/dashboard/carbon" element={<Navigate to="/dashboard/operations" replace />} />

        <Route
          path="/dashboard/copilot"
          element={
            <ProtectedRoute>
              <CopilotPage />
            </ProtectedRoute>
          }
        />

        <Route path="/style-guide" element={<StyleGuidePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />

        <Route
          path="/marketplace/owner"
          element={
            <MarketplaceRoute>
              <OwnerDashboard />
            </MarketplaceRoute>
          }
        >
          <Route path="overview" element={<OwnerOverviewPage />} />
          <Route path="projects" element={<OwnerProjectsPage />} />
          <Route path="projects/new" element={<CreateProjectPage />} />
          <Route path="projects/:id/edit" element={<CreateProjectPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:id/progress" element={<ProgressTrackingPage />} />
          <Route path="projects/:id/chat" element={<OwnerChatPage />} />
          <Route path="notifications" element={<OwnerNotificationsPage />} />
          <Route path="proposals" element={<OwnerProposalsPage />} />
          <Route path="builders" element={<div style={{ padding: '2rem', color: '#fff' }}><h3>Find Builders Page Coming Soon</h3></div>} />
          <Route path="copilot" element={<MarketplaceCopilotPage />} />
          <Route path="sites-vendors" element={<MarketplaceSitesVendorsPage />} />
          <Route path="analytics" element={<MarketplaceAnalyticsReportsPage />} />
          <Route path="operations" element={<MarketplaceOperationsPage />} />
        </Route>
        <Route
          path="/marketplace/builder"
          element={
            <MarketplaceRoute>
              <BuilderDashboard />
            </MarketplaceRoute>
          }
        >
          <Route path="overview" element={<BuilderOverviewPage />} />
          <Route path="projects" element={<BrowseProjectsPage />} />
          <Route path="projects/:id" element={<BuilderProjectDetailPage />} />
          <Route path="proposals" element={<MyProposalsPage />} />
          <Route path="workspace" element={<ActiveProjectsPage />} />
          <Route path="workspace/:projectId" element={<ProjectWorkspacePage />} />
          {/* M6C — Browse Materials (shared with vendor) */}
          <Route path="materials" element={<BrowseMaterialsPage />} />
          <Route path="order/:materialId" element={<OrderPage />} />
          <Route path="orders" element={<MyOrdersPage />} />
          {/* M5F — Builder Notifications */}
          <Route path="notifications" element={<BuilderNotificationsPage />} />
          <Route path="copilot" element={<MarketplaceCopilotPage />} />
          <Route path="sites-vendors" element={<MarketplaceSitesVendorsPage />} />
          <Route path="analytics" element={<MarketplaceAnalyticsReportsPage />} />
          <Route path="operations" element={<MarketplaceOperationsPage />} />
        </Route>
        {/* M6C — Role-agnostic compare route (navigated from BrowseMaterialsPage) */}
        <Route
          path="/marketplace/compare"
          element={
            <MarketplaceRoute>
              <PriceComparisonPage />
            </MarketplaceRoute>
          }
        />
        <Route
          path="/marketplace/vendor"
          element={
            <MarketplaceRoute>
              <VendorDashboard />
            </MarketplaceRoute>
          }
        >
          {/* M6A — Overview */}
          <Route index element={<Navigate to="/marketplace/vendor/overview" replace />} />
          <Route path="overview" element={<VendorOverviewPage />} />
          {/* M6B — My Materials CRUD */}
          <Route path="materials" element={<MyMaterialsPage />} />
          <Route path="materials/new" element={<AddMaterialPage />} />
          <Route path="materials/:id/edit" element={<EditMaterialPage />} />
          {/* M6C — Browse All Materials (shared) */}
          <Route path="browse" element={<BrowseMaterialsPage />} />
          <Route path="orders" element={<VendorOrdersPage />} />
          {/* M6D — Price Comparison */}
          <Route path="compare" element={<PriceComparisonPage />} />
          <Route path="copilot" element={<MarketplaceCopilotPage />} />
          <Route path="sites-vendors" element={<MarketplaceSitesVendorsPage />} />
          <Route path="analytics" element={<MarketplaceAnalyticsReportsPage />} />
          <Route path="operations" element={<MarketplaceOperationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
