import type { Batch, Section, StandaloneInstrument, TestParameter } from "@/types";
import { compliant, flagged, section } from "./factories";

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
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

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
      reference: "Cal. due 05-Dec-2026",
      statusText: "Calibrated",
      expected: "Calibration due date after date of use — SOP-INST-004",
      actual: "BAL-2024-007 — calibrated 05-Jun-2026, due 05-Dec-2026, used 09:10 to 09:48",
      expectedSource: "SOP-INST-004",
      source: "Caliber LIMS",
    }),
    compliant({
      prefix: P,
      label: "Analyst qualification — Priya Sharma",
      reference: "QUAL-2026-0114",
      statusText: "Qualified",
      expected: "Current qualification for the instrument used — SOP-INST-004 §3.1",
      actual: "Qualified for HPLC, FTIR and balance operation, valid to 31-Mar-2027",
      expectedSource: "SOP-INST-004 §3.1",
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
      source: "Waters Empower",
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
        reference: "Cal. due 12-Jan-2027",
        statusText: "Calibrated",
        expected: "Calibration due date after date of use — SOP-INST-004",
        actual: "KFT-2024-005 — calibrated 12-Jul-2026, due 12-Jan-2027, used 11:02 to 11:16",
        expectedSource: "SOP-INST-004",
        source: "Caliber LIMS",
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
];

export const RAW_MATERIAL_BATCHES: Batch[] = [
  {
    id: "RM-AR-2026-004417",
    arNumber: "RM-AR-2026-004417",
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
    sections,
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
