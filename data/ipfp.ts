import type { Batch, Section, StandaloneInstrument, TestParameter } from "@/types";
import { compliant, flagged, section } from "./factories";

/**
 * In-Process Finished Product review — Amoxicillin 250 mg compression stage.
 *
 * LEVEL D — demonstration scenario. Blend uniformity is the characteristic
 * in-process check; the flag is a single sampling location outside the
 * individual acceptance range while the overall RSD stays within limits,
 * which is exactly the case a reviewer has to reason about rather than
 * read off a single compliant line.
 *
 * This batch is past its SLA deadline and shows as breached everywhere it
 * appears.
 */

const P = "ipfp";

const IPFP_PARAMETERS: TestParameter[] = [
  {
    id: "blend",
    name: "Blend Uniformity (HPLC)",
    shortName: "Blend Uniformity",
    methodType: "HPLC",
    stpReference: "STP-IPFP-BU-002",
  },
  {
    id: "weight",
    name: "Tablet Weight Variation",
    shortName: "Weight Variation",
    methodType: "Gravimetric",
    stpReference: "STP-IPFP-WGT-001",
  },
  {
    id: "disintegration",
    name: "Disintegration Time",
    shortName: "Disintegration",
    methodType: "Disintegration apparatus",
    stpReference: "STP-IPFP-DT-001",
  },
  {
    id: "water",
    name: "Water Content",
    shortName: "Water Content",
    methodType: "Karl Fischer",
    stpReference: "STP-IPFP-KF-001",
  },
  {
    id: "hardness",
    name: "Tablet Hardness",
    shortName: "Hardness",
    methodType: "Physical measurement",
    stpReference: "STP-IPFP-HRD-001",
  },
];

/* -------------------------------------------------------------------------- */
/* Standalone instrument                                                      */
/* -------------------------------------------------------------------------- */

const TIAMO_IPFP_AUDIT = `TIAMO 2.4 - INSTRUMENT AUDIT TRAIL
Instrument      : KFA-2004-01 (Metrohm 831 KF Coulometer)
Software        : tiamo 2.4 SR1
Report exported : 04-Aug-2026 10:52:19
Exported by     : R.IYER (Analyst)
--------------------------------------------------------------
03-Aug-2026 14:22:05  LOGIN         R.IYER
03-Aug-2026 14:23:18  METHOD LOAD   IPFP-GRANULE-KF (v1)
03-Aug-2026 14:24:02  DRIFT CHECK   4.6 ug/min - within limit 10 ug/min
03-Aug-2026 14:29:44  DETERMINATION 1  Sample 0.3012 g / Result 2.0 % w/w
03-Aug-2026 14:35:10  DETERMINATION 2  Sample 0.2988 g / Result 2.2 % w/w
03-Aug-2026 14:40:31  DETERMINATION 3  Sample 0.3041 g / Result 2.1 % w/w
03-Aug-2026 14:40:32  MEAN          2.1 % w/w  (RSD 4.8 %)
03-Aug-2026 14:40:32  SPEC CHECK    NMT 3.0 % w/w - within specification
03-Aug-2026 14:42:55  NO DELETIONS  No determinations deleted or repeated
03-Aug-2026 14:43:40  LOGOUT        R.IYER
--------------------------------------------------------------
END OF AUDIT TRAIL`;

const TIAMO_IPFP: StandaloneInstrument = {
  name: "Tiamo",
  version: "2.4",
  source: "Tiamo 2.4",
  analyst: "Rajesh Iyer",
  loginAt: "03-Aug-2026 14:22",
  logoutAt: "03-Aug-2026 14:43",
  pdfFilename: "Tiamo_KFA200401_AMX-2026-0341-C03_03Aug2026.pdf",
  auditTrail: TIAMO_IPFP_AUDIT,
};

