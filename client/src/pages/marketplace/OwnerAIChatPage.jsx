import AIChatWidget from '../../components/AIChatWidget';

function OwnerAIChatPage() {
  return (
    <div style={{ padding: '2rem', height: 'calc(100vh - 120px)' }}>
      <AIChatWidget role="owner" />
    </div>
  );
}

export default OwnerAIChatPage;
