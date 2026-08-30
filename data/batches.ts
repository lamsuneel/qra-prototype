import type {
  AuditTrailStep,
  Batch,
  CheckItem,
  DetailField,
  Section,
  SerialContinuity,
  SourceSystem,
  StandaloneInstrument,
  TestParameter,
} from "@/types";
import { SOP, acceptabilityRule } from "./rules";

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
  subLabel?: string;
  /** The rule this entry answers to, e.g. "TIA-F01". */
  flagId?: string;
  /** The document the check comes from. */
  sopReference?: string;
  /** Set where the result cannot be used at all — a PNC number is required. */
  severity?: "HARD_INVALID";
  acceptability?: { id: string; found: string; condition: string };
  exceptionType?: string;
  reference?: string;
  statusText?: string;
  expected: string;
  actual: string;
  expectedSource?: string;
  usageSource?: string;
  potencySource?: string;
  source?: SourceSystem;
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
  auditTrailSequence?: AuditTrailStep[];
  serialContinuity?: SerialContinuity;
}

const compliant = (spec: CompliantSpec): CheckItem => ({
  id: nextId("item"),
  label: spec.label,
  subLabel: spec.subLabel,
  flagId: spec.flagId,
  sopReference: spec.sopReference,
  severity: spec.severity,
  acceptability: spec.acceptability,
  exceptionType: spec.exceptionType,
  reference: spec.reference,
  statusText: spec.statusText ?? "Active",
  expected: spec.expected,
  actual: spec.actual,
  expectedSource: spec.expectedSource,
  usageSource: spec.usageSource,
  potencySource: spec.potencySource,
  source: spec.source ?? LIMS,
  result: "COMPLIANT",
  details: spec.details,
  requiresQuantityCheck: spec.requiresQuantityCheck,
  prescribedQty: spec.prescribedQty,
  actualQty: spec.actualQty,
  quantityComparison: spec.quantityComparison,
  inactivationStatus: spec.inactivationStatus,
  inactivationApprovalDate: spec.inactivationApprovalDate,
  auditTrailSequence: spec.auditTrailSequence,
  serialContinuity: spec.serialContinuity,
  comparison: spec.comparison,
  flagReason: spec.flagReason,
  flagAction: spec.flagAction,
});

interface FlaggedSpec {
  label: string;
  subLabel?: string;
  /** The rule this entry answers to, e.g. "TIA-F01". */
  flagId?: string;
  /** The document the check comes from. */
  sopReference?: string;
  /** Set where the result cannot be used at all — a PNC number is required. */
  severity?: "HARD_INVALID";
  acceptability?: { id: string; found: string; condition: string };
  exceptionType?: string;
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
  auditTrailSequence?: AuditTrailStep[];
  serialContinuity?: SerialContinuity;
  /** Everything QRA read for this entry, shown when the row is expanded. */
  details?: DetailField[];
  source?: SourceSystem;
}

