import TabBar from '../../components/TabBar';
import SitesPage from '../SitesPage';
import VendorsPage from '../VendorsPage';
import ApprovalsPage from '../ApprovalsPage';
import PoolingPage from '../PoolingPage';

function MarketplaceSitesVendorsPage() {
  const tabs = [
    { label: 'Sites', content: <SitesPage /> },
    { label: 'Vendors', content: <VendorsPage /> },
    { label: 'Approvals', content: <ApprovalsPage /> },
    { label: 'Order Pooling', content: <PoolingPage /> },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <TabBar tabs={tabs} />
    </div>
  );
}

export default MarketplaceSitesVendorsPage;
