import type { Batch, Section, StandaloneInstrument, TestParameter } from "@/types";
import { compliant, flagged, section } from "./factories";

/**
 * Packing Material review — HDPE Bottle 60 ml.
 *
 * LEVEL D — demonstration scenario. Barcode grade is the characteristic
 * packing material check; the flag is a print quality grade one step below
 * the specification minimum, which affects scanning at the trade channel.
 *
 * Two of the five sections at this site are still paper records.
 */

const P = "pm";

const PM_PARAMETERS: TestParameter[] = [
  {
    id: "identity",
    name: "Identity",
    shortName: "Identity",
    methodType: "FTIR",
    stpReference: "STP-PM-FTIR-002",
  },
  {
    id: "dimensions",
    name: "Dimensions",
    shortName: "Dimensions",
    methodType: "Physical measurement",
    stpReference: "STP-PM-DIM-001",
  },
  {
    id: "barcode",
    name: "Barcode Verification",
    shortName: "Barcode",
    methodType: "Barcode verifier",
    stpReference: "STP-PM-BAR-001",
  },
  {
    id: "weight",
    name: "Weight",
    shortName: "Weight",
    methodType: "Gravimetric",
    stpReference: "STP-PM-WGT-001",
  },
  {
    id: "coa",
    name: "COA Verification",
    shortName: "COA",
    methodType: "Document check",
    stpReference: "SOP-PM-QC-002",
  },
];

/* -------------------------------------------------------------------------- */
/* Standalone instruments                                                     */
/* -------------------------------------------------------------------------- */

const SPECTRUM_PM_AUDIT = `SPECTRUM ES - INSTRUMENT AUDIT TRAIL
Instrument      : FTIR-2024-002 (PerkinElmer Spectrum Two)
Software        : Spectrum ES 10.6.2
Report exported : 12-Aug-2026 15:02:40
Exported by     : S.NAIR (Analyst)
--------------------------------------------------------------
12-Aug-2026 13:20:11  LOGIN         S.NAIR
12-Aug-2026 13:21:35  METHOD LOAD   PM-HDPE-IDENT-ATR (v2)
12-Aug-2026 13:22:10  BACKGROUND    16 scans, 4 cm-1, clean ATR crystal
12-Aug-2026 13:24:48  SCAN 1        Bottle wall section, sample 1 of 3
12-Aug-2026 13:25:59  SEARCH        Library REF-SPEC-HDPE-02
12-Aug-2026 13:26:00  RESULT        Correlation 0.9912
12-Aug-2026 13:28:14  SCAN 2        Bottle wall section, sample 2 of 3
12-Aug-2026 13:29:20  RESULT        Correlation 0.9908
12-Aug-2026 13:31:47  SCAN 3        Bottle base section, sample 3 of 3
12-Aug-2026 13:32:55  RESULT        Correlation 0.9915
12-Aug-2026 13:32:56  SPEC CHECK    NLT 0.980 - all scans within specification
12-Aug-2026 13:34:02  NO DELETIONS  No records deleted in this session
12-Aug-2026 13:35:18  LOGOUT        S.NAIR
--------------------------------------------------------------
END OF AUDIT TRAIL`;

const ASCOM_AUDIT = `ASCOM BRC2002 - BARCODE VERIFIER AUDIT TRAIL
Instrument      : BRC-2025-001 (Ascom BRC2002)
Software        : BRC2002 Verifier 4.1.7
Standard        : ISO/IEC 15416 - linear symbol print quality
Report exported : 12-Aug-2026 16:14:03
Exported by     : S.NAIR (Analyst)
--------------------------------------------------------------
12-Aug-2026 15:40:22  LOGIN         S.NAIR
12-Aug-2026 15:41:08  METHOD LOAD   PM-BARCODE-GS1-128 (v3)
12-Aug-2026 15:41:44  CALIBRATION   Verified against EAN-13 calibration card
12-Aug-2026 15:44:19  SCAN 1        Label 1 - Overall grade C (1.7)
12-Aug-2026 15:44:19  DETAIL        Decode A / Contrast B / Modulation C
12-Aug-2026 15:44:19  DETAIL        Defects C / Decodability C / Rmin A
12-Aug-2026 15:46:33  SCAN 2        Label 2 - Overall grade C (1.8)
12-Aug-2026 15:48:51  SCAN 3        Label 3 - Overall grade C (1.6)
12-Aug-2026 15:51:02  SCAN 4        Label 4 - Overall grade C (1.9)
12-Aug-2026 15:53:27  SCAN 5        Label 5 - Overall grade C (1.7)
12-Aug-2026 15:53:28  MEAN GRADE    C (1.74)
12-Aug-2026 15:53:28  FLAG          Below method minimum grade B (2.5)
12-Aug-2026 15:55:40  COMMENT       S.NAIR: "Modulation and defects limiting.
                                     Ink coverage inconsistent across roll."
12-Aug-2026 15:57:11  NO DELETIONS  No scans deleted or excluded
12-Aug-2026 15:58:02  LOGOUT        S.NAIR
--------------------------------------------------------------
END OF AUDIT TRAIL`;

