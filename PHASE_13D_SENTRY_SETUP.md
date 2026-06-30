# Phase 13D: Sentry Error Monitoring Setup

This document describes how to set up Sentry error monitoring for the SmartBrick application.

## Overview

Sentry has been integrated into both the client and server:
- **Server**: `@sentry/node` initialized via `server/instrument.js`
- **Client**: `@sentry/react` initialized via `client/src/sentry.js`

Both are configured to only initialize when a `SENTRY_DSN` environment variable is present, so the application works without Sentry configured.

## Sentry Setup Steps

### 1. Create a Sentry Project

1. Sign up for [Sentry](https://sentry.io) (free tier available)
2. Create a new project for "SmartBrick"
3. Select "JavaScript" as the platform for the client
4. Create a separate project for "Node.js" for the server (or use the same project with different DSNs)

### 2. Get DSNs

After creating projects, you'll receive DSNs (Data Source Names):
- **Client DSN**: Public, meant to be exposed in the browser (similar to Clerk's publishable key)
- **Server DSN**: Secret, should only be used server-side

### 3. Configure Local Development

Add to `server/.env`:
```bash
SENTRY_DSN=https://your-server-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0
```

Add to `client/.env`:
```bash
VITE_SENTRY_DSN=https://your-client-dsn@sentry.io/project-id
VITE_SENTRY_TRACES_SAMPLE_RATE=0
```

### 4. Configure Vercel (Client)

1. Go to Vercel dashboard → SmartBrick project → Settings → Environment Variables
2. Add:
   - `VITE_SENTRY_DSN`: Your client-side Sentry DSN
   - `VITE_SENTRY_TRACES_SAMPLE_RATE`: `0` (set to `0.1` for 10% performance monitoring if desired)
3. Redeploy the Vercel project

### 5. Configure Render (Server)

1. Go to Render dashboard → SmartBrick Backend service → Environment
2. Add:
   - `SENTRY_DSN`: Your server-side Sentry DSN
   - `SENTRY_TRACES_SAMPLE_RATE`: `0`
3. Redeploy the Render service

### 6. Forecasting Service (Optional)

The Python forecasting service is relatively simple. Adding Sentry Python SDK is optional but recommended for production. If you choose to add it:

1. Install: `pip install sentry-sdk`
2. Initialize in `forecasting-service/app.py`:
```python
import sentry_sdk

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    traces_sample_rate=0.0,
)
```
3. Add `SENTRY_DSN` to Render forecasting service environment variables

## Verification

To verify Sentry is working:

1. **Client-side verification**:
   - Open the deployed application in your browser
   - Open browser console and run: `throw new Error("Test Sentry error")`
   - Check Sentry dashboard for the error

2. **Server-side verification**:
   - Temporarily add a deliberate error to a route:
   ```javascript
   // In server/routes/dashboardRoutes.js
   router.get('/summary', requireAuth, async (_req, res) => {
     throw new Error('Test Sentry error');
   });
   ```
   - Hit the route via the UI or API client
   - Check Sentry dashboard for the error
   - Revert the change

## Important Notes

- **Client DSN is public**: Sentry client-side DSNs are designed to be public. They only allow sending error data, not reading it.
- **Server DSN is secret**: Keep the server DSN private and never commit it to git.
- **Tracing disabled by default**: `SENTRY_TRACES_SAMPLE_RATE=0` disables performance monitoring to stay within free tier limits. Set to `0.1` for 10% sampling if you want performance data.
- **Development environment**: Sentry works in development, but you may want to set `SENTRY_DSN` only in production to avoid noise during development.

## Troubleshooting

If errors don't appear in Sentry:
1. Check that the DSN is correctly set in environment variables
2. Verify the application is using the environment variables (check deployed logs)
3. Ensure Sentry initialization happens before other code (it does in our setup)
4. Check Sentry project settings for any filtering rules that might block errors
