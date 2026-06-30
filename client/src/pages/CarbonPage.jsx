/**
 * client/src/pages/CarbonPage.jsx
 *
 * Carbon Footprint Calculator — Phase 7F (client)
 * ─────────────────────────────────────────────────────────────────────────────
 * Simple form → Climatiq API → CO2 result display.
 *
 * Layout
 * ──────
 * • Material category dropdown
 * • Weight (tonnes) input
 * • Distance (km) input
 * • "Calculate" button → POST /api/carbon/calculate
 * • Result card: transport CO2, production CO2 (if available), total CO2
 * • Tree and car equivalents for context
 */

import { useState }               from 'react';
import { useLocation, Link }      from 'react-router-dom';
import { useUser, SignOutButton }  from '@clerk/clerk-react';
import Sidebar                    from '../components/Sidebar';
import { NAV_ITEMS } from '../config/dashboardNav.jsx';
import Card                       from '../components/Card';
import apiClient                  from '../api/client';
import './CarbonPage.css';


const MATERIALS = [
  { value: 'cement',     label: 'Cement',             emoji: '🧱' },
  { value: 'steel',      label: 'Steel / Rebar',      emoji: '⚙️' },
  { value: 'sand',       label: 'Sand / Aggregate',   emoji: '🏜' },
  { value: 'bricks',     label: 'Fired Clay Bricks',  emoji: '🏗' },
  { value: 'electrical', label: 'Electrical Fittings',emoji: '⚡' },
  { value: 'plumbing',   label: 'Plumbing Materials', emoji: '🔧' },
];

