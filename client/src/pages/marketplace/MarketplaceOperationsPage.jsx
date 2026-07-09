import TabBar from '../../components/TabBar';
import InvoiceScannerPage from '../InvoiceScannerPage';
import WeatherAlertsPage from '../WeatherAlertsPage';
import LogisticsPage from '../LogisticsPage';
import CarbonPage from '../CarbonPage';

function MarketplaceOperationsPage() {
  const tabs = [
    { label: 'Invoice OCR', content: <InvoiceScannerPage /> },
    { label: 'Weather Alerts', content: <WeatherAlertsPage /> },
    { label: 'Logistics', content: <LogisticsPage /> },
    { label: 'Sustainability', content: <CarbonPage /> },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <TabBar tabs={tabs} />
    </div>
  );
}

export default MarketplaceOperationsPage;
