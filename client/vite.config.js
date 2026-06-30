import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom to simulate a browser environment for React component tests
    environment: 'jsdom',
    // Run the jest-dom setup file before each test suite so DOM matchers
    // like .toBeInTheDocument() are available globally
    setupFiles: ['./src/tests/setup.js'],
    // Make vitest globals (describe, it, expect) available without importing them
    globals: true,
    // Phase 12A starts before client tests exist; keep the test script green
    // until actual client specs are added.
    passWithNoTests: true,
  },
})
