import { Link } from 'react-router-dom';
import './LegalPage.css';

function TermsOfServicePage() {
  return (
    <div className="legal-page">
      <main className="legal-page__main">
        <Link to="/" className="legal-page__back">Back to SmartBrick</Link>

        <header className="legal-page__header">
          <p className="legal-page__eyebrow">Legal</p>
          <h1 className="legal-page__title">Terms of Service</h1>
          <p className="legal-page__updated">Last updated: July 1, 2026</p>
        </header>

        <div className="legal-page__content">
          <section className="legal-page__section">
            <h2>Use of SmartBrick</h2>
            <p>
              SmartBrick is provided for construction procurement planning,
              analytics, forecasting, vendor scoring, reporting, and related
              operational workflows. You agree to use the service only for lawful
              purposes and in accordance with these terms.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>Accounts and Access</h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              account and for activity under your credentials. SmartBrick may use
              role-based permissions to limit access to specific application
              features.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>Customer Data</h2>
            <p>
              You retain ownership of data you submit to SmartBrick. You grant
              SmartBrick permission to process that data as needed to provide,
              secure, monitor, and improve the service.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>Demo and Forecasting Outputs</h2>
            <p>
              SmartBrick may include demo records, generated recommendations,
              forecasts, and estimates. These outputs are decision-support tools
              and should be reviewed by qualified project, procurement, or finance
              personnel before being used for business decisions.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>Availability and Changes</h2>
            <p>
              We may modify, suspend, or discontinue parts of SmartBrick as the
              product evolves. We aim to maintain reliable service but do not
              guarantee uninterrupted availability.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>Contact</h2>
            <p>
              Questions about these terms can be sent to hello@smartbrick.app.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default TermsOfServicePage;
