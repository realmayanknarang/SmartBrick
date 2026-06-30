# Phase 13 Security and Operations Audit

Last updated: July 1, 2026

## 13A CI/CD

| Check | Status | Notes |
| --- | --- | --- |
| Push/PR to `main` runs client tests | Implemented | `.github/workflows/test.yml` includes the `client` package in the test matrix. |
| Push/PR to `main` runs server tests | Implemented | `.github/workflows/test.yml` includes the `server` package in the test matrix. |
| Client Vite build runs after tests | Implemented | `client-build` depends on the test matrix and runs `npm run build`. |
| GitHub secrets for tests | Not needed locally | Current unit/integration tests use local/test fixtures and `mongodb-memory-server`; no test-only secrets were added. |
| Deployment trigger | External | Vercel/Render should continue auto-deploying from GitHub integration. Do not duplicate deploy logic in Actions unless those integrations are removed. |
| Branch protection | Account action required | In GitHub settings, require PRs before merge, require the `Tests` workflow, and disallow force pushes to `main` except for admins if absolutely needed. |

## 13B Environment Variables

| Variable | Location(s) | Side | Rotated? | Notes |
| --- | --- | --- | --- | --- |
| `MONGODB_URI` | `server`, `forecasting-service`, Render services | Server only | Account action required | Must be rotated in MongoDB Atlas due prior chat exposure if not already rotated. Never expose as `VITE_`. |
| `PORT` | `server`, `forecasting-service` | Server only | Not secret | Runtime port. |
| `FRONTEND_URL` | `server`, Render Node service | Server config | Not secret | Comma-separated allowlist for CORS. Required in production. |
| `NODE_ENV` | `server` | Server config | Not secret | Enables production CORS enforcement. |
| `CLERK_SECRET_KEY` | `server`, Render Node service | Server only | Not rotated here | Must never be exposed to client. |
| `CLERK_PUBLISHABLE_KEY` | `server` optional | Public config | Not secret | Client uses `VITE_CLERK_PUBLISHABLE_KEY`. |
| `VITE_CLERK_PUBLISHABLE_KEY` | `client`, Vercel | Client public | Not secret | Publishable Clerk key. |
| `VITE_API_URL` | `client`, Vercel | Client public | Not secret | Public API base URL. |
| `GEMINI_API_KEY` | `server`, Render Node service | Server only | Not rotated here | Server-side model key. |
| `OPENWEATHER_API_KEY` | `server`, Render Node service | Server only | Account action required | Must be rotated in OpenWeatherMap due prior chat exposure if not already rotated. |
| `OPENROUTESERVICE_API_KEY` | `server`, Render Node service | Server only | Not rotated here | Used only by Node route proxy. |
| `CLIMATIQ_API_KEY` | `server`, Render Node service | Server only | Not rotated here | Used only by Node route proxy. |
| `FORECASTING_SERVICE_URL` | `server`, Render Node service | Server config | Not secret | Node backend calls Python service. |
| `FORECASTING_SERVICE_SECRET` | `server`, `forecasting-service`, Render services | Server only | Newly required | Shared secret header between Node and Python forecast service. Generate a long random value. |
| `SENTRY_DSN` | `server`, `forecasting-service`, Render services | DSN/public submission key | Not secret per Sentry docs | Keep in env for configuration and rotation. |
| `VITE_SENTRY_DSN` | `client`, Vercel | Client public | Not secret per Sentry docs | Browser DSNs are public submission keys, not read-access secrets. |
| `SENTRY_TRACES_SAMPLE_RATE` | `server`, `forecasting-service` | Config | Not secret | Defaults to `0`. |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | `client` | Public config | Not secret | Defaults to `0`. |

Git history check: `git log --all --full-history --name-status -- '*.env' '*.env.*'` shows `.env.example` files only, not committed `.env` secret files.

## 13C Route Protection Summary

All application API routes under `server/routes/*.js` use `requireAuth` except the intentional public test route `/api/test-auth/public`. Paid/metered or expensive endpoints now have focused limiters:

| Route group | Extra limiter | Validation notes |
| --- | --- | --- |
| `/api/ocr/scan-invoice` | `ocrLimiter` | Upload and model response validation already present. |
| `/api/copilot/ask` | `copilotLimiter` | Prompt presence and length checks already present. |
| `/api/search/vendors` | `searchLimiter` | Query presence and length checks already present. |
| `/api/weather/*` | `externalApiLimiter` | Site ID path currently handled by database lookup/cast handling. |
| `/api/routes/calculate` | `externalApiLimiter` | Requires numeric origin/destination coordinates. |
| `/api/carbon/calculate` | `externalApiLimiter` | Requires supported material and positive numeric inputs. |
| `/api/forecast/:siteId/:materialId` | `forecastLimiter` | Validates both IDs as MongoDB ObjectIds before calling Python. |
| `/api/reports/*` | `reportLimiter` | Authenticated file generation limited. |
| `/api/pooling/estimate` | Global API limiter | Validates non-empty ObjectId array and minimum 2 orders. |
| `/api/approvals/:orderId/advance` | Global API limiter | Validates action and handles invalid ObjectId cast as 400. |

## 13D Error Monitoring

Sentry is wired for:

| Component | Package | Initialization |
| --- | --- | --- |
| React client | `@sentry/react` | `client/src/sentry.js`, imported first by `main.jsx`. |
| Node server | `@sentry/node` | `server/instrument.js`, imported first by `server/index.js`; Express error handler registered after routes. |
| Python forecasting service | `sentry-sdk[flask]` | `forecasting-service/app.py`, initialized when `SENTRY_DSN` is set. |

Official Sentry docs confirm DSNs are safe to keep public because they allow event submission but not read access. Abuse is still possible, so DSNs can be rotated/revoked from Sentry project settings.

## 13E Legal Pages

Routes added:

| Route | Page |
| --- | --- |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |

Footer links now navigate to both pages. Page content is starter template language for a demo/early-stage project and is not lawyer-reviewed.

## 13F Final Security Pass

| Check | Status | Notes |
| --- | --- | --- |
| CORS | Hardened | Production requires explicit `FRONTEND_URL`; local development allows localhost origins. |
| Forecasting service direct access | Hardened | Forecast endpoint requires `x-smartbrick-service-secret`. Health remains public. |
| `.env` in git history | Rechecked | No `.env` secret files found in history command output. |
| Data source truth table | Added | See `DATA_SOURCES.md`. |
| Provider/dashboard setup | Account action required | GitHub branch protection, Sentry project creation, Vercel/Render env updates, and credential rotation require account access. |
