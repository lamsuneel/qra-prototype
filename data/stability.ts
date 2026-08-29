import type {
  Batch,
  ChamberReading,
  Section,
  StandaloneInstrument,
  TestParameter,
} from "@/types";
import { compliant, flagged, section } from "./factories";

/**
 * Stability review — Amoxicillin 250 mg, 6-month accelerated condition.
 *
 * LEVEL D — demonstration scenario. Stability review is unlike the other four
 * domains: the reviewer reads chamber conditions for the whole storage period
 * before reading any test result, because an excursion explains what the
 * results do afterwards. Chamber Conditions is therefore the first entry in
 * the sidebar, above every test parameter.
 *
 * Study initiated 05-Feb-2026, 6-month pull 05-Aug-2026. The chamber
 * excursion in March 2026 is what the impurity trend at 6 months turns on.
 */

const P = "stb";

const STB_PARAMETERS: TestParameter[] = [
  {
    id: "chamber",
    name: "Chamber Conditions",
    shortName: "Chamber Conditions",
    methodType: "Environmental monitoring",
    stpReference: "SOP-STB-CHM-001",
  },
  {
    id: "assay",
    name: "Assay (HPLC)",
    shortName: "Assay",
    methodType: "HPLC",
    stpReference: "STP-STB-ASSAY-001",
  },
  {
    id: "rs",
    name: "Related Substances (HPLC)",
    shortName: "Related Substances",
    methodType: "HPLC",
    stpReference: "STP-STB-RS-001",
  },
  {
    id: "water",
    name: "Water Content",
    shortName: "Water Content",
    methodType: "Karl Fischer",
    stpReference: "STP-STB-KF-001",
  },
  {
    id: "disso",
    name: "Dissolution",
    shortName: "Dissolution",
    methodType: "UV spectrophotometry",
    stpReference: "STP-STB-DISS-001",
  },
  {
    id: "appearance",
    name: "Appearance",
    shortName: "Appearance",
    methodType: "Visual inspection",
    stpReference: "STP-STB-APP-001",
  },
];

/* -------------------------------------------------------------------------- */
/* Chamber trace — fortnightly readings across the storage period             */
/* -------------------------------------------------------------------------- */

export const CHAMBER_READINGS: ChamberReading[] = [
  { day: "05 Feb", temperature: 40.1, humidity: 74.8 },
  { day: "19 Feb", temperature: 39.8, humidity: 75.2 },
  { day: "05 Mar", temperature: 43.7, humidity: 71.4 },
  { day: "19 Mar", temperature: 44.2, humidity: 70.8 },
  { day: "02 Apr", temperature: 40.3, humidity: 74.6 },
  { day: "16 Apr", temperature: 39.9, humidity: 75.1 },
  { day: "30 Apr", temperature: 40.2, humidity: 74.9 },
  { day: "14 May", temperature: 40.0, humidity: 75.3 },
  { day: "28 May", temperature: 39.7, humidity: 74.7 },
  { day: "11 Jun", temperature: 40.4, humidity: 75.0 },
  { day: "25 Jun", temperature: 40.1, humidity: 74.5 },
  { day: "09 Jul", temperature: 39.9, humidity: 75.2 },
  { day: "05 Aug", temperature: 40.2, humidity: 74.9 },
];

/* -------------------------------------------------------------------------- */
/* Standalone instruments                                                     */
/* -------------------------------------------------------------------------- */