const flagged = (spec: FlaggedSpec): CheckItem => ({
  id: nextId("item"),
  label: spec.label,
  subLabel: spec.subLabel,
  flagId: spec.flagId,
  sopReference: spec.sopReference,
  severity: spec.severity,
  acceptability: spec.acceptability,
  exceptionType: spec.exceptionType,
  reference: spec.reference,
  expected: spec.expected,
  actual: spec.actual,
  expectedSource: spec.expectedSource,
  usageSource: spec.usageSource,
  potencySource: spec.potencySource,
  source: spec.source ?? LIMS,
  result: "FLAGGED",
  comparison: spec.comparison,
  flagReason: spec.flagReason,
  flagAction: spec.flagAction,
  auditTrailSequence: spec.auditTrailSequence,
  serialContinuity: spec.serialContinuity,
  details: spec.details,
  inactivationStatus: spec.inactivationStatus,
  inactivationApprovalDate: spec.inactivationApprovalDate,
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
    requiresQuantityCheck: true,
    prescribedQty: "450 mL",
    actualQty: "450 mL",
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
    requiresQuantityCheck: true,
    prescribedQty: "1800 mL",
    actualQty: "1800 mL",
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
    requiresQuantityCheck: true,
    prescribedQty: "13.6 g ± 5%",
    actualQty: "13.61 g",
    quantityComparison: "WITHIN TOLERANCE",
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
    usageSource: "Caliber LIMS — Reference Standard Record",
    potencySource: "Caliber LIMS — eLIMS Reference Standard Audit Trail",
    requiresQuantityCheck: true,
    prescribedQty: "25 mg (within 10–15% of 24.8 mg)",
    actualQty: "24.8 mg",
    quantityComparison: "WITHIN TOLERANCE",
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
    usageSource: "Caliber LIMS — Reference Standard Record",
    potencySource: "Caliber LIMS — eLIMS Reference Standard Audit Trail",
    requiresQuantityCheck: true,
    prescribedQty: "25 mg ± 2 mg",
    actualQty: "25.1 mg",
    quantityComparison: "WITHIN TOLERANCE",
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
    requiresQuantityCheck: true,
    prescribedQty: "25 mg ± 2 mg",
    actualQty: "24.9 mg",
    quantityComparison: "WITHIN TOLERANCE",
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
      { label: "Calibration status", value: "Calibrated — within interval" },
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
    details: [
      { label: "Instrument ID", value: "SON-2024-001" },
      { label: "Make and model", value: "Elma Elmasonic P30H" },
      { label: "Calibration status", value: "Calibrated — within interval" },
      { label: "Last calibrated", value: "22-Mar-2026" },
      { label: "Calibration due", value: "22-Sep-2026" },
      { label: "Record held in", value: "Caliber LIMS" },
    ],
    reference: "Cal. due 22-Sep-2026",
    statusText: "Calibrated",
    expected: "Calibration due date after date of use — SOP-INST-004",
    actual: "SON-2024-001 — calibrated, due 22-Sep-2026, used 08:30 to 08:45",
    expectedSource: "SOP-INST-004",
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
    source: "Caliber LIMS — Manual Entry",
  }),
  compliant({
    label: "System suitability — Plate Count",
    expected: "Not less than 2000 — STP method limit",
    actual: "4850",
    expectedSource: "SOP-HPLC-001",
    statusText: "Within limit",
    source: "Caliber LIMS — Manual Entry",
  }),
  compliant({
    label: "System suitability — Resolution",
    expected: "Not less than 2.0 — STP method limit",
    actual: "3.20",
    expectedSource: "SOP-HPLC-001",
    statusText: "Within limit",
    source: "Caliber LIMS — Manual Entry",
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
    /* Column injection life is held in LIMS, not in the chromatography data
       system. Chromatograms and system suitability stay on Empower. */
    source: LIMS,
  }),
];

const BALANCE_FP_AUDIT = `SARTORIUS CUBIS II - BALANCE AUDIT TRAIL
Instrument      : BAL-001 (Sartorius Cubis II MSA225S)
Software        : Sartorius QApp 4.2
Report exported : 30-Jul-2026 09:10:22
Exported by     : P.SHARMA (Analyst)
--------------------------------------------------------------
30-Jul-2026 07:52:10  DAILY CHECK   Internal calibration passed
30-Jul-2026 07:54:38  DAILY CHECK   Test weight 200 g / reading 200.0001 g
30-Jul-2026 08:00:14  LOGIN         P.SHARMA
30-Jul-2026 08:02:41  WEIGHING #001 Standard WS-2024-41 / 24.8 mg
30-Jul-2026 08:09:05  WEIGHING #002 Sample AMX-2026-0341 / 25.1 mg
30-Jul-2026 08:15:33  WEIGHING #003 Sample AMX-2026-0341 / 24.9 mg
30-Jul-2026 08:44:52  LOGOUT        P.SHARMA
30-Jul-2026 08:45:00  NO DELETIONS  No weighings deleted or overwritten
--------------------------------------------------------------
END OF AUDIT TRAIL`;

