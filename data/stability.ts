import type {
  Batch,
  ChamberReading,
  CheckItem,
  Section,
  StandaloneInstrument,
  TestParameter,
} from "@/types";
import { compliant, flagged, section } from "./factories";
import { attendanceCheck, empowerAuditTrail } from "./checks";
import { SOP } from "./rules";

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

const CHAMBER_LOG = `SITE LOGBOOK / MANUAL LIMS ENTRY - CHAMBER MONITORING RECORD
Chamber         : SCH-04 (Thermolab accelerated stability chamber)
Record source   : Site Logbook / Manual LIMS Entry
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

const CHAMBER_LOG_RECORD: StandaloneInstrument = {
  name: "Chamber log — manual LIMS entry",
  version: "",
  source: "Caliber LIMS — Manual Entry",
  analyst: "QA Stability Desk",
  loginAt: "07-Aug-2026 08:40",
  logoutAt: "07-Aug-2026 08:46",
  pdfFilename: "ChamberLog_SCH04_AMX-2026-0288-6M_Feb2026-Aug2026.pdf",
  auditTrail: CHAMBER_LOG,
};

const BALANCE_STB_AUDIT = `SARTORIUS CUBIS II - BALANCE AUDIT TRAIL
Instrument      : BAL-003 (Sartorius Cubis II MSA225S)
Software        : Sartorius QApp 4.2
Report exported : 07-Aug-2026 10:02:18
Exported by     : A.KULKARNI (Analyst)
--------------------------------------------------------------
06-Aug-2026 09:20:04  DAILY CHECK   Internal calibration passed
06-Aug-2026 09:22:31  DAILY CHECK   Test weight 200 g / reading 199.9999 g
06-Aug-2026 09:35:10  LOGIN         A.KULKARNI
06-Aug-2026 09:38:22  WEIGHING #001 6-month pull sample / 25.0 mg
06-Aug-2026 09:44:50  WEIGHING #002 6-month pull sample / 24.9 mg
06-Aug-2026 09:52:16  LOGOUT        A.KULKARNI
06-Aug-2026 09:52:30  NO DELETIONS  No weighings deleted or overwritten
--------------------------------------------------------------
END OF AUDIT TRAIL`;

const BALANCE_STB: StandaloneInstrument = {
  name: "Sartorius",
  version: "QApp 4.2",
  source: "Caliber LIMS",
  analyst: "Anil Kulkarni",
  loginAt: "06-Aug-2026 09:35",
  logoutAt: "06-Aug-2026 09:52",
  pdfFilename: "Sartorius_BAL003_AMX-2026-0288-6M_06Aug2026.pdf",
  auditTrail: BALANCE_STB_AUDIT,
};

/* -------------------------------------------------------------------------- */
/* Titrator routine flags — TIA-F01 to TIA-F25                                */
/* -------------------------------------------------------------------------- */

interface TitratorFacts {
  /** The day the analysis was performed, for the day-specific factor check. */
  analysisDate: string;
  /** Sample identity as it appears in Tiamo. */
  sampleName: string;
  arNumber: string;
  /** Weight in Tiamo, and on the printed slip — they have to agree. */
  weight: string;
  /** KF starts before the weight print; potentiometry starts after. */
  determinationStart: string;
  weightPrintStart: string;
  serialRange: string;
}

/**
 * The twenty-five routine checks the titrator SOP puts to every batch.
 *
 * Most of them pass and say so in a line. They are here in full rather than
 * only where they fire, because a reviewer signing a batch off is attesting
 * that all of them were asked — and a check that only appears when it fails
 * cannot be distinguished from a check nobody ran.
 *
 * TIA-F01 and TIA-F02 are supplied by the domain, since those are the two
 * that carry the demo findings.
 */
const titratorRoutineChecks = (
  prefix: string,
  facts: TitratorFacts,
): CheckItem[] => {
  const clean = (flagId: string, label: string, expected: string, actual: string) =>
    compliant({
      prefix,
      flagId,
      sopReference: SOP.TIAMO,
      label,
      statusText: "Verified",
      expected,
      actual,
      expectedSource: SOP.TIAMO,
      source: "Tiamo 2.4",
    });

  return [
    clean(
      "TIA-F03",
      "Determination status",
      "Determination status is original",
      "Status reads original — the determination has not been superseded",
    ),
    clean(
      "TIA-F04",
      "Reprocessed determination carries a PNC",
      `Any reprocessed determination has a PNC raised per ${SOP.PNC}`,
      "No reprocessed determination without a PNC",
    ),
    clean(
      "TIA-F05",
      "KF factor mean verified for the day of analysis",
      "KF factor mean value verified for the day of analysis",
      `KF factor mean verified for ${facts.analysisDate} — matches day of analysis`,
    ),
    clean(
      "TIA-F06",
      "Electrode calibration before titration",
      "Electrode calibrated before potentiometric titration where applicable",
      "Not applicable to a coulometric determination — no electrode calibration required",
    ),
    clean(
      "TIA-F07",
      "Normality verified against the standardisation mean",
      "Normality/Molarity cross-checked against the standardisation mean",
      "Cross-checked against the standardisation mean for the period",
    ),
    clean(
      "TIA-F08",
      "Electrode calibration after non-use",
      "Electrode recalibrated after more than three days without use",
      "Instrument in continuous use — the three-day rule is not engaged",
    ),
    clean(
      "TIA-F09",
      "Calculation formula matches the worksheet",
      "Calculation formula in Tiamo matches the analytical worksheet",
      "Formula read against the worksheet — identical",
    ),
    clean(
      "TIA-F10",
      "Sample name, batch and AR number",
      "Sample name, batch and AR in Tiamo match the analytical worksheet",
      `${facts.sampleName} · ${facts.arNumber} in Tiamo matches the analytical worksheet`,
    ),
    clean(
      "TIA-F11",
      "Weights against the weight slip",
      "Weights in Tiamo match the worksheet and the weight slips",
      `Weight in Tiamo (${facts.weight}) matches weight slip (${facts.weight})`,
    ),
    clean(
      "TIA-F12",
      "REQUEST entry old value",
      "REQUEST old value comparable with the previous analysis weight",
      "Old value read against the previous analysis weight — comparable",
    ),
    clean(
      "TIA-F13",
      "REQUEST entry new value",
      "REQUEST new value comparable with the weight print",
      "New value read against the weight print — comparable",
    ),
    compliant({
      prefix,
      flagId: "TIA-F14",
      sopReference: SOP.TIAMO,
      label: "Determination start against weight print start",
      statusText: "Sequence correct",
      expected:
        "Karl Fischer: the determination starts before the weight print starts",
      actual: `Determination start ${facts.determinationStart} · weight print start ${facts.weightPrintStart}`,
      expectedSource: SOP.TIAMO,
      source: "Tiamo 2.4",
      comparison: `Determination start ${facts.determinationStart} | Weight print start ${facts.weightPrintStart} | ✓ Determination started before weight print`,
      details: [
        { label: "Determination start", value: facts.determinationStart },
        { label: "Weight print start", value: facts.weightPrintStart },
        {
          label: "Required order",
          value: "Determination start before weight print start (Karl Fischer)",
        },
        { label: "Result", value: "✓ Determination started before weight print" },
      ],
    }),
    clean(
      "TIA-F15",
      "Potentiometry timing rule",
      "Potentiometry: the determination starts after the weight print starts",
      "Not applicable — this is a Karl Fischer determination",
    ),
    clean(
      "TIA-F16",
      "Potentiometry weight against the print",
      "Potentiometry: weight in Tiamo matches the weight print net weight",
      "Not applicable — this is a Karl Fischer determination",
    ),
    clean(
      "TIA-F17",
      "Parameter live modification during the run",
      "No parameter modified between determination start and finish",
      "No parameter modification recorded inside the run",
    ),
    clean(
      "TIA-F18",
      "Sample data live modification during the run",
      "No sample data modified between determination start and finish",
      "No in-run sample data modification recorded",
    ),
    clean(
      "TIA-F19",
      "Determination deleted",
      "No determination deleted in the audit trail",
      "No deletion entries in the audit trail",
    ),
    clean(
      "TIA-F20",
      "Start test error during the run",
      "No start test error between determination start and finish",
      "No start test error recorded",
    ),
    clean(
      "TIA-F21",
      "Every determination started was finished",
      "No determination started without a corresponding finish",
      "Every determination started carries a finish",
    ),
    clean(
      "TIA-F22",
      "Events after a determination started",
      "No events after a determination started without it finishing",
      "No orphaned events in the audit trail",
    ),
    clean(
      "TIA-F23",
      "LIMS instrument usage entry",
      "LIMS instrument usage entry present for the analysis day",
      `LIMS instrument usage entry confirmed for ${facts.analysisDate}`,
    ),
    clean(
      "TIA-F24",
      "Duplicate AR number",
      "No duplicate AR number without a PNC, OOS or OOT against it",
      `${facts.arNumber} searched across all databases and monthly projects — no duplicate`,
    ),
    compliant({
      prefix,
      flagId: "TIA-F25",
      sopReference: SOP.TIAMO,
      label: "Sample registered within the live database",
      statusText: "In scope",
      expected: "Sample registered within the live database scope",
      actual: `Sample registered in the live database — serial continuity ${facts.serialRange}`,
      expectedSource: SOP.TIAMO,
      source: "Tiamo 2.4",
      serialContinuity: { range: facts.serialRange },
    }),
  ];
};

/* -------------------------------------------------------------------------- */
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Attendance                                                                 */
/* -------------------------------------------------------------------------- */

const ATT = "att";

/**
 * One attendance section per test parameter, ordered first.
 *
 * Derived from the sections the batch already carries, so a parameter added
 * later gets the check without anyone having to remember it.
 */
const withAttendance = (
  entries: Section[],
  analyst: string,
  date: string,
  unverified: string[] = [],
): Section[] => {
  const parameters = [...new Set(entries.map((entry) => entry.parameter))];

  const attendance = parameters.map((parameter) =>
    section(parameter, "Attendance Verification", 0, [
      attendanceCheck(ATT, analyst, date, !unverified.includes(parameter)),
    ]),
  );

  return [...attendance, ...entries];
};

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
        source: "Caliber LIMS — Manual Entry",
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
        source: "Caliber LIMS — Manual Entry",
      }),
      compliant({
        prefix: P,
        label: "Relative humidity — storage period statistics",
        reference: "13 fortnightly readings",
        statusText: "Within limits",
        expected: "75 % RH ± 5 % RH throughout the storage period — ICH Q1A(R2)",
        actual: "Mean 74.3 % RH, minimum 70.8 % RH, maximum 75.3 % RH — all readings within limits",
        expectedSource: "SOP-STB-CHM-001",
        source: "Caliber LIMS — Manual Entry",
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
      standaloneInstrument: CHAMBER_LOG_RECORD,
      chamberReadings: CHAMBER_READINGS,
      chamberLimits: { temperature: "40 °C ± 2 °C", humidity: "75 % RH ± 5 % RH" },
    },
  ),

  /* --- Assay (HPLC) ------------------------------------------------------- */
  section("assay", "Assay Trend", 1, [
    /*
     * The 6-month assay lands two tenths above the lower limit. Inside
     * specification, and close enough that the trend decides.
     */
    compliant({
      prefix: P,
      flagId: "EMP-F23",
      sopReference: "FU7-QA-GEN-080 EMP-F23",
      label: "Assay at the 6-month timepoint",
      reference: "6-month accelerated",
      statusText: "Within specification",
      expected: "95.0 % to 105.0 % of label claim — STP-STB-ASSAY-001",
      actual: "95.2 % of label claim at the 6-month accelerated timepoint",
      expectedSource: "STP-STB-ASSAY-001",
      source: "Waters Empower",
      borderLimit: { result: 95.2, lower: 95.0, upper: 105.0, unit: "%" },
      comparison:
        "Result sits 0.2 % above the lower specification limit — inside specification, inside the border-limit margin",
    }),
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

  /* The balance keeps its own audit trail of the pull-sample weighings. */
  section(
    "assay",
    "Weighing Balance",
    2,
    [
      compliant({
        prefix: P,
        label: "Weighing Balance BAL-003",
        reference: "Cal. due 21-Dec-2026",
        statusText: "Calibrated",
        expected: "Calibration current and within tolerance at date of use — SOP-INST-004",
        actual:
          "BAL-003 — calibrated 21-Jun-2026, due 21-Dec-2026, daily check 199.9999 g against a 200 g test weight",
        expectedSource: "SOP-INST-004",
        source: "Caliber LIMS",
        serialContinuity: { range: "Weighing #001 – #002" },
        details: [
          { label: "Instrument ID", value: "BAL-003" },
          { label: "Make and model", value: "Sartorius Cubis II MSA225S" },
          { label: "Software", value: "Sartorius QApp 4.2" },
          { label: "Calibration status", value: "Calibrated — within interval" },
          { label: "Last calibrated", value: "21-Jun-2026" },
          { label: "Calibration due", value: "21-Dec-2026" },
          { label: "Daily check", value: "199.9999 g against a 200 g test weight, tolerance ± 0.2 mg" },
          { label: "Record held in", value: "Caliber LIMS" },
        ],
      }),
    ],
    { standaloneInstrument: BALANCE_STB },
  ),

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
        /* The history behind the finding, folded away: the reviewer meets
           the result first and opens the trend when they want it. */
        collapsible: true,
        collapsedLabel: "View trend data",
        caption: "Known Impurity B — stability trend across all timepoints",
        columns: ["Timepoint", "Pull date", "Result", "Limit"],
        rows: [
          { cells: ["0M", "Jan-2024", "0.05 %", "NMT 0.20 %"] },
          { cells: ["3M", "Apr-2024", "0.08 %", "NMT 0.20 %"] },
          { cells: ["6M", "Jul-2024", "0.11 %", "NMT 0.20 %"] },
          { cells: ["12M", "Jan-2025", "0.15 %", "NMT 0.20 %"] },
          { cells: ["18M", "Jul-2025", "0.17 %", "NMT 0.20 %"] },
          { cells: ["24M", "Jan-2026", "0.19 %", "NMT 0.20 %"] },
          { cells: ["36M", "Aug-2026", "0.21 %", "NMT 0.20 %"], flagged: true },
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
      ...titratorRoutineChecks(P, {
        analysisDate: "06-Aug-2026",
        sampleName: "Amoxicillin 250mg Tablet — 6M accelerated",
        arNumber: "07-ST-26-0089",
        weight: "0.2506 g",
        determinationStart: "09:38:22",
        weightPrintStart: "09:38:50",
        serialRange: "Trial #001 – #002",
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

  /* The same fourteen questions FP puts to Empower. Nothing fired here. */
  section("rs", "Empower Audit Trail", 2, empowerAuditTrail("emp-stb-rs")),

  /*
   * Whether the sample was pulled when it was supposed to be.
   *
   * A timepoint pulled outside its window is not comparable with the ones
   * before it, so the trend it feeds means less than it appears to — which
   * makes this a question to settle before reading any result, not after.
   */
  section("chamber", "Stability Window", 0, [
    compliant({
      prefix: P,
      label: "36-month long-term pull — window compliance",
      sopReference: "FU7-QA-GEN-080 — Stability Window",
      reference: "Long-term 25 °C / 60 % RH",
      statusText: "Within window",
      expected: "Pulled within ±45 days of the scheduled date — long-term condition",
      actual: "Scheduled 01-Aug-2026, pulled 03-Aug-2026 — 2 days late",
      expectedSource: "FU7-QA-GEN-080 — Stability Window",
      source: "Caliber LIMS",
      comparison:
        "2 days against a ±45 day window — the timepoint is comparable with those before it",
      details: [
        { label: "Condition", value: "Long-term — 25 °C / 60 % RH" },
        { label: "Scheduled pull date", value: "01-Aug-2026" },
        { label: "Actual pull date", value: "03-Aug-2026" },
        { label: "Window", value: "±45 days" },
        { label: "Days difference", value: "+2 days late" },
        { label: "Within window", value: "YES" },
      ],
    }),
    compliant({
      prefix: P,
      label: "6-month accelerated pull — window compliance",
      sopReference: "FU7-QA-GEN-080 — Stability Window",
      reference: "Accelerated 40 °C / 75 % RH",
      statusText: "Within window",
      expected: "Pulled within ±30 days of the scheduled date — accelerated condition",
      actual: "Scheduled 05-Aug-2026, pulled 06-Aug-2026 — 1 day late",
      expectedSource: "FU7-QA-GEN-080 — Stability Window",
      source: "Caliber LIMS",
      comparison: "1 day against a ±30 day window",
      details: [
        { label: "Condition", value: "Accelerated — 40 °C / 75 % RH" },
        { label: "Scheduled pull date", value: "05-Aug-2026" },
        { label: "Actual pull date", value: "06-Aug-2026" },
        { label: "Window", value: "±30 days" },
        { label: "Days difference", value: "+1 day late" },
        { label: "Within window", value: "YES" },
      ],
    }),
  ]),
];

export const STABILITY_BATCHES: Batch[] = [
  {
    id: "07-ST-26-0089",
    arNumber: "07-ST-26-0089",
  limsStatus: "Sample In-Charge Review",
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
    sections: withAttendance(sections, "Anil Kulkarni", "06-Aug-2026", []),
    dataSources: [
      "Caliber LIMS — Manual Entry",
      "Caliber LIMS",
      "Waters Empower",
      "Tiamo 2.4",
      "LabSolutions UV",
      "Paper Logbook",
    ],
  },
];