const TIAMO_STB_AUDIT = `TIAMO 2.4 - INSTRUMENT AUDIT TRAIL
Instrument      : KFT-2024-005 (Metrohm 851 Titrando)
Software        : tiamo 2.4 SR1
Report exported : 07-Aug-2026 09:31:44
Exported by     : A.KULKARNI (Analyst)
--------------------------------------------------------------
06-Aug-2026 09:05:12  LOGIN         A.KULKARNI
06-Aug-2026 09:06:40  METHOD LOAD   STB-TABLET-KF (v2)
06-Aug-2026 09:07:22  DRIFT CHECK   2.8 ug/min - within limit 10 ug/min
06-Aug-2026 09:12:55  DETERMINATION 1  Sample 0.5011 g / Result 3.3 % w/w
06-Aug-2026 09:18:20  DETERMINATION 2  Sample 0.4996 g / Result 3.5 % w/w
06-Aug-2026 09:18:21  MEAN          3.4 % w/w  (RSD 4.2 %)
06-Aug-2026 09:18:21  SPEC CHECK    NMT 5.0 % w/w - within specification
06-Aug-2026 09:20:03  NO DELETIONS  No determinations deleted or repeated
06-Aug-2026 09:21:15  LOGOUT        A.KULKARNI
--------------------------------------------------------------
END OF AUDIT TRAIL`;

const UV_AUDIT = `LABSOLUTIONS UV - INSTRUMENT AUDIT TRAIL
Instrument      : UV-2024-02 (Shimadzu UV-1900i)
Software        : LabSolutions UV-Vis 1.26
Report exported : 07-Aug-2026 11:18:07
Exported by     : A.KULKARNI (Analyst)
--------------------------------------------------------------
06-Aug-2026 10:15:31  LOGIN         A.KULKARNI
06-Aug-2026 10:16:47  METHOD LOAD   STB-AMX-DISS-UV (v3)
06-Aug-2026 10:17:30  BASELINE      Corrected, 0.1 N HCl blank
06-Aug-2026 10:18:02  WAVELENGTH    272 nm
06-Aug-2026 11:05:14  VESSEL 1      45 min / 94.2 % dissolved
06-Aug-2026 11:05:52  VESSEL 2      45 min / 92.8 % dissolved
06-Aug-2026 11:06:29  VESSEL 3      45 min / 95.1 % dissolved
06-Aug-2026 11:07:05  VESSEL 4      45 min / 93.6 % dissolved
06-Aug-2026 11:07:41  VESSEL 5      45 min / 91.9 % dissolved
06-Aug-2026 11:08:18  VESSEL 6      45 min / 94.7 % dissolved
06-Aug-2026 11:08:19  MEAN          93.7 % dissolved  (RSD 1.3 %)
06-Aug-2026 11:08:19  SPEC CHECK    Q = 80 % at 45 min - all vessels above Q
06-Aug-2026 11:10:44  NO DELETIONS  No vessel results excluded
06-Aug-2026 11:12:20  LOGOUT        A.KULKARNI
--------------------------------------------------------------
END OF AUDIT TRAIL`;

const ICDAS_AUDIT = `iCDAS 1.2 - CHAMBER MONITORING AUDIT TRAIL
Chamber         : SCH-04 (Thermolab accelerated stability chamber)
Software        : iCDAS 1.2 build 340
Condition       : 40 C +/- 2 C / 75 % RH +/- 5 % RH
Report exported : 07-Aug-2026 08:44:12
Exported by     : QA.STABILITY (Reviewer)
--------------------------------------------------------------
04-Mar-2026 22:14:07  ALARM         Temperature 42.4 C - upper limit exceeded
04-Mar-2026 22:14:07  CAUSE         Compressor 2 tripped on high head pressure
05-Mar-2026 06:02:19  READING       43.7 C / 71.4 % RH
05-Mar-2026 07:30:55  ACTION        Engineering call-out raised WO-2026-1188
06-Mar-2026 11:20:41  ACTION        Compressor 2 condenser cleaned, restarted
19-Mar-2026 03:48:52  ALARM         Temperature 44.2 C - upper limit exceeded
19-Mar-2026 03:48:52  CAUSE         Compressor 2 tripped again, same fault
19-Mar-2026 09:15:30  ACTION        Compressor 2 replaced under WO-2026-1204
21-Mar-2026 08:00:00  DEVIATION     DEV-2026-SCH-0023 raised by QA
02-Apr-2026 09:00:00  READING       40.3 C / 74.6 % RH - back within limits
02-Apr-2026 09:05:00  STATUS        Chamber returned to qualified state
--------------------------------------------------------------
No readings were deleted or modified. Total time above 42 C: 96 hours.
END OF AUDIT TRAIL`;