const BALANCE_FP: StandaloneInstrument = {
  name: "Sartorius",
  version: "QApp 4.2",
  source: LIMS,
  analyst: "Priya Sharma",
  loginAt: "30-Jul-2026 08:00",
  logoutAt: "30-Jul-2026 08:44",
  pdfFilename: "Sartorius_BAL001_07FP260122_30Jul2026.pdf",
  auditTrail: BALANCE_FP_AUDIT,
};

const TPW_FP_AUDIT = `TPW - TABLET PROCESSING WORKSTATION AUDIT TRAIL
Instrument      : TPW-001 (Tablet Processing Workstation)
Software        : TPW 5.3
Report exported : 31-Jul-2026 09:20:14
Exported by     : P.SHARMA (Analyst)
--------------------------------------------------------------
30-Jul-2026 07:40:11  DAILY CHECK   Hardness reference 80 N / reading 80.2 N
30-Jul-2026 07:44:02  DAILY CHECK   Friability drum 25 rpm verified
30-Jul-2026 08:05:20  LOGIN         P.SHARMA
30-Jul-2026 08:10:44  RUN #001      Hardness, 10 tablets
30-Jul-2026 08:26:18  RUN #002      Friability, 20 tablets, 100 revolutions
30-Jul-2026 08:41:55  RUN #003      Disintegration, 6 tablets
30-Jul-2026 09:02:30  LOGOUT        P.SHARMA
30-Jul-2026 09:02:41  NO DELETIONS  No runs deleted or overwritten
--------------------------------------------------------------
END OF AUDIT TRAIL`;

