import type {
  CheckItem, Batch, Section, StandaloneInstrument, TestParameter } from "@/types";
import { compliant, flagged, section } from "./factories";
import { attendanceCheck, nonCdsAuditTrail } from "./checks";
import { SOP } from "./rules";

/**
 * Raw Material review — Amoxicillin Trihydrate API.
 *
 * LEVEL D — demonstration scenario. Identity by FTIR is the characteristic
 * raw material check; the flag is a spectral correlation below the library
 * acceptance threshold, which is what stops the material being dispositioned.
 */

const P = "rm";

const RM_PARAMETERS: TestParameter[] = [
  {
    id: "identity",
    name: "Identity",
    shortName: "Identity",
    methodType: "FTIR",
    stpReference: "STP-RM-FTIR-001",
  },
  {
    id: "assay",
    name: "Assay (HPLC)",
    shortName: "Assay",
    methodType: "HPLC",
    stpReference: "STP-RM-ASSAY-001",
  },
  {
    id: "water",
    name: "Water Content",
    shortName: "Water Content",
    methodType: "Karl Fischer",
    stpReference: "STP-RM-KF-002",
  },
  {
    id: "psd",
    name: "Particle Size",
    shortName: "Particle Size",
    methodType: "Laser diffraction",
    stpReference: "STP-RM-PSD-001",
  },
  {
    id: "metals",
    name: "Heavy Metals",
    shortName: "Heavy Metals",
    methodType: "ICP-MS",
    stpReference: "STP-RM-ICP-003",
  },
];

/* -------------------------------------------------------------------------- */
/* Standalone instruments                                                     */
/* -------------------------------------------------------------------------- */

const SPECTRUM_AUDIT = `SPECTRUM ES - INSTRUMENT AUDIT TRAIL
Instrument      : FTIR-2024-002 (PerkinElmer Spectrum Two)
Software        : Spectrum ES 10.6.2
Report exported : 02-Aug-2026 11:04:18
Exported by     : P.SHARMA (Analyst)
--------------------------------------------------------------
11-Aug-2026 10:12:04  LOGIN         P.SHARMA
11-Aug-2026 10:13:41  METHOD LOAD   RM-AMXAPI-IDENT-FTIR (v4)
11-Aug-2026 10:14:22  BACKGROUND    32 scans, 4 cm-1, KBr blank
11-Aug-2026 10:16:50  SCAN 1        Sample AMXAPI-2026-0088 / KBr disc
11-Aug-2026 10:18:03  SEARCH        Library REF-SPEC-AMX-04
11-Aug-2026 10:18:04  RESULT        Correlation 0.9418
11-Aug-2026 10:18:04  FLAG          Below method threshold 0.980
11-Aug-2026 10:22:37  SCAN 2        Repeat preparation, fresh KBr disc
11-Aug-2026 10:23:55  SEARCH        Library REF-SPEC-AMX-04
11-Aug-2026 10:23:56  RESULT        Correlation 0.9421
11-Aug-2026 10:23:56  FLAG          Below method threshold 0.980
11-Aug-2026 10:25:10  COMMENT       P.SHARMA: "Repeat confirms first scan.
                                     Escalated to supervisor."
11-Aug-2026 10:26:44  NO DELETIONS  No records deleted in this session
11-Aug-2026 10:27:02  LOGOUT        P.SHARMA
--------------------------------------------------------------
END OF AUDIT TRAIL`;

const TIAMO_RM_AUDIT = `TIAMO 2.4 - INSTRUMENT AUDIT TRAIL
Instrument      : KFT-2024-005 (Metrohm 851 Titrando)
Software        : tiamo 2.4 SR1
Report exported : 02-Aug-2026 11:41:06
Exported by     : P.SHARMA (Analyst)
--------------------------------------------------------------
11-Aug-2026 11:02:11  LOGIN         P.SHARMA
11-Aug-2026 11:03:30  METHOD LOAD   RM-KF-COULOMETRIC (v2)
11-Aug-2026 11:04:12  DRIFT CHECK   3.1 ug/min - within limit 10 ug/min
11-Aug-2026 11:08:47  DETERMINATION 1  Sample 0.5024 g / Result 0.37 % w/w
11-Aug-2026 11:14:20  DETERMINATION 2  Sample 0.4988 g / Result 0.39 % w/w
11-Aug-2026 11:14:21  MEAN          0.38 % w/w  (RSD 3.7 %)
11-Aug-2026 11:14:21  SPEC CHECK    NMT 0.50 % w/w - within specification
11-Aug-2026 11:16:03  NO DELETIONS  No determinations deleted or repeated
11-Aug-2026 11:16:40  LOGOUT        P.SHARMA
--------------------------------------------------------------
END OF AUDIT TRAIL`;

