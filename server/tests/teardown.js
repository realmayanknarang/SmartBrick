/**
 * server/tests/teardown.js
 *
 * Jest globalTeardown — Phase 12A
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs ONCE after all test files have finished.
 * Stops the mongodb-memory-server instance started in setup.js.
 */

export default async function globalTeardown() {
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
    console.log('\n[Test Teardown] mongodb-memory-server stopped.');
  }
}