const TIAMO_STB: StandaloneInstrument = {
  name: "Tiamo",
  version: "2.4",
  source: "Tiamo 2.4",
  analyst: "Anil Kulkarni",
  loginAt: "06-Aug-2026 09:05",
  logoutAt: "06-Aug-2026 09:21",
  pdfFilename: "Tiamo_KFT2024005_AMX-2026-0288-6M_06Aug2026.pdf",
  auditTrail: TIAMO_STB_AUDIT,
};

const UV: StandaloneInstrument = {
  name: "LabSolutions UV",
  version: "1.26",
  source: "LabSolutions UV",
  analyst: "Anil Kulkarni",
  loginAt: "06-Aug-2026 10:15",
  logoutAt: "06-Aug-2026 11:12",
  pdfFilename: "LabSolutionsUV_UV202402_AMX-2026-0288-6M_06Aug2026.pdf",
  auditTrail: UV_AUDIT,
};

const ICDAS: StandaloneInstrument = {
  name: "iCDAS",
  version: "1.2",
  source: "iCDAS 1.2",
  analyst: "QA Stability Desk",
  loginAt: "07-Aug-2026 08:40",
  logoutAt: "07-Aug-2026 08:46",
  pdfFilename: "iCDAS_SCH04_AMX-2026-0288-6M_Feb2026-Aug2026.pdf",
  auditTrail: ICDAS_AUDIT,
};

/* -------------------------------------------------------------------------- */
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

