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
import { NAV_ITEMS } from '../config/dashboardNav.jsx';
import Card      from '../components/Card';
import apiClient from '../api/client';
import './DashboardPage.css';
import './AnalyticsPage.css';


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

const PRICE_CATEGORIES = [
  { value: 'cement',     label: 'Cement' },
  { value: 'steel',      label: 'Steel' },
  { value: 'sand',       label: 'Sand' },
  { value: 'bricks',     label: 'Bricks' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing',   label: 'Plumbing' },
];

function formatPriceINR(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

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

  const [priceCategory, setPriceCategory] = useState('cement');
  const [priceTrend, setPriceTrend]       = useState(null);
  const [priceLoading, setPriceLoading]   = useState(false);
  const [priceError, setPriceError]       = useState(null);

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

  useEffect(() => {
    let cancelled = false;
    setPriceLoading(true);
    setPriceError(null);

    apiClient.get(`/price-trends/${priceCategory}`)
      .then(({ data: d }) => {
        if (!cancelled) {
          setPriceTrend(d);
          setPriceLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPriceError(err?.response?.data?.message || 'Failed to load price trends.');
          setPriceLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [priceCategory]);

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

  const priceChartData = (priceTrend?.dataPoints ?? []).map(d => ({
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

          {/* ── Price Trends (Phase 11C — illustrative synthetic data) ─── */}
          <Card surface="navy-secondary" padding="0" className="ap-chart-card--wide ap-price-trends">
            <div className="ap-chart-card">
              <div className="ap-price-trends__header">
                <div>
                  <h3 className="ap-chart-card__title">Price Trends</h3>
                  <p className="ap-chart-card__sub">12-month indicative price movement by material category</p>
                </div>
                <label className="ap-price-trends__select-wrap">
                  <span className="ap-price-trends__select-label">Category</span>
                  <select
                    className="ap-price-trends__select"
                    value={priceCategory}
                    onChange={(e) => setPriceCategory(e.target.value)}
                  >
                    {PRICE_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="ap-synthetic-label" role="note">
                Illustrative data — not live market pricing
              </p>

              {priceLoading ? (
                <ChartEmpty message="Loading price trend…" />
              ) : priceError ? (
                <ChartEmpty message={priceError} />
              ) : priceChartData.length === 0 ? (
                <ChartEmpty message="No price trend data for this category." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={priceChartData}
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
                      tickFormatter={formatPriceINR}
                      width={72}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value) => [formatPriceINR(value), `Price/${priceTrend?.unit ?? 'unit'}`]}
                      labelStyle={{ color: '#9FB0BC', marginBottom: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      name="Price"
                      stroke="#5CC8CF"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#5CC8CF', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#7ED4DA', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

        </div>
      </main>
    </div>
  );
}

export default AnalyticsPage;
