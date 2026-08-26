/**
 * QRA — Quality Review Assistant
 * Shared type surface for the pre-pilot prototype.
 *
 * These interfaces mirror the shapes in the design-phase data model, but the
 * prototype holds everything in memory: no database, no backend, no API layer.
 *
 * Vocabulary is enforced at the type level. The banned disposition words do
 * not appear anywhere in this file — a review is Compliant, Flagged, Needs
 * Review, Reviewed, or Review Authorised.
 */

/* -------------------------------------------------------------------------- */
/* Enumerations                                                               */
/* -------------------------------------------------------------------------- */

export type Domain =
  | "FINISHED_PRODUCT"
  | "RAW_MATERIAL"
  | "PACKING_MATERIAL"
  | "IPFP"
  | "STABILITY";

export type BatchStatus =
  | "NEEDS_REVIEW"
  | "IN_REVIEW"
  | "AWAITING_AUTHORISATION"
  | "REVIEW_AUTHORISED"
  | "RETURNED_TO_REVIEWER";

export type SectionStatus = "NOT_STARTED" | "IN_PROGRESS" | "REVIEWED";

export type ItemResult = "COMPLIANT" | "FLAGGED";

/** Approver is the customer own term for the role and is kept as-is. */
export type UserRole = "REVIEWER" | "APPROVER" | "CQO";

export type SlaStatus = "green" | "amber" | "red";

/** Source systems a value can be read from. */
export type SourceSystem =
  | "Caliber LIMS"
  | "Waters Empower"
  | "Tiamo 2.4"
  | "MassLynx"
  | "Spectrum ES"
  | "Mastersizer 3000"
  | "Qtegra ICP"
  | "Ascom BRC2002"
  | "LabSolutions UV"
  | "iCDAS 1.2"
  | "Chamber Monitoring System"
  | "Paper Logbook"
  | "Test method configuration";

/* -------------------------------------------------------------------------- */
/* Domain metadata                                                            */
/* -------------------------------------------------------------------------- */

export interface DomainMeta {
  id: Domain;
  name: string;
  abbreviation: string;
  slug: string;
}

export const DOMAINS: DomainMeta[] = [
  {
    id: "FINISHED_PRODUCT",
    name: "Finished Product",
    abbreviation: "FP",
    slug: "finished-product",
  },
  { id: "RAW_MATERIAL", name: "Raw Material", abbreviation: "RM", slug: "raw-material" },
  {
    id: "PACKING_MATERIAL",
    name: "Packing Material",
    abbreviation: "PM",
    slug: "packing-material",
  },
  { id: "IPFP", name: "In-Process Finished Product", abbreviation: "IPFP", slug: "ipfp" },
  { id: "STABILITY", name: "Stability", abbreviation: "STB", slug: "stability" },
];

export const DOMAIN_BY_SLUG: Record<string, DomainMeta> = Object.fromEntries(
  DOMAINS.map((domain) => [domain.slug, domain]),
);

export const DOMAIN_META = Object.fromEntries(
  DOMAINS.map((domain) => [domain.id, domain]),
) as Record<Domain, DomainMeta>;

/* -------------------------------------------------------------------------- */
/* People                                                                     */
/* -------------------------------------------------------------------------- */

export interface Profile {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  roleLabel: string;
  avatarColour: string;
}

/* -------------------------------------------------------------------------- */
/* Review content                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Tabular evidence shown inline beneath an item — a blend uniformity sample
 * set, a stability trend, a dimensional check. Rows carrying the exception
 * are marked so the reader finds them without hunting.
 */
export interface EvidenceTable {
  caption?: string;
  columns: string[];
  rows: EvidenceRow[];
}

export interface EvidenceRow {
  cells: string[];
  flagged?: boolean;
}

/** One labelled line in the expanded view of an entry. */
export interface DetailField {
  label: string;
  value: string;
}

export interface CheckItem {
  id: string;
  label: string;
  /** Secondary identifier shown beside the label, e.g. a lot number. */
  reference?: string;
  /** Short status word shown on a compliant row, e.g. "Active". */
  statusText?: string;

  expected: string;
  actual: string;
  /** Named document the expectation comes from, e.g. "SOP-CHEM-003". */
  expectedSource?: string;
  source: SourceSystem;
  result: ItemResult;

  /**
   * One sentence saying what QRA compared and against what. Every item can
   * answer this; where it is not written out, it is derived from the fields
   * below so no entry is ever left without an explanation.
   */
  checkDescription?: string;

  /** How the actual read against the expected — "Match", "Within limits". */
  comparison?: string;
  flagReason?: string;
  flagAction?: string;

