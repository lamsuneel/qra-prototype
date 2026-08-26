import type {
  Batch,
  CheckItem,
  DetailField,
  Section,
  SourceSystem,
  TestParameter,
} from "@/types";

/**
 * Finished Product review data.
 *
 * All values are hardcoded. No database, no backend, no API.
 *
 * Confidence levels are marked per scenario:
 *   LEVEL A — confirmed by the design partner during discovery
 *   LEVEL C — confirm with site QA before pilot
 *   LEVEL D — demonstration scenario
 */

const LIMS: SourceSystem = "Caliber LIMS";
const EMPOWER: SourceSystem = "Waters Empower";

/* -------------------------------------------------------------------------- */
/* Item factories                                                             */
/* -------------------------------------------------------------------------- */

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${(seq += 1)}`;

interface CompliantSpec {
  label: string;
  reference?: string;
  statusText?: string;
  expected: string;
  actual: string;
  expectedSource?: string;
  source?: SourceSystem;
  /** Everything QRA read for this entry, shown when the row is expanded. */
  details?: DetailField[];
}

const compliant = (spec: CompliantSpec): CheckItem => ({
  id: nextId("item"),
  label: spec.label,
  reference: spec.reference,
  statusText: spec.statusText ?? "Active",
  expected: spec.expected,
  actual: spec.actual,
  expectedSource: spec.expectedSource,
  source: spec.source ?? LIMS,
  result: "COMPLIANT",
  details: spec.details,
});

interface FlaggedSpec {
  label: string;
  reference?: string;
  expected: string;
  actual: string;
  expectedSource: string;
  comparison: string;
  flagReason: string;
  flagAction: string;
  source?: SourceSystem;
}

const flagged = (spec: FlaggedSpec): CheckItem => ({
  id: nextId("item"),
  label: spec.label,
  reference: spec.reference,
  expected: spec.expected,
  actual: spec.actual,
  expectedSource: spec.expectedSource,
  source: spec.source ?? LIMS,
  result: "FLAGGED",
  comparison: spec.comparison,
  flagReason: spec.flagReason,
  flagAction: spec.flagAction,
});

const section = (
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
  status: "NOT_STARTED",
  items,
  ...extra,
});

/* -------------------------------------------------------------------------- */
/* Reusable compliant blocks                                                  */
/* -------------------------------------------------------------------------- */

const chemicalsCompliant = () => [
  compliant({
    label: "Acetonitrile HPLC grade",
    reference: "Lot AC-2024-0441",
    expected: "Active entry, within expiry — SOP-CHEM-003",
    actual: "Acetonitrile HPLC grade — Lot AC-2024-0441 — active, expiry 30-Nov-2026",
    expectedSource: "SOP-CHEM-003",
    details: [
      { label: "Lot number", value: "AC-2024-0441" },
      { label: "Manufacturer", value: "Merck" },
      { label: "Grade", value: "HPLC grade, gradient quality" },
      { label: "Quantity used", value: "500 mL" },
      { label: "Status in LIMS", value: "Active" },
      { label: "Expiry date", value: "30-Nov-2026" },
      { label: "Usage date", value: "30-Jul-2026 · 08:45 AM" },
      { label: "Inactivated entry", value: "None detected" },
    ],
  }),
  compliant({
    label: "Water for HPLC",
    reference: "Lot WH-2024-1102",
    expected: "Active entry, within expiry — SOP-CHEM-003",
    actual: "Water for HPLC — Lot WH-2024-1102 — active, expiry 31-Dec-2026",
    expectedSource: "SOP-CHEM-003",
    details: [
      { label: "Lot number", value: "WH-2024-1102" },
      { label: "Manufacturer", value: "Merck" },
      { label: "Grade", value: "HPLC grade, 0.22 micron filtered" },
      { label: "Quantity used", value: "2.0 L" },
      { label: "Status in LIMS", value: "Active" },
      { label: "Expiry date", value: "31-Dec-2026" },
      { label: "Usage date", value: "30-Jul-2026 · 08:20 AM" },
      { label: "Inactivated entry", value: "None detected" },
    ],
  }),
  compliant({
    label: "Potassium dihydrogen phosphate",
    reference: "Lot PH-2024-0892",
    expected: "Active entry, within expiry — SOP-CHEM-003",
    actual: "Potassium dihydrogen phosphate — Lot PH-2024-0892 — active, expiry 31-Oct-2026",
    expectedSource: "SOP-CHEM-003",
    details: [
      { label: "Lot number", value: "PH-2024-0892" },
      { label: "Manufacturer", value: "SD Fine-Chem" },
      { label: "Grade", value: "AR grade, 99.5 % assay" },
      { label: "Quantity used", value: "13.6 g" },
      { label: "Status in LIMS", value: "Active" },
      { label: "Expiry date", value: "31-Oct-2026" },
      { label: "Usage date", value: "30-Jul-2026 · 08:30 AM" },
      { label: "Inactivated entry", value: "None detected" },
    ],
  }),
];

const standardsCompliant = () => [
  compliant({
    label: "Working Standard — Amoxicillin",
    reference: "WS-2024-41",
    expected: "Active lot, expiry on or after analysis date — SOP-STD-002",
    actual: "WS-2024-41 — active, expiry 31-Oct-2026, potency 99.6%",
    expectedSource: "SOP-STD-002",
    details: [
      { label: "Standard number", value: "WS-2024-41" },
      { label: "Prepared from", value: "RS-2024-18, Amoxicillin USP Reference Standard" },
      { label: "Assigned potency", value: "99.6 % on the anhydrous basis" },
      { label: "Status in LIMS", value: "Active" },
      { label: "Expiry date", value: "31-Oct-2026" },
      { label: "First opened", value: "30-Jul-2026 · 08:05 AM" },
      { label: "Storage", value: "2 to 8 degrees C, desiccated" },
      { label: "Inactivated entry", value: "None detected" },
    ],
  }),
  compliant({
    label: "Reference Standard — Amoxicillin",
    reference: "RS-2024-18",
    expected: "Active lot, expiry on or after analysis date — SOP-STD-002",
    actual: "RS-2024-18 — active, expiry 30-Nov-2026, potency 99.8%",
    expectedSource: "SOP-STD-002",
    details: [
      { label: "Standard number", value: "RS-2024-18" },
      { label: "Origin", value: "United States Pharmacopeia, catalogue 1033005" },
      { label: "Assigned potency", value: "99.8 % on the anhydrous basis" },
      { label: "Status in LIMS", value: "Active" },
      { label: "Expiry date", value: "30-Nov-2026" },
      { label: "Certificate", value: "COA-USP-1033005-R09" },
      { label: "Storage", value: "2 to 8 degrees C, desiccated" },
      { label: "Inactivated entry", value: "None detected" },
    ],
  }),
  // LEVEL A — confirmed by the design partner during discovery.
  // Hygroscopic standards must be used within 24 hours of first opening.
  compliant({
    label: "Hygroscopic standard 24-hour window",
    reference: "WS-2024-41",
    statusText: "Within window",
    expected: "Used within 24 hours of first opening — SOP-STD-002 §6.2",
    actual: "First opened 30-Jul-2026 08:05, last used 30-Jul-2026 14:32 — 6h 27m",
    expectedSource: "SOP-STD-002 §6.2",
  }),
];

const instrumentsCompliant = () => [
  compliant({
    label: "Weighing Balance BAL-2024-003",
    reference: "Cal. due 10-Oct-2026",
    statusText: "Calibrated",
    expected: "Calibration due date after date of use — SOP-INST-004",
    actual: "BAL-2024-003 — calibrated, due 10-Oct-2026, used 08:00 to 08:45",
    expectedSource: "SOP-INST-004",
    details: [
      { label: "Instrument ID", value: "BAL-2024-003" },
      { label: "Make and model", value: "Mettler Toledo XPR205" },
      { label: "Location", value: "QC Wet Chemistry, Room 214" },
      { label: "Last calibrated", value: "10-Apr-2026" },
      { label: "Calibration due", value: "10-Oct-2026" },
      {
        label: "Daily verification",
        value: "Recorded 30-Jul-2026 · 07:52 AM, before first use",
      },
      { label: "Used for this test", value: "30-Jul-2026 · 08:00 AM to 08:45 AM" },
      { label: "Status in LIMS", value: "Active, no open maintenance" },
    ],
  }),
  compliant({
    label: "Sonicator SON-2024-001",
    reference: "Cal. due 22-Sep-2026",
    statusText: "Calibrated",
    expected: "Calibration due date after date of use — SOP-INST-004",
    actual: "SON-2024-001 — calibrated, due 22-Sep-2026, used 08:30 to 08:45",
    expectedSource: "SOP-INST-004",
  }),
  // LEVEL A — analyst qualification is checked as part of instrument review.
  compliant({
    label: "Analyst qualification — Priya Sharma",
    reference: "QUAL-2026-0114",
    statusText: "Qualified",
    expected: "Current qualification for the instrument used — SOP-INST-004 §3.1",
    actual: "Qualified for HPLC and balance operation, valid to 31-Mar-2027",
    expectedSource: "SOP-INST-004 §3.1",
  }),
];

const chromatographyCompliant = (systemId: string) => [
  compliant({
    label: `Chromatography system ${systemId}`,
    reference: "Waters Alliance e2695",
    statusText: "Calibrated",
    expected: "One system per test, calibrated and in date — SOP-HPLC-001",
    actual: `${systemId} — calibrated, due 31-Dec-2026, used 08:15 to 14:32`,
    expectedSource: "SOP-HPLC-001",
    source: EMPOWER,
  }),
  compliant({
    label: "System suitability — Tailing Factor",
    expected: "Not more than 2.0 — STP method limit",
    actual: "1.42",
    expectedSource: "SOP-HPLC-001",
    statusText: "Within limit",
    source: EMPOWER,
  }),
  compliant({
    label: "System suitability — Plate Count",
    expected: "Not less than 2000 — STP method limit",
    actual: "4850",
    expectedSource: "SOP-HPLC-001",
    statusText: "Within limit",
    source: EMPOWER,
  }),
  compliant({
    label: "System suitability — Resolution",
    expected: "Not less than 2.0 — STP method limit",
    actual: "3.20",
    expectedSource: "SOP-HPLC-001",
    statusText: "Within limit",
    source: EMPOWER,
  }),
];

const columnCompliant = (columnId: string, used: number, limit: number) => [
  compliant({
    label: `Column ${columnId}`,
    reference: "Waters Symmetry C18",
    statusText: "Qualified",
    expected: `Cumulative injections at or below ${limit} — SOP-COL-005`,
    actual: `${columnId} — ${used} cumulative injections, ${limit - used} remaining`,
    expectedSource: "SOP-HPLC-001 §8",
    source: EMPOWER,
  }),
];

/* -------------------------------------------------------------------------- */
/* Test parameters                                                            */
/* -------------------------------------------------------------------------- */

const FP_PARAMETERS: TestParameter[] = [
  {
    id: "assay",
    name: "Assay",
    shortName: "Assay",
    methodType: "HPLC",
    stpReference: "STP-AMX-ASSAY-003",
  },
  {
    id: "rs",
    name: "Related Substances",
    shortName: "RS",
    methodType: "HPLC",
    stpReference: "STP-AMX-RS-001",
  },
  {
    id: "disso",
    name: "Dissolution",
    shortName: "Disso",
    methodType: "UV",
    stpReference: "STP-AMX-DISSO-002",
  },
  {
    id: "kf",
    name: "KF Water Content",
    shortName: "KF",
    methodType: "Titration",
    stpReference: "STP-AMX-KF-001",
  },
  {
    id: "lcms",
    name: "Genotoxic Impurity",
    shortName: "LCMS",
    methodType: "LC-MS/MS",
    stpReference: "STP-AMX-LCMS-001",
  },
];

/* -------------------------------------------------------------------------- */
/* Standalone instrument audit trails                                         */
/* -------------------------------------------------------------------------- */

const TIAMO_AUDIT = `===========================================================
  TIAMO 2.4 — AUDIT TRAIL REPORT
  Instrument: KFA2004  ·  Station: QC-LAB-01
  Report Date: 30-Jul-2026 09:17:33
