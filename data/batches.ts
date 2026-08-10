/**
 * V2 sample data — a unified QA review workspace.
 *
 * No backend, no API, no database. Everything below is fixed data shaped to
 * look like Caliber LIMS and Empower records, and labelled as simulated
 * wherever it reaches the screen.
 *
 * Structure follows Shrikrishna's flow diagram:
 *   Batch -> TestParameter -> Section -> Entry
 * where the five sections are the five icons he drew under Assay.
 *
 * Vocabulary rules enforced throughout:
 *   - A section or entry with no exception is "Compliant". Never "Pass".
 *   - The product never states that anything is approved or released. The one
 *     deliberate exception is the LIMS master-data field "Inactivation
 *     approved", which reports whether a human completed that action in
 *     Caliber — it is the finding itself on the extra chemical entry.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type MethodType = "HPLC" | "UV" | "Titration" | "GC";

export type TestStatus = "NotStarted" | "InProgress" | "Paused" | "Reviewed";

export type SectionType =
  | "chemicals"
  | "chromatographySystem"
  | "standards"
  | "instruments"
  | "column";

export type SectionStatus = "NotStarted" | "Reviewed";

export type EntryStatus = "ok" | "flagged" | "advisory" | "na";

/**
 * Drives both the badge in the workspace and the label printed in the Digital
 * Review Record. Three distinct record labels all present as `flagged`
 * entries, so severity is what tells them apart.
 */
export type EntrySeverity = "Critical" | "Major" | "NeedsVerification" | "Advisory";

export type BatchSessionStatus = "New" | "Paused" | "Completed";

export type SlaProfileId = "shrikrishna-site" | "lupin-cipla";

export type SlaStatus = "WithinSla" | "Overdue";

export interface SlaProfile {
  id: SlaProfileId;
  name: string;
  workingDays: number;
}

/** Per-batch SLA outcome under one profile. Precomputed — no runtime date math. */
export interface SlaAssessment {
  deadline: string;
  status: SlaStatus;
  /** Short qualifier shown beside the status, e.g. "1 working day past due". */
  detail: string;
  /** Working days past the deadline. Present only when status is Overdue. */
  daysOverdue?: number;
}

export interface ExpectedEntry {
  id: string;
  label: string;
  /** Scalar form where the expectation is a rule rather than a list item. */
  requirement?: string;
  /** id of the actual entry satisfying this expectation, when one does. */
  matchedEntryId?: string;
}

export interface Inactivation {
  initiated: boolean;
  initiatedBy?: string;
  initiatedAt?: string;
  approved: boolean;
}

export interface Entry {
  id: string;
  label: string;
  value: string;
  status: EntryStatus;
  severity?: EntrySeverity;
  /** Ordered rows for the evidence panel. Insertion order is display order. */
  details: Record<string, string>;
  inactivation?: Inactivation;
  finding?: string;
  advisory?: string;
  /** What the reviewer does next — always in Caliber LIMS, never here. */
  action?: string;
  /** false when the source system holds no record for this item. */
  dataAvailable?: boolean;
  /** Shown in place of the detail panel when dataAvailable is false. */
  observationGapMessage?: string;
  sourceLabel: string;
}

export interface Section {
  type: SectionType;
  applicable: boolean;
  /** Why this section does not apply. Shown on the N/A panel. */
  naReason?: string;
  /** Non-clickable context shown above the entries, e.g. column usage. */
  contextSummary?: string;
  /** Extra note under the context card, e.g. a cross-test reference. */
  contextNote?: string;
  expectedEntries?: ExpectedEntry[];
  actualEntries: Entry[];
  status: SectionStatus;
  /** Short phrase printed against this section in the Digital Review Record. */
  recordNote?: string;
}

/**
 * Quality Management System / Planned Non-Conformance state for a test.
 * Uniformly NotApplicable in the prototype; populated per test by the QMS
 * connector in production, so each test can differ.
 */
export interface QmsPnc {
  status: "OpenPNC" | "OpenOOS" | "NoInvestigation" | "NotApplicable";
  label: string;
}

const QMS_NOT_APPLICABLE: QmsPnc = { status: "NotApplicable", label: "N/A" };

export interface TestParameter {
  id: string;
  name: string;
  methodType: MethodType;
  status: TestStatus;
  qmsPncStatus: QmsPnc;
  sections: Section[];
}

/** Seeded reviewer position and progress. Batch C only. */
export interface SessionState {
  currentTestId: string;
  currentSectionType: SectionType;
  sectionStatuses: Record<SectionType, SectionStatus>;
  /** Notes carried over from the paused session. Reappear on resume. */
  reviewerNotes?: string;
}

