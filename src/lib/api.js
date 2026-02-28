/**
 * API client for the Tapestry/Brainstorm backend
 */

const DEFAULT_BASE_URL = 'http://localhost:8080';

export function getBaseUrl() {
  return process.env.TAPESTRY_API_URL || DEFAULT_BASE_URL;
}

export async function apiGet(path) {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText} (${path})`);
  }
  return res.json();
}

export async function apiPost(path, body = {}) {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText} (${path})`);
  }
  return res.json();
}