const sections: Section[] = [
  /* --- Chamber Conditions — read before any test result ------------------- */
  section(
    "chamber",
    "Stability Chamber",
    1,
    [
      // LEVEL D — demonstration scenario.
      flagged({
        prefix: P,
        label: "Temperature excursion above the accelerated condition limit",
        reference: "DEV-2026-SCH-0023",
        expected: "40 °C ± 2 °C throughout the storage period — ICH Q1A(R2), SOP-STB-CHM-001",
        actual: "43.7 °C on 05-Mar-2026 and 44.2 °C on 19-Mar-2026 in chamber SCH-04",
        expectedSource: "SOP-STB-CHM-001",
        source: "iCDAS 1.2",
        comparison:
          "Two readings exceed the 42 °C upper limit, 96 hours in total above limit, both traced to the same compressor fault",
        flagReason:
          "The samples were stored outside the qualified accelerated condition for 96 hours across two events in March 2026. Storage outside the condition means the 6-month results cannot be attributed to the accelerated condition alone, and the impurity trend at 6 months has to be read against this excursion.",
        flagAction:
          "Review deviation DEV-2026-SCH-0023 and the engineering work orders for chamber SCH-04, then confirm the impact assessment covers the Related Substances result at 6 months before the study is reported.",
        table: {
          caption: "Readings outside the qualified condition",
          columns: ["Date", "Temperature", "Humidity", "Limit"],
          rows: [
            { cells: ["05-Mar-2026", "43.7 °C", "71.4 % RH", "40 °C ± 2 °C"], flagged: true },
            { cells: ["19-Mar-2026", "44.2 °C", "70.8 % RH", "40 °C ± 2 °C"], flagged: true },
          ],
        },
      }),
      compliant({
        prefix: P,
        label: "Temperature — storage period statistics",
        reference: "13 fortnightly readings",
        statusText: "Excursion documented",
        expected: "40 °C ± 2 °C throughout the storage period — ICH Q1A(R2)",
        actual:
          "Mean 40.7 °C, minimum 39.7 °C, maximum 44.2 °C; eleven of thirteen readings within limits",
        expectedSource: "SOP-STB-CHM-001",
        source: "iCDAS 1.2",
      }),
      compliant({
        prefix: P,
        label: "Relative humidity — storage period statistics",
        reference: "13 fortnightly readings",
        statusText: "Within limits",
        expected: "75 % RH ± 5 % RH throughout the storage period — ICH Q1A(R2)",
        actual: "Mean 74.3 % RH, minimum 70.8 % RH, maximum 75.3 % RH — all readings within limits",
        expectedSource: "SOP-STB-CHM-001",
        source: "iCDAS 1.2",
        details: [
          { label: "Chamber", value: "SCH-04, Thermolab accelerated stability chamber" },
          { label: "Condition", value: "75 % RH plus or minus 5 % RH" },
          { label: "Readings taken", value: "13, fortnightly from 05-Feb-2026" },
          { label: "Mean", value: "74.3 % RH" },
          { label: "Minimum", value: "70.8 % RH on 19-Mar-2026" },
          { label: "Maximum", value: "75.3 % RH on 14-May-2026" },
          { label: "Readings outside limit", value: "None" },
          { label: "Sensor", value: "RH-SCH04-02, calibrated 24-Mar-2026" },
        ],
      }),
      compliant({
        prefix: P,
        label: "Chamber SCH-04 qualification",
        reference: "Requalified 24-Mar-2026",
        statusText: "Qualified",
        expected: "Chamber qualified and mapped, within requalification interval — SOP-STB-CHM-001 §3",
        actual:
          "SCH-04 requalified 24-Mar-2026 after compressor replacement, next due 24-Mar-2027",
        expectedSource: "SOP-STB-CHM-001 §3",
        source: "Caliber LIMS",
      }),
    ],
    {
      standaloneInstrument: ICDAS,
      chamberReadings: CHAMBER_READINGS,
      chamberLimits: { temperature: "40 °C ± 2 °C", humidity: "75 % RH ± 5 % RH" },
    },
  ),

  /* --- Assay (HPLC) ------------------------------------------------------- */
  section("assay", "Assay Trend", 1, [
    compliant({
      prefix: P,
      label: "Assay across the study timepoints",
      reference: "Initial, 3-month, 6-month",
      statusText: "Within limits",
      expected: "95.0 % to 105.0 % of label claim at every timepoint — STP-STB-ASSAY-001",
      actual: "Initial 100.2 %, 3-month 99.8 %, 6-month 99.1 % — a 1.1 % decline across the study",
      expectedSource: "STP-STB-ASSAY-001",
      source: "Waters Empower",
      table: {
        caption: "Assay trend — % of label claim",
        columns: ["Timepoint", "Pull date", "Result", "Specification"],
        rows: [
          { cells: ["Initial", "05-Feb-2026", "100.2 %", "95.0 – 105.0 %"] },
          { cells: ["3-month", "05-May-2026", "99.8 %", "95.0 – 105.0 %"] },
          { cells: ["6-month", "05-Aug-2026", "99.1 %", "95.0 – 105.0 %"] },
        ],
      },
    }),
    compliant({
      prefix: P,
      label: "Chromatography system HPLC-005",
      reference: "Waters Alliance e2695",
      statusText: "Calibrated",
      expected: "One system per test, calibrated and in date — SOP-HPLC-001",
      actual: "HPLC-005 — calibrated, due 28-Feb-2027, used 09:40 to 14:20",
      expectedSource: "SOP-HPLC-001",
      source: "Waters Empower",
    }),
    compliant({
      prefix: P,
      label: "System suitability — five replicate injections",
      statusText: "Compliant",
      expected: "Tailing NMT 2.0, plates NLT 2000, RSD NMT 2.0 % — STP-STB-ASSAY-001",
      actual: "Tailing 1.14, plates 6710, replicate RSD 0.36 %",
      expectedSource: "STP-STB-ASSAY-001",
      source: "Caliber LIMS — Manual Entry",
    }),
  ]),

  /* --- Related Substances — the characteristic stability finding ---------- */
  section("rs", "Related Substances Trend", 1, [
    // LEVEL D — demonstration scenario.
    flagged({
      prefix: P,
      label: "Known Impurity B above the specification limit at 6 months",
      reference: "OOS-2026-0091",
      expected: "Known Impurity B not more than 0.20 % — STP-STB-RS-001",
      actual: "0.21 % at the 6-month timepoint, against 0.08 % at initial",
      expectedSource: "STP-STB-RS-001",
      source: "Waters Empower",
      comparison:
        "The result exceeds the limit by 0.01 % and continues a rising trend of 0.08 % to 0.12 % to 0.21 % across the three timepoints",
      flagReason:
        "Known Impurity B is out of specification at the 6-month accelerated timepoint. The rise between 3 and 6 months is steeper than between initial and 3 months, and the storage period covers the chamber excursion in March 2026, so degradation and storage conditions both have to be considered.",
      flagAction:
        "Review OOS-2026-0091 and confirm the investigation covers the chamber excursion recorded under DEV-2026-SCH-0023. Confirm whether the accelerated study is to be repeated before the long-term data is reported.",
      table: {
        caption: "Known Impurity B — stability trend",
        columns: ["Timepoint", "Pull date", "Result", "Limit"],
        rows: [
          { cells: ["Initial", "05-Feb-2026", "0.08 %", "NMT 0.20 %"] },
          { cells: ["3-month", "05-May-2026", "0.12 %", "NMT 0.20 %"] },
          { cells: ["6-month", "05-Aug-2026", "0.21 %", "NMT 0.20 %"], flagged: true },
        ],
      },
    }),
    compliant({
      prefix: P,
      label: "Total impurities",
      reference: "6-month timepoint",
      statusText: "Within limits",
      expected: "Total impurities not more than 1.0 % — STP-STB-RS-001",
      actual: "0.54 % total impurities at 6 months (0.19 % at initial)",
      expectedSource: "STP-STB-RS-001",
      source: "Waters Empower",
      table: {
        caption: "Total impurities — stability trend",
        columns: ["Timepoint", "Pull date", "Result", "Limit"],
        rows: [
          { cells: ["Initial", "05-Feb-2026", "0.19 %", "NMT 1.0 %"] },
          { cells: ["3-month", "05-May-2026", "0.31 %", "NMT 1.0 %"] },
          { cells: ["6-month", "05-Aug-2026", "0.54 %", "NMT 1.0 %"] },
        ],
      },
    }),
    compliant({
      prefix: P,
      label: "Any unspecified impurity",
      reference: "6-month timepoint",
      statusText: "Within limits",
      expected: "Any unspecified impurity not more than 0.10 % — STP-STB-RS-001",
      actual: "Largest unspecified impurity 0.06 % at relative retention 1.42",
      expectedSource: "STP-STB-RS-001",
      source: "Waters Empower",
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
        label: "Water content across the study timepoints",
        reference: "Initial, 3-month, 6-month",
        statusText: "Within limits",
        expected: "Not more than 5.0 % w/w at every timepoint — STP-STB-KF-001",
        actual: "Initial 2.8 %, 3-month 3.1 %, 6-month 3.4 % w/w",
        expectedSource: "STP-STB-KF-001",
        source: "Tiamo 2.4",
        table: {
          caption: "Water content trend — % w/w",
          columns: ["Timepoint", "Pull date", "Result", "Limit"],
          rows: [
            { cells: ["Initial", "05-Feb-2026", "2.8 %", "NMT 5.0 %"] },
            { cells: ["3-month", "05-May-2026", "3.1 %", "NMT 5.0 %"] },
            { cells: ["6-month", "05-Aug-2026", "3.4 %", "NMT 5.0 %"] },
          ],
        },
      }),
      compliant({
        prefix: P,
        label: "Drift check before first determination",
        reference: "2.8 µg/min",
        statusText: "Within limits",
        expected: "Drift not more than 10 µg/min before titration — SOP-KF-002 §6.1",
        actual: "Drift 2.8 µg/min recorded at 09:07",
        expectedSource: "SOP-KF-002 §6.1",
        source: "Tiamo 2.4",
      }),
      compliant({
        prefix: P,
        label: "Karl Fischer Titrator KFT-2024-005",
        auditTrailSequence: [
          { step: 1, label: "Conditioning started", timestamp: "11-Aug-2026 11:02:40", status: "ok" },
          { step: 2, label: "Analysis started", timestamp: "11-Aug-2026 11:04:12", status: "ok" },
          { step: 3, label: "Weight added", timestamp: "11-Aug-2026 11:08:47", status: "ok" },
          { step: 4, label: "Conditioning stopped", timestamp: "11-Aug-2026 11:15:02", status: "ok" },
          { step: 5, label: "Finished", timestamp: "11-Aug-2026 11:16:03", status: "ok" },
        ],
        serialContinuity: { range: "Trial #001 – #002" },
        reference: "Cal. due 12-Jan-2027",
        statusText: "Calibrated",
        expected: "Calibration due date after date of use — SOP-INST-004",
        actual: "KFT-2024-005 — calibrated 12-Jul-2026, due 12-Jan-2027, used 09:05 to 09:21",
        expectedSource: "SOP-INST-004",
        source: "Caliber LIMS",
      }),
    ],
    { standaloneInstrument: TIAMO_STB },
  ),

  /* --- Dissolution (UV) --------------------------------------------------- */
  section(
    "disso",
    "UV Spectrophotometer",
    1,
    [
      compliant({
        prefix: P,
        label: "Dissolution at 45 minutes",
        reference: "6 vessels",
        statusText: "Within limits",
        expected: "Not less than Q = 80 % dissolved at 45 minutes — STP-STB-DISS-001",
        actual: "Mean 93.7 % dissolved, lowest vessel 91.9 %, RSD 1.3 %",
        expectedSource: "STP-STB-DISS-001",
        source: "LabSolutions UV",
        table: {
          caption: "Dissolution — six vessels at 45 minutes, 0.1 N HCl",
          columns: ["Vessel", "Dissolved", "Q value"],
          rows: [
            { cells: ["1", "94.2 %", "Q = 80 %"] },
            { cells: ["2", "92.8 %", "Q = 80 %"] },
            { cells: ["3", "95.1 %", "Q = 80 %"] },
            { cells: ["4", "93.6 %", "Q = 80 %"] },
            { cells: ["5", "91.9 %", "Q = 80 %"] },
            { cells: ["6", "94.7 %", "Q = 80 %"] },
            { cells: ["Mean", "93.7 %", "Q = 80 %"] },
          ],
        },
      }),
      compliant({
        prefix: P,
        label: "Dissolution trend across timepoints",
        reference: "Initial, 3-month, 6-month",
        statusText: "Within limits",
        expected: "Not less than Q = 80 % at 45 minutes at every timepoint — STP-STB-DISS-001",
        actual: "Initial 96.1 %, 3-month 94.9 %, 6-month 93.7 % mean dissolved",
        expectedSource: "STP-STB-DISS-001",
        source: "LabSolutions UV",
        table: {
          caption: "Dissolution trend — mean % dissolved at 45 minutes",
          columns: ["Timepoint", "Pull date", "Mean dissolved", "Q value"],
          rows: [
            { cells: ["Initial", "05-Feb-2026", "96.1 %", "Q = 80 %"] },
            { cells: ["3-month", "05-May-2026", "94.9 %", "Q = 80 %"] },
            { cells: ["6-month", "05-Aug-2026", "93.7 %", "Q = 80 %"] },
          ],
        },
      }),
      compliant({
        prefix: P,
        label: "UV Spectrophotometer UV-2024-02",
        auditTrailSequence: [
          { step: 1, label: "Auto-zero / Baseline zero", timestamp: "06-Aug-2026 10:17:30", status: "ok" },
          { step: 2, label: "Method loaded", timestamp: "06-Aug-2026 10:16:47", status: "ok" },
          { step: 3, label: "Vessel readings 1 to 6", timestamp: "06-Aug-2026 11:05:14", status: "ok" },
          { step: 4, label: "End", timestamp: "06-Aug-2026 11:12:20", status: "ok" },
        ],
        serialContinuity: { range: "Trial #001 – #004", gap: "Gap detected: #003 missing" },
        comparison: "Audit trail sequence read against the method",
        flagReason:
          "The LabSolutions UV run opens on an auto-zero and closes on End as required, but trial #003 is absent from the reviewed run. A missing trial number means a determination was made and not carried into the record, or the numbering was reused.",
        flagAction:
          "Retrieve trial #003 from the LabSolutions UV audit trail and confirm whether it was excluded, and on what authority, before marking Dissolution as Reviewed.",
        reference: "Cal. due 14-Dec-2026",
        statusText: "Calibrated",
        expected: "Calibration due date after date of use — SOP-INST-004",
        actual: "UV-2024-02 — calibrated 14-Jun-2026, due 14-Dec-2026, used 10:15 to 11:12",
        expectedSource: "SOP-INST-004",
        source: "Caliber LIMS",
      }),
    ],
    { standaloneInstrument: UV },
  ),

  /* --- Appearance — a visual check, recorded on paper --------------------- */
  section(
    "appearance",
    "Visual Inspection — Logbook",
    1,
    [
      compliant({
        prefix: P,
        label: "Tablet appearance at 6 months",
        reference: "20 tablets inspected",
        statusText: "No change",
        expected:
          "White to off-white uncoated tablets, free from mottling and spotting — STP-STB-APP-001",
        actual:
          "White to off-white tablets, no change from initial; no mottling, spotting or edge chipping observed",
        expectedSource: "STP-STB-APP-001",
        source: "Paper Logbook",
        table: {
          caption: "Appearance across timepoints — transcribed from the logbook",
          columns: ["Timepoint", "Pull date", "Observation"],
          rows: [
            { cells: ["Initial", "05-Feb-2026", "White to off-white, no defects"] },
            { cells: ["3-month", "05-May-2026", "White to off-white, no change"] },
            { cells: ["6-month", "05-Aug-2026", "White to off-white, no change"] },
          ],
        },
      }),
      compliant({
        prefix: P,
        label: "Container closure condition",
        reference: "HDPE bottle with induction seal",
        statusText: "Intact",
        expected: "Closure intact, desiccant present, no seal breach — STP-STB-APP-001 §5",
        actual: "Induction seal intact on all containers, desiccant present and free-flowing",
        expectedSource: "STP-STB-APP-001 §5",
        source: "Paper Logbook",
      }),
    ],
    {
      paperLogbook: {
        reference: "Logbook LB-2026-ST-002",
        page: "Page 8",
        description: "Appearance at pull — observed and recorded by hand",
        note: "Appearance is a visual check made at the pull bench and written into the stability logbook against the initial retained sample. QRA has no image or electronic record to compare the description against.",
      },
    },
  ),
];

export const STABILITY_BATCHES: Batch[] = [
  {
    id: "07-ST-26-0089",
    arNumber: "07-ST-26-0089",
    product: "Amoxicillin 250mg — 6-Month Accelerated",
    batchNumber: "AMX-2026-0288",
    domain: "STABILITY",
    specVersion: "v3.2",
    specCurrent: true,
    slaDeadline: "05-Aug-2026 17:00",
    slaStatus: "amber",
    slaLabel: "Approaching SLA",
    status: "NEEDS_REVIEW",
    assignedTo: "priya-sharma",
    analyst: "Anil Kulkarni",
    lastActivity: "11:20 AM today",
    parameters: STB_PARAMETERS,
    sections,
    dataSources: [
      "iCDAS 1.2",
      "Caliber LIMS",
      "Waters Empower",
      "Tiamo 2.4",
      "LabSolutions UV",
      "Paper Logbook",
    ],
  },
];
