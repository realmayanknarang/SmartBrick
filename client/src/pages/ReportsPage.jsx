/**
 * client/src/pages/ReportsPage.jsx
 *
 * Report Export UI — Phase 11B
 * ─────────────────────────────────────────────────────────────────────────────
 * Triggers real PDF/Excel downloads from Phase 11A backend endpoints.
 */

import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SignOutButton } from '@clerk/clerk-react';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import { NAV_ITEMS } from '../config/dashboardNav.jsx';
import { downloadReport } from '../utils/downloadReport.js';
import './DashboardPage.css';
import './ReportsPage.css';

function ReportDownloadCard({ icon, title, description, endpoint, defaultFilename, loadingKey, onDownload, downloading }) {
  const isLoading = downloading === loadingKey;

  return (
    <Card surface="navy-secondary" padding="var(--space-6)" className="reports-card">
      <span className="reports-card__icon" aria-hidden="true">{icon}</span>
      <h3 className="reports-card__title">{title}</h3>
      <p className="reports-card__desc">{description}</p>
      <button
        type="button"
        className="reports-card__btn"
        disabled={!!downloading}
        onClick={() => onDownload(loadingKey, endpoint, defaultFilename)}
      >
        {isLoading ? (
          <>
            <span className="reports-card__btn-spinner" aria-hidden="true" />
            Generating…
          </>
        ) : (
          <>Download</>
        )}
      </button>
    </Card>
  );
}

function ReportsPage() {
  const { pathname } = useLocation();
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState(null);

  async function handleDownload(key, endpoint, defaultFilename) {
    setDownloading(key);
    setError(null);
    try {
      await downloadReport(endpoint, defaultFilename);
    } catch (err) {
      setError(err.message || 'Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Reports</h1>
          </div>
          <div className="dash-topbar__right">
            <Link to="/dashboard" className="dash-topbar__link">Overview</Link>
            <Link to="/" className="dash-topbar__link">Home</Link>
            <SignOutButton>
              <button className="dash-topbar__signout" id="reports-sign-out-btn">Sign out</button>
            </SignOutButton>
          </div>
        </header>

        <div className="dash-content">
          <section className="dash-welcome" aria-label="Reports overview">
            <h2 className="dash-welcome__name">Export Reports</h2>
            <p className="dash-welcome__sub">
              Download spending and vendor reports generated from live SmartBrick data.
            </p>
          </section>

          <div className="reports-grid">
            <ReportDownloadCard
              icon="📄"
              title="Download Spending Report (PDF)"
              description="Total spend, spend-by-category breakdown, and spend-by-project summary — same data as the Analytics dashboard."
              endpoint="/reports/spending-pdf"
              defaultFilename="smartbrick-spending-report.pdf"
              loadingKey="pdf"
              onDownload={handleDownload}
              downloading={downloading}
            />
            <ReportDownloadCard
              icon="📊"
              title="Download Vendor List (Excel)"
              description="All active vendors with composite scores, reliability, delivery, and quality ratings — same data as the Vendors page."
              endpoint="/reports/vendor-list-excel"
              defaultFilename="smartbrick-vendor-list.xlsx"
              loadingKey="excel"
              onDownload={handleDownload}
              downloading={downloading}
            />
          </div>

          {error && (
            <div className="reports-error" role="alert">
              {error}
            </div>
          )}

          <p className="reports-note">
            Reports are generated on demand from your MongoDB data. Large datasets may take a few seconds to compile.
          </p>
        </div>
      </main>
    </div>
  );
}

export default ReportsPage;