const MASTERSIZER_AUDIT = `MASTERSIZER 3000 - INSTRUMENT AUDIT TRAIL
Instrument      : PSD-2023-001 (Malvern Mastersizer 3000, Aero S)
Software        : Mastersizer 3000 v3.81
Report exported : 02-Aug-2026 12:20:55
Exported by     : A.KULKARNI (Analyst)
--------------------------------------------------------------
11-Aug-2026 11:40:09  LOGIN         A.KULKARNI
11-Aug-2026 11:41:15  SOP LOAD      RM-PSD-DRY-AMXAPI (v3)
11-Aug-2026 11:42:00  ALIGNMENT     Verified - background 12 units
11-Aug-2026 11:45:31  MEASUREMENT 1 D10 18.9 / D50 47.8 / D90 96.2 um
11-Aug-2026 11:47:02  MEASUREMENT 2 D10 19.4 / D50 48.3 / D90 97.1 um
11-Aug-2026 11:48:36  MEASUREMENT 3 D10 19.2 / D50 48.5 / D90 96.8 um
11-Aug-2026 11:48:37  MEAN          D50 48.2 um  (RSD 0.8 %)
11-Aug-2026 11:48:37  SPEC CHECK    D50 40-60 um - within specification
11-Aug-2026 11:50:12  NO DELETIONS  No measurements excluded
11-Aug-2026 11:51:00  LOGOUT        A.KULKARNI
--------------------------------------------------------------
END OF AUDIT TRAIL`;

const SPECTRUM: StandaloneInstrument = {
  name: "Spectrum ES",
  version: "10.6.2",
  source: "Spectrum ES",
  analyst: "Priya Sharma",
  loginAt: "11-Aug-2026 10:12",
  logoutAt: "11-Aug-2026 10:27",
  pdfFilename: "SpectrumES_FTIR2024002_AMXAPI-2026-0088_11Aug2026.pdf",
  auditTrail: SPECTRUM_AUDIT,
};

const TIAMO_RM: StandaloneInstrument = {
  name: "Tiamo",
  version: "2.4",
  source: "Tiamo 2.4",
  analyst: "Priya Sharma",
  loginAt: "11-Aug-2026 11:02",
  logoutAt: "11-Aug-2026 11:16",
  pdfFilename: "Tiamo_KFT2024005_AMXAPI-2026-0088_11Aug2026.pdf",
  auditTrail: TIAMO_RM_AUDIT,
};

