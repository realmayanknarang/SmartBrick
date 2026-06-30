import { Link } from 'react-router-dom';
import './LegalPage.css';

function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <main className="legal-page__main">
        <Link to="/" className="legal-page__back">Back to SmartBrick</Link>

        <header className="legal-page__header">
          <p className="legal-page__eyebrow">Legal</p>
          <h1 className="legal-page__title">Privacy Policy</h1>
          <p className="legal-page__updated">Last updated: July 1, 2026</p>
        </header>

        <div className="legal-page__content">
          <section className="legal-page__section">
            <h2>Information We Collect</h2>
            <p>
              SmartBrick collects account details, role information, project and
              procurement records, uploaded invoice content, and usage data needed
              to provide procurement analytics, alerts, forecasts, reports, and
              related application features.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>How We Use Information</h2>
            <ul>
              <li>Provide, secure, and improve the SmartBrick application.</li>
              <li>Authenticate users and apply role-based access controls.</li>
              <li>Generate dashboards, alerts, forecasts, reports, and recommendations.</li>
              <li>Monitor reliability, investigate errors, and protect against abuse.</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>Service Providers</h2>
            <p>
              We may process data through infrastructure, authentication,
              database, monitoring, and external API providers used to operate
              SmartBrick. These providers are used only to support application
              functionality and operations.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>Data Retention</h2>
            <p>
              We retain application data for as long as needed to operate the
              service, comply with legal obligations, resolve disputes, and
              maintain security. Demo data may be reset or removed at any time.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>Your Choices</h2>
            <p>
              You may request access, correction, or deletion of your personal
              information by contacting the SmartBrick team. Some records may be
              retained where required for security, audit, or legal reasons.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>Contact</h2>
            <p>
              Questions about this policy can be sent to hello@smartbrick.app.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default PrivacyPolicyPage;
