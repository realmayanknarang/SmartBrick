<div align="center">

# 🧱 SmartBrick

### AI-Powered Construction Procurement & Marketplace Platform

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-smartbrick--pi.vercel.app-E8C547?style=for-the-badge&labelColor=1A2B3C)](https://smartbrick-pi.vercel.app)
[![Backend](https://img.shields.io/badge/⚙️%20Backend-Render-46E3B7?style=for-the-badge&labelColor=1A2B3C)](https://smartbrick-backend.onrender.com/api/health)
[![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Groq-blue?style=for-the-badge&labelColor=1A2B3C)](#tech-stack)

*A full-stack platform where property owners post construction projects, builders manage builds and procurement, and material suppliers list products — all in one system with real-time chat and AI tools.*

</div>

---

## 📋 Table of Contents

- [Live Demo](#-live-demo)
- [What is SmartBrick?](#-what-is-smartbrick)
- [Screenshots](#-screenshots)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Real vs Synthetic Data](#-real-vs-synthetic-data)
- [Project Structure](#-project-structure)
- [Team](#-team)

---

## 🌐 Live Demo

**→ https://smartbrick-pi.vercel.app**

> The backend runs on Render's free tier — first request may take 30–60 seconds to wake up.

### Demo Credentials (no sign-up required)

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| 🏠 Property Owner | `owner@smartbrick-demo.com` | `SmartBrick2026!` | Post projects, review proposals, track builds |
| 🏗️ Builder | `builder@smartbrick-demo.com` | `SmartBrick2026!` | Browse projects + full procurement toolkit |
| 📦 Material Supplier | `vendor@smartbrick-demo.com` | `SmartBrick2026!` | List materials, manage inventory |

---

## 🏗️ What is SmartBrick?

SmartBrick solves two real problems in construction, in one platform:

**1. The Marketplace Problem** — Property owners have no structured way to find and vet builders. Builders have no central place to discover projects. Material suppliers have no storefront.

SmartBrick adds a three-role marketplace: owners post projects → builders submit proposals → owner approves one → private workspace and real-time chat unlock → builder tracks progress and owner monitors it live.

**2. The Procurement Problem** — Construction teams managing multiple sites have no unified view of material stock, vendor reliability, spend trends, or delivery risks.

SmartBrick gives builders an AI-powered procurement dashboard: vendor scoring, demand forecasting, live weather risk per site, invoice OCR, logistics routing, carbon footprint calculation, and an AI copilot that answers plain-English questions about their data.

Both sides are the same application, separated by role — a builder gets both.

---

## 📸 Screenshots

### Builder Dashboard — Overview
> Merged view: marketplace metrics (open projects, proposals) + procurement metrics (sites, vendors, spend) in one place.

![Builder Overview](Screenshots/builder1.png)

---

### Browse Open Projects
> Filter by type, budget range, and location. Real projects posted by property owners.

![Browse Projects](Screenshots/builder2.png)

---

### Project Detail + Submit Proposal
> Full project info on the left, proposal form on the right. Builders submit estimated budget, duration, and material recommendations.

![Submit Proposal](Screenshots/builder3.png)

---

### Notifications — Real-Time
> Proposal approval notification arrives in real time. Badge count updates without a page refresh.

![Notifications](Screenshots/builder4.png)

---

### Project Workspace — Progress Tab
> Approved builders post progress updates with stage, percentage slider, notes, and photo URL. Update history shown below.

![Progress Update](Screenshots/builder5.png)

---

### Project Workspace — Milestones Tab
> Add milestones with title, description, and due date. Mark complete — owner is notified instantly.

![Milestones](Screenshots/builder6.png)

---

### Project Workspace — Project Details Tab
> Full project info including owner contact, "Builder Selected" status badge, and the builder's winning proposal summary.

![Project Details](Screenshots/builder7.png)

---

### Active Projects
> Card view of all approved/active projects. "Open Workspace" navigates to the full project workspace.

![Active Projects](Screenshots/builder8.png)

---

### Construction Sites (Procurement)
> Live snapshot of all 8 seeded construction sites across the Chandigarh–tricity region, with phase badges (Foundation / Structure / Finishing).

![Construction Sites](Screenshots/builder9.png)

---

### Vendor Scoring
> 18 vendors ranked by composite score (reliability × 0.4 + delivery × 0.35 + quality × 0.25 − delay penalty). Natural language search powered by Groq — try *"cement vendors under ₹400 per bag in Mohali"*.

![Vendor Scoring](Screenshots/builder10.png)

---

### Purchase Order Approvals
> Kanban-style approval workflow. Purchase orders move through Site Engineer → Project Manager → Finance stages. Role-gated Advance and Reject actions.

![Approvals](Screenshots/builder11.png)

---

### Order Pooling Estimator
> Select multiple orders of the same material category to calculate bulk discount savings. Real arithmetic on real seeded order data.

![Order Pooling](Screenshots/builder12.png)

---

### AI Copilot (Groq)
> Ask plain-English questions about your procurement data. Grounded in live seeded data — not hallucinated. Powered by Groq's Llama 3.3 70B.

![AI Copilot](Screenshots/builder13.png)

---

### Spending Analytics
> MongoDB aggregation pipeline showing ₹63.3L total spend across 48 purchase orders, broken down by material category (donut chart) and project (bar chart).

![Spending Analytics](Screenshots/builder14.png)

---

### Export Reports
> One-click PDF (spending report) and Excel (vendor list with scores) download. Generated on demand from live MongoDB data.

![Export Reports](Screenshots/builder15.png)

---

### Smart Alerts
> 18 active alerts across 8 sites — 17 stock alerts and 1 budget alert. Critical/Low severity with visual progress bars showing stock vs reorder threshold.

![Smart Alerts](Screenshots/builder16.png)

---

### Invoice OCR Scanner (Groq Vision)
> Upload any invoice image (JPEG/PNG/WEBP up to 20MB). Groq's Llama 4 Scout vision model extracts vendor name, line items, totals, and GSTIN automatically.

![Invoice OCR](Screenshots/builder17.png)

---

### Weather Risk Monitor (OpenWeatherMap)
> Live 48-hour weather forecast for all 8 construction sites. Flags extreme heat (>40°C), heavy rain (>3mm/3h), strong winds, and thunderstorms with specific action recommendations.

![Weather Alerts](Screenshots/builder18.png)

---

### Logistics Route Map (OpenRouteService + Leaflet)
> Select a vendor and a site — calculates real road distance and estimated drive time. Map rendered with Leaflet on real OpenStreetMap tiles.

![Logistics Map](Screenshots/builder19.png)

---

### Carbon Footprint Calculator (Climatiq)
> Calculate CO₂ emissions from material transport using Climatiq's GLEC Framework emissions database. Breaks down road transport vs material production emissions separately.

![Carbon Calculator](Screenshots/builder20.png)

---

## ✨ Features

### Three-Role Marketplace

**🏠 Owner**
- Post construction projects (title, type, location, budget range, plot size, timeline)
- Browse and compare all builder proposals side by side
- Approve one builder — project locks, all other proposals rejected automatically
- Private chat with the approved builder unlocks immediately
- Track build progress in real time (stage, percentage, milestones, site photos)
- Real-time notifications for new proposals, progress updates, messages, milestone completions

**🏗️ Builder**

*Marketplace:*
- Browse and filter open projects by type, location, and budget
- Submit proposals with estimated budget, duration, and material recommendations
- Manage active project workspaces — 4 tabs: Progress, Milestones, Chat, Project Details
- Post progress updates with percentage slider, add and complete milestones
- Real-time chat with property owner (typing indicators, read receipts, online status)

*Procurement:*
- AI Copilot, Vendor Scoring with NL search, Spending Analytics, Smart Alerts
- Invoice OCR, Weather Risk Alerts, Logistics Routing, Carbon Calculator
- Purchase Order Approval Workflow, Order Pooling Estimator, PDF/Excel Reports

**📦 Vendor**
- List construction materials with pricing, stock, delivery time, and images
- Manage listings with inline stock toggles and direct editing
- All marketplace roles can browse and filter materials
- Side-by-side price comparison across up to 3 materials — lowest price highlighted green

---

### Procurement Dashboard

| Feature | Description | Data |
|---------|-------------|------|
| AI Copilot | Groq Llama 3.3 70B — plain-English questions about vendors, stock, orders, budgets | Real AI, synthetic data |
| Vendor Scoring | Composite formula: reliability×0.4 + delivery×0.35 + quality×0.25 − delay penalty | Real formula, synthetic profiles |
| NL Vendor Search | Groq parses natural language into MongoDB filters | Real AI + real query |
| Spending Analytics | MongoDB aggregation — total spend, by category, by project, monthly trend | Real aggregation, synthetic orders |
| Demand Forecasting | Python Prophet microservice — weekly usage forecast per site/material | Real model, synthetic history |
| Smart Alerts | Low-stock + budget-overrun detection with critical/low severity | Real logic, seeded to trigger |
| Weather Risk | Live OpenWeatherMap — 48h forecast per site, actionable risk messages | **Fully real live data** |
| Invoice OCR | Groq Llama 4 Scout Vision — extracts vendor, items, totals, GSTIN | **Real AI model** |
| Logistics Map | OpenRouteService + Leaflet — real road routing, vendor to site | **Fully real live data** |
| Carbon Calculator | Climatiq GLEC Framework — CO₂ from transport + material production | **Fully real live data** |
| PDF/Excel Export | Spending report (PDF) + vendor list with scores (Excel) | Real file generation |
| Approval Workflow | Purchase order stages: Site Engineer → Project Manager → Finance | Real state machine |
| Order Pooling | Bulk discount estimator for combined orders | Real arithmetic |
| Price Trends | 6–12 month material price charts | Labeled synthetic data |

---

### Real-Time Chat

- Chat unlocks only after proposal approval — enforced server-side, not just client-side
- Optimistic message delivery with REST API fallback if socket drops
- Typing indicators (debounced 1.5s), read receipts (✓✓), online/offline status
- Auto-scroll with "↓ New message" nudge when scrolled up
- Failed message state with retry

---

### Authentication (Custom JWT — No Third-Party)

- `bcryptjs` password hashing (12 salt rounds)
- JWT tokens with 64+ character random secret, 7-day expiry
- Tokens stored in localStorage, attached via axios request interceptor
- Server-side `requireAuth` + `requireRole` middleware on every protected route
- Same error message for wrong email and wrong password (prevents email enumeration)

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 + Vite | UI framework and build tool |
| React Router v6 | Nested client-side routing |
| Axios | HTTP client with JWT interceptor |
| Recharts | Analytics and forecasting charts |
| Leaflet | Interactive delivery route maps |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database — 15 schemas |
| bcryptjs + jsonwebtoken | Auth — password hashing + JWT |
| express-rate-limit | Rate limiting on AI and auth routes |

### AI & External APIs
| API | Feature | Free Tier |
|-----|---------|-----------|
| Groq (Llama 3.3 70B) | AI Copilot, NL Search | ✅ Yes |
| Groq (Llama 4 Scout Vision) | Invoice OCR | ✅ Yes |
| OpenWeatherMap | Live weather risk per site | ✅ Yes (1M calls/month) |
| OpenRouteService | Road routing and delivery ETAs | ✅ Yes |
| Climatiq | CO₂ emissions (GLEC Framework) | ✅ Yes (community plan) |

### Infrastructure
| Service | Hosts |
|---------|-------|
| Vercel | React frontend |
| Render (Node.js) | Express API |
| Render (Python) | Flask + Prophet forecasting microservice |
| MongoDB Atlas | Database (free tier) |

---

## 🏛️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Vercel (React SPA)                        │
│                                                               │
│  Landing → Login / Signup (3 role cards)                      │
│                                                               │
│  Owner Dashboard    Builder Dashboard    Vendor Dashboard     │
│  (marketplace)      (marketplace +       (materials)          │
│                      procurement)                             │
│                                                               │
│              axios (JWT)                                      │
└───────────────────────────┬───────────────────────────────────┘
                            │ HTTP + WebSocket
┌───────────────────────────▼───────────────────────────────────┐
│               Render — Express                                 │
│                                                               │
│  /api/auth/*          Custom JWT auth                         │
│  /api/dashboard/*     Procurement overview                    │
│  /api/vendors/*       Vendor scoring + NL search              │
│  /api/analytics/*     MongoDB aggregation pipeline            │
│  /api/alerts          Stock + budget alerts                   │
│  /api/copilot/ask     Groq Llama 3.3 70B                      │
│  /api/weather/*       OpenWeatherMap (cached 30min)           │
│  /api/ocr/*           Groq Llama 4 Scout Vision               │
│  /api/routes/*        OpenRouteService                        │
│  /api/carbon/*        Climatiq GLEC Framework                 │
│  /api/forecast/* ───► Python forecasting service              │
│  /api/reports/*       PDF + Excel generation                  │
│  /api/marketplace/*   Owner/Builder/Vendor marketplace        │
│                                                               │
└───────────┬───────────────────────────────┬───────────────────┘
            │                               │
┌───────────▼───────────┐   ┌───────────────▼───────────────────┐
│    MongoDB Atlas       │   │   Render — Python Flask            │
│                        │   │                                   │
│  7 internal schemas    │   │   Prophet time-series model        │
│  User, Vendor,         │   │   Reads UsageHistory from Atlas   │
│  Project, Site,        │   │   Returns 8-week forecast with    │
│  Material,             │   │   upper/lower confidence bounds   │
│  PurchaseOrder,        │   │                                   │
│  UsageHistory          │   │   Main dashboard degrades         │
│                        │   │   gracefully if unavailable       │
│  8 marketplace schemas │   └───────────────────────────────────┘
│  MarketplaceProject,   │
│  Proposal,             │
│  ProgressUpdate,       │
│  Milestone,            │
│  MarketplaceMaterial,  │
│  Conversation,         │
│  Message,              │
│  Notification          │
└────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+ (for the forecasting microservice)
- MongoDB Atlas account (free tier works)
- API keys — see [Environment Variables](#-environment-variables)

### Clone and Install

```bash
git clone https://github.com/realmayanknarang/SmartBrick.git
cd SmartBrick

# Root dependencies (concurrently)
npm install

# Client
cd client && npm install && cd ..

# Server
cd server && npm install && cd ..

# Forecasting service
cd forecasting-service
pip install -r requirements.txt
cd ..
```

### Configure Environment

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
# Fill in values — see Environment Variables section
```

### Seed the Database

```bash
cd server
npm run seed
```

Creates: 3 demo users, 18 vendors across 6 categories, 5 projects, 8 construction sites, 6 materials, 1,296 weekly usage history records (26 weeks × 8 sites × 6 materials), and 52 purchase orders — all in the Chandigarh–tricity region.

### Run Locally

```bash
# From root — runs client (5173) and server (3001) in parallel
npm start

# Forecasting service — separate terminal
cd forecasting-service && python app.py
# Runs on port 5001
```

---

## 🔑 Environment Variables

### `server/.env`

```env
MONGODB_URI=mongodb+srv://...
PORT=3001
FRONTEND_URL=http://localhost:5173

# Generate with:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<64+ character random string>
JWT_EXPIRES_IN=7d

GROQ_API_KEY=gsk_...
OPENWEATHER_API_KEY=
OPENROUTESERVICE_API_KEY=
CLIMATIQ_API_KEY=

FORECASTING_SERVICE_URL=http://localhost:5001
```

### `client/.env`

```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

### `forecasting-service/.env`

```env
MONGODB_URI=<same as server>
PORT=5001
```

---

## 📡 API Reference

### Auth (public)
```
POST /api/auth/signup     Create account with role selection
POST /api/auth/signin     Sign in, receive JWT
GET  /api/auth/me         Get current user from JWT
POST /api/auth/signout    Sign out
```

### Procurement (builder role)
```
GET  /api/dashboard/summary           Site/vendor/spend overview
GET  /api/vendors                     Vendor list with composite scores
GET  /api/analytics/spending-summary  Spend by category/project/month
GET  /api/alerts                      Low-stock + budget alerts
POST /api/copilot/ask                 Groq AI copilot
POST /api/search/vendors              NL vendor search (Groq → MongoDB)
GET  /api/weather/site/:siteId        Live 48h weather risk
POST /api/ocr/scan-invoice            Invoice OCR (Groq Vision)
POST /api/routes/calculate            Road routing (OpenRouteService)
POST /api/carbon/calculate            CO₂ estimation (Climatiq)
GET  /api/forecast/:siteId/:matId     Demand forecast (Prophet service)
GET  /api/reports/spending-pdf        Download PDF report
GET  /api/reports/vendor-list-excel   Download Excel report
GET  /api/approvals/pending           Purchase orders in pipeline
PATCH /api/approvals/:id/advance      Advance approval stage
POST /api/pooling/estimate            Bulk discount calculation
```

### Marketplace
```
POST   /api/marketplace/projects                   Create project
GET    /api/marketplace/projects                   Browse (role-filtered)
PATCH  /api/marketplace/proposals/:id/approve      Approve + lock project
POST   /api/marketplace/progress/:projectId        Post progress update
PATCH  /api/marketplace/milestones/:id/complete    Mark milestone done
POST   /api/marketplace/materials                  List material
GET    /api/marketplace/messages/:conversationId   Get chat messages
POST   /api/marketplace/messages/:conversationId   Send message
GET    /api/marketplace/notifications              Get notifications
PATCH  /api/marketplace/notifications/mark-read    Mark all as read
```

---

## 🔍 Real vs Synthetic Data

| Feature | Real part | Synthetic part |
|---------|-----------|----------------|
| Weather alerts | Live OpenWeatherMap API, real forecast | Site GPS coordinates are seeded |
| Invoice OCR | Real Groq Vision model reads image pixels | Sample invoices are hand-created |
| Route map | Real roads, real distances/ETAs | No actual delivery is happening |
| Carbon calculator | Real Climatiq GLEC emissions factors | Input quantities are demo values |
| Demand forecasting | Real Prophet time-series algorithm | Training data is generated history |
| Vendor scoring | Real deterministic formula | Vendor histories are seeded |
| Spending analytics | Real MongoDB aggregation pipeline | Purchase orders are seeded |
| AI Copilot | Real Groq LLM, real API call | Data it reasons over is seeded |
| Smart alerts | Real threshold-check logic | Seed data deliberately triggers alerts |
| Price trends | Real Recharts rendering | Numbers are hardcoded, clearly labeled |

**Summary:** The AI models, live APIs, algorithms, and application logic are real — the business data is realistic synthetic data, because this is a portfolio project without actual construction clients.

---

## 📁 Project Structure

```
SmartBrick/
├── client/
│   └── src/
│       ├── api/client.js              Axios + JWT interceptor
│       ├── components/
│       │   ├── marketplace/
│       │   │   ├── ChatWindow.jsx     Real-time chat
│       │   │   ├── MaterialForm.jsx   Shared add/edit form
│       │   │   └── NotificationsList.jsx
│       │   ├── Button.jsx             Gold/navy/outlined variants
│       │   ├── Card.jsx               Surface variants
│       │   ├── Sidebar.jsx            Grouped + badge support
│       │   ├── TabBar.jsx             Underline tab navigation
│       │   └── Toast.jsx              Bottom-right toasts
│       ├── contexts/
│       │   ├── AuthContext.jsx        JWT auth state
│       │   ├── SocketContext.jsx      Socket context
│       │   └── ToastContext.jsx       Toast context
│       ├── hooks/useSocket.js         Socket hook
│       ├── pages/
│       │   ├── marketplace/
│       │   │   ├── BuilderDashboard.jsx   Merged marketplace+procurement
│       │   │   ├── OwnerDashboard.jsx
│       │   │   ├── VendorDashboard.jsx
│       │   │   ├── ProjectWorkspacePage.jsx  4-tab workspace
│       │   │   ├── BrowseMaterialsPage.jsx   Shared across roles
│       │   │   └── PriceComparisonPage.jsx   Role-agnostic
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx          Custom JWT — no third-party auth
│       │   └── SignUpPage.jsx         3 role cards
│       └── styles/tokens.css          CSS custom properties
│
├── server/
│   ├── config/
│   │   ├── db.js                      MongoDB connection
│   │   ├── groq.js                    Groq client
│   │   └── socket.js                  WebSocket setup + event handlers
│   ├── middleware/
│   │   ├── auth.js                    requireAuth + requireRole
│   │   └── rateLimiter.js             Rate limiting
│   ├── models/
│   │   ├── marketplace/               8 marketplace schemas
│   │   └── ...                        7 internal schemas
│   ├── routes/
│   │   ├── marketplace/               All marketplace routes
│   │   ├── authRoutes.js              signup/signin/me/signout
│   │   ├── copilotRoutes.js           Groq with context retrieval
│   │   ├── weatherRoutes.js           OpenWeatherMap + cache
│   │   ├── ocrRoutes.js               Groq Vision
│   │   └── ...                        All other feature routes
│   ├── scripts/seed.js                1,300+ document seeder
│   └── utils/
│       ├── jwt.js                     Token sign/verify
│       ├── password.js                bcrypt helpers
│       ├── vendorScoring.js           calculateVendorRank()
│       └── copilotContext.js          Context retrieval for AI
│
├── forecasting-service/
│   ├── app.py                         Flask + /forecast endpoint
│   └── forecast.py                    Prophet model
│
├── vercel.json                        SPA routing config
└── README.md
```

---

## 👥 Team

Built by **Anmol Goyal and Mayank Narang** — second-year B.Tech Computer Science students at **Punjab Engineering College (PEC), Chandigarh** — Batch 2024.

| Name | GitHub |
|------|--------|
| **Anmol Goyal** | [@anmolgoyal2006](https://github.com/anmolgoyal2006) |
| **Mayank Narang** | [@realmayanknarang](https://github.com/realmayanknarang) |

---

## 📄 License

MIT — use this as a reference, fork it, or build on top of it.

---

<div align="center">

**Built with** Node.js · React · MongoDB · Groq · Prophet · OpenWeatherMap · Leaflet · Climatiq

*SmartBrick — Punjab Engineering College, Chandigarh · 2026*

</div>