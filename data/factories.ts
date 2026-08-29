import type {
  CheckItem,
  DetailField,
  EvidenceTable,
  Section,
  SectionStatus,
  SourceSystem,
} from "@/types";

/**
 * Item and section factories shared by the four non-Finished-Product domains.
 *
 * Ids are prefixed per domain so nothing collides once every batch is joined
 * in data/index.ts. Everything here is hardcoded — no database, no API.
 */

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${(counter += 1)}`;

export interface CompliantSpec {
  prefix: string;
  label: string;
  reference?: string;
  statusText?: string;
  expected: string;
  actual: string;
  expectedSource?: string;
  usageSource?: string;
  potencySource?: string;
  source: SourceSystem;
  table?: EvidenceTable;
  /** Everything QRA read for this entry, shown when the row is expanded. */
  details?: DetailField[];
  requiresQuantityCheck?: boolean;
  prescribedQty?: string;
  actualQty?: string;
  quantityComparison?: "MATCH" | "WITHIN TOLERANCE" | "MISMATCH";
  inactivationStatus?: "Approved" | "Pending Approval";
  inactivationApprovalDate?: string;
  /**
   * Present where a rule may flag an entry that the data itself records as
   * compliant — the panel still has to explain why and say what to do.
   */
  comparison?: string;
  flagReason?: string;
  flagAction?: string;
}

export const compliant = (spec: CompliantSpec): CheckItem => ({
  id: nextId(spec.prefix),
  label: spec.label,
  reference: spec.reference,
  statusText: spec.statusText ?? "Active",
  expected: spec.expected,
  actual: spec.actual,
  expectedSource: spec.expectedSource,
  usageSource: spec.usageSource,
  potencySource: spec.potencySource,
  source: spec.source,
  result: "COMPLIANT",
  table: spec.table,
  details: spec.details,
  requiresQuantityCheck: spec.requiresQuantityCheck,
  prescribedQty: spec.prescribedQty,
  actualQty: spec.actualQty,
  quantityComparison: spec.quantityComparison,
  inactivationStatus: spec.inactivationStatus,
  inactivationApprovalDate: spec.inactivationApprovalDate,
  comparison: spec.comparison,
  flagReason: spec.flagReason,
  flagAction: spec.flagAction,
});

export interface FlaggedSpec {
  prefix: string;
  label: string;
  reference?: string;
  expected: string;
  actual: string;
  expectedSource: string;
  usageSource?: string;
  potencySource?: string;
  inactivationStatus?: "Approved" | "Pending Approval";
  inactivationApprovalDate?: string;
  comparison: string;
  flagReason: string;
  flagAction: string;
  /** Everything QRA read for this entry, shown when the row is expanded. */
  details?: DetailField[];
  source: SourceSystem;
  table?: EvidenceTable;
}

export const flagged = (spec: FlaggedSpec): CheckItem => ({
  id: nextId(spec.prefix),
  label: spec.label,
  reference: spec.reference,
  expected: spec.expected,
  actual: spec.actual,
  expectedSource: spec.expectedSource,
  usageSource: spec.usageSource,
  potencySource: spec.potencySource,
  source: spec.source,
  result: "FLAGGED",
  comparison: spec.comparison,
  flagReason: spec.flagReason,
  flagAction: spec.flagAction,
  details: spec.details,
  table: spec.table,
});

export const section = (
  parameter: string,
  name: string,
  order: number,
  items: CheckItem[],
  extra: Partial<Section> = {},
): Section => ({
  id: `${parameter}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  parameter,
  name,
  order,
  status: "NOT_STARTED" as SectionStatus,
  items,
  ...extra,
});