const SPECTRUM_PM: StandaloneInstrument = {
  name: "Spectrum ES",
  version: "10.6.2",
  source: "Spectrum ES",
  analyst: "Sunita Nair",
  loginAt: "12-Aug-2026 13:20",
  logoutAt: "12-Aug-2026 13:35",
  pdfFilename: "SpectrumES_FTIR2024002_HDPE-2026-1147_12Aug2026.pdf",
  auditTrail: SPECTRUM_PM_AUDIT,
};

const ASCOM: StandaloneInstrument = {
  name: "Ascom BRC2002",
  version: "4.1.7",
  source: "Ascom BRC2002",
  analyst: "Sunita Nair",
  loginAt: "12-Aug-2026 15:40",
  logoutAt: "12-Aug-2026 15:58",
  pdfFilename: "AscomBRC2002_BRC2025001_HDPE-2026-1147_12Aug2026.pdf",
  auditTrail: ASCOM_AUDIT,
};

/* -------------------------------------------------------------------------- */
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

const sections: Section[] = [
  /* --- Identity (FTIR) ---------------------------------------------------- */
  section(
    "identity",
    "FTIR Spectrometer",
    1,
    [
      compliant({
        prefix: P,
        label: "HDPE identity by ATR-FTIR",
        reference: "Three sampling points",
        statusText: "Confirmed",
        expected: "Correlation not less than 0.980 against REF-SPEC-HDPE-02 — STP-PM-FTIR-002",
        actual: "Mean correlation 0.991 across three scans",
        expectedSource: "STP-PM-FTIR-002",
        source: "Spectrum ES",
        table: {
          caption: "Identity scans — session of 12-Aug-2026",
          columns: ["Scan", "Sampling point", "Correlation", "Threshold"],
          rows: [
            { cells: ["1", "Bottle wall", "0.9912", "NLT 0.980"] },
            { cells: ["2", "Bottle wall", "0.9908", "NLT 0.980"] },
            { cells: ["3", "Bottle base", "0.9915", "NLT 0.980"] },
            { cells: ["Mean", "—", "0.9912", "NLT 0.980"] },
          ],
        },
      }),
      compliant({
        prefix: P,
        label: "Reference spectrum REF-SPEC-HDPE-02",
        reference: "Issued 04-Feb-2026",
        statusText: "Current",
        expected: "Current library reference spectrum — SOP-PM-QC-001 §4.2",
        actual: "REF-SPEC-HDPE-02 — current version, issued 04-Feb-2026, valid to 03-Feb-2027",
        expectedSource: "SOP-PM-QC-001 §4.2",
        source: "Caliber LIMS",
      }),
      compliant({
        prefix: P,
        label: "FTIR Spectrometer FTIR-2024-002",
        reference: "Cal. due 20-Oct-2026",
        statusText: "Calibrated",
        expected: "Calibration due date after date of use — SOP-INST-004",
        actual: "FTIR-2024-002 — calibrated 20-Apr-2026, due 20-Oct-2026, used 13:20 to 13:35",
        expectedSource: "SOP-INST-004",
        source: "Caliber LIMS",
      }),
    ],
    { standaloneInstrument: SPECTRUM_PM },
  ),

  /* --- Dimensions — measured by hand, recorded on paper ------------------- */
  section(
    "dimensions",
    "Physical Measurement — Logbook",
    1,
    [
      compliant({
        prefix: P,
        label: "Bottle height",
        reference: "10 bottles measured",
        statusText: "Within limits",
        expected: "72 mm ± 1 mm — STP-PM-DIM-001",
        actual: "Mean 72.4 mm, range 72.1 mm to 72.7 mm",
        expectedSource: "STP-PM-DIM-001",
        source: "Paper Logbook",
      }),
      compliant({
        prefix: P,
        label: "Neck diameter",
        reference: "10 bottles measured",
        statusText: "Within limits",
        expected: "38 mm ± 0.5 mm — STP-PM-DIM-001",
        actual: "Mean 38.2 mm, range 38.0 mm to 38.4 mm",
        expectedSource: "STP-PM-DIM-001",
        source: "Paper Logbook",
      }),
      compliant({
        prefix: P,
        label: "Vernier caliper VC-2024-012",
        reference: "Cal. due 30-Nov-2026",
        statusText: "Calibrated",
        expected: "Calibration due date after date of use — SOP-INST-004",
        actual: "VC-2024-012 — calibrated 30-May-2026, due 30-Nov-2026",
        expectedSource: "SOP-INST-004",
        source: "Caliber LIMS",
      }),
    ],
    {
      paperLogbook: {
        reference: "Logbook LB-2026-PM-011",
        page: "Page 7",
        description: "Bottle dimensions — measured and recorded by hand",
        note: "Height and neck diameter are taken with a vernier caliper and written into the departmental logbook. QRA has no electronic record to compare the transcribed values against.",
      },
    },
  ),

  /* --- Barcode Verification — the characteristic packing material check --- */
  section(
    "barcode",
    "Barcode Verifier",
    1,
    [
      // LEVEL D — demonstration scenario.
      flagged({
        prefix: P,
        label: "Barcode print quality below specification grade",
        reference: "Mean grade C (1.74)",
        expected:
          "Overall print quality grade B or better — ISO/IEC 15416 and SOP-PM-QC-004 §6.3",
        actual: "Mean overall grade C (1.74) across five labels",
        expectedSource: "SOP-PM-QC-004 §6.3",
        source: "Ascom BRC2002",
        comparison:
          "Every one of the five labels verified graded C; none reached the grade B minimum, with modulation and defects the limiting parameters",
        flagReason:
          "The GS1-128 symbol does not meet the print quality grade required by the specification. Grade C symbols scan less reliably at the distributor and pharmacy, and the site specification sets grade B as the minimum for use on the packing line.",
        flagAction:
          "Confirm the grade against the supplier certificate for label roll LBL-2026-0771 and review ink coverage with the printing vendor. Record the finding against the batch and confirm whether the roll is to be rejected before it reaches the packing line.",
        table: {
          caption: "Barcode verification — five labels, ISO/IEC 15416",
          columns: ["Label", "Overall grade", "Modulation", "Defects", "Minimum"],
          rows: [
            { cells: ["1", "C (1.7)", "C", "C", "B (2.5)"], flagged: true },
            { cells: ["2", "C (1.8)", "C", "B", "B (2.5)"], flagged: true },
            { cells: ["3", "C (1.6)", "C", "C", "B (2.5)"], flagged: true },
            { cells: ["4", "C (1.9)", "B", "C", "B (2.5)"], flagged: true },
            { cells: ["5", "C (1.7)", "C", "C", "B (2.5)"], flagged: true },
          ],
        },
      }),
      compliant({
        prefix: P,
        label: "Verifier calibration check before use",
        reference: "EAN-13 calibration card",
        statusText: "Verified",
        expected: "Calibration card verified before the first scan — SOP-PM-QC-004 §5.1",
        actual: "Calibration verified at 15:41 against the EAN-13 reference card",
        expectedSource: "SOP-PM-QC-004 §5.1",
        source: "Ascom BRC2002",
      }),
      compliant({
        prefix: P,
        label: "Barcode content — GTIN and batch",
        reference: "GS1-128",
        statusText: "Correct",
        expected: "GTIN and batch number matching the packing order — SOP-PM-QC-004 §6.1",
        actual: "GTIN 08901234567890, batch HDPE-2026-1147 — decoded correctly on all five labels",
        expectedSource: "SOP-PM-QC-004 §6.1",
        source: "Ascom BRC2002",
        details: [
          { label: "Symbology", value: "GS1-128" },
          { label: "GTIN decoded", value: "08901234567890" },
          { label: "Batch decoded", value: "HDPE-2026-1147" },
          { label: "Packing order", value: "PO-2026-0774" },
          { label: "Label roll", value: "LBL-2026-0771" },
          { label: "Labels verified", value: "5 of 5 decoded without error" },
          { label: "Verifier", value: "BRC-2025-001, Ascom BRC2002" },
          { label: "Read on", value: "12-Aug-2026 · 15:44 to 15:53" },
        ],
      }),
    ],
    { standaloneInstrument: ASCOM },
  ),

  /* --- Weight ------------------------------------------------------------- */
  section("weight", "Weight Check", 1, [
    compliant({
      prefix: P,
      label: "Bottle weight",
      reference: "20 bottles weighed",
      statusText: "Within limits",
      expected: "27.0 g to 30.0 g — STP-PM-WGT-001",
      actual: "Mean 28.4 g, range 27.9 g to 28.9 g, RSD 1.1 %",
      expectedSource: "STP-PM-WGT-001",
      source: "Caliber LIMS",
      table: {
        caption: "Weight check — summary of 20 bottles",
        columns: ["Statistic", "Value", "Specification"],
        rows: [
          { cells: ["Mean", "28.4 g", "27.0 – 30.0 g"] },
          { cells: ["Minimum", "27.9 g", "27.0 g"] },
          { cells: ["Maximum", "28.9 g", "30.0 g"] },
          { cells: ["RSD", "1.1 %", "NMT 3.0 %"] },
        ],
      },
    }),
    compliant({
      prefix: P,
      label: "Weighing Balance BAL-2024-011",
      reference: "Cal. due 18-Jan-2027",
      statusText: "Calibrated",
      expected: "Calibration due date after date of use — SOP-INST-004",
      actual: "BAL-2024-011 — calibrated 18-Jul-2026, due 18-Jan-2027, used 14:05 to 14:38",
      expectedSource: "SOP-INST-004",
      source: "Caliber LIMS",
    }),
  ]),

  /* --- COA Verification — a supplier document, verified by hand ----------- */
  section(
    "coa",
    "Supplier COA Verification",
    1,
    [
      compliant({
        prefix: P,
        label: "Supplier certificate of analysis",
        reference: "COA-MJT-PM-2026-0823",
        statusText: "Received",
        expected:
          "Supplier COA on file, matching the received consignment — SOP-PM-QC-002 §4.4",
        actual:
          "COA-MJT-PM-2026-0823 from Mahajan Thermoplastics, dated 28-Jul-2026, filed against GRN-2026-4471",
        expectedSource: "SOP-PM-QC-002 §4.4",
        source: "Paper Logbook",
      }),
      compliant({
        prefix: P,
        label: "COA declared values against site specification",
        reference: "Resin grade and additives",
        statusText: "Consistent",
        expected: "Declared resin grade and additive package as per the qualified supplier file",
        actual:
          "HDPE resin grade HD5502FA declared, matching the qualified supplier file; no additive change declared",
        expectedSource: "SOP-PM-QC-002 §4.4",
        source: "Paper Logbook",
      }),
    ],
    {
      paperLogbook: {
        reference: "Supplier COA COA-MJT-PM-2026-0823",
        page: "Filed against GRN-2026-4471",
        description: "Supplier certificate of analysis — paper document on file",
        note: "The supplier issues this certificate on paper and it is filed in the goods receipt binder. The reviewer must confirm the document matches the consignment physically received; QRA cannot read it.",
      },
    },
  ),
];

export const PACKING_MATERIAL_BATCHES: Batch[] = [
  {
    id: "PM-AR-2026-008823",
    arNumber: "PM-AR-2026-008823",
    product: "HDPE Bottle 60ml",
    batchNumber: "HDPE-2026-1147",
    domain: "PACKING_MATERIAL",
    specVersion: "v1.4",
    specCurrent: true,
    slaDeadline: "04-Aug-2026 12:00",
    slaStatus: "green",
    slaLabel: "Within SLA",
    status: "NEEDS_REVIEW",
    assignedTo: "arjun-mehta",
    analyst: "Sunita Nair",
    lastActivity: "10:05 AM today",
    parameters: PM_PARAMETERS,
    sections,
    dataSources: [
      "Caliber LIMS",
      "Spectrum ES",
      "Ascom BRC2002",
      "Paper Logbook",
    ],
  },
];