  /** Sample sets and trends that belong with this item, rendered inline. */
  table?: EvidenceTable;

  /**
   * Everything QRA read for this entry, shown when the reviewer expands the
   * row. Where it is absent the expanded view is built from the fields above,
   * so every entry can still be inspected.
   */
  details?: DetailField[];

  /** Reviewer-entered, in memory only. Gates Mark Section Reviewed. */
  reviewerNote?: string;
  noteAt?: string;
}

/** A standalone instrument that writes its own audit trail. */
export interface StandaloneInstrument {
  name: string;
  version: string;
  /** The system the badge names — standalone instruments are not in LIMS. */
  source: SourceSystem;
  analyst: string;
  loginAt: string;
  logoutAt: string;
  pdfFilename: string;
  /** Monospaced audit trail rendered in the mock viewer. */
  auditTrail: string;
}

/** A record that still lives on paper at this site. */
export interface PaperLogbook {
  reference: string;
  /** Page within the logbook the entry sits on. */
  page: string;
  description: string;
  note: string;
}

/** Stability chamber trace, charted in the Chamber Conditions section. */
export interface ChamberReading {
  day: string;
  temperature: number;
  humidity: number;
}

export interface Section {
  id: string;
  parameter: string;
  name: string;
  order: number;
  status: SectionStatus;
  items: CheckItem[];
  /** Present on Standalone Instrument sections. */
  standaloneInstrument?: StandaloneInstrument;
  /** Present where the source is still a paper record. */
  paperLogbook?: PaperLogbook;
  /** Present on the Stability Chamber Conditions section. */
  chamberReadings?: ChamberReading[];
  chamberLimits?: { temperature: string; humidity: string };
}

export interface TestParameter {
  id: string;
  name: string;
  shortName: string;
  methodType: string;
  stpReference: string;
}

export interface Batch {
  id: string;
  arNumber: string;
  product: string;
  batchNumber: string;
  domain: Domain;
  specVersion: string;
  specCurrent: boolean;
  slaDeadline: string;
  slaStatus: SlaStatus;
  slaLabel: string;
  status: BatchStatus;
  assignedTo: string | null;
  analyst: string;
  lastActivity: string;
  submittedAt?: string;
  parameters: TestParameter[];
  sections: Section[];
  dataSources: SourceSystem[];
}

/* -------------------------------------------------------------------------- */
/* Dashboards                                                                 */
/* -------------------------------------------------------------------------- */

export interface DomainSummary {
  domain: Domain;
  batchCount: number;
  flaggedCount: number;
  needsReviewCount: number;
  slaStatus: SlaStatus;
  slaNote: string;
}

export interface ActivityEntry {
  at: string;
  description: string;
}

export interface Kpi {
  title: string;
  value: string;
  trend: string;
  trendGood: boolean;
}

export interface CycleTimePoint {
  month: string;
  days: number;
}

export interface ExceptionPoint {
  category: string;
  count: number;
}

export interface DomainBreakdownRow {
  domain: string;
  completed: number;
  avgDays: string;
  exceptions: number;
}

export interface ManagementAlert {
  title: string;
  detail: string;
  severity: "high" | "medium";
}

/* -------------------------------------------------------------------------- */
/* Site configuration                                                         */
/* -------------------------------------------------------------------------- */

export interface SpecRow {
  product: string;
  specification: string;
  version: string;
  status: string;
}

export interface SopRow {
  reference: string;
  description: string;
  appliesTo: string;
  status: string;
}

export interface StpRow {
  reference: string;
  method: string;
  domain: string;
  status: string;
}

export interface RegulatoryRow {
  standard: string;
  scope: string;
  appliesTo: string;
  type: string;
}

export interface ConfiguredRule {
  check: string;
  sourceDocument: string;
  comparison: string;
}

/* -------------------------------------------------------------------------- */
/* Derived helpers                                                            */
/* -------------------------------------------------------------------------- */

/** A section unlocks once every flagged item in it carries a reviewer note. */
export const canMarkSectionReviewed = (
  section: Section,
  notes: Record<string, string>,
): boolean =>
  section.items
    .filter((item) => item.result === "FLAGGED")
    .every((item) => (notes[item.id] ?? item.reviewerNote ?? "").trim().length > 0);

export const flaggedCount = (section: Section): number =>
  section.items.filter((item) => item.result === "FLAGGED").length;

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  NEEDS_REVIEW: "Needs Review",
  IN_REVIEW: "In Review",
  AWAITING_AUTHORISATION: "Awaiting Authorisation",
  REVIEW_AUTHORISED: "Review Authorised",
  RETURNED_TO_REVIEWER: "Returned to Reviewer",
};
