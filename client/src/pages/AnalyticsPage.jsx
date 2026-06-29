/**
 * client/src/pages/AnalyticsPage.jsx
 *
 * Spending Analytics Dashboard — Phase 8C
 * ─────────────────────────────────────────────────────────────────────────────
 * Consumes GET /api/analytics/spending-summary and renders:
 *   • 3 KPI cards: total spend, category count, project count
 *   • Pie chart — spend by material category
 *   • Bar chart — spend by project
 *   • Line chart — monthly spend trend (last 12 months)
 *
 * Empty-state strategy
 * ────────────────────
 * Each chart checks its own data slice independently.  A "planning" project
 * with zero purchase orders will produce an empty byProject array for that
 * project, but the other charts (byCategory, monthlyTrend) may still have data.
 * Every chart shows a graceful "no data yet" panel rather than crashing or
 * rendering a broken empty SVG.
 *
 * Recharts usage
 * ──────────────
 * Uses ResponsiveContainer so charts adapt to their parent's width.
 * Tooltips use a custom contentStyle matching the nav-dark surface token.
 */

import { useState, useEffect }       from 'react';
import { useLocation, Link }         from 'react-router-dom';
import { useUser, SignOutButton }     from '@clerk/clerk-react';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';

import Sidebar   from '../components/Sidebar';
import Card      from '../components/Card';
import apiClient from '../api/client';
import './DashboardPage.css';
import './AnalyticsPage.css';

// ─── Sidebar nav (canonical set) ────────────────────────────────────────────
function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" />
    </svg>
  );
}
function SitesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L3 7v11h4v-5h6v5h4V7L10 2z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
function VendorsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="6" r="3.5" fill="currentColor" />
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function ReportsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <line x1="6" y1="7"  x2="14" y2="7"  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="13" x2="11" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function AlertsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L2 16h16L10 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="currentColor" opacity="0.15" />
      <line x1="10" y1="8"  x2="10" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="0.9" fill="currentColor" />
    </svg>
  );
}
function ScannerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12h5M14.5 12v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function WeatherIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 14c0-1.1.9-2 2-2h6a2 2 0 110 4H7a2 2 0 01-2-2z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4l5 2 6-2 5 2v12l-5-2-6 2-5-2V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="7" y1="6" x2="7" y2="18" stroke="currentColor" strokeWidth="1.2" />
      <line x1="13" y1="2" x2="13" y2="16" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function LeafIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 4C16 4 14 12 8 14C5 15 3 16 3 16C3 16 4 12 7 9C10 6 16 4 16 4Z" fill="currentColor" opacity="0.6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M3 16C5 13 8 11 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

const NAV_ITEMS = [
  { icon: <OverviewIcon />,  label: 'Overview',       path: '/dashboard' },
  { icon: <SitesIcon />,     label: 'Sites',          path: '/dashboard/sites' },
  { icon: <VendorsIcon />,   label: 'Vendors',        path: '/dashboard/vendors' },
  { icon: <ReportsIcon />,   label: 'Analytics',      path: '/dashboard/analytics' },
  { icon: <AlertsIcon />,    label: 'Alerts',         path: '/dashboard/alerts' },
  { icon: <ScannerIcon />, label: 'Invoice OCR', path: '/dashboard/invoice-scanner', dividerBefore: true },
  { icon: <WeatherIcon />,   label: 'Weather Alerts', path: '/dashboard/weather' },
  { icon: <MapIcon />,       label: 'Logistics',      path: '/dashboard/logistics' },
  { icon: <LeafIcon />,      label: 'Sustainability',  path: '/dashboard/carbon' },
];

// ─── Chart colour palette (consistent across all three charts) ─────────────
const PALETTE = [
  '#4A90D9', // blue  — cement
  '#E8C547', // gold  — steel
  '#3CB57A', // green — sand
  '#9B7FE8', // purple — bricks
  '#E07B5C', // coral — electrical
  '#5CC8CF', // teal  — plumbing
  '#C9A83A', // dark gold
  '#7EC8A0', // light green
];

// ─── Number formatter helpers ──────────────────────────────────────────────
function formatINR(value) {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)} Cr`;
  if (value >= 1_00_000)    return `₹${(value / 1_00_000).toFixed(1)} L`;
  if (value >= 1_000)       return `₹${(value / 1_000).toFixed(1)} K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

function formatMonthLabel(yyyyMM) {
  // "2025-03" → "Mar '25"
  const [year, month] = yyyyMM.split('-');
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

// ─── Shared tooltip style (matches dark surface token) ────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: '#2E4154',
  border:          '1px solid #4A5D6E',
  borderRadius:    8,
  fontFamily:      'inherit',
  fontSize:        12,
  color:           '#FFFFFF',
};

