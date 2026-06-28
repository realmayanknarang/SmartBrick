/**
 * client/src/hooks/useApiClient.js
 *
 * Convenience hook that returns the shared apiClient instance.
 *
 * The default export from `../api/client` is a single Axios instance with a
 * built-in request interceptor that automatically attaches the Clerk session
 * token via `window.Clerk?.session?.getToken()` — no hook wiring needed.
 *
 * This hook exists purely for ergonomic reasons: some components prefer to
 * obtain their dependencies via hooks rather than module-level imports.
 * Both approaches are equivalent and safe to mix.
 *
 * Usage
 * -----
 *  // Option A — import directly (preferred for non-component code):
 *  import apiClient from '../api/client';
 *  const { data } = await apiClient.get('/projects');
 *
 *  // Option B — via hook (equivalent, works inside components too):
 *  import useApiClient from '../hooks/useApiClient';
 *  const api = useApiClient();
 *  const { data } = await api.get('/projects');
 */

import apiClient from '../api/client';

export default function useApiClient() {
  return apiClient;
}