const MASTERSIZER: StandaloneInstrument = {
  name: "Mastersizer 3000",
  version: "3.81",
  source: "Mastersizer 3000",
  analyst: "Anil Kulkarni",
  loginAt: "11-Aug-2026 11:40",
  logoutAt: "11-Aug-2026 11:51",
  pdfFilename: "Mastersizer_PSD2023001_AMXAPI-2026-0088_11Aug2026.pdf",
  auditTrail: MASTERSIZER_AUDIT,
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
  /* --- Identity (FTIR) — the characteristic raw material check ------------ */
  section(
    "identity",
    "FTIR Spectrometer",
    1,
    [
      // LEVEL D — demonstration scenario.
      flagged({
        prefix: P,
        label: "FTIR spectral correlation below acceptance threshold",
        reference: "Correlation 0.942",
        expected: "Correlation coefficient not less than 0.980 — STP-RM-FTIR-001 §7.4",
        actual: "Correlation coefficient 0.942 against REF-SPEC-AMX-04",
        expectedSource: "STP-RM-FTIR-001 §7.4",
        source: "Spectrum ES",
        comparison:
          "Correlation is 0.038 below the acceptance threshold; the repeat scan returned 0.942 against the same library reference",
        flagReason:
          "The FTIR spectrum does not meet the identity acceptance criterion. A correlation below 0.980 does not confirm the material as Amoxicillin Trihydrate against the current library reference, and both scans in the session returned the same result.",
        flagAction:
          "Confirm sample preparation and KBr disc quality with the analyst, then review the repeat scan in the Spectrum ES audit trail. If correlation remains below 0.980, raise a material investigation before the batch is dispositioned.",
        table: {
          caption: "Identity scans — session of 11-Aug-2026",
          columns: ["Scan", "Preparation", "Correlation", "Threshold", "Outcome"],
          rows: [
            {
              cells: ["Scan 1", "KBr disc, 32 scans", "0.942", "0.980", "Below threshold"],
              flagged: true,
            },
            {
              cells: [
                "Scan 2",
                "Fresh KBr disc, 32 scans",
                "0.942",
                "0.980",
                "Below threshold",
              ],
              flagged: true,
            },
          ],
        },
      }),
      compliant({
        prefix: P,
        label: "Reference spectrum REF-SPEC-AMX-04",
        reference: "Issued 12-Mar-2026",
        statusText: "Current",
        expected: "Current library reference spectrum — SOP-RM-QC-001 §4.2",
        actual: "REF-SPEC-AMX-04 — current version, issued 12-Mar-2026, valid to 11-Mar-2027",
        expectedSource: "SOP-RM-QC-001 §4.2",
        source: "Caliber LIMS",
        details: [
          { label: "Spectrum ID", value: "REF-SPEC-AMX-04" },
          { label: "Material", value: "Amoxicillin Trihydrate, USP grade" },
          { label: "Library", value: "Site FTIR identity library, revision 11" },
          { label: "Acquisition mode", value: "KBr transmission, 32 scans, 4 cm-1" },
          { label: "Issued", value: "12-Mar-2026" },
          { label: "Valid to", value: "11-Mar-2027" },
          { label: "Supersedes", value: "REF-SPEC-AMX-03, retired 12-Mar-2026" },
          { label: "Status in LIMS", value: "Current, no open change control" },
        ],
      }),
      compliant({
        prefix: P,
        label: "Potassium bromide IR grade",
        requiresQuantityCheck: true,
        prescribedQty: "200 mg ± 10 mg",
        actualQty: "198 mg",
        quantityComparison: "WITHIN TOLERANCE",
        reference: "Lot KBR-2024-031",
        expected: "Active entry, within expiry — SOP-CHEM-003",
        actual: "Potassium bromide IR grade — Lot KBR-2024-031 — active, expiry 31-Dec-2026",
        expectedSource: "SOP-CHEM-003",
        source: "Caliber LIMS",
      }),
      compliant({
        prefix: P,
        label: "FTIR Spectrometer FTIR-2024-002",
        serialContinuity: { range: "Scan #001 – #003" },
        reference: "Cal. due 20-Oct-2026",
        statusText: "Calibrated",
        expected: "Calibration due date after date of use — SOP-INST-004",
        actual: "FTIR-2024-002 — calibrated 20-Apr-2026, due 20-Oct-2026, used 10:12 to 10:27",
        expectedSource: "SOP-INST-004",
        source: "Caliber LIMS",
      }),
    ],
    { standaloneInstrument: SPECTRUM },
  ),

  /* --- Assay (HPLC) — the standard five-section Empower layout ------------ */
  section("assay", "Chemicals", 1, [
    /*
     * LEVEL D — written as a compliant entry on purpose. Nothing here says
     * FLAGGED; the unauthorised inactivation is what flags it, so a future
     * entry cannot be added in this state and quietly read as green.
     */
    compliant({
      prefix: P,
      label: "Triethylamine HPLC grade",
      reference: "Lot TEA-2025-04",
      statusText: "Inactivated",
      requiresQuantityCheck: true,
      prescribedQty: "5 mL",
      actualQty: "5 mL",
      expected: "Inactivation authorised before the entry leaves service — SOP-CHEM-003 §7",
      actual:
        "Triethylamine HPLC grade — Lot TEA-2025-04 — inactivated 03-Aug-2026, authorisation not recorded",
      expectedSource: "SOP-CHEM-003 §7",
      source: "Caliber LIMS",
      inactivationStatus: "Pending Second Approval",
      inactivationReason: "Recorded as decanted to a secondary container",
      inactivationInitiatedBy: "M. Rao, QC Section In-Charge",
      inactivationInitiatedDate: "03-Aug-2026",
      comparison:
        "The entry is inactivated in LIMS but carries no authorisation record against the inactivation",
      flagReason:
        "Lot TEA-2025-04 was inactivated on 03-Aug-2026 but the inactivation has not been authorised. Until it is, there is no record of who withdrew the reagent from service or why, and the entry was still available to the analysis.",
      flagAction:
        "Second QC Section In-Charge approval required. Do not release until both approvals recorded. Confirm whether the reagent was used after it was inactivated. Both approvals required per FU7-QA-GEN-080 + APL-GP-GEN-0023.",
      details: [
        { label: "Lot number", value: "TEA-2025-04" },
        { label: "Manufacturer", value: "Spectrochem" },
        { label: "Reason for inactivation", value: "Recorded as decanted to a secondary container" },
        { label: "Inactivated on", value: "03-Aug-2026" },
        { label: "Authorised by", value: "Not recorded" },
        { label: "Status in LIMS", value: "Inactivated, authorisation outstanding" },
      ],
    }),
    compliant({
      prefix: P,
      label: "Acetonitrile HPLC grade",
      requiresQuantityCheck: true,
      prescribedQty: "450 mL",
      actualQty: "450 mL",
      reference: "Lot AC-2024-0441",
      expected: "Active entry, within expiry — SOP-CHEM-003",
      actual: "Acetonitrile HPLC grade — Lot AC-2024-0441 — active, expiry 30-Nov-2026",
      expectedSource: "SOP-CHEM-003",
      source: "Caliber LIMS",
    }),
    compliant({
      prefix: P,
      label: "Potassium dihydrogen phosphate",
      requiresQuantityCheck: true,
      prescribedQty: "13.6 g ± 5%",
      actualQty: "13.61 g",
      quantityComparison: "WITHIN TOLERANCE",
      reference: "Lot PH-2024-0892",
      expected: "Active entry, within expiry — SOP-CHEM-003",
      actual: "Potassium dihydrogen phosphate — Lot PH-2024-0892 — active, expiry 15-Aug-2027",
      expectedSource: "SOP-CHEM-003",
      source: "Caliber LIMS",
    }),
    compliant({
      prefix: P,
      label: "Water for HPLC",
      requiresQuantityCheck: true,
      prescribedQty: "1800 mL",
      actualQty: "1800 mL",
      reference: "Lot WH-2024-1102",
      expected: "Active entry, within expiry — SOP-CHEM-003",
      actual: "Water for HPLC — Lot WH-2024-1102 — active, expiry 30-Sep-2026",
      expectedSource: "SOP-CHEM-003",
      source: "Caliber LIMS",
    }),
  ]),
  section("assay", "Standards", 2, [
    compliant({
      prefix: P,
      label: "Amoxicillin Trihydrate USP Reference Standard",
      usageSource: "Caliber LIMS — Reference Standard Record",
      potencySource: "Caliber LIMS — eLIMS Reference Standard Audit Trail",
      requiresQuantityCheck: true,
      prescribedQty: "25 mg ± 2 mg",
      actualQty: "25.2 mg",
      quantityComparison: "WITHIN TOLERANCE",
      reference: "Lot R09480",
      statusText: "Valid",
      expected: "Valid reference standard, within re-test date — SOP-STD-002",
      actual: "USP RS Lot R09480 — potency 99.6 %, re-test 30-Jun-2027",
      expectedSource: "SOP-STD-002",
      source: "Caliber LIMS",
    }),
    compliant({
      prefix: P,
      label: "Standard preparation — duplicate weighings",
      requiresQuantityCheck: true,
      prescribedQty: "25 mg per preparation ± 2 mg",
      actualQty: "25.0 mg and 24.9 mg",
      quantityComparison: "WITHIN TOLERANCE",
      reference: "STD-2026-0812-A/B",
      statusText: "Verified",
      expected: "Duplicate standard preparations agreeing within 2.0 % — STP-RM-ASSAY-001",
      actual: "STD-A 100.3 %, STD-B 99.9 % — difference 0.4 %",
      expectedSource: "STP-RM-ASSAY-001",
      source: "Waters Empower",
    }),
  ]),
  section("assay", "Instruments", 3, [
    compliant({
      prefix: P,
      label: "Weighing Balance BAL-2024-007",
      details: [
        { label: "Instrument ID", value: "BAL-2024-007" },
        { label: "Make and model", value: "Mettler Toledo XPR205" },
        { label: "Calibration status", value: "Calibrated — within interval" },
        { label: "Last calibrated", value: "05-Jun-2026" },
        { label: "Calibration due", value: "05-Dec-2026" },
        { label: "Record held in", value: "Caliber LIMS" },
      ],
      reference: "Cal. due 05-Dec-2026",
      statusText: "Calibrated",
      expected: "Calibration due date after date of use — SOP-INST-004",
      actual: "BAL-2024-007 — calibrated 05-Jun-2026, due 05-Dec-2026, used 09:10 to 09:48",
      expectedSource: "SOP-INST-004",
      source: "Caliber LIMS",
    }),
  ]),
  section("assay", "Chromatography", 4, [
    compliant({
      prefix: P,
      label: "Chromatography system HPLC-004",
      reference: "Waters Alliance e2695",
      statusText: "Calibrated",
      expected: "One system per test, calibrated and in date — SOP-HPLC-001",
      actual: "HPLC-004 — calibrated, due 31-Jan-2027, used 09:55 to 13:40",
      expectedSource: "SOP-HPLC-001",
      source: "Waters Empower",
    }),
    compliant({
      prefix: P,
      label: "System suitability — five replicate injections",
      statusText: "Compliant",
      expected: "Tailing NMT 2.0, plates NLT 2000, RSD NMT 2.0 % — STP-RM-ASSAY-001",
      actual: "Tailing 1.18, plates 6420, replicate RSD 0.42 %",
      expectedSource: "STP-RM-ASSAY-001",
      source: "Caliber LIMS — Manual Entry",
    }),
    compliant({
      prefix: P,
      label: "Assay result — Amoxicillin Trihydrate",
      reference: "Duplicate preparation",
      statusText: "Within limits",
      expected: "98.0 % to 102.0 % on the anhydrous basis — STP-RM-ASSAY-001",
      actual: "Mean 99.7 % on the anhydrous basis (99.6 % / 99.8 %)",
      expectedSource: "STP-RM-ASSAY-001",
      source: "Waters Empower",
    }),
  ]),
  section("assay", "Column", 5, [
    compliant({
      prefix: P,
      label: "Column COL-2025-03",
      reference: "Waters Symmetry C18, 250 × 4.6 mm",
      statusText: "Within life",
      expected: "Cumulative injections at or below 400 — SOP-HPLC-001 §8",
      actual: "COL-2025-03 — 214 of 400 injections used, 18 added by this test",
      expectedSource: "SOP-HPLC-001 §8",
      /* Column injection life is held in LIMS, not in Empower. */
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
        flagId: "TIA-F01",
        sopReference: "APL-CP-F-QCCI-GEN-0013 TIA-F01",
        label: "Conditioning state at determination start",
        reference: "COND BUSY not detected",
        statusText: "Clean start",
        checkDescription:
          "QRA read the Tiamo audit trail for a determination started with COND BUSY — a prohibited entry, because conditioning still running consumes titre the reading does not account for.",
        expected: "Not present",
        actual: "Not present — determination started clean",
        expectedSource: "APL-CP-F-QCCI-GEN-0013",
        source: "Tiamo 2.4",
        comparison:
          "No COND BUSY entry between conditioning stopped and determination start",
      }),
      compliant({
        prefix: P,
        flagId: "TIA-F02",
        sopReference: "APL-CP-F-QCCI-GEN-0013 TIA-F02",
        label: "Determination version",
        reference: "Version 1",
        statusText: "Original",
        checkDescription:
          "QRA read the determination version in Tiamo. Anything above 1 means the run was processed a second time, which needs a PNC behind it.",
        expected: "Version 1 (original)",
        actual: "Version 1 — original determination",
        expectedSource: "APL-CP-F-QCCI-GEN-0013",
        source: "Tiamo 2.4",
        comparison: "Determination version read against the original-run requirement",
      }),
      compliant({
        prefix: P,
        label: "Water content by Karl Fischer",
        reference: "Duplicate determinations",
        statusText: "Within limits",
        expected: "Not more than 0.50 % w/w — STP-RM-KF-002",
        actual: "Mean 0.38 % w/w (0.37 % / 0.39 %), RSD 3.7 %",
        expectedSource: "STP-RM-KF-002",
        source: "Tiamo 2.4",
        table: {
          caption: "Determinations — session of 11-Aug-2026",
          columns: ["Determination", "Sample weight", "Result", "Limit"],
          rows: [
            { cells: ["1", "0.5024 g", "0.37 % w/w", "NMT 0.50 %"] },
            { cells: ["2", "0.4988 g", "0.39 % w/w", "NMT 0.50 %"] },
            { cells: ["Mean", "—", "0.38 % w/w", "NMT 0.50 %"] },
          ],
        },
      }),
      compliant({
        prefix: P,
        label: "Drift check before first determination",
        reference: "3.1 µg/min",
        statusText: "Within limits",
        expected: "Drift not more than 10 µg/min before titration — SOP-KF-002 §6.1",
        actual: "Drift 3.1 µg/min recorded at 11:04",
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
        actual: "KFT-2024-005 — calibrated 12-Jul-2026, due 12-Jan-2027, used 11:02 to 11:16",
        expectedSource: "SOP-INST-004",
        source: "Caliber LIMS",
      }),
      ...titratorRoutineChecks(P, {
        analysisDate: "11-Aug-2026",
        sampleName: "Amoxicillin Trihydrate API",
        arNumber: "07-RM-26-4417",
        weight: "0.2014 g",
        determinationStart: "10:22:04",
        weightPrintStart: "10:22:31",
        serialRange: "Trial #001 – #003",
      }),
    ],
    { standaloneInstrument: TIAMO_RM },
  ),

  /* --- Particle Size ------------------------------------------------------ */
  section(
    "psd",
    "Particle Analyser",
    1,
    [
      compliant({
        prefix: P,
        label: "Particle size distribution — D50",
        reference: "Three measurements",
        statusText: "Within limits",
        expected: "D50 between 40 µm and 60 µm — STP-RM-PSD-001",
        actual: "Mean D50 48.2 µm, RSD 0.8 %",
        expectedSource: "STP-RM-PSD-001",
        source: "Mastersizer 3000",
        table: {
          caption: "Laser diffraction measurements — dry dispersion, Aero S",
          columns: ["Measurement", "D10 (µm)", "D50 (µm)", "D90 (µm)"],
          rows: [
            { cells: ["1", "18.9", "47.8", "96.2"] },
            { cells: ["2", "19.4", "48.3", "97.1"] },
            { cells: ["3", "19.2", "48.5", "96.8"] },
            { cells: ["Mean", "19.2", "48.2", "96.7"] },
          ],
        },
      }),
      compliant({
        prefix: P,
        label: "Optical alignment and background",
        reference: "12 units",
        statusText: "Verified",
        expected: "Background not more than 20 units before measurement — SOP-PSD-001 §5",
        actual: "Alignment verified, background 12 units recorded at 11:42",
        expectedSource: "SOP-PSD-001 §5",
        source: "Mastersizer 3000",
      }),
      compliant({
        prefix: P,
        label: "Particle Size Analyser PSD-2023-001",
        serialContinuity: { range: "Measurement #001 – #003" },
        reference: "Cal. due 28-Feb-2027",
        statusText: "Calibrated",
        expected: "Calibration due date after date of use — SOP-INST-004",
        actual: "PSD-2023-001 — calibrated 28-Aug-2025, due 28-Feb-2027, used 11:40 to 11:51",
        expectedSource: "SOP-INST-004",
        source: "Caliber LIMS",
      }),
    ],
    { standaloneInstrument: MASTERSIZER },
  ),

  /* --- Heavy Metals (ICP) — still a paper record at this site ------------- */
  section(
    "metals",
    "ICP-OES Results — Logbook",
    1,
    [
      compliant({
        prefix: P,
        label: "Lead (Pb)",
        reference: "Qtegra run ICP-2026-0331",
        statusText: "Within limits",
        expected: "Not more than 0.5 ppm — ICH Q3D Option 1, oral daily dose",
        actual: "0.08 ppm transcribed from logbook LB-2026-RM-003 Page 4",
        expectedSource: "ICH Q3D",
        source: "Paper Logbook",
      }),
      compliant({
        prefix: P,
        label: "Cadmium (Cd)",
        reference: "Qtegra run ICP-2026-0331",
        statusText: "Within limits",
        expected: "Not more than 0.5 ppm — ICH Q3D Option 1, oral daily dose",
        actual: "Below quantitation limit, transcribed from logbook LB-2026-RM-003 Page 4",
        expectedSource: "ICH Q3D",
        source: "Paper Logbook",
      }),
      compliant({
        prefix: P,
        label: "Arsenic (As)",
        reference: "Qtegra run ICP-2026-0331",
        statusText: "Within limits",
        expected: "Not more than 1.5 ppm — ICH Q3D Option 1, oral daily dose",
        actual: "0.21 ppm transcribed from logbook LB-2026-RM-003 Page 4",
        expectedSource: "ICH Q3D",
        source: "Paper Logbook",
      }),
      compliant({
        prefix: P,
        label: "Mercury (Hg)",
        reference: "Qtegra run ICP-2026-0331",
        statusText: "Within limits",
        expected: "Not more than 3.0 ppm — ICH Q3D Option 1, oral daily dose",
        actual: "Below quantitation limit, transcribed from logbook LB-2026-RM-003 Page 4",
        expectedSource: "ICH Q3D",
        source: "Paper Logbook",
      }),
    ],
    {
      paperLogbook: {
        reference: "Logbook LB-2026-RM-003",
        page: "Page 4",
        description: "Heavy metals by ICP — results recorded by hand",
        note: "The Qtegra ICP at this site does not write to LIMS, so run ICP-2026-0331 was transcribed into the departmental logbook. QRA has no electronic record to compare against.",
      },
    },
  ),

  /*
   * Each of these instruments writes its own record and hands it over as a
   * PDF in LIMS. Nothing here can be queried, so the six questions have to be
   * read off the report by a person — which is exactly why they are listed.
   */
  section(
    "identity",
    "FTIR Audit Trail",
    2,
    nonCdsAuditTrail(P, "Spectrum ES", "Spectrum ES", "Trial #001 – #003"),
  ),
  section(
    "metals",
    "ICP-OES Audit Trail",
    2,
    nonCdsAuditTrail(P, "Qtegra", "Qtegra ICP", "Run #001 – #002"),
  ),
  section(
    "psd",
    "Particle Analyser Audit Trail",
    2,
    nonCdsAuditTrail(P, "Mastersizer 3000", "Mastersizer 3000", "Run #001 – #004"),
  ),
];

export const RAW_MATERIAL_BATCHES: Batch[] = [
  {
    id: "07-RM-26-4417",
    arNumber: "07-RM-26-4417",
  limsStatus: "Under QC Review",
    product: "Amoxicillin Trihydrate API",
    batchNumber: "AMXAPI-2026-0088",
    domain: "RAW_MATERIAL",
    specVersion: "v2.1",
    specCurrent: true,
    slaDeadline: "03-Aug-2026 18:00",
    slaStatus: "amber",
    slaLabel: "Approaching SLA",
    status: "NEEDS_REVIEW",
    assignedTo: "arjun-mehta",
    analyst: "Priya Sharma",
    lastActivity: "08:30 AM today",
    parameters: RM_PARAMETERS,
    sections: withAttendance(sections, "Meena Nair", "11-Aug-2026", []),
    dataSources: [
      "Caliber LIMS",
      "Waters Empower",
      "Spectrum ES",
      "Tiamo 2.4",
      "Mastersizer 3000",
      "Paper Logbook",
    ],
  },
];