const BALANCE_IPFP_AUDIT = `METROHM - BALANCE AUDIT TRAIL
Instrument      : BAL-002 (Metrohm Precisa 320XB)
Software        : Metrohm BalanceLink 3.1
Report exported : 04-Aug-2026 09:05:41
Exported by     : R.IYER (Analyst)
--------------------------------------------------------------
03-Aug-2026 09:40:02  DAILY CHECK   Internal calibration passed
03-Aug-2026 09:42:20  DAILY CHECK   Test weight 100 g / reading 99.9998 g
03-Aug-2026 10:40:11  LOGIN         R.IYER
03-Aug-2026 10:42:35  WEIGHING #001 Tablet set 1 of 4 / 250.1 mg mean
03-Aug-2026 10:48:07  WEIGHING #002 Tablet set 2 of 4 / 249.8 mg mean
03-Aug-2026 10:53:44  WEIGHING #003 Tablet set 3 of 4 / 250.4 mg mean
03-Aug-2026 10:59:12  WEIGHING #004 Tablet set 4 of 4 / 250.0 mg mean
03-Aug-2026 11:05:30  LOGOUT        R.IYER
03-Aug-2026 11:05:40  NO DELETIONS  No weighings deleted or overwritten
--------------------------------------------------------------
END OF AUDIT TRAIL`;

const BALANCE_IPFP: StandaloneInstrument = {
  name: "Metrohm",
  version: "BalanceLink 3.1",
  source: "Caliber LIMS",
  analyst: "Rajesh Iyer",
  loginAt: "03-Aug-2026 10:40",
  logoutAt: "03-Aug-2026 11:05",
  pdfFilename: "Metrohm_BAL002_AMX-2026-0341-C03_03Aug2026.pdf",
  auditTrail: BALANCE_IPFP_AUDIT,
};

const TPW_IPFP_AUDIT = `TPW - TABLET PROCESSING WORKSTATION AUDIT TRAIL
Instrument      : TPW-002 (Tablet Processing Workstation)
Software        : TPW 5.3
Report exported : 04-Aug-2026 08:55:02
Exported by     : R.IYER (Analyst)
--------------------------------------------------------------
03-Aug-2026 08:30:19  DAILY CHECK   Hardness reference 80 N / reading 79.9 N
03-Aug-2026 08:33:40  DAILY CHECK   Friability drum 25 rpm verified
03-Aug-2026 12:40:07  LOGIN         R.IYER
03-Aug-2026 12:44:51  RUN #001      Friability, 20 tablets, 100 revolutions
03-Aug-2026 13:02:36  RUN #002      Disintegration, 6 tablets
03-Aug-2026 13:20:14  LOGOUT        R.IYER
03-Aug-2026 13:20:25  NO DELETIONS  No runs deleted or overwritten
--------------------------------------------------------------
END OF AUDIT TRAIL`;

const TPW_IPFP: StandaloneInstrument = {
  name: "TPW",
  version: "5.3",
  source: "Caliber LIMS",
  analyst: "Rajesh Iyer",
  loginAt: "03-Aug-2026 12:40",
  logoutAt: "03-Aug-2026 13:20",
  pdfFilename: "TPW_TPW002_AMX-2026-0341-C03_03Aug2026.pdf",
  auditTrail: TPW_IPFP_AUDIT,
};

const TIAMO_SOP = "APL-CP-F-QCCI-GEN-0013";

/* -------------------------------------------------------------------------- */
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