// ─── Empty state for a single chart ─────────────────────────────────────────
function ChartEmpty({ message = 'No data yet for this view.' }) {
  return (
    <div className="ap-chart-empty">
      <span className="ap-chart-empty__icon">📊</span>
      <span>{message}</span>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
function AnalyticsPage() {
  const { pathname } = useLocation();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiClient.get('/analytics/spending-summary')
      .then(({ data: d }) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load analytics data.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dash-shell">
        <Sidebar items={NAV_ITEMS} activePath={pathname} />
        <main className="dash-main" id="main-content">
          <div className="ap-empty-full">
            <span className="ap-empty-full__icon">⏳</span>
            Loading analytics…
          </div>
        </main>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="dash-shell">
        <Sidebar items={NAV_ITEMS} activePath={pathname} />
        <main className="dash-main" id="main-content">
          <div className="ap-empty-full">
            <span className="ap-empty-full__icon">⚠️</span>
            {error}
          </div>
        </main>
      </div>
    );
  }

  const { totalSpend = 0, byCategory = [], byProject = [], monthlyTrend = [] } = data ?? {};

  // Prepare trend data with formatted month labels for the X axis
  const trendData = monthlyTrend.map(d => ({
    ...d,
    monthLabel: formatMonthLabel(d.month),
  }));

  // Total orders = sum of count from byCategory
  const totalOrders = byCategory.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        {/* Top bar */}
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Analytics</h1>
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
          {/* Welcome */}
          <section className="dash-welcome">
            <h2 className="dash-welcome__name">Spending Analytics</h2>
            <p className="dash-welcome__sub">
              Aggregated from all purchase orders — material spend by category, project, and time.
            </p>
          </section>

          {/* KPI row */}
          <div className="ap-kpi-row">
            <Card surface="navy-secondary" padding="0">
              <div className="ap-kpi-card">
                <p className="ap-kpi-card__label">Total spend</p>
                <p className="ap-kpi-card__value" id="ap-total-spend">{formatINR(totalSpend)}</p>
                <p className="ap-kpi-card__sub">{totalOrders} purchase orders</p>
              </div>
            </Card>
            <Card surface="navy-secondary" padding="0">
              <div className="ap-kpi-card">
                <p className="ap-kpi-card__label">Material categories</p>
                <p className="ap-kpi-card__value" id="ap-category-count">{byCategory.length}</p>
                <p className="ap-kpi-card__sub">with recorded spend</p>
              </div>
            </Card>
            <Card surface="navy-secondary" padding="0">
              <div className="ap-kpi-card">
                <p className="ap-kpi-card__label">Projects tracked</p>
                <p className="ap-kpi-card__value" id="ap-project-count">{byProject.length}</p>
                <p className="ap-kpi-card__sub">with purchase orders</p>
              </div>
            </Card>
          </div>

          {/* Charts grid */}
          <div className="ap-charts-grid">

            {/* ── Pie: spend by category ─────────────────────────────────── */}
            <Card surface="navy-secondary" padding="0">
              <div className="ap-chart-card">
                <h3 className="ap-chart-card__title">Spend by Material Category</h3>
                {byCategory.length === 0 ? (
                  <ChartEmpty message="No purchase orders recorded yet." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={byCategory}
                        dataKey="spend"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        label={({ category, percent }) =>
                          `${category} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {byCategory.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={PALETTE[idx % PALETTE.length]}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value, name) => [formatINR(value), name]}
                      />
                      <Legend
                        formatter={(value) => (
                          <span style={{ color: '#9FB0BC', fontSize: 11 }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* ── Bar: spend by project ─────────────────────────────────── */}
            <Card surface="navy-secondary" padding="0">
              <div className="ap-chart-card">
                <h3 className="ap-chart-card__title">Spend by Project</h3>
                {byProject.length === 0 ? (
                  <ChartEmpty message="No projects have purchase orders yet." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={byProject}
                      margin={{ top: 8, right: 16, left: 8, bottom: 32 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(74,93,110,0.4)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="projectName"
                        tick={{ fill: '#9FB0BC', fontSize: 11 }}
                        angle={-20}
                        textAnchor="end"
                        interval={0}
                        height={48}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#9FB0BC', fontSize: 11 }}
                        tickFormatter={formatINR}
                        width={70}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value) => [formatINR(value), 'Spend']}
                        cursor={{ fill: 'rgba(232,197,71,0.07)' }}
                      />
                      <Bar
                        dataKey="spend"
                        name="Spend"
                        radius={[4, 4, 0, 0]}
                      >
                        {byProject.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={PALETTE[idx % PALETTE.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* ── Line: monthly trend (full width) ─────────────────────── */}
            <Card surface="navy-secondary" padding="0" className="ap-chart-card--wide">
              <div className="ap-chart-card">
                <h3 className="ap-chart-card__title">Monthly Spend Trend</h3>
                <p className="ap-chart-card__sub">Last 12 months of purchase order activity</p>
                {trendData.length === 0 ? (
                  <ChartEmpty message="No purchase orders in the last 12 months." />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart
                      data={trendData}
                      margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(74,93,110,0.4)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="monthLabel"
                        tick={{ fill: '#9FB0BC', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#9FB0BC', fontSize: 11 }}
                        tickFormatter={formatINR}
                        width={72}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value, name) => [formatINR(value), 'Spend']}
                        labelStyle={{ color: '#9FB0BC', marginBottom: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="spend"
                        name="Spend"
                        stroke="#E8C547"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#E8C547', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#F0D060', strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}

export default AnalyticsPage;
