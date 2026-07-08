import './instrument.js';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRouter      from './routes/auth.js';
import authRoutes      from './routes/authRoutes.js';
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
import approvalRouter  from './routes/approvalRoutes.js';  // Phase 11D
import poolingRouter   from './routes/poolingRoutes.js';   // Phase 11E
import siteRouter      from './routes/siteRoutes.js';      // Sites fix
import projectRouter   from './routes/marketplace/projectRoutes.js';  // Phase M2A
import proposalRouter  from './routes/marketplace/proposalRoutes.js'; // Phase M2A
import progressRouter  from './routes/marketplace/progressRoutes.js'; // Phase M2B
import materialRouter  from './routes/marketplace/materialRoutes.js';  // Phase M2C
import chatRouter      from './routes/marketplace/chatRoutes.js';       // Phase M2D
import notificationRouter from './routes/marketplace/notificationRoutes.js'; // Phase M2D
import { apiLimiter }  from './middleware/rateLimiter.js';
import { initializeSocket } from './config/socket.js';

// Check for required env vars first
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174'
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      // Allow requests with no origin (like curl or Postman)
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

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

// Auth routes (signup, signin, me, signout) — mount before other routes
app.use('/api', authRoutes);

// Auth: session sync (links a Clerk user ID to a MongoDB User document)
app.use('/api', authRouter);

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

// Purchase order approval workflow — Phase 11D
app.use('/api/approvals', approvalRouter);

// Order pooling estimator — Phase 11E
app.use('/api/pooling', poolingRouter);

// Sites listing
app.use('/api/sites', siteRouter);

// Marketplace — project & proposal APIs — Phase M2A
app.use('/api/marketplace', projectRouter);
app.use('/api/marketplace', proposalRouter);

// Marketplace — progress & milestone APIs — Phase M2B
app.use('/api/marketplace', progressRouter);

// Marketplace — materials API — Phase M2C
app.use('/api/marketplace', materialRouter);

// Marketplace — chat & notification APIs — Phase M2D
app.use('/api/marketplace', chatRouter);
app.use('/api/marketplace', notificationRouter);

const httpServer = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

initializeSocket(httpServer);

