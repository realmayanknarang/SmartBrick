import { useUser, SignOutButton } from '@clerk/react';
import { Link } from 'react-router-dom';

function DashboardPage() {
  const { user } = useUser();

  return (
    <div>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
        <h1>SmartBrick Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/">Home</Link>
          <SignOutButton />
        </div>
      </nav>
      <main style={{ padding: '2rem' }}>
        <h2>Welcome{user ? `, ${user.fullName || user.emailAddresses?.[0]?.emailAddress}` : ''}!</h2>
        <p>Your dashboard content will appear here.</p>
      </main>
    </div>
  );
}

export default DashboardPage;
