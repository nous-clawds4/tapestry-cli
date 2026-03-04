/**
 * Shared utilities for audit commands.
 *
 * All audit helpers are read-only — no mutations.
 */

import { apiGet } from './api.js';

/**
 * Run a Cypher query and return parsed row objects.
 *
 * @param {string} query - Cypher query string
 * @returns {Array<object>} Array of { header: value } row objects
 */
export async function cypher(query) {
  const encoded = encodeURIComponent(query.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim());
  const data = await apiGet(`/api/neo4j/run-query?cypher=${encoded}`);
  if (!data.success) throw new Error(data.error || 'Query failed');
  return parseCypherCSV(data.cypherResults);
}

/**
 * Run a Cypher query and return raw CSV string.
 */
export async function cypherRaw(query) {
  const encoded = encodeURIComponent(query.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim());
  const data = await apiGet(`/api/neo4j/run-query?cypher=${encoded}`);
  if (!data.success) throw new Error(data.error || 'Query failed');
  return (data.cypherResults || '').trim();
}

/**
 * Parse Cypher CSV output into row objects.
 * Handles quoted strings, NULL values, and arrays.
 */
function parseCypherCSV(raw) {
  if (!raw || !raw.trim()) return [];
  const lines = raw.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => {
      const v = values[i];
      row[h] = v === 'NULL' || v === undefined ? null : v;
    });
    return row;
  });
}

/**
 * Parse a single CSV line, respecting quotes and brackets.
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuote = false;
  let bracketDepth = 0;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"' && bracketDepth === 0) {
      inQuote = !inQuote;
      continue;
    }
    if (ch === '[' && !inQuote) { bracketDepth++; current += ch; continue; }
    if (ch === ']' && !inQuote) { bracketDepth--; current += ch; continue; }
    if (ch === ',' && !inQuote && bracketDepth === 0) {
      values.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  values.push(current.trim());
  return values;
}

/**
 * Format a number with commas.
 */
export function fmt(n) {
  return Number(n).toLocaleString();
}

/**
 * Print a section header for audit output.
 */
export function section(title) {
  console.log(`\n  ── ${title} ──\n`);
}

/**
 * Print a check result line.
 * @param {string} label
 * @param {number} count - Number of issues (0 = pass)
 * @param {string} [detail] - Optional detail text
 */
export function check(label, count, detail) {
  const icon = count === 0 ? '✅' : '⚠️';
  const suffix = detail ? ` — ${detail}` : '';
  console.log(`  ${icon} ${label}: ${count}${suffix}`);
}

/**
 * Print a table of rows.
 * @param {Array<object>} rows
 * @param {Array<{key: string, label: string, width?: number}>} columns
 */
export function table(rows, columns) {
  if (rows.length === 0) {
    console.log('  (none)');
    return;
  }

  // Calculate column widths
  const widths = columns.map(col => {
    const maxData = rows.reduce((max, row) => {
      const val = String(row[col.key] ?? '');
      return Math.max(max, val.length);
    }, 0);
    return Math.max(col.label.length, Math.min(col.width || 60, maxData));
  });

  // Header
  const header = columns.map((col, i) => col.label.padEnd(widths[i])).join('  ');
  console.log(`  ${header}`);
  console.log(`  ${widths.map(w => '─'.repeat(w)).join('  ')}`);

  // Rows
  for (const row of rows) {
    const line = columns.map((col, i) => {
      const val = String(row[col.key] ?? '');
      return val.length > widths[i] ? val.slice(0, widths[i] - 1) + '…' : val.padEnd(widths[i]);
    }).join('  ');
    console.log(`  ${line}`);
  }
}