const TPW_FP: StandaloneInstrument = {
  name: "TPW",
  version: "5.3",
  source: LIMS,
  analyst: "Priya Sharma",
  loginAt: "30-Jul-2026 08:05",
  logoutAt: "30-Jul-2026 09:02",
  pdfFilename: "TPW_TPW001_07FP260122_30Jul2026.pdf",
  auditTrail: TPW_FP_AUDIT,
};

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
AR Number:  07-FP-26-0122
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
AR Number:  07-FP-26-0122
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
/* Batch B — 07-FP-26-0122 — the primary demonstration batch                 */
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
      inactivationStatus: "Pending Approval",
    }),
    // LEVEL D — an inactivation that was authorised, for contrast with AC-7701.
    compliant({
      label: "Methanol HPLC grade",
      reference: "Lot MET-2024-118",
      statusText: "Inactivated",
      requiresQuantityCheck: true,
      prescribedQty: "250 mL",
      actualQty: "250 mL",
      expected: "Inactivation authorised before the entry leaves service — SOP-CHEM-003 §7",
      actual:
        "Methanol HPLC grade — Lot MET-2024-118 — inactivated 12-Jul-2026, authorised by the QC supervisor",
      expectedSource: "SOP-CHEM-003 §7",
      inactivationStatus: "Approved",
      inactivationApprovalDate: "12-Jul-2026",
      details: [
        { label: "Lot number", value: "MET-2024-118" },
        { label: "Manufacturer", value: "Merck" },
        { label: "Reason for inactivation", value: "Container seal integrity not assured" },
        { label: "Inactivated on", value: "12-Jul-2026" },
        { label: "Authorised by", value: "S. Deshmukh, QC Supervisor" },
        { label: "Quantity used before inactivation", value: "250 mL" },
        { label: "Status in LIMS", value: "Inactivated, withdrawn from use" },
      ],
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
      comparison:
        "Cumulative count from Caliber LIMS exceeds the qualified limit by 12 injections",
      flagReason:
        "The column has been used beyond its qualified injection life. Results obtained after the limit was exceeded may not be reliable.",
      flagAction:
        "Column must be retired or re-qualified before further use. Verify in Caliber LIMS whether the column was within limit for the specific injections used in this sample set.",
      source: LIMS,
    }),
  ]),

  /*
   * The balance has a section of its own as well as a row in Instruments:
   * it keeps its own audit trail, and the reviewer reads the weighing
   * record rather than only the calibration state.
   */
  section(
    "assay",
    "Weighing Balance",
    6,
    [
      compliant({
        label: "Weighing Balance BAL-001",
        reference: "Cal. due 14-Nov-2026",
        statusText: "Calibrated",
        expected: "Calibration current and within tolerance at date of use — SOP-INST-004",
        actual:
          "BAL-001 — calibrated 14-May-2026, due 14-Nov-2026, daily check 200.0001 g against a 200 g test weight",
        expectedSource: "SOP-INST-004",
        source: LIMS,
        serialContinuity: { range: "Weighing #001 – #003" },
        details: [
          { label: "Instrument ID", value: "BAL-001" },
          { label: "Make and model", value: "Sartorius Cubis II MSA225S" },
          { label: "Software", value: "Sartorius QApp 4.2" },
          { label: "Calibration status", value: "Calibrated — within interval" },
          { label: "Last calibrated", value: "14-May-2026" },
          { label: "Calibration due", value: "14-Nov-2026" },
          { label: "Daily check", value: "200.0001 g against a 200 g test weight, tolerance ± 0.2 mg" },
          { label: "Record held in", value: "Caliber LIMS" },
        ],
      }),
    ],
    { standaloneInstrument: BALANCE_FP },
  ),

  /* ---- Related Substances ---- */
  section("rs", "Chemicals", 1, chemicalsCompliant()),
  section("rs", "Standards", 2, [
    compliant({
      label: "Reference Standard — Amoxicillin RS",
      usageSource: "Caliber LIMS — Reference Standard Record",
      potencySource: "Caliber LIMS — eLIMS Reference Standard Audit Trail",
      details: [
        { label: "Standard number", value: "RS-AMX-2024-12" },
        { label: "Origin", value: "United States Pharmacopeia, catalogue 1033005" },
        { label: "Assigned potency", value: "99.7 % on the anhydrous basis" },
        { label: "Potency held in", value: "eLIMS Reference Standard Audit Trail" },
        { label: "Status in LIMS", value: "Active" },
        { label: "Expiry date", value: "15-Dec-2026" },
      ],
      requiresQuantityCheck: true,
      prescribedQty: "50 mg ± 2 mg",
      actualQty: "50.3 mg",
      quantityComparison: "WITHIN TOLERANCE",
      reference: "RS-AMX-2024-12",
      expected: "Active lot, expiry on or after analysis date — SOP-STD-002",
      actual: "RS-AMX-2024-12 — active, expiry 15-Dec-2026, potency 99.7%",
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
      requiresQuantityCheck: true,
      actualQty: "900 mL per vessel",
      reference: "Lot BUF-2024-067",
      expected: "Active entry, within expiry — SOP-CHEM-003",
      actual: "Buffer pH 6.8 — Lot BUF-2024-067 — active, expiry 30-Sep-2026",
      expectedSource: "SOP-CHEM-003",
    }),
    compliant({
      label: "Water for HPLC",
      requiresQuantityCheck: true,
      prescribedQty: "1800 mL",
      actualQty: "1800 mL",
      reference: "Lot WH-2024-1102",
      expected: "Active entry, within expiry — SOP-CHEM-003",
      actual: "Water for HPLC — Lot WH-2024-1102 — active, expiry 31-Dec-2026",
      expectedSource: "SOP-CHEM-003",
    }),
  ]),
  section("disso", "Standards", 2, [
    compliant({
      label: "Reference Standard — Amoxicillin",
      usageSource: "Caliber LIMS — Reference Standard Record",
      potencySource: "Caliber LIMS — eLIMS Reference Standard Audit Trail",
      requiresQuantityCheck: true,
      prescribedQty: "25 mg ± 2 mg",
      actualQty: "25.1 mg",
      quantityComparison: "WITHIN TOLERANCE",
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
      details: [
        { label: "Instrument ID", value: "UV-2024-02" },
        { label: "Make and model", value: "Shimadzu UV-1900i" },
        { label: "Calibration status", value: "Overdue — 29 days past due at date of use" },
        { label: "Last calibrated", value: "01-Jan-2026" },
        { label: "Calibration due", value: "01-Jul-2026" },
        { label: "Record held in", value: "Caliber LIMS" },
      ],
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
      details: [
        { label: "Instrument ID", value: "DA-2024-001" },
        { label: "Make and model", value: "Electrolab TDT-08L" },
        { label: "Calibration status", value: "Calibrated — within interval" },
        { label: "Last calibrated", value: "15-May-2026" },
        { label: "Calibration due", value: "15-Nov-2026" },
        { label: "Record held in", value: "Caliber LIMS" },
      ],
      reference: "Cal. due 15-Nov-2026",
      statusText: "Calibrated",
      expected: "Calibration due date after date of use — SOP-INST-004",
      actual: "DA-2024-001 — calibrated, due 15-Nov-2026, used 08:30 to 14:00",
      expectedSource: "SOP-INST-004",
    }),
    compliant({
      label: "Weighing Balance BAL-2024-003",
      details: [
        { label: "Instrument ID", value: "BAL-2024-003" },
        { label: "Make and model", value: "Mettler Toledo XPR205" },
        { label: "Calibration status", value: "Calibrated — within interval" },
        { label: "Last calibrated", value: "10-Apr-2026" },
        { label: "Calibration due", value: "10-Oct-2026" },
        { label: "Record held in", value: "Caliber LIMS" },
      ],
      reference: "Cal. due 10-Oct-2026",
      statusText: "Calibrated",
      expected: "Calibration due date after date of use — SOP-INST-004",
      actual:
        "BAL-2024-003 — calibrated, used for tablet weighing before dissolution, 08:15 to 08:45",
      expectedSource: "SOP-INST-004",
    }),
  ]),

  /* The workstation records the tablet physical tests and keeps its own
     audit trail, so it reads as a section rather than a calibration row. */
  section(
    "disso",
    "Tablet Processing Workstation",
    5,
    [
      compliant({
        label: "Tablet Processing Workstation TPW-001",
        reference: "Cal. due 26-Oct-2026",
        statusText: "Calibrated",
        expected: "Calibration current and within tolerance at date of use — SOP-INST-004",
        actual:
          "TPW-001 — calibrated 26-Apr-2026, due 26-Oct-2026, daily check 80.2 N against an 80 N hardness reference",
        expectedSource: "SOP-INST-004",
        source: LIMS,
        serialContinuity: { range: "Run #001 – #003" },
        details: [
          { label: "Instrument ID", value: "TPW-001" },
          { label: "Make and model", value: "Tablet Processing Workstation" },
          { label: "Software", value: "TPW 5.3" },
          { label: "Records", value: "Tablet hardness, friability and disintegration" },
          { label: "Calibration status", value: "Calibrated — within interval" },
          { label: "Last calibrated", value: "26-Apr-2026" },
          { label: "Calibration due", value: "26-Oct-2026" },
          { label: "Daily check", value: "80.2 N against an 80 N hardness reference, tolerance ± 2 N" },
          { label: "Record held in", value: "Caliber LIMS" },
        ],
      }),
    ],
    { standaloneInstrument: TPW_FP },
  ),

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
      requiresQuantityCheck: true,
      prescribedQty: "40 mL",
      actualQty: "40 mL",
      reference: "Lot KFR-2024-023",
      expected: "Active entry, within expiry — SOP-CHEM-003",
      actual: "Karl Fischer Reagent — Lot KFR-2024-023 — active, expiry 31-Aug-2026",
      expectedSource: "SOP-CHEM-003",
    }),
    compliant({
      label: "Methanol anhydrous",
      requiresQuantityCheck: true,
      prescribedQty: "50 mL",
      actualQty: "50 mL",
      reference: "Lot MET-2024-221",
      expected: "Active entry, within expiry — SOP-CHEM-003",
      actual: "Methanol anhydrous — Lot MET-2024-221 — active, expiry 30-Sep-2026",
      expectedSource: "SOP-CHEM-003",
    }),
  ]),
  section("kf", "Standards", 2, [
    compliant({
      label: "Water Standard WST-2024-044",
      requiresQuantityCheck: true,
      prescribedQty: "1.0 g ± 0.05 g",
      actualQty: "1.02 g",
      quantityComparison: "WITHIN TOLERANCE",
      reference: "WST-2024-044",
      expected: "Active lot, expiry on or after analysis date — SOP-STD-002",
      actual: "WST-2024-044 — active, expiry 31-Dec-2026",
      expectedSource: "SOP-STD-002",
    }),
  ]),
  section("kf", "Instruments", 3, [
    compliant({
      label: "Karl Fischer Titrator KFT-2024-001",
      details: [
        { label: "Instrument ID", value: "KFT-2024-001" },
        { label: "Make and model", value: "Metrohm 831 KF Coulometer" },
        { label: "Calibration status", value: "Calibrated — within interval" },
        { label: "Last calibrated", value: "30-May-2026" },
        { label: "Calibration due", value: "30-Nov-2026" },
        { label: "Record held in", value: "Caliber LIMS" },
      ],
      reference: "Cal. due 30-Nov-2026",
      statusText: "Calibrated",
      expected: "Calibration due date after date of use — SOP-INST-004",
      actual: "KFT-2024-001 — calibrated, due 30-Nov-2026, used 08:45 to 08:52",
      expectedSource: "SOP-INST-004",
      source: "Tiamo 2.4",
    }),
    compliant({
      label: "Weighing Balance BAL-2024-003",
      details: [
        { label: "Instrument ID", value: "BAL-2024-003" },
        { label: "Make and model", value: "Mettler Toledo XPR205" },
        { label: "Calibration status", value: "Calibrated — within interval" },
        { label: "Last calibrated", value: "10-Apr-2026" },
        { label: "Calibration due", value: "10-Oct-2026" },
        { label: "Record held in", value: "Caliber LIMS" },
      ],
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
      /*
       * PASS-TIA-01. The trail records the titration stopping and starting
       * again, which is what the method asks for when solution is added
       * mid-run — and also what it records when somebody interfered. QRA
       * cannot read the method, so the reviewer says which it was.
       */
      compliant({
        flagId: "PASS-TIA-01",
        sopReference: SOP.TIAMO,
        acceptability: acceptabilityRule("PASS-TIA-01"),
        label: "Determination interrupted and continued",
        reference: "Determination #001",
        statusText: "Acceptable if condition met",
        expected: "Interruption covered by the method — PASS-TIA-01",
        actual:
          "Determination interrupted 08:46:10, continued 08:47:02, finished 08:52:04",
        expectedSource: SOP.TIAMO,
        comparison:
          "The interrupted / continued / finished sequence is complete; whether it was called for is a question for the method",
        source: "Tiamo 2.4",
      }),

      /*
       * PASS-TIA-03. A live edit before the titration starts is a correction
       * with a REQUEST behind it, or it is a value being moved. The old and
       * the new are both on the trail; someone has to check them.
       */
      compliant({
        flagId: "PASS-TIA-03",
        sopReference: SOP.TIAMO,
        acceptability: acceptabilityRule("PASS-TIA-03"),
        label: "Sample data live modified before titration start",
        reference: "REQUEST 2026-0774",
        statusText: "Acceptable if condition met",
        expected: "Old and new values verified against the worksheet — PASS-TIA-03",
        actual:
          "Sample weight modified 08:43:55, before determination start 08:44:02 — old 24.6 mg, new 24.8 mg, REQUEST 2026-0774",
        expectedSource: SOP.TIAMO,
        comparison:
          "The modification carries a REQUEST and precedes the determination; the two values still have to be read against the weight slip",
        source: "Tiamo 2.4",
      }),

      /* TIA-F01. Checked and clean: the cell had finished conditioning
         before the determination began, so the titre reported is the
         sample's own. */
      compliant({
        flagId: "TIA-F01",
        sopReference: "APL-CP-F-QCCI-GEN-0013",
        label: "Conditioning state at determination start",
        reference: "COND BUSY not detected",
        statusText: "Clean start",
        expected: "Conditioning complete before the determination starts",
        actual: "Determination #001 started at 08:44:02 with conditioning complete",
        expectedSource: "APL-CP-F-QCCI-GEN-0013",
        comparison: "No COND BUSY entry between conditioning stopped and determination start",
        source: "Tiamo 2.4",
      }),
      compliant({
        label: "Result — Karl Fischer Titration",
        auditTrailSequence: [
          { step: 1, label: "Conditioning started", timestamp: "30-Jul-2026 08:44:02", status: "ok" },
          { step: 2, label: "Weight added", timestamp: "30-Jul-2026 08:45:10", status: "out-of-order" },
          { step: 3, label: "Analysis started", timestamp: "30-Jul-2026 08:45:38", status: "out-of-order" },
          { step: 4, label: "Conditioning stopped", timestamp: "30-Jul-2026 08:51:20", status: "ok" },
          { step: 5, label: "Finished", timestamp: "30-Jul-2026 08:52:04", status: "ok" },
        ],
        serialContinuity: { range: "Trial #001 – #002" },
        comparison: "Audit trail sequence read against the method",
        flagReason:
          "The Tiamo audit trail records the weight being added before analysis started. STP-AMX-KF-001 requires conditioning, then analysis started, then the weight added — a weight entered before the analysis begins is not covered by the conditioning that precedes it.",
        flagAction:
          "Review the Tiamo audit trail with the analyst and confirm whether the sequence reflects what was done or a late entry. Record the finding before marking KF as Reviewed.",
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
        pdfFilename: "Tiamo_KFA2004_07FP260122_20260730.pdf",
        auditTrail: TIAMO_AUDIT,
      },
    },
  ),

  /* ---- LCMS Genotoxic Impurity ---- */
  section("lcms", "Chemicals", 1, [
    compliant({
      label: "Acetonitrile LC-MS grade",
      requiresQuantityCheck: true,
      prescribedQty: "200 mL",
      actualQty: "200 mL",
      reference: "Lot ACM-2024-018",
      expected: "Active entry, within expiry — SOP-CHEM-003",
      actual: "Acetonitrile LC-MS grade — Lot ACM-2024-018 — active, expiry 31-Jan-2027",
      expectedSource: "SOP-CHEM-003",
    }),
    compliant({
      label: "Formic acid LC-MS grade",
      requiresQuantityCheck: true,
      actualQty: "1.0 mL",
      reference: "Lot FMA-2024-007",
      expected: "Active entry, within expiry — SOP-CHEM-003",
      actual: "Formic acid LC-MS grade — Lot FMA-2024-007 — active, expiry 30-Nov-2026",
      expectedSource: "SOP-CHEM-003",
    }),
  ]),
  section("lcms", "Standards", 2, [
    compliant({
      label: "MpTS Reference Standard",
      usageSource: "Caliber LIMS — Reference Standard Record",
      potencySource: "Caliber LIMS — eLIMS Reference Standard Audit Trail",
      details: [
        { label: "Standard number", value: "RS-MPTS-2024-03" },
        { label: "Origin", value: "Sigma-Aldrich, certified reference material" },
        { label: "Assigned potency", value: "99.2 % as methyl p-toluenesulphonate" },
        { label: "Potency held in", value: "eLIMS Reference Standard Audit Trail" },
        { label: "Status in LIMS", value: "Active" },
        { label: "Expiry date", value: "28-Feb-2027" },
      ],
      requiresQuantityCheck: true,
      prescribedQty: "10 mg (within 10–15% of 9.8 mg)",
      actualQty: "9.8 mg",
      quantityComparison: "WITHIN TOLERANCE",
      reference: "RS-MPTS-2024-03",
      expected: "Active lot, expiry on or after analysis date — SOP-STD-002",
      actual: "RS-MPTS-2024-03 — active, expiry 28-Feb-2027, potency 99.2%",
      expectedSource: "SOP-STD-002",
      source: "MassLynx",
    }),
  ]),
  section("lcms", "Instruments", 3, [
    compliant({
      label: "LC-MS/MS LCMS-8060",
      details: [
        { label: "Instrument ID", value: "LCMS-8060" },
        { label: "Make and model", value: "Shimadzu LCMS-8060" },
        { label: "Calibration status", value: "Calibrated — within interval" },
        { label: "Last calibrated", value: "15-Jun-2026" },
        { label: "Calibration due", value: "15-Dec-2026" },
        { label: "Record held in", value: "Caliber LIMS" },
      ],
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
        /*
         * QRA read this from the analytical data during review and surfaced
         * it. It does not claim to have prevented anything, and it makes no
         * recommendation about the batch — the reviewer decides what follows.
         */
        label: "OOS Result — Genotoxic Impurity",
        subLabel: "Requires OOS investigation per site SOP",
        exceptionType: "OOS Result",
        reference: "OOS-2026-0089",
        expected: "Not more than 0.05 ppm — ICH M7 permitted daily exposure",
        actual: "0.08 ppm (mean of 3 injections: 0.081, 0.079, 0.080)",
        expectedSource: "ICH M7",
        comparison: "Reported result exceeds the ICH M7 permitted limit by 0.03 ppm",
        flagReason:
          "Result (0.08 ppm) exceeds ICH M7 specification limit (NMT 0.05 ppm). Source: MassLynx via Caliber LIMS.",
        flagAction:
          "Raise OOS number in QMS. Do not release batch until investigation complete and root cause identified.",
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
        pdfFilename: "MassLynx_LCMS8060_07FP260122_20260730.pdf",
        auditTrail: MASSLYNX_AUDIT,
      },
    },
  ),
];

const batchB: Batch = {
  id: "07-FP-26-0122",
  arNumber: "07-FP-26-0122",
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
        details: [
          { label: "Instrument ID", value: "BAL-2024-003" },
          { label: "Make and model", value: "Mettler Toledo XPR205" },
          { label: "Calibration status", value: "Calibrated — within interval" },
          { label: "Last calibrated", value: "10-Apr-2026" },
          { label: "Calibration due", value: "10-Oct-2026" },
          { label: "Record held in", value: "Caliber LIMS" },
        ],
        reference: "Cal. due 10-Oct-2026",
        statusText: "Calibrated",
        expected: "Calibration due date after date of use — SOP-INST-004",
        actual: "BAL-2024-003 — calibrated, due 10-Oct-2026, used 07:40 to 08:20",
        expectedSource: "SOP-INST-004",
      }),
      {
        ...flagged({
          label: "Sonicator SON-2024-002 — daily verification recorded late",
          details: [
            { label: "Instrument ID", value: "SON-2024-002" },
            { label: "Make and model", value: "Elma Elmasonic P30H" },
            { label: "Calibration status", value: "Calibrated — within interval" },
            { label: "Last calibrated", value: "18-May-2026" },
            { label: "Calibration due", value: "18-Nov-2026" },
            { label: "Record held in", value: "Caliber LIMS" },
          ],
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
  id: "07-FP-26-0121",
  arNumber: "07-FP-26-0121",
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
  id: "07-FP-26-0120",
  arNumber: "07-FP-26-0120",
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