export interface Batch {
  arNumber: string;
  batchNumber: string;
  product: string;
  analyst: string;
  reviewerName: string;
  submittedAt: string;
  analysisDate: string;
  sessionStatus: BatchSessionStatus;
  /** Sub-line on the Recent Reviews card. */
  activityLabel: string;
  slaByProfile: Record<SlaProfileId, SlaAssessment>;
  tests: TestParameter[];
  sessionState?: SessionState;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const REVIEWER = "Shrikrishna";

/** Required on every entry, and shown wherever data is displayed. */
export const SOURCE_LABEL = "Simulated LIMS data (Caliber LIMS in production)";

/** Source of the N/A determination — configuration, not LIMS. */
const METHOD_CONFIG_SOURCE = "Test method configuration";

export const SLA_PROFILES: SlaProfile[] = [
  { id: "shrikrishna-site", name: "Shrikrishna's site", workingDays: 2 },
  { id: "lupin-cipla", name: "Lupin/Cipla profile", workingDays: 1 },
];

export const DEFAULT_SLA_PROFILE: SlaProfileId = "shrikrishna-site";

/** The date the review session is taking place. Monday. */
export const REVIEW_DATE = "03-Aug-2026";

export const SECTION_LABELS: Record<SectionType, string> = {
  chemicals: "Chemicals",
  chromatographySystem: "Chromatography System",
  standards: "Standards",
  instruments: "Instruments",
  column: "Column",
};

/** Customer checklist line each section maps to. Configuration in production. */
export const CHECKLIST_REFERENCES: Record<SectionType, string> = {
  chemicals: "Analytical Checklist Item 5a — Chemical usage verified",
  chromatographySystem: "Analytical Checklist Item 8 — Instrument logbook verified",
  standards:
    "Analytical Checklist Item 5b — Working / Reference standard details verified",
  instruments: "Analytical Checklist Item 8 — Equipment usage verified",
  column: "Analytical Checklist Item 8 — Column usage / SST verified",
};

export const QMS_PNC_NOTE =
  "QMS/PNC status will be populated from the Quality Management System connector in production.";

/** Canonical section order, matching the icons on the flow diagram. */
export const SECTION_ORDER: SectionType[] = [
  "chemicals",
  "chromatographySystem",
  "standards",
  "instruments",
  "column",
];

/** Label printed against a section in the Digital Review Record. */
export const RECORD_LABELS: Record<EntrySeverity, string> = {
  Critical: "CRITICAL",
  Major: "EXCEPTION",
  NeedsVerification: "NEEDS VERIFICATION",
  Advisory: "ADVISORY",
};

/** Most serious first — used to pick a section's record label. */
export const SEVERITY_RANK: EntrySeverity[] = [
  "Critical",
  "Major",
  "NeedsVerification",
  "Advisory",
];

/* -------------------------------------------------------------------------- */
/* System suitability                                                         */
/* -------------------------------------------------------------------------- */

/** The three SST parameters and their method limits, identical across tests. */
const SST_LIMITS = [
  { key: "PLATE", label: "Plate Count (N)", requirement: ">= 2000 (method limit)" },
  { key: "TAIL", label: "Tailing Factor (T)", requirement: "<= 2.0 (method limit)" },
  { key: "RES", label: "Resolution (Rs)", requirement: ">= 2.0 (method limit)" },
];

const sstExpected = (prefix: string): ExpectedEntry[] =>
  SST_LIMITS.map((limit) => ({
    id: `${prefix}-EXP-SST-${limit.key}`,
    label: limit.label,
    requirement: limit.requirement,
    matchedEntryId: `${prefix}-SST-${limit.key}`,
  }));

const sstEntries = (
  prefix: string,
  values: {
    plateCount: string;
    tailing: string;
    resolution: string;
    resolutionFails?: boolean;
  },
): Entry[] => {
  const actuals = [values.plateCount, values.tailing, values.resolution];

  return SST_LIMITS.map((limit, index) => {
    const failing = limit.key === "RES" && values.resolutionFails === true;

    return {
      id: `${prefix}-SST-${limit.key}`,
      label: limit.label,
      value: `${actuals[index]} — expected ${limit.requirement}`,
      status: failing ? "flagged" : "ok",
      ...(failing ? { severity: "Major" as EntrySeverity } : {}),
      details: {
        Parameter: limit.label,
        Expected: limit.requirement,
        Actual: actuals[index],
        Status: failing ? "Below method limit" : "Within method limit",
      },
      ...(failing
        ? {
            finding:
              "Resolution of 1.18 is below the method specification limit of >= 2.0. Poor resolution indicates the chromatographic system may not adequately separate the analyte from impurities. Results obtained with this system suitability failure may not be valid.",
            action:
              "Verify whether SST was repeated after corrective action before sample analysis began. Do not release batch until SST failure is resolved.",
          }
        : {}),
      sourceLabel: SOURCE_LABEL,
    };
  });
};

/** Cumulative injection count against the column's qualified limit. */
const overLimitExpected = (prefix: string): ExpectedEntry => ({
  id: `${prefix}-EXP-COL-LIMIT`,
  label: "Cumulative Injection Count",
  requirement: "<= 400 injections (qualified limit)",
  matchedEntryId: `${prefix}-COL-LIMIT`,
});

const overLimitEntry = (prefix: string): Entry => ({
  id: `${prefix}-COL-LIMIT`,
  label: "Cumulative Injection Count",
  value: "412 injections — expected <= 400 injections (qualified limit)",
  status: "flagged",
  severity: "Major",
  details: {
    Column: "COL-2024-09",
    Expected: "<= 400 injections (qualified limit)",
    Actual: "412 injections",
    "Exceeded by": "12 injections",
    Inactivation: "Not initiated",
  },
  inactivation: { initiated: false, approved: false },
  finding:
    "Column COL-2024-09 has 412 cumulative injections against a qualified limit of 400. The column has been used beyond its qualified range. Results obtained after the limit was exceeded may not be reliable.",
  action:
    "Column must be retired or re-qualified before further use. Verify in Caliber LIMS whether the column was within limit for the specific injections used in this sample set.",
  sourceLabel: SOURCE_LABEL,
});

/** Every N/A section carries the same source attribution. */
const naSection = (type: SectionType, naReason: string): Section => ({
  type,
  applicable: false,
  naReason,
  actualEntries: [],
  status: "NotStarted",
  recordNote: METHOD_CONFIG_SOURCE,
});

/* ========================================================================== */
/* BATCH A — AR-2026-000121 — Paracetamol 500mg                              */
/* Clean path. Assay only. Every applicable section compliant.               */
/* ========================================================================== */

const batchA: Batch = {
  arNumber: "AR-2026-000121",
  batchNumber: "ABF-2026-121",
  product: "Paracetamol 500mg",
  analyst: "Rajesh Kumar",
  reviewerName: "Shrikrishna",
  submittedAt: "01-Aug-2026 09:00",
  analysisDate: "01-Aug-2026",
  sessionStatus: "Completed",
  activityLabel: "Reviewed 02-Aug-2026 10:00",
  slaByProfile: {
    "shrikrishna-site": {
      deadline: "04-Aug-2026 09:00",
      status: "WithinSla",
      detail: "1 working day remaining",
    },
    "lupin-cipla": {
      deadline: "03-Aug-2026 09:00",
      status: "WithinSla",
      detail: "Due today",
    },
  },
  tests: [
    {
      id: "ASSAY",
      name: "Assay",
      methodType: "HPLC",
      status: "NotStarted",
      qmsPncStatus: QMS_NOT_APPLICABLE,
      sections: [
        {
          type: "chemicals",
          applicable: true,
          status: "NotStarted",
          recordNote: "3 chemicals — all match specification",
          expectedEntries: [
            {
              id: "A-ASSAY-EXP-CHEM-1",
              label: "Acetonitrile HPLC grade",
              matchedEntryId: "A-ASSAY-CHEM-1",
            },
            {
              id: "A-ASSAY-EXP-CHEM-2",
              label: "Water HPLC grade",
              matchedEntryId: "A-ASSAY-CHEM-2",
            },
            {
              id: "A-ASSAY-EXP-CHEM-3",
              label: "Phosphate buffer",
              matchedEntryId: "A-ASSAY-CHEM-3",
            },
          ],
          actualEntries: [
            {
              id: "A-ASSAY-CHEM-1",
              label: "Acetonitrile HPLC grade",
              value: "ACN-2024-441 · 1000ml",
              status: "ok",
              details: {
                Chemical: "Acetonitrile HPLC grade",
                Lot: "ACN-2024-441",
                Quantity: "1000ml",
                Expected: "Acetonitrile HPLC grade — required by specification",
                Actual: "Acetonitrile HPLC grade — Lot ACN-2024-441 — 1000ml",
              },
              sourceLabel: SOURCE_LABEL,
            },
            {
              id: "A-ASSAY-CHEM-2",
              label: "Water HPLC grade",
              value: "WTR-2024-112 · 500ml",
              status: "ok",
              details: {
                Chemical: "Water HPLC grade",
                Lot: "WTR-2024-112",
                Quantity: "500ml",
                Expected: "Water HPLC grade — required by specification",
                Actual: "Water HPLC grade — Lot WTR-2024-112 — 500ml",
              },
              sourceLabel: SOURCE_LABEL,
            },
            {
              id: "A-ASSAY-CHEM-3",
              label: "Phosphate buffer",
              value: "PB-2024-089 · 200ml",
              status: "ok",
              details: {
                Chemical: "Phosphate buffer",
                Lot: "PB-2024-089",
                Quantity: "200ml",
                Expected: "Phosphate buffer — required by specification",
                Actual: "Phosphate buffer — Lot PB-2024-089 — 200ml",
              },
              sourceLabel: SOURCE_LABEL,
            },
          ],
        },
        {
          type: "chromatographySystem",
          applicable: true,
          status: "NotStarted",
          recordNote: "HPLC-001 only — active, within range",
          actualEntries: [
            {
              id: "A-ASSAY-SYS-1",
              label: "HPLC-001",
              value: "Waters Alliance e2695 · 08:20 to 13:10",
              status: "ok",
              details: {
                "System ID": "HPLC-001",
                Instrument: "Waters Alliance e2695",
                "Usage start": "01-Aug-2026 08:20",
                "Usage end": "01-Aug-2026 13:10",
                Status: "Active, within range",
                Expected: "One system per test, active and within range",
                Actual: "Single system used — HPLC-001",
              },
              sourceLabel: SOURCE_LABEL,
            },
          ],
        },
        {
          type: "standards",
          applicable: true,
          status: "NotStarted",
          recordNote: "WS-2024-41 and RS-2024-18 active and unexpired",
          expectedEntries: [
            {
              id: "A-ASSAY-EXP-STD-1",
              label: "Working standard",
              requirement: "Active, expiry on or after 01-Aug-2026",
              matchedEntryId: "A-ASSAY-STD-1",
            },
            {
              id: "A-ASSAY-EXP-STD-2",
              label: "Reference standard",
              requirement: "Active, expiry on or after 01-Aug-2026",
              matchedEntryId: "A-ASSAY-STD-2",
            },
          ],
          actualEntries: [
            {
              id: "A-ASSAY-STD-1",
              label: "Working Standard WS-2024-41",
              value: "Active · Expiry 31-Oct-2026",
              status: "ok",
              details: {
                "Working Standard": "WS-2024-41",
                Status: "Active",
                Expiry: "31-Oct-2026",
                "Analysis date": "01-Aug-2026",
                Potency: "99.6%",
                Consumption: "52.0mg",
                Expected: "Active, not expired",
                Actual: "Active, 91 days before expiry",
              },
              sourceLabel: SOURCE_LABEL,
            },
            {
              id: "A-ASSAY-STD-2",
              label: "Reference Standard RS-2024-18",
              value: "Active · Expiry 30-Nov-2026",
              status: "ok",
              details: {
                "Reference Standard": "RS-2024-18",
                Status: "Active",
                Expiry: "30-Nov-2026",
                "Analysis date": "01-Aug-2026",
                Potency: "99.8%",
                Consumption: "10.0mg",
                Expected: "Active, not expired",
                Actual: "Active, 121 days before expiry",
              },
              sourceLabel: SOURCE_LABEL,
            },
          ],
        },
        {
          type: "instruments",
          applicable: true,
          status: "NotStarted",
          recordNote: "All instruments active and calibrated",
          actualEntries: [
            {
              id: "A-ASSAY-INS-1",
              label: "BAL-2024-003",
              value: "Weighing Balance · Active, calibrated",
              status: "ok",
              details: {
                "Instrument ID": "BAL-2024-003",
                Type: "Weighing Balance",
                Status: "Active, calibrated",
                Expected: "Weighing Balance BAL-2024-003 — active and within calibration",
                Actual: "BAL-2024-003 — active, calibration current",
              },
              sourceLabel: SOURCE_LABEL,
            },
            {
              id: "A-ASSAY-INS-2",
              label: "SON-2024-001",
              value: "Sonicator · Active",
              status: "ok",
              details: {
                "Instrument ID": "SON-2024-001",
                Type: "Sonicator",
                Status: "Active, calibrated",
                Expected: "Sonicator SON-2024-001 — active and within calibration",
                Actual: "SON-2024-001 — active, calibration current",
              },
              sourceLabel: SOURCE_LABEL,
            },
          ],
        },
        {
          type: "column",
          applicable: true,
          status: "NotStarted",
          recordNote: "COL-2024-07 — SST within method limits",
          contextSummary:
            "COL-2024-07 · 12 test injections · 380 cumulative · limit 400 · Used 01-Aug 08:20 to 13:10",
          expectedEntries: sstExpected("A-ASSAY"),
          actualEntries: sstEntries("A-ASSAY", {
            plateCount: "5200",
            tailing: "1.28",
            resolution: "2.35",
          }),
        },
      ],
    },
  ],
};

/* ========================================================================== */
/* BATCH B — AR-2026-000122 — Amoxicillin 250mg                              */
/* Primary demonstration batch. Five tests, Assay at full depth.             */
/* ========================================================================== */

const batchBAssay: TestParameter = {
  id: "ASSAY",
  name: "Assay",
  methodType: "HPLC",
  status: "NotStarted",
  qmsPncStatus: QMS_NOT_APPLICABLE,
  sections: [
    {
      type: "chemicals",
      applicable: true,
      status: "NotStarted",
      recordNote: "Extra entry, inactivation not approved",
      expectedEntries: [
        {
          id: "B-ASSAY-EXP-CHEM-1",
          label: "Acetonitrile HPLC grade",
          matchedEntryId: "B-ASSAY-CHEM-1",
        },
        {
          id: "B-ASSAY-EXP-CHEM-2",
          label: "Water HPLC grade",
          matchedEntryId: "B-ASSAY-CHEM-2",
        },
        {
          id: "B-ASSAY-EXP-CHEM-3",
          label: "Phosphate buffer",
          matchedEntryId: "B-ASSAY-CHEM-3",
        },
        {
          id: "B-ASSAY-EXP-CHEM-4",
          label: "Methanol HPLC grade",
          matchedEntryId: "B-ASSAY-CHEM-4",
        },
      ],
      actualEntries: [
        {
          id: "B-ASSAY-CHEM-1",
          label: "Acetonitrile HPLC grade",
          value: "ACN-2024-441 · 1000ml",
          status: "ok",
          details: {
            Chemical: "Acetonitrile HPLC grade",
            Lot: "ACN-2024-441",
            Quantity: "1000ml",
            Expected: "Acetonitrile HPLC grade — required by specification",
            Actual: "Acetonitrile HPLC grade — Lot ACN-2024-441 — 1000ml",
          },
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-ASSAY-CHEM-2",
          label: "Water HPLC grade",
          value: "WTR-2024-112 · 500ml",
          status: "ok",
          details: {
            Chemical: "Water HPLC grade",
            Lot: "WTR-2024-112",
            Quantity: "500ml",
            Expected: "Water HPLC grade — required by specification",
            Actual: "Water HPLC grade — Lot WTR-2024-112 — 500ml",
          },
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-ASSAY-CHEM-3",
          label: "Phosphate buffer",
          value: "PB-2024-089 · 200ml",
          status: "ok",
          details: {
            Chemical: "Phosphate buffer",
            Lot: "PB-2024-089",
            Quantity: "200ml",
            Expected: "Phosphate buffer — required by specification",
            Actual: "Phosphate buffer — Lot PB-2024-089 — 200ml",
          },
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-ASSAY-CHEM-4",
          label: "Methanol HPLC grade",
          value: "MET-2024-221 · 1000ml",
          status: "ok",
          details: {
            Chemical: "Methanol HPLC grade",
            Lot: "MET-2024-221",
            Quantity: "1000ml",
            Expected: "Methanol HPLC grade — required by specification",
            Actual: "Methanol HPLC grade — Lot MET-2024-221 — 1000ml",
          },
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-ASSAY-CHEM-5",
          label: "Acetonitrile HPLC grade (extra)",
          value: "ACN-2024-441 · 500ml",
          status: "flagged",
          severity: "Major",
          details: {
            Chemical: "Acetonitrile HPLC grade (extra)",
            Lot: "ACN-2024-441",
            Quantity: "500ml",
            Expected:
              "Not present — specification requires 4 chemicals only (Acetonitrile HPLC grade, Water HPLC grade, Phosphate buffer, Methanol HPLC grade)",
            Actual: "Acetonitrile HPLC grade — Lot ACN-2024-441 — 500ml",
            "Inactivation initiated": "Yes — apatel 30-Jul-2026 11:34",
            "Inactivation approved": "No",
          },
          inactivation: {
            initiated: true,
            initiatedBy: "apatel",
            initiatedAt: "30-Jul-2026 11:34",
            approved: false,
          },
          finding:
            "Extra chemical entry not in the configured specification. Inactivation was initiated but has not been completed.",
          action: "Go to Caliber LIMS to verify approval chain.",
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    {
      type: "chromatographySystem",
      applicable: true,
      status: "NotStarted",
      recordNote: "Duplicate entry",
      actualEntries: [
        {
          id: "B-ASSAY-SYS-1",
          label: "HPLC-001",
          value: "Waters Alliance e2695 · 08:15 to 14:32",
          status: "ok",
          details: {
            "System ID": "HPLC-001",
            Instrument: "Waters Alliance e2695",
            "Calibration Status": "Calibrated",
            "Calibration Due": "31-Dec-2026",
            "Usage Start": "30-Jul-2026 08:15",
            "Usage End": "30-Jul-2026 14:32",
            Expected: "One system per test, calibrated and in date",
            Actual: "Primary system for this test",
          },
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-ASSAY-SYS-2",
          label: "HPLC-003",
          value: "Waters Alliance e2695 · 11:00 to 11:45",
          status: "flagged",
          severity: "NeedsVerification",
          details: {
            "System ID": "HPLC-003",
            Instrument: "Waters Alliance e2695",
            "Calibration Status": "Calibrated",
            "Calibration Due": "31-Dec-2026",
            "Usage Start": "30-Jul-2026 11:00",
            "Usage End": "30-Jul-2026 11:45",
            Expected: "One system per test",
            Actual: "Second system recorded during HPLC-001 usage window",
            Inactivation: "Not initiated",
          },
          inactivation: { initiated: false, approved: false },
          finding:
            "Possible duplicate entry. A second chromatography system is recorded inside the usage window of HPLC-001.",
          action:
            "Confirm in Caliber LIMS whether HPLC-003 was genuinely used or recorded in error.",
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    {
      type: "standards",
      applicable: true,
      status: "NotStarted",
      recordNote: "WS expired but still active in LIMS at analysis",
      expectedEntries: [
        {
          id: "B-ASSAY-EXP-STD-1",
          label: "Valid lot, not expired on analysis date",
          requirement: "Expected: Active lot with expiry >= 30-Jul-2026 (analysis date)",
          matchedEntryId: "B-ASSAY-STD-1",
        },
        {
          id: "B-ASSAY-EXP-STD-2",
          label: "Reference standard",
          requirement: "Active, expiry on or after 30-Jul-2026",
          matchedEntryId: "B-ASSAY-STD-2",
        },
      ],
      actualEntries: [
        {
          id: "B-ASSAY-STD-1",
          label: "Working Standard WS-2024-44",
          value: "Active in LIMS · Expired 18-Jul-2026",
          status: "flagged",
          severity: "Critical",
          details: {
            "Working Standard": "WS-2024-44",
            Status: "Active in LIMS",
            Expiry: "18-Jul-2026",
            "Analysis date": "30-Jul-2026",
            Potency: "99.2%",
            Consumption: "55.5mg",
            Expected:
              "Expired — lot expiry date (18-Jul-2026) preceded analysis date (30-Jul-2026). Should not have been in active use.",
            Actual: "WS-2024-44 — Status: Active in LIMS — Used on 30-Jul-2026",
            Inactivation: "Not initiated",
          },
          inactivation: { initiated: false, approved: false },
          finding:
            "Working standard lot WS-2024-44 was Active in LIMS at time of analysis but had expired 12 days prior (expiry: 18-Jul-2026, analysis: 30-Jul-2026). Lot should have been inactivated before analysis date.",
          action:
            "Verify whether re-analysis was performed with a valid standard. Do not release batch until resolved.",
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-ASSAY-STD-2",
          label: "Reference Standard RS-2024-18",
          value: "Active · Expiry 30-Nov-2026",
          status: "ok",
          details: {
            "Reference Standard": "RS-2024-18",
            Status: "Active",
            Expiry: "30-Nov-2026",
            "Analysis date": "30-Jul-2026",
            Potency: "99.8%",
            Consumption: "10.0mg",
            Expected: "Active, not expired",
            Actual: "Active, 123 days before expiry",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    {
      type: "instruments",
      applicable: true,
      status: "NotStarted",
      recordNote: "All instruments active and calibrated",
      actualEntries: [
        {
          id: "B-ASSAY-INS-1",
          label: "BAL-2024-003",
          value: "Weighing Balance · 08:00 to 08:45",
          status: "ok",
          dataAvailable: true,
          details: {
            "Instrument ID": "BAL-2024-003",
            Type: "Weighing Balance",
            Status: "Active, calibrated",
            "Usage Start": "30-Jul-2026 08:00",
            "Usage End": "30-Jul-2026 08:45",
            "Weight recorded": "50.12mg of WS-2024-44",
            Expected: "Weighing Balance BAL-2024-003 — active and within calibration",
            Actual: "BAL-2024-003 — active, calibration current",
          },
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-ASSAY-INS-2",
          label: "SON-2024-001",
          value: "Sonicator · 08:30 to 08:45",
          status: "ok",
          dataAvailable: true,
          details: {
            "Instrument ID": "SON-2024-001",
            Type: "Sonicator",
            Status: "Active, calibrated",
            "Usage Start": "30-Jul-2026 08:30",
            "Usage End": "30-Jul-2026 08:45",
            Duration: "15 minutes",
            Expected: "Sonicator SON-2024-001 — active and within calibration",
            Actual: "SON-2024-001 — active, calibration current",
          },
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-ASSAY-INS-3",
          label: "STR-2024-002",
          value: "Magnetic Stirrer · 08:35 to 08:50",
          status: "ok",
          dataAvailable: true,
          details: {
            "Instrument ID": "STR-2024-002",
            Type: "Magnetic Stirrer",
            Status: "Active, calibrated",
            "Usage Start": "30-Jul-2026 08:35",
            "Usage End": "30-Jul-2026 08:50",
            Expected: "Magnetic Stirrer STR-2024-002 — active and within calibration",
            Actual: "STR-2024-002 — active, calibration current",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    {
      type: "column",
      applicable: true,
      status: "NotStarted",
      recordNote: "SST resolution below limit; usage exceeded qualified limit",
      contextSummary:
        "COL-2024-09 · 47 test injections · 412 cumulative · limit 400 · Used 30-Jul 08:15 to 14:32",
      expectedEntries: [...sstExpected("B-ASSAY"), overLimitExpected("B-ASSAY")],
      actualEntries: [
        ...sstEntries("B-ASSAY", {
          plateCount: "4850",
          tailing: "1.42",
          resolution: "1.18",
          resolutionFails: true,
        }),
        overLimitEntry("B-ASSAY"),
      ],
    },
  ],
};

const batchBRs: TestParameter = {
  id: "RS",
  name: "RS",
  methodType: "HPLC",
  status: "NotStarted",
  qmsPncStatus: QMS_NOT_APPLICABLE,
  sections: [
    {
      type: "chemicals",
      applicable: true,
      status: "NotStarted",
      recordNote: "3 chemicals — all match specification",
      expectedEntries: [
        { id: "B-RS-EXP-CHEM-1", label: "Acetonitrile HPLC grade", matchedEntryId: "B-RS-CHEM-1" },
        { id: "B-RS-EXP-CHEM-2", label: "Water HPLC grade", matchedEntryId: "B-RS-CHEM-2" },
        { id: "B-RS-EXP-CHEM-3", label: "Phosphate buffer", matchedEntryId: "B-RS-CHEM-3" },
      ],
      actualEntries: [
        {
          id: "B-RS-CHEM-1",
          label: "Acetonitrile HPLC grade",
          value: "ACN-2024-441 · 500ml",
          status: "ok",
          details: {
            Chemical: "Acetonitrile HPLC grade",
            Lot: "ACN-2024-441",
            Quantity: "500ml",
            Expected: "Acetonitrile HPLC grade — required by specification",
            Actual: "Acetonitrile HPLC grade — Lot ACN-2024-441 — 500ml",
          },
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-RS-CHEM-2",
          label: "Water HPLC grade",
          value: "WTR-2024-112 · 500ml",
          status: "ok",
          details: {
            Chemical: "Water HPLC grade",
            Lot: "WTR-2024-112",
            Quantity: "500ml",
            Expected: "Water HPLC grade — required by specification",
            Actual: "Water HPLC grade — Lot WTR-2024-112 — 500ml",
          },
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-RS-CHEM-3",
          label: "Phosphate buffer",
          value: "PB-2024-089 · 200ml",
          status: "ok",
          details: {
            Chemical: "Phosphate buffer",
            Lot: "PB-2024-089",
            Quantity: "200ml",
            Expected: "Phosphate buffer — required by specification",
            Actual: "Phosphate buffer — Lot PB-2024-089 — 200ml",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    {
      type: "chromatographySystem",
      applicable: true,
      status: "NotStarted",
      recordNote: "HPLC-001 only — active, within range",
      actualEntries: [
        {
          id: "B-RS-SYS-1",
          label: "HPLC-001",
          value: "Waters Alliance e2695 · 15:05 to 18:40",
          status: "ok",
          details: {
            "System ID": "HPLC-001",
            Instrument: "Waters Alliance e2695",
            "Calibration Status": "Calibrated",
            "Calibration Due": "31-Dec-2026",
            "Usage Start": "30-Jul-2026 15:05",
            "Usage End": "30-Jul-2026 18:40",
            Expected: "One system per test, calibrated and in date",
            Actual: "Single system used — HPLC-001",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    {
      type: "standards",
      applicable: true,
      status: "NotStarted",
      recordNote: "RS-AMOX-2024-12 active and unexpired",
      expectedEntries: [
        {
          id: "B-RS-EXP-STD-1",
          label: "Reference standard",
          requirement: "Active, expiry on or after 30-Jul-2026",
          matchedEntryId: "B-RS-STD-1",
        },
      ],
      actualEntries: [
        {
          id: "B-RS-STD-1",
          label: "Reference Standard RS-AMOX-2024-12",
          value: "Active · Expiry 15-Dec-2026",
          status: "ok",
          details: {
            "Reference Standard": "RS-AMOX-2024-12",
            Status: "Active",
            Expiry: "15-Dec-2026",
            "Analysis date": "30-Jul-2026",
            Expected: "Active, not expired",
            Actual: "Active, 138 days before expiry",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    {
      type: "instruments",
      applicable: true,
      status: "NotStarted",
      recordNote: "All instruments active and calibrated",
      actualEntries: [
        {
          id: "B-RS-INS-1",
          label: "BAL-2024-003",
          value: "Weighing Balance · Active, calibrated",
          status: "ok",
          details: {
            "Instrument ID": "BAL-2024-003",
            Type: "Weighing Balance",
            Status: "Active, calibrated",
            Expected: "Weighing Balance BAL-2024-003 — active and within calibration",
            Actual: "BAL-2024-003 — active, calibration current",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    {
      type: "column",
      applicable: true,
      status: "NotStarted",
      recordNote: "Same SST failure and over-limit column as Assay",
      contextSummary:
        "COL-2024-09 · 31 test injections · 412 cumulative · limit 400 · Used 30-Jul 15:05 to 18:40",
      contextNote:
        "Same SST failure as Assay. Column used for both tests on 30-Jul-2026.",
      expectedEntries: [...sstExpected("B-RS"), overLimitExpected("B-RS")],
      actualEntries: [
        ...sstEntries("B-RS", {
          plateCount: "4790",
          tailing: "1.45",
          resolution: "1.18",
          resolutionFails: true,
        }),
        overLimitEntry("B-RS"),
      ],
    },
  ],
};

const batchBDisso: TestParameter = {
  id: "DISSO",
  name: "Disso",
  methodType: "UV",
  status: "NotStarted",
  qmsPncStatus: QMS_NOT_APPLICABLE,
  sections: [
    {
      type: "chemicals",
      applicable: true,
      status: "NotStarted",
      recordNote: "2 chemicals — all match specification",
      expectedEntries: [
        { id: "B-DISSO-EXP-CHEM-1", label: "Buffer pH 6.8", matchedEntryId: "B-DISSO-CHEM-1" },
        { id: "B-DISSO-EXP-CHEM-2", label: "Water HPLC grade", matchedEntryId: "B-DISSO-CHEM-2" },
      ],
      actualEntries: [
        {
          id: "B-DISSO-CHEM-1",
          label: "Buffer pH 6.8",
          value: "BUF-2024-067 · 2000ml",
          status: "ok",
          details: {
            Chemical: "Buffer pH 6.8",
            Lot: "BUF-2024-067",
            Quantity: "2000ml",
            Expected: "Buffer pH 6.8 — required by specification",
            Actual: "Buffer pH 6.8 — Lot BUF-2024-067 — 2000ml",
          },
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-DISSO-CHEM-2",
          label: "Water HPLC grade",
          value: "WTR-2024-112 · 1000ml",
          status: "ok",
          details: {
            Chemical: "Water HPLC grade",
            Lot: "WTR-2024-112",
            Quantity: "1000ml",
            Expected: "Water HPLC grade — required by specification",
            Actual: "Water HPLC grade — Lot WTR-2024-112 — 1000ml",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    naSection(
      "chromatographySystem",
      "Dissolution uses UV detection. No chromatography system involved.",
    ),
    {
      type: "standards",
      applicable: true,
      status: "NotStarted",
      recordNote: "RS-2024-18 active and unexpired",
      expectedEntries: [
        {
          id: "B-DISSO-EXP-STD-1",
          label: "Reference standard",
          requirement: "Active, expiry on or after 30-Jul-2026",
          matchedEntryId: "B-DISSO-STD-1",
        },
      ],
      actualEntries: [
        {
          id: "B-DISSO-STD-1",
          label: "Reference Standard RS-2024-18",
          value: "Active · Expiry 30-Nov-2026",
          status: "ok",
          details: {
            "Reference Standard": "RS-2024-18",
            Status: "Active",
            Expiry: "30-Nov-2026",
            "Analysis date": "30-Jul-2026",
            Expected: "Active, not expired",
            Actual: "Active, 123 days before expiry",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    {
      type: "instruments",
      applicable: true,
      status: "NotStarted",
      recordNote: "All instruments active and calibrated",
      actualEntries: [
        {
          id: "B-DISSO-INS-1",
          label: "DA-2024-001",
          value: "Dissolution Apparatus · Active, calibrated",
          status: "ok",
          details: {
            "Instrument ID": "DA-2024-001",
            Type: "Dissolution Apparatus",
            Status: "Active, calibrated",
            Expected: "Dissolution Apparatus DA-2024-001 — active and within calibration",
            Actual: "DA-2024-001 — active, calibration current",
          },
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-DISSO-INS-2",
          label: "THM-2024-001",
          value: "Thermometer · Active, calibrated",
          status: "ok",
          details: {
            "Instrument ID": "THM-2024-001",
            Type: "Thermometer",
            Status: "Active, calibrated",
            Expected: "Thermometer THM-2024-001 — active and within calibration",
            Actual: "THM-2024-001 — active, calibration current",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    naSection(
      "column",
      "Dissolution uses UV detection. No chromatography column involved.",
    ),
  ],
};

const batchBKf: TestParameter = {
  id: "KF",
  name: "KF",
  methodType: "Titration",
  status: "NotStarted",
  qmsPncStatus: QMS_NOT_APPLICABLE,
  sections: [
    {
      type: "chemicals",
      applicable: true,
      status: "NotStarted",
      recordNote: "KF reagent expiry in 31 days",
      expectedEntries: [
        { id: "B-KF-EXP-CHEM-1", label: "Karl Fischer Reagent", matchedEntryId: "B-KF-CHEM-1" },
        { id: "B-KF-EXP-CHEM-2", label: "Methanol HPLC grade", matchedEntryId: "B-KF-CHEM-2" },
      ],
      actualEntries: [
        {
          id: "B-KF-CHEM-1",
          label: "Karl Fischer Reagent",
          value: "KFR-2024-023 · Expiry 31-Aug-2026",
          status: "advisory",
          severity: "Advisory",
          details: {
            Chemical: "Karl Fischer Reagent",
            Lot: "KFR-2024-023",
            Expiry: "31-Aug-2026",
            "Days remaining": "31",
            Status: "Active — within expiry",
            Expected: "Karl Fischer Reagent — required by specification, within expiry",
            Actual: "Karl Fischer Reagent — Lot KFR-2024-023 — expiry 31-Aug-2026",
          },
          advisory: "Expiry within 30 days. Plan re-order.",
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-KF-CHEM-2",
          label: "Methanol HPLC grade",
          value: "MET-2024-221 · Expiry 30-Sep-2026",
          status: "ok",
          details: {
            Chemical: "Methanol HPLC grade",
            Lot: "MET-2024-221",
            Expiry: "30-Sep-2026",
            Status: "Active — within expiry",
            Expected: "Methanol HPLC grade — required by specification, within expiry",
            Actual: "Methanol HPLC grade — Lot MET-2024-221 — expiry 30-Sep-2026",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    naSection(
      "chromatographySystem",
      "Karl Fischer is a titration method. No chromatography system involved.",
    ),
    {
      type: "standards",
      applicable: true,
      status: "NotStarted",
      recordNote: "WST-2024-044 active",
      expectedEntries: [
        {
          id: "B-KF-EXP-STD-1",
          label: "Water standard",
          requirement: "Active, expiry on or after 30-Jul-2026",
          matchedEntryId: "B-KF-STD-1",
        },
      ],
      actualEntries: [
        {
          id: "B-KF-STD-1",
          label: "Water Standard WST-2024-044",
          value: "Active · Expiry 31-Dec-2026",
          status: "ok",
          details: {
            "Water Standard": "WST-2024-044",
            Status: "Active",
            Expiry: "31-Dec-2026",
            "Analysis date": "30-Jul-2026",
            Expected: "Active, not expired",
            Actual: "Active, 154 days before expiry",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    {
      type: "instruments",
      applicable: true,
      status: "NotStarted",
      recordNote: "All instruments active and calibrated",
      actualEntries: [
        {
          id: "B-KF-INS-1",
          label: "KFT-2024-001",
          value: "Karl Fischer Titrator · Active, calibrated",
          status: "ok",
          details: {
            "Instrument ID": "KFT-2024-001",
            Type: "Karl Fischer Titrator",
            Status: "Active, calibrated",
            Expected: "Karl Fischer Titrator KFT-2024-001 — active and within calibration",
            Actual: "KFT-2024-001 — active, calibration current",
          },
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-KF-INS-2",
          label: "BAL-2024-003",
          value: "Weighing Balance · Active, calibrated",
          status: "ok",
          dataAvailable: true,
          details: {
            "Instrument ID": "BAL-2024-003",
            Type: "Weighing Balance",
            Status: "Active, calibrated",
            Expected: "Weighing Balance BAL-2024-003 — active and within calibration",
            Actual: "BAL-2024-003 — active, calibration current",
          },
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-KF-INS-3",
          label: "pH-Meter-001",
          value: "pH Meter · No LIMS record",
          status: "ok",
          dataAvailable: false,
          observationGapMessage:
            "pH meter not configured in LIMS. Verify usage in physical logbook as per current practice.",
          details: {
            "Instrument ID": "pH-Meter-001",
            Type: "pH Meter",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    naSection(
      "column",
      "Karl Fischer is a titration method. No chromatography column involved.",
    ),
  ],
};

const batchBGc: TestParameter = {
  id: "GC",
  name: "GC",
  methodType: "GC",
  status: "NotStarted",
  qmsPncStatus: QMS_NOT_APPLICABLE,
  sections: [
    {
      type: "chemicals",
      applicable: true,
      status: "NotStarted",
      recordNote: "2 chemicals — all match specification",
      expectedEntries: [
        { id: "B-GC-EXP-CHEM-1", label: "DMSO", matchedEntryId: "B-GC-CHEM-1" },
        { id: "B-GC-EXP-CHEM-2", label: "Water HPLC grade", matchedEntryId: "B-GC-CHEM-2" },
      ],
      actualEntries: [
        {
          id: "B-GC-CHEM-1",
          label: "DMSO",
          value: "DMS-2024-011 · 500ml",
          status: "ok",
          details: {
            Chemical: "DMSO",
            Lot: "DMS-2024-011",
            Quantity: "500ml",
            Expected: "DMSO — required by specification",
            Actual: "DMSO — Lot DMS-2024-011 — 500ml",
          },
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-GC-CHEM-2",
          label: "Water HPLC grade",
          value: "WTR-2024-112 · 250ml",
          status: "ok",
          details: {
            Chemical: "Water HPLC grade",
            Lot: "WTR-2024-112",
            Quantity: "250ml",
            Expected: "Water HPLC grade — required by specification",
            Actual: "Water HPLC grade — Lot WTR-2024-112 — 250ml",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    {
      type: "chromatographySystem",
      applicable: true,
      status: "NotStarted",
      recordNote: "GC-2024-001 only — active, within range",
      actualEntries: [
        {
          id: "B-GC-SYS-1",
          label: "GC-2024-001",
          value: "Agilent 7890B GC system · 09:10 to 12:25",
          status: "ok",
          details: {
            "System ID": "GC-2024-001",
            Instrument: "Agilent 7890B",
            "System type": "Gas chromatography system",
            "Calibration Status": "Calibrated",
            "Calibration Due": "31-Dec-2026",
            "Usage Start": "30-Jul-2026 09:10",
            "Usage End": "30-Jul-2026 12:25",
            Expected: "One system per test, calibrated and in date",
            Actual: "Single system used — GC-2024-001",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    {
      type: "standards",
      applicable: true,
      status: "NotStarted",
      recordNote: "RS-GC-2024-008 active and unexpired",
      expectedEntries: [
        {
          id: "B-GC-EXP-STD-1",
          label: "Reference standard",
          requirement: "Active, expiry on or after 30-Jul-2026",
          matchedEntryId: "B-GC-STD-1",
        },
      ],
      actualEntries: [
        {
          id: "B-GC-STD-1",
          label: "Reference Standard RS-GC-2024-008",
          value: "Active · Expiry 28-Feb-2027",
          status: "ok",
          details: {
            "Reference Standard": "RS-GC-2024-008",
            Status: "Active",
            Expiry: "28-Feb-2027",
            "Analysis date": "30-Jul-2026",
            Expected: "Active, not expired",
            Actual: "Active, 213 days before expiry",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    {
      type: "instruments",
      applicable: true,
      status: "NotStarted",
      recordNote: "All instruments active and calibrated",
      actualEntries: [
        {
          id: "B-GC-INS-1",
          label: "BAL-2024-003",
          value: "Weighing Balance · from 12:45",
          status: "ok",
          dataAvailable: true,
          details: {
            "Instrument ID": "BAL-2024-003",
            Type: "Weighing Balance",
            Status: "Active, calibrated",
            "Usage Start": "30-Jul-2026 12:45",
            Expected: "Weighing Balance BAL-2024-003 — active and within calibration",
            Actual: "BAL-2024-003 — active, calibration current",
          },
          sourceLabel: SOURCE_LABEL,
        },
        {
          id: "B-GC-INS-2",
          label: "HS-2024-001",
          value: "Headspace Sampler · 13:00 to 15:30",
          status: "ok",
          dataAvailable: true,
          details: {
            "Instrument ID": "HS-2024-001",
            Type: "Headspace Sampler",
            Status: "Active, calibrated",
            "Usage Start": "30-Jul-2026 13:00",
            "Usage End": "30-Jul-2026 15:30",
            Expected: "Headspace Sampler HS-2024-001 — active and within calibration",
            Actual: "HS-2024-001 — active, calibration current",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
    {
      type: "column",
      applicable: true,
      status: "NotStarted",
      recordNote: "GCC-2024-003 — 220 of 500 injections",
      expectedEntries: [
        {
          id: "B-GC-EXP-COL-1",
          label: "Column injection count",
          requirement: "Count <= 500",
          matchedEntryId: "B-GC-COL-1",
        },
      ],
      actualEntries: [
        {
          id: "B-GC-COL-1",
          label: "GCC-2024-003",
          value: "220 of 500 injections",
          status: "ok",
          details: {
            Column: "GCC-2024-003",
            Type: "DB-624",
            Expected: "Count <= 500",
            Actual: "220 injections",
            Remaining: "280 injections",
            Status: "Within qualified limit",
          },
          sourceLabel: SOURCE_LABEL,
        },
      ],
    },
  ],
};

const batchB: Batch = {
  arNumber: "AR-2026-000122",
  batchNumber: "ABF-2026-122",
  product: "Amoxicillin 250mg",
  analyst: "Priya Sharma",
  reviewerName: "Shrikrishna",
  submittedAt: "30-Jul-2026 16:00",
  analysisDate: "30-Jul-2026",
  sessionStatus: "New",
  activityLabel: "Not yet reviewed",
  slaByProfile: {
    "shrikrishna-site": {
      deadline: "03-Aug-2026 16:00",
      status: "WithinSla",
      detail: "Due today",
    },
    "lupin-cipla": {
      deadline: "31-Jul-2026 16:00",
      status: "Overdue",
      detail: "1 working day past due",
      daysOverdue: 1,
    },
  },
  tests: [batchBAssay, batchBRs, batchBDisso, batchBKf, batchBGc],
};

/* ========================================================================== */
/* BATCH C — AR-2026-000123 — Metformin 500mg                                */
/* Pause and resume. Assay only, paused at the Column section.               */
/* ========================================================================== */

const batchC: Batch = {
  arNumber: "AR-2026-000123",
  batchNumber: "ABF-2026-123",
  product: "Metformin 500mg",
  analyst: "Amit Patel",
  reviewerName: "Shrikrishna",
  submittedAt: "29-Jul-2026 14:00",
  analysisDate: "29-Jul-2026",
  sessionStatus: "Paused",
  activityLabel: "Paused 31-Jul-2026 17:35",
  slaByProfile: {
    "shrikrishna-site": {
      deadline: "31-Jul-2026 14:00",
      status: "Overdue",
      detail: "1 working day past due",
      daysOverdue: 1,
    },
    "lupin-cipla": {
      deadline: "30-Jul-2026 14:00",
      status: "Overdue",
      detail: "2 working days past due",
      daysOverdue: 2,
    },
  },
  sessionState: {
    currentTestId: "ASSAY",
    currentSectionType: "column",
    reviewerNotes:
      "SLA overdue due to analyst leave — confirmed with QA Manager. Proceeding with review.",
    sectionStatuses: {
      chemicals: "Reviewed",
      chromatographySystem: "Reviewed",
      standards: "Reviewed",
      instruments: "Reviewed",
      column: "NotStarted",
    },
  },
  tests: [
    {
      id: "ASSAY",
      name: "Assay",
      methodType: "HPLC",
      status: "Paused",
      qmsPncStatus: QMS_NOT_APPLICABLE,
      sections: [
        {
          type: "chemicals",
          applicable: true,
          status: "NotStarted",
          recordNote: "3 chemicals — all match specification",
          expectedEntries: [
            { id: "C-ASSAY-EXP-CHEM-1", label: "Water HPLC grade", matchedEntryId: "C-ASSAY-CHEM-1" },
            { id: "C-ASSAY-EXP-CHEM-2", label: "Methanol HPLC grade", matchedEntryId: "C-ASSAY-CHEM-2" },
            { id: "C-ASSAY-EXP-CHEM-3", label: "Phosphate buffer", matchedEntryId: "C-ASSAY-CHEM-3" },
          ],
          actualEntries: [
            {
              id: "C-ASSAY-CHEM-1",
              label: "Water HPLC grade",
              value: "WTR-2024-112 · 1000ml",
              status: "ok",
              details: {
                Chemical: "Water HPLC grade",
                Lot: "WTR-2024-112",
                Quantity: "1000ml",
                Expected: "Water HPLC grade — required by specification",
                Actual: "Water HPLC grade — Lot WTR-2024-112 — 1000ml",
              },
              sourceLabel: SOURCE_LABEL,
            },
            {
              id: "C-ASSAY-CHEM-2",
              label: "Methanol HPLC grade",
              value: "MET-2024-221 · 500ml",
              status: "ok",
              details: {
                Chemical: "Methanol HPLC grade",
                Lot: "MET-2024-221",
                Quantity: "500ml",
                Expected: "Methanol HPLC grade — required by specification",
                Actual: "Methanol HPLC grade — Lot MET-2024-221 — 500ml",
              },
              sourceLabel: SOURCE_LABEL,
            },
            {
              id: "C-ASSAY-CHEM-3",
              label: "Phosphate buffer",
              value: "PB-2024-089 · 200ml",
              status: "ok",
              details: {
                Chemical: "Phosphate buffer",
                Lot: "PB-2024-089",
                Quantity: "200ml",
                Expected: "Phosphate buffer — required by specification",
                Actual: "Phosphate buffer — Lot PB-2024-089 — 200ml",
              },
              sourceLabel: SOURCE_LABEL,
            },
          ],
        },
        {
          type: "chromatographySystem",
          applicable: true,
          status: "NotStarted",
          recordNote: "HPLC-001 only — active, within range",
          actualEntries: [
            {
              id: "C-ASSAY-SYS-1",
              label: "HPLC-001",
              value: "Waters Alliance e2695 · 09:48 to 17:02",
              status: "ok",
              details: {
                "System ID": "HPLC-001",
                Instrument: "Waters Alliance e2695",
                "Usage start": "29-Jul-2026 09:48",
                "Usage end": "29-Jul-2026 17:02",
                Status: "Active, within range",
                Expected: "One system per test, active and within range",
                Actual: "Single system used — HPLC-001",
              },
              sourceLabel: SOURCE_LABEL,
            },
          ],
        },
        {
          type: "standards",
          applicable: true,
          status: "NotStarted",
          recordNote: "WS-2024-39 and RS-2024-18 active and unexpired",
          expectedEntries: [
            {
              id: "C-ASSAY-EXP-STD-1",
              label: "Working standard",
              requirement: "Active, expiry on or after 29-Jul-2026",
              matchedEntryId: "C-ASSAY-STD-1",
            },
            {
              id: "C-ASSAY-EXP-STD-2",
              label: "Reference standard",
              requirement: "Active, expiry on or after 29-Jul-2026",
              matchedEntryId: "C-ASSAY-STD-2",
            },
          ],
          actualEntries: [
            {
              id: "C-ASSAY-STD-1",
              label: "Working Standard WS-2024-39",
              value: "Active · Expiry 31-Oct-2026",
              status: "ok",
              details: {
                "Working Standard": "WS-2024-39",
                Status: "Active",
                Expiry: "31-Oct-2026",
                "Analysis date": "29-Jul-2026",
                Potency: "99.4%",
                Consumption: "50.2mg",
                Expected: "Active, not expired",
                Actual: "Active, 94 days before expiry",
              },
              sourceLabel: SOURCE_LABEL,
            },
            {
              id: "C-ASSAY-STD-2",
              label: "Reference Standard RS-2024-18",
              value: "Active · Expiry 30-Nov-2026",
              status: "ok",
              details: {
                "Reference Standard": "RS-2024-18",
                Status: "Active",
                Expiry: "30-Nov-2026",
                "Analysis date": "29-Jul-2026",
                Potency: "99.8%",
                Consumption: "10.0mg",
                Expected: "Active, not expired",
                Actual: "Active, 124 days before expiry",
              },
              sourceLabel: SOURCE_LABEL,
            },
          ],
        },
        {
          type: "instruments",
          applicable: true,
          status: "NotStarted",
          recordNote: "All instruments active and calibrated",
          actualEntries: [
            {
              id: "C-ASSAY-INS-1",
              label: "BAL-2024-003",
              value: "Weighing Balance · Active, calibrated",
              status: "ok",
              details: {
                "Instrument ID": "BAL-2024-003",
                Type: "Weighing Balance",
                Status: "Active, calibrated",
                Expected: "Weighing Balance BAL-2024-003 — active and within calibration",
                Actual: "BAL-2024-003 — active, calibration current",
              },
              sourceLabel: SOURCE_LABEL,
            },
            {
              id: "C-ASSAY-INS-2",
              label: "SON-2024-001",
              value: "Sonicator · Active",
              status: "ok",
              details: {
                "Instrument ID": "SON-2024-001",
                Type: "Sonicator",
                Status: "Active, calibrated",
                Expected: "Sonicator SON-2024-001 — active and within calibration",
                Actual: "SON-2024-001 — active, calibration current",
              },
              sourceLabel: SOURCE_LABEL,
            },
          ],
        },
        {
          type: "column",
          applicable: true,
          status: "NotStarted",
          recordNote: "COL-2024-07 — SST within method limits",
          contextSummary:
            "COL-2024-07 · 12 test injections · 380 cumulative · limit 400 · Used 29-Jul 09:48 to 17:02",
          expectedEntries: sstExpected("C-ASSAY"),
          actualEntries: sstEntries("C-ASSAY", {
            plateCount: "5200",
            tailing: "1.28",
            resolution: "2.35",
          }),
        },
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Exports and lookups                                                        */
/* -------------------------------------------------------------------------- */

/** All batches, in AR-number order — the order of the validation session. */
export const BATCHES: Batch[] = [batchA, batchB, batchC];

export function getBatch(arNumber: string): Batch | undefined {
  const needle = arNumber.trim().toUpperCase();
  return BATCHES.find((batch) => batch.arNumber.toUpperCase() === needle);
}

export function getTest(
  arNumber: string,
  testId: string,
): TestParameter | undefined {
  return getBatch(arNumber)?.tests.find((test) => test.id === testId);
}

export function getSection(
  arNumber: string,
  testId: string,
  type: SectionType,
): Section | undefined {
  return getTest(arNumber, testId)?.sections.find(
    (section) => section.type === type,
  );
}

export function getSlaProfile(id: SlaProfileId): SlaProfile {
  return SLA_PROFILES.find((profile) => profile.id === id) ?? SLA_PROFILES[0];
}

/** Sections a reviewer must actually work through — N/A sections excluded. */
export function applicableSections(test: TestParameter): Section[] {
  return test.sections.filter((section) => section.applicable);
}

/** The most serious severity present in a section, or undefined if compliant. */
export function sectionSeverity(section: Section): EntrySeverity | undefined {
  return SEVERITY_RANK.find((severity) =>
    section.actualEntries.some((entry) => entry.severity === severity),
  );
}

/** Label printed against a section in the Digital Review Record. */
export function sectionRecordLabel(section: Section): string {
  if (!section.applicable) return "N/A";
  const severity = sectionSeverity(section);
  return severity ? RECORD_LABELS[severity] : "COMPLIANT";
}
