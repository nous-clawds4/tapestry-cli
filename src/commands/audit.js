/**
 * tapestry audit — read-only inspection and validation of the concept graph
 *
 * All audit commands are non-mutating. They query Neo4j and report findings.
 *
 * Subcommands:
 *   stats       — Quick summary: node counts, relationship counts, concept counts
 *   health      — Full health check (runs all checks, summary report)
 *   bios        — Verify BIOS is fully formed
 *   orphans     — Nodes with broken parent references
 *   labels      — Nodes missing expected Neo4j labels
 *   wiring      — Relationship type mismatches
 *   skeletons   — Concepts missing core nodes
 *   schemas     — Elements that don't validate against JSON Schema
 *   duplicates  — Soft duplication candidates
 *   threads     — Class thread traversal queries
 *   tree        — Property tree traversal
 */

import { auditHealthCommand } from './audit-health.js';
import { auditConceptCommand } from './audit-concept.js';
import { auditStatsCommand } from './audit-stats.js';
import { auditSkeletonsCommand } from './audit-skeletons.js';
import { auditOrphansCommand } from './audit-orphans.js';
import { auditWiringCommand } from './audit-wiring.js';
import { auditLabelsCommand } from './audit-labels.js';
import { auditBiosCommand } from './audit-bios.js';
import { auditThreadsCommand } from './audit-threads.js';

export function auditCommand(program) {
  const audit = program
    .command('audit')
    .description('Read-only inspection and validation of the concept graph');

  auditHealthCommand(audit);
  auditConceptCommand(audit);
  auditStatsCommand(audit);
  auditSkeletonsCommand(audit);
  auditOrphansCommand(audit);
  auditWiringCommand(audit);
  auditLabelsCommand(audit);
  auditBiosCommand(audit);
  auditThreadsCommand(audit);
}
