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
  | "STABILITY"
  | "MICROBIOLOGY";

export type BatchStatus =
  | "NEEDS_REVIEW"
  | "IN_REVIEW"
  | "AWAITING_AUTHORISATION"
  | "REVIEW_AUTHORISED"
  | "RETURNED_TO_REVIEWER"
  | "RETURNED_FOR_CORRECTION";

export type InactivationStatus =
  | "Initiated"
  | "Pending Second Approval"
  | "Approved";

/** The seven stages a batch moves through in LIMS. */
export type LimsStatus =
  | "Under Test"
  | "Print Taken"
  | "Under QC Review"
  | "Sample In-Charge Review"
  | "Pending QA Review"
  | "Manager Approval"
  | "COA Generated";

export type SectionStatus = "NOT_STARTED" | "IN_PROGRESS" | "REVIEWED";

/**
 * NEEDS_VERIFICATION is never written in the data. It is derived: an entry
 * whose check depends on a prescribed quantity cannot be shown as compliant
 * until both the prescribed and the actual quantity are present to compare.
 *
 * CONDITIONAL_PASS is the opposite case to NEEDS_VERIFICATION. There, QRA
 * has a rule but is missing a figure. Here it has the figure and the rule
 * both, and the rule says the entry is acceptable provided something else
 * holds that only a person can confirm — a titration interrupted and
 * continued is correct if the method calls for adding solution mid-run. QRA
 * cannot read the method, so it says what it found, states the condition,
 * and waits to be told.
 *
 * HARD_INVALID sits above FLAGGED. A flagged result is a real result that
 * needs explaining; a hard-invalid one is not a result at all — a titration
 * started with the conditioning still running has consumed titre the reading
 * does not account for. No observation makes it usable, so the reviewer
 * records a PNC number instead of a note and the analysis is repeated.
 */
export type ItemResult =
  | "COMPLIANT"
  | "CONDITIONAL_PASS"
  | "NEEDS_VERIFICATION"
  | "FLAGGED"
  | "HARD_INVALID";

/** Approver is the customer own term for the role and is kept as-is. */
export type UserRole = "REVIEWER" | "APPROVER" | "CQO";

export type SlaStatus = "green" | "amber" | "red";

/** Source systems a value can be read from. */
export type SourceSystem =
  | "Caliber LIMS"
  /* SST values are keyed into LIMS by the analyst at this site — there are no
     custom fields in Empower here — so they are not instrument-sourced. */
  | "Caliber LIMS — Manual Entry"
  | "Waters Empower"
  | "Tiamo 2.4"
  | "MassLynx"
  | "Spectrum ES"
  | "Mastersizer 3000"
  | "Qtegra ICP"
  | "Magic Net 4.2"
  /* The chromatograph produces the result; LIMS is where it is read. */
  | "Magic Net 4.2 — Caliber LIMS"
  | "Axicon Barcode Verifier"
  | "LabSolutions UV"
  | "iCDAS 1.2"
  | "Chamber Monitoring System"
  | "HRMS System"
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
  {
    id: "RAW_MATERIAL",
    name: "Raw Material",
    abbreviation: "RM",
    slug: "raw-material",
  },
  {
    id: "PACKING_MATERIAL",
    name: "Packing Material",
    abbreviation: "PM",
    slug: "packing-material",
  },
  {
    id: "IPFP",
    name: "In-Process Finished Product",
    abbreviation: "IPFP",
    slug: "ipfp",
  },
  {
    id: "STABILITY",
    name: "Stability",
    abbreviation: "STB",
    slug: "stability",
  },
  {
    id: "MICROBIOLOGY",
    name: "Microbiology",
    abbreviation: "MB",
    slug: "microbiology",
  },
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
  /**
   * Folded away by default. Use where the table is the history behind a
   * finding rather than the finding itself — the reviewer meets the result
   * first and opens the trend when they want it.
   */
  collapsible?: boolean;
  /** What the fold is called while it is shut. */
  collapsedLabel?: string;
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

/** One entry in an instrument's own audit trail, in the order it was written. */
export interface AuditTrailStep {
  step: number;
  label: string;
  timestamp: string;
  status: "ok" | "missing" | "out-of-order";
}

