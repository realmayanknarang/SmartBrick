# SmartBrick E2E Tests

Run the focused core-flow test with:

```bash
PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers E2E_CLERK_EMAIL=owner@smartbrick-demo.com E2E_CLERK_PASSWORD=<password> npm run test:e2e
```

Use a dedicated Clerk test account, not a personal account. The account email must match a seeded SmartBrick user or the setup will insert it into the temporary test database with `E2E_CLERK_ROLE` (default: `owner`).

The Playwright harness starts an isolated `mongodb-memory-server`, seeds it, starts the backend against that in-memory database, and starts the Vite client. This keeps e2e reads and writes away from Atlas/demo data.

Known gap for Phase 13: this test is intentionally not wired into the default CI workflow yet because it needs Clerk credentials stored as CI secrets. The current product also does not expose a create-purchase-order UI/API flow, so this test verifies existing purchase-order analytics from seeded data rather than creating a new order.