const sections: Section[] = [
  /* --- Blend Uniformity — the characteristic in-process check ------------- */
  section("blend", "Blend Uniformity Result", 1, [
    // LEVEL D — demonstration scenario.
    flagged({
      prefix: P,
      label: "Sampling location 7 outside individual acceptance range",
      reference: "87.4 % of label claim",
      expected:
        "Each individual location between 90.0 % and 110.0 % of label claim — STP-IPFP-BU-002 §8.2",
      actual: "Location 7 at 87.4 % of label claim; the other nine locations within range",
      expectedSource: "STP-IPFP-BU-002 §8.2",
      source: "Waters Empower",
      comparison:
        "Location 7 sits 2.6 percentage points below the lower individual limit, while the overall RSD of 4.2 % remains within the 5.0 % criterion",
      flagReason:
        "One sampling location is outside the individual content criterion even though the blend meets the RSD criterion. A single low location at the discharge end of the blender points to incomplete distribution rather than analytical variability, and the STP requires every location to be within range.",
      flagAction:
        "Confirm the sampling location and thief technique with production, and review whether the low result repeats on the retained sample. Record the finding and confirm whether the blend is to be re-blended before compression continues.",
      table: {
        caption: "Blend uniformity — 10 sampling locations, % of label claim",
        columns: ["Location", "Position in blender", "Result", "Range"],
        rows: [
          { cells: ["1", "Top left", "99.2 %", "90.0 – 110.0 %"] },
          { cells: ["2", "Top right", "101.4 %", "90.0 – 110.0 %"] },
          { cells: ["3", "Top centre", "98.7 %", "90.0 – 110.0 %"] },
          { cells: ["4", "Middle left", "97.5 %", "90.0 – 110.0 %"] },
          { cells: ["5", "Middle right", "102.8 %", "90.0 – 110.0 %"] },
          { cells: ["6", "Middle centre", "100.1 %", "90.0 – 110.0 %"] },
          {
            cells: ["7", "Discharge end", "87.4 %", "90.0 – 110.0 %"],
            flagged: true,
          },
          { cells: ["8", "Bottom left", "96.3 %", "90.0 – 110.0 %"] },
          { cells: ["9", "Bottom right", "103.6 %", "90.0 – 110.0 %"] },
          { cells: ["10", "Bottom centre", "99.8 %", "90.0 – 110.0 %"] },
        ],
      },
    }),
    compliant({
      prefix: P,
      label: "Relative standard deviation across locations",
      reference: "10 locations",
      statusText: "Within limits",
      expected: "RSD not more than 5.0 % across all locations — STP-IPFP-BU-002 §8.2",
      actual: "RSD 4.2 % across the ten sampling locations",
      expectedSource: "STP-IPFP-BU-002 §8.2",
      source: "Waters Empower",
      details: [
        { label: "Locations sampled", value: "10, per the blender sampling plan" },
        { label: "Mean of locations", value: "98.7 % of label claim" },
        { label: "Standard deviation", value: "4.15 % of label claim" },
        { label: "RSD", value: "4.2 %" },
        { label: "Limit", value: "Not more than 5.0 %" },
        { label: "Sampling device", value: "Side-sampling thief, 10 mL cavity" },
        { label: "Blend stage", value: "Post-lubrication, 5 minutes at 12 rpm" },
        { label: "Analysed on", value: "03-Aug-2026 · 11:20 AM to 16:05 PM" },
      ],
    }),
    compliant({
      prefix: P,
      label: "Chromatography system HPLC-002",
      reference: "Waters Alliance e2695",
      statusText: "Calibrated",
      expected: "One system per test, calibrated and in date — SOP-HPLC-001",
      actual: "HPLC-002 — calibrated, due 30-Nov-2026, used 11:20 to 16:05",
      expectedSource: "SOP-HPLC-001",
      source: "Waters Empower",
    }),
    compliant({
      prefix: P,
      label: "System suitability — five replicate injections",
      statusText: "Compliant",
      expected: "Tailing NMT 2.0, plates NLT 2000, RSD NMT 2.0 % — STP-IPFP-BU-002",
      actual: "Tailing 1.21, plates 5980, replicate RSD 0.58 %",
      expectedSource: "STP-IPFP-BU-002",
      source: "Caliber LIMS — Manual Entry",
    }),
  ]),

  /* --- Tablet Weight Variation ------------------------------------------- */
  section("weight", "Weight Variation Result", 1, [
    compliant({
      prefix: P,
      label: "Individual tablet weights",
      reference: "20 tablets",
      statusText: "Within limits",
      expected: "Each tablet between 247 mg and 253 mg — STP-IPFP-WGT-001",
      actual: "Mean 250.1 mg, RSD 0.8 %, all 20 tablets within 248.2 mg to 252.0 mg",
      expectedSource: "STP-IPFP-WGT-001",
      source: "Caliber LIMS",
      table: {
        caption: "Weight variation — summary of 20 tablets",
        columns: ["Statistic", "Value", "Specification"],
        rows: [
          { cells: ["Mean", "250.1 mg", "247 – 253 mg"] },
          { cells: ["Minimum", "248.2 mg", "247 mg"] },
          { cells: ["Maximum", "252.0 mg", "253 mg"] },
          { cells: ["RSD", "0.8 %", "NMT 2.0 %"] },
        ],
      },
    }),
    compliant({
      prefix: P,
      label: "Analytical Balance BAL-2024-005",
      reference: "Cal. due 22-Dec-2026",
      statusText: "Calibrated",
      expected: "Calibration due date after date of use — SOP-INST-004",
      actual: "BAL-2024-005 — calibrated 22-Jun-2026, due 22-Dec-2026, used 10:40 to 11:05",
      expectedSource: "SOP-INST-004",
      source: "Caliber LIMS",
    }),
  ]),

  /* The balance keeps its own audit trail of the tablet weighings. */
  section(
    "weight",
    "Weighing Balance",
    2,
    [
      compliant({
        prefix: P,
        label: "Weighing Balance BAL-002",
        reference: "Cal. due 09-Jan-2027",
        statusText: "Calibrated",
        expected: "Calibration current and within tolerance at date of use — SOP-INST-004",
        actual:
          "BAL-002 — calibrated 09-Jul-2026, due 09-Jan-2027, daily check 99.9998 g against a 100 g test weight",
        expectedSource: "SOP-INST-004",
        source: "Caliber LIMS",
        serialContinuity: { range: "Weighing #001 – #004" },
        details: [
          { label: "Instrument ID", value: "BAL-002" },
          { label: "Make and model", value: "Metrohm Precisa 320XB" },
          { label: "Software", value: "Metrohm BalanceLink 3.1" },
          { label: "Calibration status", value: "Calibrated — within interval" },
          { label: "Last calibrated", value: "09-Jul-2026" },
          { label: "Calibration due", value: "09-Jan-2027" },
          { label: "Daily check", value: "99.9998 g against a 100 g test weight, tolerance ± 1 mg" },
          { label: "Record held in", value: "Caliber LIMS" },
        ],
      }),
    ],
    { standaloneInstrument: BALANCE_IPFP },
  ),

  /* --- Disintegration Time ------------------------------------------------ */
  section("disintegration", "Disintegration Result", 1, [
    compliant({
      prefix: P,
      label: "Disintegration time",
      reference: "6 tablets",
      statusText: "Within limits",
      expected: "Not more than 15 minutes in water at 37 °C — STP-IPFP-DT-001",
      actual: "All six tablets disintegrated by 4 minutes 20 seconds",
      expectedSource: "STP-IPFP-DT-001",
      source: "Caliber LIMS",
      table: {
        caption: "Disintegration — six tablets, water at 37 °C",
        columns: ["Tablet", "Time", "Limit"],
        rows: [
          { cells: ["1", "4 min 05 s", "NMT 15 min"] },
          { cells: ["2", "3 min 58 s", "NMT 15 min"] },
          { cells: ["3", "4 min 12 s", "NMT 15 min"] },
          { cells: ["4", "4 min 20 s", "NMT 15 min"] },
          { cells: ["5", "4 min 01 s", "NMT 15 min"] },
          { cells: ["6", "4 min 09 s", "NMT 15 min"] },
        ],
      },
    }),
    compliant({
      prefix: P,
      label: "Disintegration Apparatus DIS-2023-004",
      reference: "Cal. due 15-Oct-2026",
      statusText: "Calibrated",
      expected: "Calibration due date after date of use — SOP-INST-004",
      actual: "DIS-2023-004 — calibrated 15-Apr-2026, due 15-Oct-2026, used 12:10 to 12:35",
      expectedSource: "SOP-INST-004",
      source: "Caliber LIMS",
    }),
  ]),

  /* --- Water Content (KF) ------------------------------------------------- */
  section(
    "water",
    "KF Titrator",
    1,
    [
      compliant({
        prefix: P,
        label: "Granule moisture by Karl Fischer",
        reference: "Triplicate determinations",
        statusText: "Within limits",
        expected: "Not more than 3.0 % w/w — STP-IPFP-KF-001",
        actual: "Mean 2.1 % w/w (2.0 % / 2.2 % / 2.1 %), RSD 4.8 %",
        expectedSource: "STP-IPFP-KF-001",
        source: "Tiamo 2.4",
        table: {
          caption: "Determinations — session of 03-Aug-2026",
          columns: ["Determination", "Sample weight", "Result", "Limit"],
          rows: [
            { cells: ["1", "0.3012 g", "2.0 % w/w", "NMT 3.0 %"] },
            { cells: ["2", "0.2988 g", "2.2 % w/w", "NMT 3.0 %"] },
            { cells: ["3", "0.3041 g", "2.1 % w/w", "NMT 3.0 %"] },
            { cells: ["Mean", "—", "2.1 % w/w", "NMT 3.0 %"] },
          ],
        },
      }),
      /*
       * TIA-F01. The titration began while conditioning was still running, so
       * it consumed titre the reading does not account for. That is not a
       * result to be explained — it is not a result, and no observation makes
       * it one. The analysis is repeated and a PNC carries the record.
       */
      flagged({
        prefix: P,
        severity: "HARD_INVALID",
        flagId: "TIA-F01",
        sopReference: TIAMO_SOP,
        label: "Determination started with COND BUSY",
        subLabel: "Result is not usable — analysis must be repeated",
        exceptionType: "Result Invalid",
        reference: "Determination #004",
        expected: "Conditioning complete before the determination starts",
        actual: "Determination #004 started at 14:41:08 with COND BUSY active",
        expectedSource: TIAMO_SOP,
        comparison:
          "The Tiamo audit trail records COND BUSY at the moment the determination started",
        flagReason:
          "TIA-F01 — the determination began while the cell was still conditioning. Additional titre was consumed by the conditioning, so the value reported is not the water content of the sample. Source: " + TIAMO_SOP + ".",
        flagAction:
          "Raise PNC per APL-GP-GEN-0023. Analysis must be repeated. Source: " + TIAMO_SOP + ".",
        source: "Tiamo 2.4",
      }),
      compliant({
        prefix: P,
        label: "Drift check before first determination",
        reference: "4.6 µg/min",
        statusText: "Within limits",
        expected: "Drift not more than 10 µg/min before titration — SOP-KF-002 §6.1",
        actual: "Drift 4.6 µg/min recorded at 14:24",
        expectedSource: "SOP-KF-002 §6.1",
        source: "Tiamo 2.4",
      }),
      compliant({
        prefix: P,
        label: "Karl Fischer Coulometer KFA-2004-01",
        auditTrailSequence: [
          { step: 1, label: "Conditioning started", timestamp: "03-Aug-2026 14:23:40", status: "ok" },
          { step: 2, label: "Analysis started", timestamp: "03-Aug-2026 14:24:02", status: "ok" },
          { step: 3, label: "Weight added", timestamp: "03-Aug-2026 14:29:44", status: "ok" },
          { step: 4, label: "Conditioning stopped", timestamp: "03-Aug-2026 14:40:10", status: "ok" },
          { step: 5, label: "Finished", timestamp: "03-Aug-2026 14:40:32", status: "ok" },
        ],
        serialContinuity: { range: "Trial #001 – #003" },
        reference: "Cal. due 08-Feb-2027",
        statusText: "Calibrated",
        expected: "Calibration due date after date of use — SOP-INST-004",
        actual: "KFA-2004-01 — calibrated 08-Aug-2026, due 08-Feb-2027, used 14:22 to 14:43",
        expectedSource: "SOP-INST-004",
        source: "Caliber LIMS",
      }),
    ],
    { standaloneInstrument: TIAMO_IPFP },
  ),

  /*
   * The workstation sits beside the hardness logbook rather than replacing
   * it: the tester on the compression floor writes to paper, this one keeps
   * its own record.
   */
  section(
    "hardness",
    "Tablet Processing Workstation",
    2,
    [
      compliant({
        prefix: P,
        label: "Tablet Processing Workstation TPW-002",
        reference: "Cal. due 17-Dec-2026",
        statusText: "Calibrated",
        expected: "Calibration current and within tolerance at date of use — SOP-INST-004",
        actual:
          "TPW-002 — calibrated 17-Jun-2026, due 17-Dec-2026, daily check 79.9 N against an 80 N hardness reference",
        expectedSource: "SOP-INST-004",
        source: "Caliber LIMS",
        serialContinuity: { range: "Run #001 – #002" },
        details: [
          { label: "Instrument ID", value: "TPW-002" },
          { label: "Make and model", value: "Tablet Processing Workstation" },
          { label: "Software", value: "TPW 5.3" },
          { label: "Records", value: "Tablet hardness, friability and disintegration" },
          { label: "Calibration status", value: "Calibrated — within interval" },
          { label: "Last calibrated", value: "17-Jun-2026" },
          { label: "Calibration due", value: "17-Dec-2026" },
          { label: "Daily check", value: "79.9 N against an 80 N hardness reference, tolerance ± 2 N" },
          { label: "In-process hardness", value: "Read at the press and written into logbook LB-2026-IPFP-007" },
          { label: "Record held in", value: "Caliber LIMS" },
        ],
      }),
    ],
    { standaloneInstrument: TPW_IPFP },
  ),

  /* --- Tablet Hardness — measured at the press, recorded on paper --------- */
  section(
    "hardness",
    "Tablet Hardness — Logbook",
    1,
    [
      compliant({
        prefix: P,
        label: "Tablet hardness",
        reference: "10 tablets",
        statusText: "Within limits",
        expected: "70 N to 100 N — STP-IPFP-HRD-001",
        actual: "Mean 82 N, range 76 N to 89 N, transcribed from logbook LB-2026-IPFP-007",
        expectedSource: "STP-IPFP-HRD-001",
        source: "Paper Logbook",
        table: {
          caption: "Hardness — 10 tablets, transcribed from the logbook",
          columns: ["Tablet", "Hardness", "Specification"],
          rows: [
            { cells: ["1", "79 N", "70 – 100 N"] },
            { cells: ["2", "84 N", "70 – 100 N"] },
            { cells: ["3", "81 N", "70 – 100 N"] },
            { cells: ["4", "88 N", "70 – 100 N"] },
            { cells: ["5", "76 N", "70 – 100 N"] },
            { cells: ["6", "83 N", "70 – 100 N"] },
            { cells: ["7", "80 N", "70 – 100 N"] },
            { cells: ["8", "89 N", "70 – 100 N"] },
            { cells: ["9", "78 N", "70 – 100 N"] },
            { cells: ["10", "82 N", "70 – 100 N"] },
          ],
        },
      }),
      compliant({
        prefix: P,
        label: "Hardness Tester HRD-2022-002",
        reference: "Cal. due 05-Mar-2027",
        statusText: "Calibrated",
        expected: "Calibration due date after date of use — SOP-INST-004",
        actual: "HRD-2022-002 — calibrated 05-Sep-2025, due 05-Mar-2027",
        expectedSource: "SOP-INST-004",
        source: "Caliber LIMS",
      }),
    ],
    {
      paperLogbook: {
        reference: "Logbook LB-2026-IPFP-007",
        page: "Page 12",
        description: "Tablet hardness — measured at the press and recorded by hand",
        note: "The hardness tester on the compression floor is not connected to LIMS, so in-process readings are written into the line logbook. QRA has no electronic record to compare the transcribed values against.",
      },
    },
  ),
];

export const IPFP_BATCHES: Batch[] = [
  {
    id: "07-IPFP-26-0122",
    arNumber: "07-IPFP-26-0122",
  limsStatus: "Under Test",
    product: "Amoxicillin 250mg — Compression Stage",
    batchNumber: "AMX-2026-0341-C03",
    domain: "IPFP",
    specVersion: "v3.2",
    specCurrent: true,
    slaDeadline: "01-Aug-2026 16:00",
    slaStatus: "red",
    slaLabel: "Breached — 0.5 days overdue",
    status: "NEEDS_REVIEW",
    assignedTo: "arjun-mehta",
    analyst: "Rajesh Iyer",
    lastActivity: "Yesterday 16:40",
    parameters: IPFP_PARAMETERS,
    sections,
    dataSources: ["Caliber LIMS", "Waters Empower", "Tiamo 2.4", "Paper Logbook"],
  },
];