===========================================================

ANALYSIS DETAILS
Method:     STP-AMX-KF-001 v2.3
AR Number:  AR-2026-000122
Sample:     Amoxicillin 250mg Tablet — Batch AMX-2026-0341

ANALYST LOG
08:42:11  Login    PHARMA\\PriyaS    (Priya Sharma)
08:43:55  Method loaded: STP-AMX-KF-001
08:44:20  Sample ID entered: AMX-2026-0341

DETERMINATION 1
08:45:02  Titration started
08:47:19  Titration ended
          Consumption: 0.412 mL  ·  Factor: 4.823 mg/mL
          RESULT: 0.397% w/w     STATUS: VALID

INSTRUMENT ERROR — DETERMINATION 2 TRIGGERED
08:47:55  ERROR: Electrode conditioning unstable (drift > 0.5 ug/min)
08:48:10  Analyst comment: "Electrode reconditioning required per SOP-INST-004"
08:49:00  Reconditioning complete
08:49:22  Titration started — Determination 2
08:51:38  Titration ended
          Consumption: 0.426 mL  ·  Factor: 4.823 mg/mL
          RESULT: 0.410% w/w     STATUS: VALID

FINAL REPORTED RESULT
Determination 2 accepted per SOP-INST-004 §4.3
Water Content: 0.41% w/w  ·  Limit: NMT 0.50% w/w
                          WITHIN SPECIFICATION