/** The run of trial numbers reviewed, and any break in it. */
export interface SerialContinuity {
  /** The span reviewed, e.g. "Trial #001 – #004". */
  range: string;
  /** Stated only where the run is broken, e.g. "Gap detected: #003 missing". */
  gap?: string;
}

export interface CheckItem {
  id: string;
  label: string;
  /** A second line under the label, saying what the finding requires. */
  subLabel?: string;
  /**
   * The rule this entry answers to, e.g. "TIA-F01" or "EMP-F09". Named on
   * the finding so a reviewer can take it straight to the SOP.
   */
  flagId?: string;
  /**
   * The document the check comes from, e.g. "APL-CP-F-QCCI-GEN-0013". Every
   * entry carries one — an automated check the reviewer cannot trace back to
   * a named document is a check they have to take on trust.
   */
  sopReference?: string;
  /**
   * Set where the result is not usable at all. The reviewer records a PNC
   * number rather than an observation, and the section stays shut until they
   * do.
   */
  severity?: "HARD_INVALID";

  /**
   * A quantitative result, so QRA can say how close to the limit it landed.
   */
  borderLimit?: BorderLimit;

  /**
   * An entry QRA could not conclude for a reason of its own, with the words
   * that reason needs. Without this every amber entry has to be amber for the
   * same reason as a chemical with a missing prescribed quantity, and says
   * so — which is wrong about attendance, and would be wrong about anything
   * else QRA cannot fetch.
   */
  verification?: {
    /** The line on the collapsed row. */
    warning: string;
    /** What the reviewer is being asked to confirm, in the note field. */
    prefill: string;
    placeholder: string;
    /** What the bottom bar says while this entry is holding the section. */
    blocking: string;
  };

  /**
   * An entry the rule set accepts provided a stated condition holds. The
   * reviewer confirms the condition; nothing is written, because there is
   * nothing to describe — either the method says so or it does not.
   */
  acceptability?: {
    /** The rule, e.g. "PASS-TIA-01". */
    id: string;
    /** What the audit trail actually recorded. */
    found: string;
    /** The condition that makes it acceptable. */
    condition: string;
  };
  /**
   * What kind of exception this is, for the heading of a flagged entry.
   * Stated where it matters rather than inferred from the wording.
   */
  exceptionType?: string;
  /** Secondary identifier shown beside the label, e.g. a lot number. */
  reference?: string;
  /** Short status word shown on a compliant row, e.g. "Active". */
  statusText?: string;

  expected: string;
  actual: string;
  /** Named document the expectation comes from, e.g. "SOP-CHEM-003". */
  expectedSource?: string;

  /**
   * Reference and working standard records live in two Caliber LIMS modules:
   * usage in the standard record itself, the assigned value in the eLIMS
   * Reference Standard Audit Trail. Both are named so the reviewer — and an
   * auditor — can see QRA read each of them.
   */
  usageSource?: string;
  potencySource?: string;
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

  /**
   * Chemicals and working standards are checked against the quantity the LIMS
   * worksheet prescribes, so both figures have to be present before the entry
   * can read as compliant.
   */
  requiresQuantityCheck?: boolean;
  /** The quantity the worksheet prescribes, e.g. "25 mg". */
  prescribedQty?: string;
  /** The quantity actually recorded as used. */
  actualQty?: string;

  /**
   * Set only on a chemical that has been taken out of service. The words are
   * the site's own terms for the LIMS inactivation workflow and describe that
   * record, never the disposition of a review.
   */
  /**
   * Taking a chemical out of service needs two QC Section In-Charges, so the
   * record has three states, not two. Anything short of both signatures is a
   * finding: the entry was used while its withdrawal was still half-recorded.
   */
  inactivationStatus?: InactivationStatus;
  /** Who started it, and who countersigned — the second may not exist yet. */
  inactivationInitiatedBy?: string;
  inactivationInitiatedDate?: string;
  inactivationApprovedBy?: string;
  inactivationReason?: string;
  /** When the inactivation was authorised, or absent while it is not. */
  inactivationApprovalDate?: string;
  /** Stated where the comparison is not a plain equality. */
  quantityComparison?: "MATCH" | "WITHIN TOLERANCE" | "MISMATCH";