// ── CarbonPage ────────────────────────────────────────────────────────────────
function CarbonPage() {
  const { pathname } = useLocation();

  const [material,      setMaterial]      = useState('cement');
  const [weightTonnes,  setWeightTonnes]  = useState('');
  const [distanceKm,    setDistanceKm]    = useState('');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [result,        setResult]        = useState(null);

  async function handleCalculate(e) {
    e.preventDefault();
    if (!material || !weightTonnes || !distanceKm) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data } = await apiClient.post('/carbon/calculate', {
        material,
        weightTonnes: parseFloat(weightTonnes),
        distanceKm:   parseFloat(distanceKm),
      });
      setResult(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Calculation failed. Please check your inputs and try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedMat = MATERIALS.find(m => m.value === material);

  return (
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        {/* Top bar */}
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Sustainability</h1>
          </div>
          <div className="dash-topbar__right">
            <Link to="/dashboard" className="dash-topbar__link">Overview</Link>
            <Link to="/" className="dash-topbar__link">Home</Link>
            <SignOutButton>
              <button className="dash-topbar__signout" id="carbon-signout-btn">Sign out</button>
            </SignOutButton>
          </div>
        </header>

        <div className="dash-content">

          {/* Intro */}
          <section className="co2-intro">
            <p className="co2-intro__label">Powered by Climatiq · GLEC Framework</p>
            <h2 className="co2-intro__heading">Carbon Footprint Calculator</h2>
            <p className="co2-intro__sub">
              Calculate CO₂ emissions from transporting construction materials.
              Includes both freight transport (road, rigid truck) and material production
              emissions where available.
            </p>
          </section>

          <div className="co2-layout">

            {/* ── Form panel ───────────────────────────────────────────────── */}
            <Card surface="navy-secondary" className="co2-form-card">
              <h3 className="co2-section-heading">Shipment Details</h3>

              <form onSubmit={handleCalculate} className="co2-form" id="carbon-calc-form">

                <div className="co2-field">
                  <label className="co2-label" htmlFor="co2-material">
                    Material Category
                  </label>
                  <select
                    id="co2-material"
                    className="co2-select"
                    value={material}
                    onChange={e => { setMaterial(e.target.value); setResult(null); setError(null); }}
                  >
                    {MATERIALS.map(m => (
                      <option key={m.value} value={m.value}>
                        {m.emoji} {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="co2-field">
                  <label className="co2-label" htmlFor="co2-weight">
                    Weight (tonnes)
                  </label>
                  <div className="co2-input-wrap">
                    <input
                      id="co2-weight"
                      type="number"
                      className="co2-input"
                      placeholder="e.g. 10"
                      min="0.01"
                      step="0.01"
                      value={weightTonnes}
                      onChange={e => { setWeightTonnes(e.target.value); setResult(null); setError(null); }}
                      required
                    />
                    <span className="co2-input-unit">t</span>
                  </div>
                </div>

                <div className="co2-field">
                  <label className="co2-label" htmlFor="co2-distance">
                    Transport Distance (km)
                  </label>
                  <div className="co2-input-wrap">
                    <input
                      id="co2-distance"
                      type="number"
                      className="co2-input"
                      placeholder="e.g. 120"
                      min="1"
                      step="1"
                      value={distanceKm}
                      onChange={e => { setDistanceKm(e.target.value); setResult(null); setError(null); }}
                      required
                    />
                    <span className="co2-input-unit">km</span>
                  </div>
                </div>

                {error && (
                  <div className="co2-error" role="alert">
                    <span>⚠ {error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="co2-calc-btn"
                  id="co2-calculate-btn"
                  disabled={loading || !weightTonnes || !distanceKm}
                >
                  {loading ? (
                    <><span className="co2-spinner" aria-hidden="true" /> Calculating…</>
                  ) : '🌱 Calculate CO₂'}
                </button>

              </form>

              {/* Methodology note */}
              <div className="co2-methodology">
                <p className="co2-methodology__heading">Methodology</p>
                <ul className="co2-methodology__list">
                  <li>Transport: Rigid diesel truck (GLEC framework, Climatiq)</li>
                  <li>Production factors: Climatiq database (cement, steel, bricks)</li>
                  <li>Results in kg CO₂e (carbon dioxide equivalent)</li>
                </ul>
              </div>
            </Card>

            {/* ── Result panel ──────────────────────────────────────────────── */}
            <div className="co2-result-col">

              {!result && !loading && (
                <Card surface="navy-secondary" className="co2-empty-state">
                  <div className="co2-empty-state__inner">
                    <span className="co2-empty-state__icon">🌿</span>
                    <p className="co2-empty-state__heading">Results will appear here</p>
                    <p className="co2-empty-state__sub">
                      Fill in the form and click Calculate to see the carbon footprint breakdown
                    </p>
                  </div>
                </Card>
              )}

              {loading && (
                <Card surface="navy-secondary" className="co2-loading-state">
                  <div className="co2-loading-state__inner">
                    <div className="co2-loading-state__spinner" aria-hidden="true" />
                    <p className="co2-loading-state__text">Querying Climatiq API…</p>
                  </div>
                </Card>
              )}

              {result && !loading && (
                <>
                  {/* Total headline */}
                  <Card surface="navy-secondary" className="co2-total-card">
                    <div className="co2-total-card__header">
                      <span className="co2-total-card__emoji" aria-hidden="true">{selectedMat?.emoji}</span>
                      <div>
                        <p className="co2-total-card__label">Total Carbon Footprint</p>
                        <p className="co2-total-card__subtitle">
                          {result.weightTonnes}t of {selectedMat?.label} · {result.distanceKm} km
                        </p>
                      </div>
                    </div>
                    <p className="co2-total-card__value">{result.total.co2Formatted}</p>
                    <p className="co2-total-card__unit">CO₂ equivalent</p>
                  </Card>

                  {/* Breakdown */}
                  <Card surface="navy-secondary" className="co2-breakdown-card">
                    <h3 className="co2-section-heading">Breakdown</h3>

                    <div className="co2-breakdown-rows">
                      <div className="co2-breakdown-row">
                        <div className="co2-breakdown-row__left">
                          <span className="co2-breakdown-row__icon" aria-hidden="true">🚛</span>
                          <div>
                            <p className="co2-breakdown-row__title">Road Transport</p>
                            <p className="co2-breakdown-row__sub">Rigid diesel truck</p>
                          </div>
                        </div>
                        <p className="co2-breakdown-row__value">{result.transport.co2Formatted}</p>
                      </div>

                      {result.production && (
                        <div className="co2-breakdown-row">
                          <div className="co2-breakdown-row__left">
                            <span className="co2-breakdown-row__icon" aria-hidden="true">🏭</span>
                            <div>
                              <p className="co2-breakdown-row__title">Material Production</p>
                              <p className="co2-breakdown-row__sub">Cradle-to-gate</p>
                            </div>
                          </div>
                          <p className="co2-breakdown-row__value">{result.production.co2Formatted}</p>
                        </div>
                      )}

                      <div className="co2-breakdown-row co2-breakdown-row--total">
                        <div className="co2-breakdown-row__left">
                          <span className="co2-breakdown-row__icon" aria-hidden="true">🌍</span>
                          <div>
                            <p className="co2-breakdown-row__title">Total</p>
                          </div>
                        </div>
                        <p className="co2-breakdown-row__value co2-breakdown-row__value--total">
                          {result.total.co2Formatted}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Equivalents */}
                  <Card surface="navy-secondary" className="co2-equiv-card">
                    <h3 className="co2-section-heading">What does this mean?</h3>
                    <div className="co2-equiv-grid">
                      <div className="co2-equiv-item">
                        <p className="co2-equiv-item__icon" aria-hidden="true">🌳</p>
                        <p className="co2-equiv-item__value">{result.equivalents.treesNeeded.toLocaleString('en-IN')}</p>
                        <p className="co2-equiv-item__label">trees needed to absorb this CO₂ in one year</p>
                      </div>
                      <div className="co2-equiv-item">
                        <p className="co2-equiv-item__icon" aria-hidden="true">🚗</p>
                        <p className="co2-equiv-item__value">{result.equivalents.carKmEquivalent.toLocaleString('en-IN')} km</p>
                        <p className="co2-equiv-item__label">equivalent to driving an average car this far</p>
                      </div>
                    </div>
                  </Card>
                </>
              )}

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default CarbonPage;
