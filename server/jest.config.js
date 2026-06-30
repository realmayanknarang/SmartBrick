/**
 * server/jest.config.js
 *
 * Jest configuration for SmartBrick server tests — Phase 12A
 * ─────────────────────────────────────────────────────────────────────────────
 * The server package is "type": "module" (ESM).  Jest's native ESM support is
 * enabled via NODE_OPTIONS=--experimental-vm-modules (set in the "test" script
 * in package.json).
 *
 * Key choices:
 *   • extensionsToTreatAsEsm: ['.js'] — tells Jest to treat .js files as ESM
 *   • transform: {}                    — disable Babel transform; Node handles
 *                                        ESM natively
 *   • testEnvironment: 'node'          — no browser globals needed
 *   • globalSetup / globalTeardown     — start/stop mongodb-memory-server once
 *                                        across the entire test run for speed
 *   • setupFilesAfterEnv               — runs dbHelper.js in each worker process
 *                                        to connect Mongoose and clean data between
 *                                        individual test cases
 */

export default {
  // Skip Babel; Node's built-in ESM handles the transform
  transform: {},

  testEnvironment: 'node',

  // Where Jest looks for tests
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js',
  ],

  // Global setup: spin up mongodb-memory-server before any test file runs
  globalSetup: './tests/setup.js',

  // Global teardown: shut it down after all test files finish
  globalTeardown: './tests/teardown.js',

  // Per-file setup: reconnect to the in-memory DB before each test file
  // and clean up after — each test file gets an isolated view of the DB
  setupFilesAfterEnv: ['./tests/dbHelper.js'],

  // Module name mapper so Jest can resolve bare specifiers that real Node
  // would resolve via package.json exports (add entries here if needed)
  moduleNameMapper: {},

  // Give long-running operations (mongodb-memory-server binary startup)
  // enough time; default 5000ms is too short during first cold boot
  testTimeout: 30000,
};