  /**
   * The instrument's own audit trail, which the reviewer has to read in
   * order. A step out of order or missing is a finding in itself.
   */
  auditTrailSequence?: AuditTrailStep[];
  serialContinuity?: SerialContinuity;

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
  /** Present where the section is served by one named instrument. */
  standaloneInstrument?: StandaloneInstrument;
  /** Present where the source is still a paper record. */
  paperLogbook?: PaperLogbook;
  /** Present on the Stability Chamber Conditions section. */
  chamberReadings?: ChamberReading[];
  chamberLimits?: { temperature: string; humidity: string };
}

export interface TestParameter {
  /**
   * Whether the lab has released this test for review yet. In-process review
   * runs test by test, so a batch is normally part ready and part still on
   * the bench.
   */
  readiness?: "READY" | "IN_PROGRESS";
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
  /** Where the batch has got to in LIMS, independent of QRA's own review. */
  limsStatus: LimsStatus;
  /** Only meaningful at "Print Taken". */
  limsPrints?: number;
  assignedTo: string | null;
  analyst: string;
  lastActivity: string;
  submittedAt?: string;
  parameters: TestParameter[];
  sections: Section[];
  /** Rounds this batch has already been sent back for correction. */
  corrections?: CorrectionRecord[];
  dataSources: SourceSystem[];
}

/* -------------------------------------------------------------------------- */
/* Dashboards                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * A batch sent back to the lab and returned.
 *
 * Kept because the next reviewer needs to know what was corrected — a batch
 * that arrives clean tells you nothing about what it looked like before, and
 * that is exactly what they should be looking at hardest.
 */
export interface CorrectionRecord {
  returnedOn: string;
  returnedBy: string;
  reason: string;
  correctedOn?: string;
  /** What the lab said when it sent the batch back. */
  correctionNote?: string;
}

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
  /** Smaller supporting line beneath the trend, where the KPI has a target. */
  target?: string;
}