ELECTRONIC SIGNATURE
09:15:04  Logout   PHARMA\\PriyaS    (Priya Sharma)
Signature ID: ES-2026-07-30-001   Hash: 7f3a9c2d...
===========================================================`;

const MASSLYNX_AUDIT = `===========================================================
  MASSLYNX 4.2 — AUDIT TRAIL REPORT
  Instrument: LCMS-8060  ·  Station: QC-LAB-03
  Report Date: 30-Jul-2026 16:04:11
===========================================================

ANALYSIS DETAILS
Method:     STP-AMX-LCMS-001 v1.6
AR Number:  AR-2026-000122
Sample:     Amoxicillin 250mg Tablet — Batch AMX-2026-0341
Analyte:    Methyl p-toluenesulphonate (MpTS)

ANALYST LOG
13:02:47  Login    PHARMA\\PriyaS    (Priya Sharma)
13:05:12  Method loaded: STP-AMX-LCMS-001
13:06:40  Calibration curve accepted  r2 = 0.9992

SYSTEM SUITABILITY
13:20:05  S/N ratio at LOQ: 24:1        LIMIT: NLT 10:1     WITHIN
13:20:05  RSD of 6 replicates: 3.1%     LIMIT: NMT 15.0%    WITHIN

SAMPLE ACQUISITION
14:11:22  Injection 1   MpTS  0.081 ppm
14:24:50  Injection 2   MpTS  0.079 ppm
14:38:16  Injection 3   MpTS  0.080 ppm
          MEAN: 0.080 ppm

