/**
 * Audit API client for the CLI.
 *
 * Calls the server-side audit endpoints (single source of truth).
 * The server owns all audit queries; the CLI is just a renderer.
 */

import { apiGet } from './api.js';

export async function fetchAuditHealth() {
  return apiGet('/api/audit/health');
}

export async function fetchAuditConcept(concept) {
  return apiGet(`/api/audit/concept?concept=${encodeURIComponent(concept)}`);
}

export async function fetchAuditConceptsSummary() {
  return apiGet('/api/audit/concepts-summary');
}

export async function fetchAuditStats() {
  return apiGet('/api/audit/stats');
}

export async function fetchAuditSkeletons(concept) {
  const params = concept ? `?concept=${encodeURIComponent(concept)}` : '';
  return apiGet(`/api/audit/skeletons${params}`);
}

export async function fetchAuditOrphans() {
  return apiGet('/api/audit/orphans');
}

export async function fetchAuditWiring() {
  return apiGet('/api/audit/wiring');
}

export async function fetchAuditLabels() {
  return apiGet('/api/audit/labels');
}

export async function fetchAuditBios() {
  return apiGet('/api/audit/bios');
}

export async function fetchAuditThreads({ concept, mode, through, depth } = {}) {
  const params = new URLSearchParams();
  if (concept) params.set('concept', concept);
  if (mode) params.set('mode', mode);
  if (through) params.set('through', through);
  if (depth) params.set('depth', depth);
  const qs = params.toString();
  return apiGet(`/api/audit/threads${qs ? '?' + qs : ''}`);
}
