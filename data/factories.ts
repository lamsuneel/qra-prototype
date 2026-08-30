import type {
  AuditTrailStep,
  BorderLimit,
  CheckItem,
  DetailField,
  InactivationStatus,
  SerialContinuity,
  EvidenceTable,
  Section,
  SectionStatus,
  SourceSystem,
} from "@/types";
import { SOP } from "./rules";

/**
 * Item and section factories shared by the four non-Finished-Product domains.
 *
 * Ids are prefixed per domain so nothing collides once every batch is joined
 * in data/index.ts. Everything here is hardcoded — no database, no API.
 */

let counter = 0;
/**
 * The document a check traces back to.
 *
 * Derived rather than written on every entry, so a new entry cannot be added
 * without one. An entry that needs a different reference states it and that
 * wins; everything else is answered by what it reads and where it read it.
 */
const sopFor = (spec: {
  label: string;
  source?: SourceSystem;
  sopReference?: string;
}): string => {
  if (spec.sopReference) return spec.sopReference;

  if (spec.source === "Waters Empower") return SOP.EMPOWER;
  if (spec.source === "Tiamo 2.4") return SOP.TIAMO;
  if (spec.source === "MassLynx") return SOP.NON_CDS;

  const label = spec.label.toLowerCase();

  /* Instruments before chemicals: a balance used to weigh a standard is an
     instrument entry, not a standard one. */
  if (
    /calibrat|instrument|balance|titrator|spectrophotomet|sonicator|workstation|verifier|analyser|analyzer|chromatograph|column|system|coulometer|chamber/.test(
      label,
    )
  ) {
    return SOP.INSTRUMENTS;
  }
  if (
    /standard|chemical|reagent|buffer|acid|methanol|acetonitrile|phosphate|water for|solution|lot /.test(
      label,
    )
  ) {
    return SOP.CHEMICALS;
  }

  return SOP.LIMS;
};

const nextId = (prefix: string) => `${prefix}-${(counter += 1)}`;

export interface CompliantSpec {
  prefix: string;
  label: string;
  subLabel?: string;
  /** The rule this entry answers to, e.g. "TIA-F01". */
  flagId?: string;
  /** The document the check comes from. */
  sopReference?: string;
  /** Set where the result cannot be used at all — a PNC number is required. */
  severity?: "HARD_INVALID";
  acceptability?: { id: string; found: string; condition: string };
  borderLimit?: BorderLimit;
  exceptionType?: string;
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
  inactivationStatus?: InactivationStatus;
  inactivationInitiatedBy?: string;
  inactivationInitiatedDate?: string;
  inactivationApprovedBy?: string;
  inactivationReason?: string;
  inactivationApprovalDate?: string;
  /**
   * Present where a rule may flag an entry that the data itself records as
   * compliant — the panel still has to explain why and say what to do.
   */
  comparison?: string;
  flagReason?: string;
  flagAction?: string;
  auditTrailSequence?: AuditTrailStep[];
  serialContinuity?: SerialContinuity;
}

export const compliant = (spec: CompliantSpec): CheckItem => ({
  id: nextId(spec.prefix),
  label: spec.label,
  subLabel: spec.subLabel,
  flagId: spec.flagId,
  sopReference: sopFor(spec),
  severity: spec.severity,
  acceptability: spec.acceptability,
  borderLimit: spec.borderLimit,
  exceptionType: spec.exceptionType,
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
  inactivationInitiatedBy: spec.inactivationInitiatedBy,
  inactivationInitiatedDate: spec.inactivationInitiatedDate,
  inactivationApprovedBy: spec.inactivationApprovedBy,
  inactivationReason: spec.inactivationReason,
  inactivationApprovalDate: spec.inactivationApprovalDate,
  auditTrailSequence: spec.auditTrailSequence,
  serialContinuity: spec.serialContinuity,
  comparison: spec.comparison,
  flagReason: spec.flagReason,
  flagAction: spec.flagAction,
});

export interface FlaggedSpec {
  prefix: string;
  label: string;
  subLabel?: string;
  /** The rule this entry answers to, e.g. "TIA-F01". */
  flagId?: string;
  /** The document the check comes from. */
  sopReference?: string;
  /** Set where the result cannot be used at all — a PNC number is required. */
  severity?: "HARD_INVALID";
  acceptability?: { id: string; found: string; condition: string };
  borderLimit?: BorderLimit;
  exceptionType?: string;
  reference?: string;
  expected: string;
  actual: string;
  expectedSource: string;
  usageSource?: string;
  potencySource?: string;
  inactivationStatus?: InactivationStatus;
  inactivationInitiatedBy?: string;
  inactivationInitiatedDate?: string;
  inactivationApprovedBy?: string;
  inactivationReason?: string;
  inactivationApprovalDate?: string;
  comparison: string;
  flagReason: string;
  flagAction: string;
  auditTrailSequence?: AuditTrailStep[];
  serialContinuity?: SerialContinuity;
  /** Everything QRA read for this entry, shown when the row is expanded. */
  details?: DetailField[];
  source: SourceSystem;
  table?: EvidenceTable;
}

export const flagged = (spec: FlaggedSpec): CheckItem => ({
  id: nextId(spec.prefix),
  label: spec.label,
  subLabel: spec.subLabel,
  flagId: spec.flagId,
  sopReference: sopFor(spec),
  severity: spec.severity,
  acceptability: spec.acceptability,
  borderLimit: spec.borderLimit,
  exceptionType: spec.exceptionType,
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
  auditTrailSequence: spec.auditTrailSequence,
  serialContinuity: spec.serialContinuity,
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
