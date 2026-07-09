import TabBar from '../../components/TabBar';
import AnalyticsPage from '../AnalyticsPage';
import ReportsPage from '../ReportsPage';
import ForecastingPage from '../ForecastingPage';
import AlertsPage from '../AlertsPage';

function MarketplaceAnalyticsReportsPage() {
  const tabs = [
    { label: 'Analytics', content: <AnalyticsPage /> },
    { label: 'Reports', content: <ReportsPage /> },
    { label: 'Forecasting', content: <ForecastingPage /> },
    { label: 'Alerts', content: <AlertsPage /> },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <TabBar tabs={tabs} />
    </div>
  );
}

export default MarketplaceAnalyticsReportsPage;
