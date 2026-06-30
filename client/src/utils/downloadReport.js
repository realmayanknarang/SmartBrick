/**
 * client/src/utils/downloadReport.js
 *
 * Phase 11B — authenticated file download helper.
 *
 * Uses fetch + blob + programmatic anchor click rather than axios because:
 *   • responseType: 'blob' works but Content-Disposition filename parsing
 *     is cleaner on the native Response object
 *   • anchor.download reliably triggers a browser save dialog for blobs
 */

/**
 * Downloads a protected report endpoint as a file.
 *
 * @param {string} endpoint       Path relative to /api (e.g. '/reports/spending-pdf')
 * @param {string} defaultFilename Fallback filename if Content-Disposition is absent
 */
export async function downloadReport(endpoint, defaultFilename) {
  const token = await window.Clerk?.session?.getToken();
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const res = await fetch(`${baseURL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    let message = `Download failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // response was not JSON — keep generic message
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  let filename = defaultFilename;

  const match = disposition?.match(/filename="([^"]+)"/);
  if (match) filename = match[1];

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
