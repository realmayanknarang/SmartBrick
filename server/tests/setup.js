/**
 * server/tests/setup.js
 *
 * Jest globalSetup — Phase 12A
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs ONCE before any test file is executed (in a separate Node process from
 * the tests themselves, so it cannot share module-level state with test files
 * directly — it communicates via process.env).
 *
 * What it does:
 *   1. Starts a fresh mongodb-memory-server instance (downloads MongoDB binary
 *      on first run; cached locally thereafter).
 *   2. Exports the connection URI as process.env.MONGODB_TEST_URI so that each
 *      test file can connect to the same in-memory instance.
 *
 * SAFETY: This setup intentionally never reads MONGODB_URI (your real Atlas
 * connection string) — tests are completely isolated from production data.
 */

import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

export default async function globalSetup() {
  // Start an in-memory MongoDB instance
  mongod = await MongoMemoryServer.create({
    instance: {
      // Use a well-known port so teardown can reference it if needed
      // (MongoMemoryServer will pick a random available port if not specified,
      //  which is actually safer — leave it unspecified)
    },
  });

  const uri = mongod.getUri();

  // Expose URI to all test processes via environment variable.
  // Jest's globalSetup runs in the same process that controls test workers,
  // so setting process.env here propagates to worker environments.
  process.env.MONGODB_TEST_URI = uri;

  // Store mongod reference for teardown
  // globalSetup and globalTeardown share state via module scope within the
  // same Jest orchestrator process — but we need to persist the server
  // reference across the module boundary to teardown.js.
  // The cleanest way: write the uri to a temp global that globalTeardown reads.
  global.__MONGOD__ = mongod;

  console.log(`\n[Test Setup] mongodb-memory-server started at ${uri}`);
}
