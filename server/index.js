import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import connectDB from './config/db.js';
import authRouter      from './routes/auth.js';
import testAuthRouter  from './routes/testAuth.js'; // PHASE 3 SCAFFOLD — delete after verification
import dashboardRouter from './routes/dashboardRoutes.js'; // Phase 7A
import ocrRouter       from './routes/ocrRoutes.js';       // Phase 7C
import weatherRouter   from './routes/weatherRoutes.js';   // Phase 7D
import routeRouter     from './routes/routeRoutes.js';     // Phase 7E
import carbonRouter    from './routes/carbonRoutes.js';    // Phase 7F
import vendorRouter    from './routes/vendorRoutes.js';    // Phase 8A
import analyticsRouter from './routes/analyticsRoutes.js'; // Phase 8C
import alertRouter    from './routes/alertRoutes.js';    // Phase 8D
import copilotRouter  from './routes/copilotRoutes.js';  // Phase 9B
import searchRouter    from './routes/searchRoutes.js';    // Phase 9D
import forecastRouter  from './routes/forecastRoutes.js';  // Phase 10C
import reportRouter    from './routes/reportRoutes.js';    // Phase 11A
import priceTrendRouter from './routes/priceTrendRoutes.js'; // Phase 11C
import { apiLimiter }  from './middleware/rateLimiter.js';

connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Populate req.auth on every request so requireAuth / getAuth() work
// throughout the application without per-route setup.
app.use(clerkMiddleware());

// Rate-limit all /api routes (100 req / 15 min per IP).
// Must be registered before route handlers so abusive clients are rejected
// before reaching Clerk verification or database queries.
app.use('/api', apiLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ message: 'SmartBrick server is running' });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'SmartBrick backend running',
    timestamp: new Date().toISOString(),
  });
});

// Auth: session sync (links a Clerk user ID to a MongoDB User document)
app.use('/api/auth', authRouter);

// PHASE 3 SCAFFOLD — verify auth stack end-to-end; delete once confirmed working
// Routes: /api/test-auth/public  /api/test-auth/protected  /api/test-auth/owner-only
app.use('/api/test-auth', testAuthRouter);

// Dashboard summary metrics — Phase 7A
app.use('/api/dashboard', dashboardRouter);

// Invoice OCR scanner via Groq vision — Phase 7C
app.use('/api/ocr', ocrRouter);

// Weather risk alerts via OpenWeatherMap — Phase 7D
app.use('/api/weather', weatherRouter);

// Route & delivery map via OpenRouteService — Phase 7E
app.use('/api/routes', routeRouter);

// Carbon footprint calculator via Climatiq — Phase 7F
app.use('/api/carbon', carbonRouter);

// Vendor scoring & listing — Phase 8A
app.use('/api/vendors', vendorRouter);

// Spending analytics — Phase 8C
app.use('/api/analytics', analyticsRouter);

// Smart alerts (stock + budget) — Phase 8D
app.use('/api/alerts', alertRouter);

// AI Copilot (Groq chat) — Phase 9B
app.use('/api/copilot', copilotRouter);

// Natural language vendor search — Phase 9D
app.use('/api/search', searchRouter);

// Demand forecasting proxy — Phase 10C
app.use('/api/forecast', forecastRouter);

// PDF/Excel report export — Phase 11A
app.use('/api/reports', reportRouter);

// Illustrative price trends — Phase 11C
app.use('/api/price-trends', priceTrendRouter);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

