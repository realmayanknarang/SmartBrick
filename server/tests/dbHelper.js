/**
 * server/tests/dbHelper.js
 *
 * Per-test-file DB connection helper — Phase 12A
 * ─────────────────────────────────────────────────────────────────────────────
 * This module is listed in jest.config.js setupFilesAfterFramework so it runs
 * at the start of EACH test file (in the same process as the test file itself,
 * unlike globalSetup which runs in the orchestrator process).
 *
 * It connects Mongoose to the in-memory MongoDB instance (URI passed via env)
 * and registers afterEach / afterAll hooks to:
 *   • afterEach  — drop all collection documents so tests don't bleed into each other
 *   • afterAll   — disconnect Mongoose cleanly when the test file is done
 *
 * Each test file gets a clean slate for every test case.
 */

import mongoose from 'mongoose';

// Connect to the in-memory MongoDB before tests in this file run
beforeAll(async () => {
  const uri = process.env.MONGODB_TEST_URI;
  if (!uri) {
    throw new Error(
      '[dbHelper] MONGODB_TEST_URI is not set. ' +
      'Make sure globalSetup (tests/setup.js) ran successfully.'
    );
  }

  // Only connect if Mongoose isn't already connected from a previous test file
  // (Jest may reuse the worker process across test files)
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

// After each individual test, wipe all documents from every registered
// collection so tests start with a clean database state
afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((col) => col.deleteMany({}))
  );
});

// After all tests in the file, close the Mongoose connection
afterAll(async () => {
  await mongoose.disconnect();
});
