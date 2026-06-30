/**
 * client/src/pages/ForecastingPage.jsx
 *
 * Demand Forecasting Dashboard — Phase 10E
 * ─────────────────────────────────────────────────────────────────────────────
 * Site + material selectors → GET /api/forecast/:siteId/:materialId
 * Renders historical usage transitioning into Prophet forecast with
 * confidence band. Shows clear fallback when the Python service is down.
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SignOutButton } from '@clerk/clerk-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import apiClient from '../api/client';
import './DashboardPage.css';
import './ForecastingPage.css';

// ─── Sidebar icons ───────────────────────────────────────────────────────────

function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" />
    </svg>
  );
}
function SitesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2L3 7v11h4v-5h6v5h4V7L10 2z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
function VendorsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="6" r="3.5" fill="currentColor" />
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function ReportsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <line x1="6" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="13" x2="11" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function ForecastIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 15L7 9l3 3 7-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3h3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function AlertsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2L2 16h16L10 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="currentColor" opacity="0.15" />
      <line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="0.9" fill="currentColor" />
    </svg>
  );
}
function ScannerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12h5M14.5 12v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function WeatherIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 14c0-1.1.9-2 2-2h6a2 2 0 110 4H7a2 2 0 01-2-2z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M2 4l5 2 6-2 5 2v12l-5-2-6 2-5-2V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="7" y1="6" x2="7" y2="18" stroke="currentColor" strokeWidth="1.2" />
      <line x1="13" y1="2" x2="13" y2="16" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function LeafIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M16 4C16 4 14 12 8 14C5 15 3 16 3 16C3 16 4 12 7 9C10 6 16 4 16 4Z" fill="currentColor" opacity="0.6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M3 16C5 13 8 11 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function CopilotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2a6 6 0 00-6 6v2.5a2.5 2.5 0 002.5 2.5h1.2a1.3 1.3 0 001.3-1.3V9.5A1.3 1.3 0 007.7 8.2H6.5A4.5 4.5 0 0110 3.5 4.5 4.5 0 0113.5 8.2h-1.2a1.3 1.3 0 00-1.3 1.3v2.2a1.3 1.3 0 001.3 1.3H13.5A2.5 2.5 0 0016 10.5V8a6 6 0 00-6-6z" fill="currentColor" opacity="0.85" />
      <rect x="7" y="14" width="6" height="3" rx="1.2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

const NAV_ITEMS = [
  { icon: <OverviewIcon />, label: 'Overview', path: '/dashboard' },
  { icon: <SitesIcon />, label: 'Sites', path: '/dashboard/sites' },
  { icon: <VendorsIcon />, label: 'Vendors', path: '/dashboard/vendors' },
  { icon: <ReportsIcon />, label: 'Analytics', path: '/dashboard/analytics' },
  { icon: <ForecastIcon />, label: 'Forecasting', path: '/dashboard/forecasting' },
  { icon: <AlertsIcon />, label: 'Alerts', path: '/dashboard/alerts' },
  { icon: <ScannerIcon />, label: 'Invoice OCR', path: '/dashboard/invoice-scanner', dividerBefore: true },
  { icon: <WeatherIcon />, label: 'Weather Alerts', path: '/dashboard/weather' },
  { icon: <MapIcon />, label: 'Logistics', path: '/dashboard/logistics' },
  { icon: <LeafIcon />, label: 'Sustainability', path: '/dashboard/carbon' },
  { icon: <CopilotIcon />, label: 'Copilot', path: '/dashboard/copilot', dividerBefore: true },
];

const TOOLTIP_STYLE = {
  backgroundColor: '#2E4154',
  border: '1px solid #4A5D6E',
  borderRadius: 8,
  fontFamily: 'inherit',
  fontSize: 12,
  color: '#FFFFFF',
};

const RELIABILITY_LABELS = {
  moderate: { label: 'Moderate fit', className: 'fp-reliability--moderate' },
  limited: { label: 'Limited data (~6 months)', className: 'fp-reliability--limited' },
  insufficient: { label: 'Insufficient history', className: 'fp-reliability--insufficient' },
};

function formatDateLabel(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function mergeChartData(history, forecast) {
  const points = [];

  for (const h of history) {
    points.push({
      date: h.date,
      dateLabel: formatDateLabel(h.date),
      actual: h.quantityUsed,
      predicted: null,
      lowerBound: null,
      upperBound: null,
    });
  }

  if (history.length > 0 && forecast.length > 0) {
    const lastHistory = history[history.length - 1];
    points.push({
      date: lastHistory.date,
      dateLabel: formatDateLabel(lastHistory.date),
      actual: lastHistory.quantityUsed,
      predicted: lastHistory.quantityUsed,
      lowerBound: lastHistory.quantityUsed,
      upperBound: lastHistory.quantityUsed,
    });
  }

  for (const f of forecast) {
    points.push({
      date: f.date,
      dateLabel: formatDateLabel(f.date),
      actual: null,
      predicted: f.predictedUsage,
      lowerBound: f.lowerBound,
      upperBound: f.upperBound,
    });
  }

  return points;
}

function ForecastingPage() {
  const { pathname } = useLocation();

  const [options, setOptions] = useState({ sites: [], materials: [] });
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [siteId, setSiteId] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient.get('/forecast/options')
      .then(({ data }) => {
        if (!cancelled) {
          setOptions(data);
          setOptionsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setOptionsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!siteId || !materialId) {
      setResult(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    apiClient.get(`/forecast/${siteId}/${materialId}`)
      .then(({ data }) => {
        if (!cancelled) {
          setResult(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ available: false, message: 'Forecasting temporarily unavailable' });
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [siteId, materialId]);

  const chartData = useMemo(() => {
    if (!result?.available) return [];
    return mergeChartData(result.history ?? [], result.forecast ?? []);
  }, [result]);

  const selectedSite = options.sites.find((s) => s.id === siteId);
  const selectedMaterial = options.materials.find((m) => m.id === materialId);
  const reliability = result?.metadata?.reliability
    ? RELIABILITY_LABELS[result.metadata.reliability]
    : null;

  return (
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Forecasting</h1>
          </div>
          <div className="dash-topbar__right">
            <Link to="/dashboard" className="dash-topbar__link">Overview</Link>
            <Link to="/" className="dash-topbar__link">Home</Link>
            <SignOutButton>
              <button className="dash-topbar__signout">Sign out</button>
            </SignOutButton>
          </div>
        </header>

        <div className="dash-content">
          <section className="dash-welcome">
            <h2 className="dash-welcome__name">Demand Forecasting</h2>
            <p className="dash-welcome__sub">
              Weekly material usage predictions powered by Prophet, trained on site usage history.
            </p>
            <p className="fp-limitation-note" title="Honest limitation disclosure">
              Forecasts use ~26 weeks of synthetic seed data per site/material. Prophet typically
              needs 12+ months for reliable seasonality — treat these as demo projections, not
              production-grade predictions.
            </p>
          </section>

          <Card surface="navy-secondary" padding="0">
            <div className="fp-controls">
              <div className="fp-control">
                <label htmlFor="fp-site">Site</label>
                <select
                  id="fp-site"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  disabled={optionsLoading}
                >
                  <option value="">Select a site…</option>
                  {options.sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city}, {s.currentPhase})
                    </option>
                  ))}
                </select>
              </div>
              <div className="fp-control">
                <label htmlFor="fp-material">Material</label>
                <select
                  id="fp-material"
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  disabled={optionsLoading}
                >
                  <option value="">Select a material…</option>
                  {options.materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {!siteId || !materialId ? (
            <div className="fp-empty">
              Select a site and material to view usage history and forecast.
            </div>
          ) : loading ? (
            <div className="fp-empty">Loading forecast…</div>
          ) : !result?.available ? (
            <Card surface="navy-secondary" padding="0">
              <div className="fp-unavailable">
                <span className="fp-unavailable__icon" aria-hidden="true">⚠️</span>
                <p>{result?.message || 'Forecasting temporarily unavailable'}</p>
                <p className="fp-unavailable__sub">
                  The dashboard remains fully usable — only the forecasting microservice is unreachable.
                </p>
              </div>
            </Card>
          ) : (
            <Card surface="navy-secondary" padding="0">
              <div className="fp-chart-card">
                <div className="fp-chart-header">
                  <div>
                    <h3 className="fp-chart-title">
                      {selectedSite?.name} — {selectedMaterial?.name}
                    </h3>
                    <p className="fp-chart-sub">
                      {result.metadata?.historyWeeks ?? 0} weeks of history → 8-week forecast
                    </p>
                  </div>
                  {reliability && (
                    <span className={`fp-reliability ${reliability.className}`}>
                      {reliability.label}
                    </span>
                  )}
                </div>

                {chartData.length === 0 ? (
                  <div className="fp-empty">No usage history found for this combination.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,93,110,0.4)" vertical={false} />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fill: '#9FB0BC', fontSize: 10 }}
                        interval="preserveStartEnd"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#9FB0BC', fontSize: 11 }}
                        width={48}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: selectedMaterial?.unit || 'units', angle: -90, position: 'insideLeft', fill: '#9FB0BC', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value, name) => {
                          if (value == null) return ['—', name];
                          return [Number(value).toFixed(1), name];
                        }}
                        labelStyle={{ color: '#9FB0BC', marginBottom: 4 }}
                      />
                      <Legend
                        formatter={(value) => (
                          <span style={{ color: '#9FB0BC', fontSize: 11 }}>{value}</span>
                        )}
                      />
                      <Area
                        type="monotone"
                        dataKey="upperBound"
                        name="Upper bound"
                        stroke="none"
                        fill="#4A90D9"
                        fillOpacity={0.2}
                        connectNulls={false}
                        legendType="none"
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="lowerBound"
                        name="Lower bound"
                        stroke="none"
                        fill="#2E4154"
                        connectNulls={false}
                        legendType="none"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        name="Historical usage"
                        stroke="#E8C547"
                        strokeWidth={2.5}
                        dot={{ r: 2, fill: '#E8C547', strokeWidth: 0 }}
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        name="Forecast"
                        stroke="#4A90D9"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        dot={{ r: 3, fill: '#4A90D9', strokeWidth: 0 }}
                        connectNulls={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

export default ForecastingPage;