/** A recurring exception type, counted across the month. */
export interface RecurringIssue {
  issue: string;
  occurrences: number;
  share: string;
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
  /** Short severity tag shown in the corner of the card. */
  label: string;
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

/**
 * A result inside specification but within half a percent of a limit.
 *
 * It passes, and passing is not the whole question: a batch that lands this
 * close to a limit is one the stability trend has to be read against before
 * anyone decides what happens to it. So it is not green — it is amber, and
 * the reviewer says what the trend showed.
 */
export interface BorderLimit {
  /** The reported result, as a number. */
  result: number;
  lower?: number;
  upper?: number;
  unit: string;
}

export const BORDER_LIMIT_MARGIN = 0.5;

/**
 * The distance, at the precision it is meaningful.
 *
 * A hundredth of a percent under a limit is the whole point of the entry, and
 * one decimal place rounds it away to nothing.
 */
export const formatDistance = (value: number): string =>
  Number(value.toFixed(2)).toString();

/** How close the result sits to the limit it is nearest, or null if clear. */
export const borderLimitDistance = (
  border: BorderLimit,
): { distance: number; edge: "lower" | "upper" } | null => {
  const candidates: { distance: number; edge: "lower" | "upper" }[] = [];

  if (border.lower !== undefined) {
    candidates.push({ distance: border.result - border.lower, edge: "lower" });
  }
  if (border.upper !== undefined) {
    candidates.push({ distance: border.upper - border.result, edge: "upper" });
  }

  const nearest = candidates
    .filter((entry) => entry.distance >= 0)
    .sort((a, b) => a.distance - b.distance)[0];

  if (!nearest) return null;
  return nearest.distance < BORDER_LIMIT_MARGIN ? nearest : null;
};

/**
 * What the reviewer is actually shown for an entry.
 *
 * There is no fixed specification for chemical or working standard usage: the
 * check is the prescribed quantity in the LIMS worksheet against the quantity
 * actually used. Without both figures there is no comparison, so the entry
 * cannot be shown as compliant — it is shown as needing verification against
 * the worksheet instead.
 */
export const resultFor = (item: CheckItem): ItemResult => {
  /* Stated on the entry, and above everything else: a result that is not a
     result cannot be talked down to a flag. */
  if (item.severity === "HARD_INVALID") return "HARD_INVALID";
  if (item.result === "HARD_INVALID") return "HARD_INVALID";

  if (item.result === "FLAGGED") return "FLAGGED";

  /* An acceptability rule holds the entry open until the condition it names
     is confirmed. Confirmation is session state, so the row resolves in the
     component rather than here. */
  if (item.acceptability) return "CONDITIONAL_PASS";

  /* An inactivation short of both signatures is an open question, so the
     entry is flagged whatever the data says. */
  if (
    item.inactivationStatus === "Initiated" ||
    item.inactivationStatus === "Pending Second Approval"
  ) {
    return "FLAGGED";
  }

  /* A broken audit trail is a finding on its own, however the run read. */
  if (item.auditTrailSequence?.some((entry) => entry.status !== "ok"))
    return "FLAGGED";
  if (item.serialContinuity?.gap) return "FLAGGED";

  if (item.requiresQuantityCheck && !(item.prescribedQty && item.actualQty)) {
    return "NEEDS_VERIFICATION";
  }

  /* Something else QRA could not conclude, carrying its own explanation. */
  if (item.verification) return "NEEDS_VERIFICATION";

  /* Passes, but close enough to the limit that the trend has to be read
     before anyone decides what happens to the batch. */
  if (item.borderLimit && borderLimitDistance(item.borderLimit)) {
    return "NEEDS_VERIFICATION";
  }

  return item.result;
};

/**
 * An entry the reviewer has to write against before the section can be
 * marked reviewed. Flagged, because QRA compared and the comparison failed;
 * or needing verification, because QRA could not compare at all and the
 * reviewer has to do it against the worksheet. Compliant entries ask for
 * nothing.
 */
/** The PNC series raised for an unusable result — APL-GP-GEN-0023. */
export const PNC_PATTERN = /^PNC-\d{4}-\d{3,4}$/i;

export const isValidPnc = (value: string): boolean =>
  PNC_PATTERN.test(value.trim());

/** An entry whose result cannot be used, whatever the reviewer writes. */
export const requiresPnc = (item: CheckItem): boolean =>
  resultFor(item) === "HARD_INVALID";

export const requiresNote = (item: CheckItem): boolean => {
  const result = resultFor(item);
  return result === "FLAGGED" || result === "NEEDS_VERIFICATION";
};

/** An entry waiting on the reviewer to confirm an acceptability condition. */
export const requiresConfirmation = (item: CheckItem): boolean =>
  resultFor(item) === "CONDITIONAL_PASS";

/** MATCH, WITHIN TOLERANCE or MISMATCH, where both quantities are present. */
export const quantityComparison = (item: CheckItem): string | null => {
  if (!item.prescribedQty || !item.actualQty) return null;
  if (item.quantityComparison) return item.quantityComparison;

  return item.prescribedQty === item.actualQty ? "MATCH" : "WITHIN TOLERANCE";
};

/** A section unlocks once every flagged item in it carries a reviewer note. */
export const canMarkSectionReviewed = (
  section: Section,
  notes: Record<string, string>,
): boolean =>
  section.items
    .filter((item) => resultFor(item) === "FLAGGED")
    .every(
      (item) => (notes[item.id] ?? item.reviewerNote ?? "").trim().length > 0,
    );

export const flaggedCount = (section: Section): number =>
  section.items.filter((item) => resultFor(item) === "FLAGGED").length;

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  NEEDS_REVIEW: "Needs Review",
  IN_REVIEW: "In Review",
  AWAITING_AUTHORISATION: "Awaiting Authorisation",
  REVIEW_AUTHORISED: "Review Authorised",
  RETURNED_TO_REVIEWER: "Returned to Reviewer",
  RETURNED_FOR_CORRECTION: "Returned for Correction",
};
