/**
 * client/src/pages/LogisticsPage.jsx
 *
 * Route & Delivery Map — Phase 7E (client)
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses Leaflet (via react-leaflet) to display driving routes calculated by
 * the backend OpenRouteService integration.
 *
 * Layout
 * ──────
 * • Vendor dropdown (sourced from seed data coordinates via known locations)
 * • Site dropdown (sourced from seed data coordinates)
 * • "Calculate Route" button → POST /api/routes/calculate
 * • Leaflet map showing origin marker, destination marker, and route polyline
 * • Summary card showing distance and estimated duration
 *
 * Leaflet setup note
 * ──────────────────
 * react-leaflet requires a CSS import AND the marker icon fix
 * (Leaflet's default marker icon URLs break with Vite bundling — we fix by
 * importing the icon images explicitly and setting L.Icon.Default.prototype).
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation, Link }           from 'react-router-dom';
import { useUser, SignOutButton }       from '@clerk/clerk-react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L                               from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Sidebar                         from '../components/Sidebar';
import Card                            from '../components/Card';
import apiClient                       from '../api/client';
import './LogisticsPage.css';

// ── Fix Leaflet marker icon in Vite ──────────────────────────────────────────
import markerIcon2x    from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon      from 'leaflet/dist/images/marker-icon.png';
import markerShadow    from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl:     markerShadow,
});

// ── Gold marker for origin ────────────────────────────────────────────────────
const originIcon = new L.Icon({
  iconUrl:      markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl:    markerShadow,
  iconSize:     [25, 41],
  iconAnchor:   [12, 41],
  popupAnchor:  [1, -34],
  shadowSize:   [41, 41],
  className:    'leaflet-marker-origin',
});

// ─── Sidebar nav items ────────────────────────────────────────────────────────
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

function CopilotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2a6 6 0 00-6 6v2.5a2.5 2.5 0 002.5 2.5h1.2a1.3 1.3 0 001.3-1.3V9.5A1.3 1.3 0 007.7 8.2H6.5A4.5 4.5 0 0110 3.5 4.5 4.5 0 0113.5 8.2h-1.2a1.3 1.3 0 00-1.3 1.3v2.2a1.3 1.3 0 001.3 1.3H13.5A2.5 2.5 0 0016 10.5V8a6 6 0 00-6-6z" fill="currentColor" opacity="0.85"/>
      <rect x="7" y="14" width="6" height="3" rx="1.2" fill="currentColor" opacity="0.6"/>
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
  { icon: <CopilotIcon />,     label: 'Copilot',         path: '/dashboard/copilot', dividerBefore: true },
];

// ── Seed-data vendor locations (Chandigarh tricity area) ──────────────────────
// These match the Phase 2 seed data city assignments.
const VENDOR_LOCATIONS = [
  { id: 'v1', label: 'Chandigarh Cement Works',  city: 'Chandigarh',  lat: 30.7333, lng: 76.7794 },
  { id: 'v2', label: 'Mohali Steel Traders',      city: 'Mohali',      lat: 30.8397, lng: 76.6855 },
  { id: 'v3', label: 'Panchkula Sand Suppliers',  city: 'Panchkula',   lat: 30.6942, lng: 76.8606 },
  { id: 'v4', label: 'Ludhiana Brick Depot',      city: 'Ludhiana',    lat: 30.9010, lng: 75.8573 },
  { id: 'v5', label: 'Ambala Building Materials', city: 'Ambala',      lat: 30.3782, lng: 76.7767 },
  { id: 'v6', label: 'Zirakpur Electrical Hub',   city: 'Zirakpur',    lat: 30.6455, lng: 76.8160 },
];

// ── Seed-data site locations ──────────────────────────────────────────────────
const SITE_LOCATIONS = [
  { id: 's1', label: 'Sector 17 Commercial Tower', city: 'Chandigarh',  lat: 30.7415, lng: 76.7882 },
  { id: 's2', label: 'Mohali IT Park Phase 2',     city: 'Mohali',      lat: 30.8520, lng: 76.6710 },
  { id: 's3', label: 'Panchkula Residential Block',city: 'Panchkula',   lat: 30.7004, lng: 76.8530 },
  { id: 's4', label: 'Ludhiana Industrial Zone',   city: 'Ludhiana',    lat: 30.9100, lng: 75.8450 },
  { id: 's5', label: 'Kharar Housing Project',     city: 'Kharar',      lat: 30.7450, lng: 76.6350 },
  { id: 's6', label: 'Derabassi Logistics Hub',    city: 'Derabassi',   lat: 30.5980, lng: 76.8070 },
];

// ── MapFitBounds: updates map view when route changes ────────────────────────
function MapFitBounds({ coordinates, origin, destination }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates?.length > 1) {
      const bounds = L.latLngBounds(coordinates.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (origin && destination) {
      map.fitBounds([
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ], { padding: [60, 60] });
    }
  }, [coordinates, origin, destination, map]);

  return null;
}

// ── LogisticsPage ─────────────────────────────────────────────────────────────

function LogisticsPage() {
  const { pathname } = useLocation();

  const [selectedVendor,  setSelectedVendor]  = useState('');
  const [selectedSite,    setSelectedSite]    = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(null);
  const [routeResult,     setRouteResult]     = useState(null);

  const vendorObj = VENDOR_LOCATIONS.find(v => v.id === selectedVendor);
  const siteObj   = SITE_LOCATIONS.find(s => s.id === selectedSite);

  // Centre the map on Chandigarh tricity by default
  const defaultCenter = [30.7333, 76.7794];
  const defaultZoom   = 10;

  async function handleCalculate() {
    if (!vendorObj || !siteObj) return;

    setLoading(true);
    setError(null);
    setRouteResult(null);

    try {
      const { data } = await apiClient.post('/routes/calculate', {
        origin:      { lat: vendorObj.lat, lng: vendorObj.lng, label: vendorObj.label },
        destination: { lat: siteObj.lat,   lng: siteObj.lng,   label: siteObj.label   },
      });
      setRouteResult(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Failed to calculate route. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  const routeCoords = routeResult?.coordinates ?? [];

  return (
    <div className="dash-shell">
      <Sidebar items={NAV_ITEMS} activePath={pathname} />

      <main className="dash-main" id="main-content">
        {/* Top bar */}
        <header className="dash-topbar">
          <div className="dash-topbar__left">
            <h1 className="dash-topbar__title">Logistics</h1>
          </div>
          <div className="dash-topbar__right">
            <Link to="/dashboard" className="dash-topbar__link">Overview</Link>
            <Link to="/" className="dash-topbar__link">Home</Link>
            <SignOutButton>
              <button className="dash-topbar__signout" id="logistics-signout-btn">Sign out</button>
            </SignOutButton>
          </div>
        </header>

        <div className="dash-content">

          {/* Intro */}
          <section className="map-intro">
            <p className="map-intro__label">Route Planning · Real Driving Distances</p>
            <h2 className="map-intro__heading">Vendor → Site Delivery Map</h2>
            <p className="map-intro__sub">
              Calculate driving routes from vendor locations to construction sites using
              OpenRouteService. Shows real road distance and estimated delivery time.
            </p>
          </section>

          {/* Controls + summary + map */}
          <div className="map-layout">

            {/* Left: controls panel */}
            <Card surface="navy-secondary" className="map-controls-card">
              <h3 className="map-section-heading">Route Configuration</h3>

              <div className="map-field">
                <label className="map-label" htmlFor="vendor-select">
                  Origin (Vendor)
                </label>
                <select
                  id="vendor-select"
                  className="map-select"
                  value={selectedVendor}
                  onChange={e => { setSelectedVendor(e.target.value); setRouteResult(null); setError(null); }}
                >
                  <option value="">— Select a vendor —</option>
                  {VENDOR_LOCATIONS.map(v => (
                    <option key={v.id} value={v.id}>{v.label} ({v.city})</option>
                  ))}
                </select>
                {vendorObj && (
                  <p className="map-coord-hint">
                    📍 {vendorObj.lat.toFixed(4)}, {vendorObj.lng.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="map-field">
                <label className="map-label" htmlFor="site-select">
                  Destination (Site)
                </label>
                <select
                  id="site-select"
                  className="map-select"
                  value={selectedSite}
                  onChange={e => { setSelectedSite(e.target.value); setRouteResult(null); setError(null); }}
                >
                  <option value="">— Select a site —</option>
                  {SITE_LOCATIONS.map(s => (
                    <option key={s.id} value={s.id}>{s.label} ({s.city})</option>
                  ))}
                </select>
                {siteObj && (
                  <p className="map-coord-hint">
                    📍 {siteObj.lat.toFixed(4)}, {siteObj.lng.toFixed(4)}
                  </p>
                )}
              </div>

              {error && (
                <div className="map-error" role="alert">
                  <span>⚠ {error}</span>
                </div>
              )}

              <button
                className="map-calc-btn"
                id="map-calculate-btn"
                onClick={handleCalculate}
                disabled={!selectedVendor || !selectedSite || loading}
              >
                {loading ? (
                  <><span className="map-spinner" aria-hidden="true" /> Calculating…</>
                ) : '🗺 Calculate Route'}
              </button>

              {/* Route summary */}
              {routeResult && (
                <div className="map-summary">
                  <div className="map-summary__item">
                    <span className="map-summary__icon">📏</span>
                    <div>
                      <p className="map-summary__value">{routeResult.distance} km</p>
                      <p className="map-summary__label">Road Distance</p>
                    </div>
                  </div>
                  <div className="map-summary__divider" />
                  <div className="map-summary__item">
                    <span className="map-summary__icon">⏱</span>
                    <div>
                      <p className="map-summary__value">{routeResult.duration}</p>
                      <p className="map-summary__label">Est. Drive Time</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Route waypoints info */}
              {routeResult && (
                <div className="map-waypoints">
                  <div className="map-waypoint map-waypoint--origin">
                    <span className="map-waypoint__dot" />
                    <span className="map-waypoint__label">{routeResult.origin?.label}</span>
                  </div>
                  <div className="map-waypoint-line" />
                  <div className="map-waypoint map-waypoint--dest">
                    <span className="map-waypoint__dot" />
                    <span className="map-waypoint__label">{routeResult.destination?.label}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Right: map */}
            <div className="map-container-wrap">
              <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                className="map-leaflet"
                id="logistics-map"
                aria-label="Delivery route map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Fit bounds when route is available */}
                {(routeCoords.length > 0 || (vendorObj && siteObj)) && (
                  <MapFitBounds
                    coordinates={routeCoords}
                    origin={vendorObj}
                    destination={siteObj}
                  />
                )}

                {/* Origin marker */}
                {vendorObj && (
                  <Marker position={[vendorObj.lat, vendorObj.lng]} icon={originIcon}>
                    <Popup>
                      <strong>🏭 {vendorObj.label}</strong><br />
                      {vendorObj.city}
                    </Popup>
                  </Marker>
                )}

                {/* Destination marker */}
                {siteObj && (
                  <Marker position={[siteObj.lat, siteObj.lng]}>
                    <Popup>
                      <strong>🏗 {siteObj.label}</strong><br />
                      {siteObj.city}
                    </Popup>
                  </Marker>
                )}

                {/* Route polyline */}
                {routeCoords.length > 0 && (
                  <Polyline
                    positions={routeCoords.map(c => [c.lat, c.lng])}
                    color="#E8C547"
                    weight={4}
                    opacity={0.85}
                  />
                )}
              </MapContainer>

              {/* Map hint when nothing selected */}
              {!vendorObj && !siteObj && (
                <div className="map-hint-overlay" aria-hidden="true">
                  <p className="map-hint-overlay__text">
                    Select a vendor and site to visualise the delivery route
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default LogisticsPage;
