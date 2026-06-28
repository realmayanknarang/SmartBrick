import { Link } from 'react-router-dom';
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/clerk-react';

function LandingPage() {
  return (
    <div>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
        <h1>SmartBrick</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
            <Link to="/dashboard">Dashboard</Link>
          </SignedIn>
        </div>
      </nav>
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Welcome to SmartBrick</h2>
        <p>Your intelligent building material estimator.</p>
      </main>
    </div>
  );
}

export default LandingPage;