LIMIT EVALUATION
ICH M7 permitted limit: 0.05 ppm
Reported result:        0.08 ppm
                        EXCEEDS PERMITTED LIMIT

OOS TRIGGERED
15:02:30  OOS raised: OOS-2026-0089
15:03:11  Analyst comment: "Result exceeds ICH M7 limit. Batch on hold."
15:40:00  Supervisor notified: Rajesh Kumar

ELECTRONIC SIGNATURE
16:02:55  Logout   PHARMA\\PriyaS    (Priya Sharma)
Signature ID: ES-2026-07-30-014   Hash: b21e7740...
===========================================================`;

/* -------------------------------------------------------------------------- */
/* Batch B — AR-2026-000122 — the primary demonstration batch                 */
/* -------------------------------------------------------------------------- */

const batchBSections: Section[] = [
  /* ---- Assay ---- */
  section("assay", "Chemicals", 1, [
    // LEVEL A — confirmed by the design partner. An inactivated entry that is
    // still visible in the method is the single most common finding.
    flagged({
      label: "Acetonitrile — inactivated entry detected",
      reference: "AC-7701",
      expected: "Active entries only — SOP-CHEM-003",
      actual: "Inactivated entry AC-7701 (Acetonitrile) present in the usage record",
      expectedSource: "SOP-CHEM-003",
      comparison: "QRA found an inactivated entry in the LIMS chemical audit trail",
      flagReason:
        "An inactivated chemical entry was used in the analysis. Inactivated entries are withdrawn from use and should not appear in the usage record.",
      flagAction:
        "Verify that inactivated entry AC-7701 has documented justification in LIMS before marking the Chemicals section as Reviewed. Check analyst comments and supervisor sign-off in the audit trail.",
    }),
    ...chemicalsCompliant(),
  ]),
  section("assay", "Standards", 2, standardsCompliant()),
  section("assay", "Instruments", 3, instrumentsCompliant()),
  section("assay", "Chromatography", 4, chromatographyCompliant("HPLC-001")),
  section("assay", "Column", 5, [
    // LEVEL A — column injection life is checked on every chromatographic test.
    flagged({
      label: "Column COL-2024-09 — injection limit exceeded",
      reference: "Waters Symmetry C18",
      expected: "Cumulative injections at or below 400 — SOP-HPLC-001 §8",
      actual: "COL-2024-09 — 412 cumulative injections, limit exceeded by 12",
      expectedSource: "SOP-HPLC-001 §8",
      comparison: "Cumulative count from Empower exceeds the qualified limit by 12 injections",
      flagReason:
        "The column has been used beyond its qualified injection life. Results obtained after the limit was exceeded may not be reliable.",
      flagAction:
        "Column must be retired or re-qualified before further use. Verify in Caliber LIMS whether the column was within limit for the specific injections used in this sample set.",
      source: EMPOWER,
    }),
  ]),

  /* ---- Related Substances ---- */
  section("rs", "Chemicals", 1, chemicalsCompliant()),
  section("rs", "Standards", 2, [
    compliant({
      label: "Reference Standard — Amoxicillin RS",
      reference: "RS-AMX-2024-12",
      expected: "Active lot, expiry on or after analysis date — SOP-STD-002",
      actual: "RS-AMX-2024-12 — active, expiry 15-Dec-2026",
      expectedSource: "SOP-STD-002",
    }),
  ]),
  section("rs", "Instruments", 3, instrumentsCompliant()),
  section("rs", "Chromatography", 4, chromatographyCompliant("HPLC-001")),
  section("rs", "Column", 5, columnCompliant("COL-2024-09", 412, 400).map((item) => ({
    ...item,
    result: "COMPLIANT" as const,
    actual: "COL-2024-09 — same column as Assay, flagged there",
    statusText: "See Assay",
  }))),

  /* ---- Dissolution ---- */
  section("disso", "Chemicals", 1, [
    compliant({
      label: "Buffer pH 6.8",
      reference: "Lot BUF-2024-067",
      expected: "Active entry, within expiry — SOP-CHEM-003",
      actual: "Buffer pH 6.8 — Lot BUF-2024-067 — active, expiry 30-Sep-2026",
      expectedSource: "SOP-CHEM-003",
    }),
    compliant({
      label: "Water for HPLC",
      reference: "Lot WH-2024-1102",
      expected: "Active entry, within expiry — SOP-CHEM-003",
      actual: "Water for HPLC — Lot WH-2024-1102 — active, expiry 31-Dec-2026",
      expectedSource: "SOP-CHEM-003",
    }),
  ]),
  section("disso", "Standards", 2, [
    compliant({
      label: "Reference Standard — Amoxicillin",
      reference: "RS-2024-18",
      expected: "Active lot, expiry on or after analysis date — SOP-STD-002",
      actual: "RS-2024-18 — active, expiry 30-Nov-2026",
      expectedSource: "SOP-STD-002",
    }),
  ]),
  section("disso", "Instruments", 3, [
    // LEVEL D — demonstration scenario. Principal instrument for dissolution.
    flagged({
      label: "UV Spectrophotometer UV-2024-02 — calibration overdue",
      reference: "Cal. due 01-Jul-2026",
      expected: "Calibration due date after date of use — SOP-INST-004",
      actual: "UV-2024-02 — calibration overdue since 01-Jul-2026, used 09:15 to 11:45",
      expectedSource: "SOP-INST-004",
      comparison: "Calibration due date precedes the analysis date by 29 days",
      flagReason:
        "UV Spectrophotometer calibration was overdue at time of analysis. Calibration due 01-Jul-2026, analysis performed 30-Jul-2026.",
      flagAction:
        "Verify in Caliber LIMS whether the instrument was re-calibrated before the sample set, and whether results require re-measurement.",
    }),
    compliant({
      label: "Dissolution Apparatus DA-2024-001",
      reference: "Cal. due 15-Nov-2026",
      statusText: "Calibrated",
      expected: "Calibration due date after date of use — SOP-INST-004",
      actual: "DA-2024-001 — calibrated, due 15-Nov-2026, used 08:30 to 14:00",
      expectedSource: "SOP-INST-004",
    }),
    compliant({
      label: "Weighing Balance BAL-2024-003",
      reference: "Cal. due 10-Oct-2026",
      statusText: "Calibrated",
      expected: "Calibration due date after date of use — SOP-INST-004",
      actual:
        "BAL-2024-003 — calibrated, used for tablet weighing before dissolution, 08:15 to 08:45",
      expectedSource: "SOP-INST-004",
    }),
  ]),

  /*
   * LEVEL A — the bath check at this site is written into the line logbook.
   * It sits in its own section so the reviewer sees at a glance that part of
   * the dissolution record is still on paper.
   */
  section(
    "disso",
    "Dissolution Bath — Logbook",
    4,
    [
      compliant({
        label: "Dissolution bath temperature and paddle speed",
        reference: "Checked at 0, 15 and 45 minutes",
        statusText: "Within limits",
        expected: "37 °C ± 0.5 °C and 50 rpm ± 4 % throughout the run — SOP-DISS-001 §6.2",
        actual:
          "36.9 °C / 37.1 °C / 37.0 °C and 50 rpm at each check, transcribed from logbook LB-2026-FP-014",
        expectedSource: "SOP-DISS-001 §6.2",
        source: "Paper Logbook",
      }),
      compliant({
        label: "Medium preparation and de-aeration",
        reference: "0.1 N HCl, 900 mL per vessel",
        statusText: "Verified",
        expected: "Medium de-aerated and volume verified before the run — SOP-DISS-001 §5.4",
        actual:
          "900 mL per vessel, de-aerated by vacuum filtration, verified at 08:20 and recorded in logbook LB-2026-FP-014",
        expectedSource: "SOP-DISS-001 §5.4",
        source: "Paper Logbook",
      }),
    ],
    {
      paperLogbook: {
        reference: "Logbook LB-2026-FP-014",
        page: "Page 22",
        description: "Dissolution bath check — read from the panel and recorded by hand",
        note: "The bath on this line has no data link to LIMS and keeps no audit trail of its own, so medium temperature and paddle speed are written into the line logbook at each check point.",
      },
    },
  ),

  /* ---- KF Water Content ---- */
  section("kf", "Chemicals", 1, [
    compliant({
      label: "Karl Fischer Reagent",
      reference: "Lot KFR-2024-023",
      expected: "Active entry, within expiry — SOP-CHEM-003",
      actual: "Karl Fischer Reagent — Lot KFR-2024-023 — active, expiry 31-Aug-2026",
      expectedSource: "SOP-CHEM-003",
    }),
    compliant({
      label: "Methanol anhydrous",
      reference: "Lot MET-2024-221",
      expected: "Active entry, within expiry — SOP-CHEM-003",
      actual: "Methanol anhydrous — Lot MET-2024-221 — active, expiry 30-Sep-2026",
      expectedSource: "SOP-CHEM-003",
    }),
  ]),
  section("kf", "Standards", 2, [
    compliant({
      label: "Water Standard WST-2024-044",
      reference: "WST-2024-044",
      expected: "Active lot, expiry on or after analysis date — SOP-STD-002",
      actual: "WST-2024-044 — active, expiry 31-Dec-2026",
      expectedSource: "SOP-STD-002",
    }),
  ]),
  section("kf", "Instruments", 3, [
    compliant({
      label: "Karl Fischer Titrator KFT-2024-001",
      reference: "Cal. due 30-Nov-2026",
      statusText: "Calibrated",
      expected: "Calibration due date after date of use — SOP-INST-004",
      actual: "KFT-2024-001 — calibrated, due 30-Nov-2026, used 08:45 to 08:52",
      expectedSource: "SOP-INST-004",
      source: "Tiamo 2.4",
    }),
    compliant({
      label: "Weighing Balance BAL-2024-003",
      reference: "Cal. due 10-Oct-2026",
      statusText: "Calibrated",
      expected: "Calibration due date after date of use — SOP-INST-004",
      actual: "BAL-2024-003 — calibrated, due 10-Oct-2026, used 08:30 to 08:44",
      expectedSource: "SOP-INST-004",
    }),
  ]),
  // LEVEL A — confirmed by the design partner. The Tiamo titrator writes its
  // own audit trail, exported as PDF and reviewed outside LIMS today.
  section(
    "kf",
    "KF Titrator",
    4,
    [
      flagged({
        label: "Determinations — excess reanalysis",
        expected: "1 determination per STP-AMX-KF-001",
        actual: "2 determinations performed",
        expectedSource: "STP-AMX-KF-001",
        comparison:
          "Instrument audit trail records 2 titrations; the STP permits 1 unless an instrument error is documented",
        flagReason:
          "A second determination was performed. STP-AMX-KF-001 permits one determination unless an instrument error is documented in the audit trail.",
        flagAction:
          "Confirm the second determination is justified and documented. The audit trail records an electrode conditioning error before Determination 2 — verify this satisfies SOP-INST-004 §4.3.",
        source: "Tiamo 2.4",
      }),
      compliant({
        label: "Result — Karl Fischer Titration",
        statusText: "Within specification",
        expected: "Not more than 0.50% w/w — STP-AMX-KF-001",
        actual: "0.41% w/w",
        expectedSource: "STP-AMX-KF-001",
        source: "Tiamo 2.4",
      }),
    ],
    {
      standaloneInstrument: {
        name: "Tiamo",
        source: "Tiamo 2.4",
        version: "2.4",
        analyst: "Priya Sharma",
        loginAt: "08:42 AM · 30-Jul-2026",
        logoutAt: "09:15 AM · 30-Jul-2026",
        pdfFilename: "Tiamo_KFA2004_AR2026000122_20260730.pdf",
        auditTrail: TIAMO_AUDIT,
      },
    },
  ),

  /* ---- LCMS Genotoxic Impurity ---- */
  section("lcms", "Chemicals", 1, [
    compliant({
      label: "Acetonitrile LC-MS grade",
      reference: "Lot ACM-2024-018",
      expected: "Active entry, within expiry — SOP-CHEM-003",
      actual: "Acetonitrile LC-MS grade — Lot ACM-2024-018 — active, expiry 31-Jan-2027",
      expectedSource: "SOP-CHEM-003",
    }),
    compliant({
      label: "Formic acid LC-MS grade",
      reference: "Lot FMA-2024-007",
      expected: "Active entry, within expiry — SOP-CHEM-003",
      actual: "Formic acid LC-MS grade — Lot FMA-2024-007 — active, expiry 30-Nov-2026",
      expectedSource: "SOP-CHEM-003",
    }),
  ]),
  section("lcms", "Standards", 2, [
    compliant({
      label: "MpTS Reference Standard",
      reference: "RS-MPTS-2024-03",
      expected: "Active lot, expiry on or after analysis date — SOP-STD-002",
      actual: "RS-MPTS-2024-03 — active, expiry 28-Feb-2027",
      expectedSource: "SOP-STD-002",
      source: "MassLynx",
    }),
  ]),
  section("lcms", "Instruments", 3, [
    compliant({
      label: "LC-MS/MS LCMS-8060",
      reference: "Cal. due 15-Dec-2026",
      statusText: "Calibrated",
      expected: "Calibration due date after date of use — SOP-INST-004",
      actual: "LCMS-8060 — calibrated, due 15-Dec-2026, used 13:02 to 16:02",
      expectedSource: "SOP-INST-004",
      source: "MassLynx",
    }),
  ]),
  // LEVEL A — confirmed by the design partner. The genotoxic impurity OOS is
  // the scenario that most clearly shows why review-by-exception matters.
  section(
    "lcms",
    "LCMS System",
    4,
    [
      flagged({
        label: "Methyl p-toluenesulphonate — exceeds ICH M7 limit",
        reference: "OOS-2026-0089",
        expected: "Not more than 0.05 ppm — ICH M7 permitted daily exposure",
        actual: "0.08 ppm (mean of 3 injections: 0.081, 0.079, 0.080)",
        expectedSource: "ICH M7",
        comparison: "Reported result exceeds the ICH M7 permitted limit by 0.03 ppm",
        flagReason:
          "Genotoxic impurity result 0.08 ppm exceeds the ICH M7 permitted limit of 0.05 ppm. OOS investigation OOS-2026-0089 has been initiated and the batch is on hold.",
        flagAction:
          "Do not progress the batch disposition until OOS-2026-0089 is closed. Confirm the investigation reference, the hold status, and that the supervisor has been notified.",
        source: "MassLynx",
      }),
      compliant({
        label: "System suitability — signal to noise at LOQ",
        statusText: "Within limit",
        expected: "Not less than 10:1 — STP-AMX-LCMS-001",
        actual: "24:1",
        expectedSource: "STP-AMX-LCMS-001",
        source: "MassLynx",
      }),
      compliant({
        label: "System suitability — RSD of 6 replicates",
        statusText: "Within limit",
        expected: "Not more than 15.0% — STP-AMX-LCMS-001",
        actual: "3.1%",
        expectedSource: "STP-AMX-LCMS-001",
        source: "MassLynx",
      }),
      compliant({
        label: "Calibration curve linearity",
        statusText: "Within limit",
        expected: "r2 not less than 0.995 — STP-AMX-LCMS-001",
        actual: "r2 = 0.9992",
        expectedSource: "STP-AMX-LCMS-001",
        source: "MassLynx",
      }),
    ],
    {
      standaloneInstrument: {
        name: "MassLynx",
        source: "MassLynx",
        version: "4.2",
        analyst: "Priya Sharma",
        loginAt: "01:02 PM · 30-Jul-2026",
        logoutAt: "04:02 PM · 30-Jul-2026",
        pdfFilename: "MassLynx_LCMS8060_AR2026000122_20260730.pdf",
        auditTrail: MASSLYNX_AUDIT,
      },
    },
  ),
];

const batchB: Batch = {
  id: "AR-2026-000122",
  arNumber: "AR-2026-000122",
  product: "Amoxicillin 250mg Tablet",
  batchNumber: "AMX-2026-0341",
  domain: "FINISHED_PRODUCT",
  specVersion: "v3.2",
  specCurrent: true,
  slaDeadline: "03-Aug-2026 16:00",
  slaStatus: "green",
  slaLabel: "Within SLA",
  status: "NEEDS_REVIEW",
  assignedTo: "arjun-mehta",
  analyst: "Priya Sharma",
  lastActivity: "09:12 AM today",
  parameters: FP_PARAMETERS,
  sections: batchBSections,
  dataSources: [LIMS, EMPOWER, "Tiamo 2.4", "MassLynx"],
};

/* -------------------------------------------------------------------------- */
/* Batch A and Batch C — lighter Finished Product batches                     */
/* -------------------------------------------------------------------------- */

const assayOnly: TestParameter[] = [FP_PARAMETERS[0]];

const cleanAssaySections = (columnId: string, used: number): Section[] => [
  section("assay", "Chemicals", 1, chemicalsCompliant()),
  section("assay", "Standards", 2, standardsCompliant()),
  section("assay", "Instruments", 3, instrumentsCompliant()),
  section("assay", "Chromatography", 4, chromatographyCompliant("HPLC-001")),
  section("assay", "Column", 5, columnCompliant(columnId, used, 400)),
];

/**
 * LEVEL D — Batch A arrives already submitted, so the approver queue is never
 * empty on a cold start. Priya reviewed it, documented one exception and sent
 * it to Rajesh; every section is therefore already marked as reviewed.
 */
const batchASections: Section[] = [
  section("assay", "Chemicals", 1, chemicalsCompliant(), { status: "REVIEWED" }),
  section("assay", "Standards", 2, standardsCompliant(), { status: "REVIEWED" }),
  section(
    "assay",
    "Instruments",
    3,
    [
      compliant({
        label: "Weighing Balance BAL-2024-003",
        reference: "Cal. due 10-Oct-2026",
        statusText: "Calibrated",
        expected: "Calibration due date after date of use — SOP-INST-004",
        actual: "BAL-2024-003 — calibrated, due 10-Oct-2026, used 07:40 to 08:20",
        expectedSource: "SOP-INST-004",
      }),
      {
        ...flagged({
          label: "Sonicator SON-2024-002 — daily verification recorded late",
          reference: "Cal. due 18-Nov-2026",
          expected:
            "Daily performance verification recorded before first use — SOP-INST-004 §5.2",
          actual: "Verification recorded at 09:15; sonication started 08:05",
          expectedSource: "SOP-INST-004 §5.2",
          comparison:
            "Verification entry is 70 minutes after the recorded start of sonication",
          flagReason:
            "The daily performance verification for SON-2024-002 was entered after the instrument had already been used for sample preparation. SOP-INST-004 §5.2 requires the verification to be complete before first use of the day.",
          flagAction:
            "Confirm with the analyst whether the verification was performed before use and recorded late, or performed late. Record the finding against the batch.",
        }),
        reviewerNote:
          "Analyst confirmed verification was performed at 07:55 before use; the LIMS entry was made late. Documentation practice deviation DEV-2026-0217 raised. Result is unaffected.",
        noteAt: "01-Aug-2026 · 14:22",
      },
      compliant({
        label: "Analyst qualification — Priya Sharma",
        reference: "QUAL-2026-0114",
        statusText: "Qualified",
        expected: "Current qualification for the instrument used — SOP-INST-004 §3.1",
        actual: "Qualified for HPLC and balance operation, valid to 31-Mar-2027",
        expectedSource: "SOP-INST-004 §3.1",
      }),
    ],
    { status: "REVIEWED" },
  ),
  section("assay", "Chromatography", 4, chromatographyCompliant("HPLC-003"), {
    status: "REVIEWED",
  }),
  section("assay", "Column", 5, columnCompliant("COL-2024-07", 380, 400), {
    status: "REVIEWED",
  }),
];

const batchA: Batch = {
  id: "AR-2026-000121",
  arNumber: "AR-2026-000121",
  product: "Ciprofloxacin 500mg Tablet",
  batchNumber: "CIP-2026-0198",
  domain: "FINISHED_PRODUCT",
  specVersion: "v2.1",
  specCurrent: true,
  slaDeadline: "02-Aug-2026 12:00",
  slaStatus: "amber",
  slaLabel: "Approaching SLA",
  status: "AWAITING_AUTHORISATION",
  assignedTo: "priya-sharma",
  analyst: "Rajesh Iyer",
  lastActivity: "Submitted 14:35 yesterday",
  submittedAt: "01-Aug-2026 · 14:35",
  parameters: assayOnly,
  sections: batchASections,
  dataSources: [LIMS, EMPOWER],
};

const batchC: Batch = {
  id: "AR-2026-000120",
  arNumber: "AR-2026-000120",
  product: "Metformin 500mg Tablet",
  batchNumber: "MET-2026-0452",
  domain: "FINISHED_PRODUCT",
  specVersion: "v1.8",
  specCurrent: true,
  slaDeadline: "29-Jul-2026 14:00",
  slaStatus: "red",
  slaLabel: "SLA Breached",
  status: "NEEDS_REVIEW",
  assignedTo: null,
  analyst: "Amit Patel",
  lastActivity: "2 days ago",
  parameters: assayOnly,
  sections: cleanAssaySections("COL-2024-11", 210),
  dataSources: [LIMS, EMPOWER],
};

export const FINISHED_PRODUCT_BATCHES: Batch[] = [batchB, batchA, batchC];
