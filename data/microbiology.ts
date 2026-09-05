import type { Batch, CheckItem, Section, TestParameter } from "@/types";
import { compliant, flagged, section } from "./factories";
import { attendanceCheck } from "./checks";

/**
 * Microbiology.
 *
 * Reviewed to Format 2 rather than Format 1, and it differs from the
 * chemistry domains in ways that matter to a reviewer:
 *
 *  - Out-of-limit, not out-of-specification. A count above its limit is an
 *    OOL, and the site's investigation route for one is different.
 *  - Environmental monitoring takes a negative control only. Everywhere else
 *    the absence of a positive control is a finding; here asking for one
 *    would be asking for something the method does not use.
 *  - Media is traceable in three parts — lot, preparation date, expiry — and
 *    all three are mandatory, because a plate is only as good as what was
 *    poured into it and when.
 *
 * Governing SOP: FU7-QA-GEN-080 §4.6. Vitek 2, ICDAS, Hygrolab and MBMS
 * audit trails are deferred to their own instrument SOPs and are out of
 * scope here.
 */

const P = "mb";

const SOP = "FU7-QA-GEN-080";
const sopFor = (clause: string) => `${SOP} §4.6.1.${clause}`;

/* -------------------------------------------------------------------------- */
/* Test parameters                                                            */
/* -------------------------------------------------------------------------- */

const MB_PARAMETERS: TestParameter[] = [
  {
    id: "mlt",
    name: "Product / Material MLT",
    shortName: "Product / Material MLT",
    methodType: "Microbial limit test",
    stpReference: "STP-MB-MLT-001",
  },
  {
    id: "cleaning",
    name: "Cleaning Validation",
    shortName: "Cleaning Validation",
    methodType: "Swab / rinse recovery",
    stpReference: "STP-MB-CV-002",
  },
  {
    id: "watermicro",
    name: "Water Microbiology",
    shortName: "Water Microbiology",
    methodType: "Membrane filtration",
    stpReference: "STP-MB-WM-003",
  },
  {
    id: "em",
    name: "Environmental Monitoring",
    shortName: "Environmental Monitoring",
    methodType: "Active air / settle plate",
    stpReference: "STP-MB-EM-004",
  },
  {
    id: "waterchem",
    name: "Water Chemical",
    shortName: "Water Chemical",
    methodType: "Chemical purity",
    stpReference: "STP-MB-WC-005",
  },
  {
    id: "methodval",
    name: "Method Validation",
    shortName: "Method Validation",
    methodType: "Suitability of counting method",
    stpReference: "STP-MB-MV-006",
  },
];

/* -------------------------------------------------------------------------- */
/* Shared rows                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Media, and the three things that make a plate traceable.
 *
 * MIC-F11 makes all three mandatory. A lot number alone says which batch of
 * powder; without the preparation date and the expiry there is no way to know
 * the poured plate was still good when the sample went onto it.
 */
const mediaRows = (clause: string, media: string, lot: string): CheckItem[] => [
  compliant({
    prefix: P,
    flagId: "MIC-F11",
    sopReference: sopFor(clause),
    label: "Media lot number",
    reference: lot,
    statusText: "Traceable",
    checkDescription: `NeuraTrace read the media record for ${media}. A plate is only as good as what was poured into it, so the lot number is checked against the preparation log rather than taken from the worksheet alone.`,
    expected: "Media lot number recorded and traceable to the preparation log",
    actual: `${media} — lot ${lot}, matched to the media preparation log`,
    expectedSource: sopFor(clause),
    source: "Caliber LIMS",
    comparison: "Lot number read against the media preparation log",
  }),
  compliant({
    prefix: P,
    flagId: "MIC-F11",
    sopReference: sopFor(clause),
    label: "Media preparation date",
    reference: "18-Aug-2026",
    statusText: "Recorded",
    checkDescription:
      "NeuraTrace read the preparation date against the day of use. Media prepared too far ahead of the analysis can dry or lose selectivity before the sample ever reaches it.",
    expected: "Preparation date recorded and before the date of use",
    actual: "Prepared 18-Aug-2026, used 20-Aug-2026",
    expectedSource: sopFor(clause),
    source: "Caliber LIMS",
    comparison: "Preparation date read against the analysis date",
  }),
  compliant({
    prefix: P,
    flagId: "MIC-F11",
    sopReference: sopFor(clause),
    label: "Media expiry date",
    reference: "17-Sep-2026",
    statusText: "Within expiry",
    checkDescription:
      "NeuraTrace read the expiry against the day of use. Expired media under-recovers, so a clean plate proves nothing about the sample.",
    expected: "Expiry date on or after the date of use",
    actual: "Expires 17-Sep-2026, used 20-Aug-2026",
    expectedSource: sopFor(clause),
    source: "Caliber LIMS",
    comparison: "Expiry date read against the analysis date",
  }),
];

/** The instrument and the neutraliser behind a count. */
const equipmentRows = (
  clause: string,
  instrument: string,
  neutraliser = true,
): CheckItem[] => {
  const rows: CheckItem[] = [
    compliant({
      prefix: P,
      sopReference: sopFor(clause),
      label: "Instrument and equipment details",
      reference: instrument,
      statusText: "Calibrated",
      checkDescription: `NeuraTrace read the equipment record for ${instrument} against its calibration state. An incubator running warm or an air sampler drawing the wrong volume changes the count without changing anything on the worksheet.`,
      expected:
        "Equipment identified and within calibration at the date of use",
      actual: `${instrument} — calibrated, due 12-Jan-2027`,
      expectedSource: sopFor(clause),
      source: "Caliber LIMS",
      comparison:
        "Equipment identity and calibration read against the usage record",
    }),
  ];

  if (neutraliser) {
    rows.push(
      compliant({
        prefix: P,
        sopReference: sopFor(clause),
        label: "Neutraliser details",
        reference: "Lecithin / polysorbate 80",
        statusText: "Recorded",
        checkDescription:
          "NeuraTrace read the neutraliser record. Without an effective neutraliser, residual product carried onto the plate suppresses growth and the count reads low for a reason that has nothing to do with the sample.",
        expected: "Neutraliser identified with its lot and efficacy record",
        actual:
          "Lecithin / polysorbate 80 — lot NEU-2026-0071, efficacy verified",
        expectedSource: sopFor(clause),
        source: "Caliber LIMS",
        comparison: "Neutraliser identity and efficacy read against the method",
      }),
    );
  }

  return rows;
};

/**
 * Controls.
 *
 * A negative control is required everywhere: without it a clean plate could
 * mean a clean sample or a failed method. A positive control is required
 * everywhere except environmental monitoring, which does not use one — so
 * asking for it there would be asking for something the method never had.
 */
const controlRows = (clause: string, positive: boolean): CheckItem[] => {
  const rows: CheckItem[] = [];

  if (positive) {
    rows.push(
      compliant({
        prefix: P,
        flagId: "MIC-F05",
        sopReference: sopFor(clause),
        label: "Positive control",
        reference: "Growth confirmed",
        statusText: "Growth confirmed",
        checkDescription:
          "NeuraTrace read the positive control result. It is what shows the media and the method can recover an organism at all — without it a clean sample plate proves nothing.",
        expected: "Growth confirmed on the positive control",
        actual: "Growth confirmed",
        expectedSource: sopFor(clause),
        source: "Caliber LIMS",
        comparison: "Positive control read against the acceptance criterion",
      }),
    );
  }

  rows.push(
    compliant({
      prefix: P,
      flagId: "MIC-F06",
      sopReference: sopFor(clause),
      label: "Negative control",
      reference: "No growth",
      statusText: "No growth",
      checkDescription:
        "NeuraTrace read the negative control result. Growth here would mean the plate, the diluent or the handling introduced the organism, and every count in the set would be unreadable.",
      expected: "No growth on the negative control",
      actual: "No growth",
      expectedSource: sopFor(clause),
      source: "Caliber LIMS",
      comparison: "Negative control read against the acceptance criterion",
    }),
  );

  return rows;
};

/** Dates and signatures, the same question at the end of every parameter. */
const analysisRecordRows = (
  clause: string,
  label = "Analysis",
): CheckItem[] => [
  compliant({
    prefix: P,
    sopReference: sopFor(clause),
    label: `${label} start and completion date`,
    reference: "20-Aug-2026 to 25-Aug-2026",
    statusText: "Within incubation period",
    checkDescription:
      "NeuraTrace read the start and completion dates against the incubation period the method requires. A plate read early under-counts; one read late can overgrow.",
    expected: "Incubation period as specified by the method",
    actual: "Started 20-Aug-2026, completed 25-Aug-2026 — 5 days",
    expectedSource: sopFor(clause),
    source: "Caliber LIMS",
    comparison: "Elapsed incubation read against the method requirement",
  }),
  compliant({
    prefix: P,
    sopReference: sopFor(clause),
    label: "Analysed and checked by signatures",
    reference: "Two signatures",
    statusText: "Both present",
    checkDescription:
      "NeuraTrace read the signature record. Two signatures are what makes the result somebody's rather than the system's.",
    expected: "Analyst and checker signatures both present",
    actual: "Analysed by S. Menon · checked by D. Kulkarni",
    expectedSource: sopFor(clause),
    source: "Caliber LIMS",
    comparison: "Signature count read against the SOP requirement",
  }),
];

/**
 * The log books behind a parameter — §4.6.1.8.
 *
 * Both the instrument usage log and the media preparation log, per
 * RULE-MIC-06: one says the equipment was used when the record claims, the
 * other says the plate existed and was fit when the sample met it.
 */
const logBookSection = (
  parameter: string,
  order: number,
  media: string,
  lot: string,
  instrument: string,
): Section =>
  section(parameter, "Log Books", order, [
    ...mediaRows("8", media, lot),
    compliant({
      prefix: P,
      sopReference: sopFor("8"),
      label: "Instrument usage log",
      reference: instrument,
      statusText: "Entry present",
      checkDescription: `NeuraTrace read the usage log for ${instrument}. An analysis with no usage entry against it cannot be placed on a particular instrument on a particular day.`,
      expected: "Usage entry present for the analysis day",
      actual: `${instrument} — usage entry recorded for 20-Aug-2026`,
      expectedSource: sopFor("8"),
      source: "Caliber LIMS",
      comparison: "Usage log read against the analysis date",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("8"),
      label: "Media preparation and reconciliation log",
      reference: "MB-MEDIA-08/2026",
      statusText: "Reconciled",
      checkDescription:
        "NeuraTrace read the media preparation log against what was issued and used. Reconciliation is what catches plates poured and never accounted for.",
      expected: "Prepared, issued and used quantities reconcile",
      actual:
        "Prepared 40 plates, issued 32, used 32, discarded 8 — reconciled",
      expectedSource: sopFor("8"),
      source: "Caliber LIMS",
      comparison:
        "Preparation, issue and usage quantities read against each other",
    }),
  ]);

/* -------------------------------------------------------------------------- */
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

const sections: Section[] = [
  /* ---- 1. Product / Material MLT — §4.6.1.1 ---------------------------- */
  section("mlt", "Media and Equipment", 1, [
    ...mediaRows("1", "Soybean casein digest agar", "SCDA-2026-0812"),
    ...equipmentRows("1", "Incubator INC-MB-004"),
  ]),
  section("mlt", "Controls", 2, controlRows("1", true)),
  section("mlt", "Sample Preparation", 3, [
    compliant({
      prefix: P,
      sopReference: sopFor("1"),
      label: "Sample weight print and time and date",
      reference: "10.02 g",
      statusText: "Within tolerance",
      checkDescription:
        "NeuraTrace read the weight print against the worksheet. The count is reported per gram, so an error in the weight moves the result without touching a plate.",
      expected: "10.0 g ± 0.1 g, print timed and dated",
      actual: "10.02 g — printed 20-Aug-2026 09:14",
      expectedSource: sopFor("1"),
      source: "Caliber LIMS",
      comparison: "Weight print read against the prescribed sample weight",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("1"),
      label: "Sample dilutions",
      reference: "1:10",
      statusText: "Verified",
      checkDescription:
        "NeuraTrace read the dilution against the reported count. The dilution factor multiplies straight into the result, so an unverified one carries all the way through.",
      expected: "Dilution prepared and recorded as the method specifies",
      actual: "1:10 in 0.1 % peptone water — recorded",
      expectedSource: sopFor("1"),
      source: "Caliber LIMS",
      comparison: "Dilution factor read against the reported count",
    }),
  ]),
  section("mlt", "MLT Results", 4, [
    compliant({
      prefix: P,
      sopReference: sopFor("1"),
      label: "Total Aerobic Microbial Count (TAMC)",
      reference: "10 CFU/g",
      statusText: "Within limit",
      checkDescription:
        "NeuraTrace read the TAMC against its limit. A count inside the limit still has to be read with the controls beside it — the plate only means something if the positive control grew.",
      expected: "Not more than 1000 CFU/g — STP-MB-MLT-001",
      actual: "10 CFU/g",
      expectedSource: "STP-MB-MLT-001",
      source: "Caliber LIMS",
      comparison: "Count read against the limit",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("1"),
      label: "Total Combined Yeast and Mould Count (TYMC)",
      reference: "<10 CFU/g",
      statusText: "Within limit",
      checkDescription:
        "NeuraTrace read the TYMC against its limit. Mould recovers more slowly than bacteria, which is why it is counted on its own plate and against its own number.",
      expected: "Not more than 100 CFU/g — STP-MB-MLT-001",
      actual: "<10 CFU/g",
      expectedSource: "STP-MB-MLT-001",
      source: "Caliber LIMS",
      comparison: "Count read against the limit",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("1"),
      label: "Pathogens",
      reference: "Absent",
      statusText: "Absent",
      checkDescription:
        "NeuraTrace read the pathogen result. This one is not a count but a presence test — a single organism recovered is a finding whatever the total count says.",
      expected: "Absent in the tested quantity — STP-MB-MLT-001",
      actual: "Absent — E. coli, Salmonella, S. aureus, P. aeruginosa",
      expectedSource: "STP-MB-MLT-001",
      source: "Caliber LIMS",
      comparison: "Pathogen result read against the presence/absence criterion",
    }),
  ]),
  section("mlt", "Analysis Record", 5, analysisRecordRows("1")),
  logBookSection(
    "mlt",
    6,
    "Soybean casein digest agar",
    "SCDA-2026-0812",
    "Incubator INC-MB-004",
  ),

  /* ---- 2. Cleaning Validation — §4.6.1.2 ------------------------------- */
  section("cleaning", "Media and Equipment", 1, [
    ...mediaRows("2", "Soybean casein digest agar", "SCDA-2026-0812"),
    ...equipmentRows("2", "Incubator INC-MB-004"),
  ]),
  section("cleaning", "Controls", 2, controlRows("2", true)),
  section("cleaning", "Sample Collection", 3, [
    compliant({
      prefix: P,
      sopReference: sopFor("2"),
      label: "Sample type",
      reference: "Swab",
      statusText: "Swab",
      checkDescription:
        "NeuraTrace read which sample type was taken. A swab and a rinse recover differently and are reported against different limits, so the type has to be on the record before the count means anything.",
      expected: "Swab or rinse identified on the worksheet",
      actual: "Swab — 25 cm² template, equipment surface",
      expectedSource: sopFor("2"),
      source: "Caliber LIMS",
      comparison: "Sample type read against the reported limit basis",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("2"),
      label: "Sample collection time and date",
      reference: "19-Aug-2026 16:40",
      statusText: "Recorded",
      checkDescription:
        "NeuraTrace read the collection time against the start of incubation. A swab left too long before plating loses recoverable organisms.",
      expected:
        "Collection time and date recorded, plated within the method window",
      actual: "Collected 19-Aug-2026 16:40, plated 19-Aug-2026 17:15",
      expectedSource: sopFor("2"),
      source: "Caliber LIMS",
      comparison: "Collection time read against the time of plating",
    }),
  ]),
  section("cleaning", "Cleaning Validation Results", 4, [
    compliant({
      prefix: P,
      sopReference: sopFor("2"),
      label: "Total Microbial Count (TMC)",
      reference: "<1 CFU/cm²",
      statusText: "Within limit",
      checkDescription:
        "NeuraTrace read the TMC against the surface limit. Cleaning validation is asking whether the previous product and its organisms are gone, so the number is per unit area rather than per gram.",
      expected: "Not more than 3 CFU/cm² — STP-MB-CV-002",
      actual: "<1 CFU/cm²",
      expectedSource: "STP-MB-CV-002",
      source: "Caliber LIMS",
      comparison: "Count read against the surface limit",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("2"),
      label: "Pathogens",
      reference: "Absent",
      statusText: "Absent",
      checkDescription:
        "NeuraTrace read the pathogen result for the cleaned surface. Equipment that carries a pathogen forward contaminates every batch that follows, not only this one.",
      expected: "Absent on the swabbed surface — STP-MB-CV-002",
      actual: "Absent",
      expectedSource: "STP-MB-CV-002",
      source: "Caliber LIMS",
      comparison: "Pathogen result read against the presence/absence criterion",
    }),
  ]),
  section("cleaning", "Analysis Record", 5, analysisRecordRows("2")),
  logBookSection(
    "cleaning",
    6,
    "Soybean casein digest agar",
    "SCDA-2026-0812",
    "Incubator INC-MB-004",
  ),

  /* ---- 3. Water Microbiology — §4.6.1.3 -------------------------------- */
  section("watermicro", "Media and Equipment", 1, [
    ...mediaRows("3", "R2A agar", "R2A-2026-0804"),
    compliant({
      prefix: P,
      sopReference: sopFor("3"),
      label: "Sample and 0.1 % peptone volume",
      reference: "100 mL",
      statusText: "Recorded",
      checkDescription:
        "NeuraTrace read the filtered volume. The count is reported per 100 mL, so a different volume through the filter changes the result arithmetically.",
      expected: "100 mL sample volume filtered, rinse volume recorded",
      actual: "100 mL sample, 100 mL 0.1 % peptone rinse",
      expectedSource: sopFor("3"),
      source: "Caliber LIMS",
      comparison: "Filtered volume read against the reporting basis",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("3"),
      label: "Membrane filter details",
      reference: "0.45 µm cellulose nitrate",
      statusText: "Recorded",
      checkDescription:
        "NeuraTrace read the filter specification. A pore size above 0.45 µm lets organisms through and the plate under-counts without any sign that it has.",
      expected: "0.45 µm membrane, lot recorded",
      actual: "0.45 µm cellulose nitrate — lot MF-2026-0219",
      expectedSource: sopFor("3"),
      source: "Caliber LIMS",
      comparison: "Filter specification read against the method requirement",
    }),
    ...equipmentRows("3", "Filtration manifold FM-MB-002"),
  ]),
  section("watermicro", "Controls", 2, controlRows("3", true)),
  section("watermicro", "Water Microbiology Results", 3, [
    compliant({
      prefix: P,
      sopReference: sopFor("3"),
      label: "Total Microbial Count (TMC)",
      reference: "2 CFU/mL",
      statusText: "Within limit",
      checkDescription:
        "NeuraTrace read the TMC against the limit for this water grade. Purified water is not sterile; the question is whether the count is where the system normally holds it.",
      expected: "Not more than 100 CFU/mL — STP-MB-WM-003",
      actual: "2 CFU/mL",
      expectedSource: "STP-MB-WM-003",
      source: "Caliber LIMS",
      comparison: "Count read against the limit",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("3"),
      label: "Pathogens",
      reference: "Absent",
      statusText: "Absent",
      checkDescription:
        "NeuraTrace read the pathogen result for the water sample. A pathogen in the water system reaches every product made with it.",
      expected: "Absent — STP-MB-WM-003",
      actual: "Absent — P. aeruginosa, E. coli",
      expectedSource: "STP-MB-WM-003",
      source: "Caliber LIMS",
      comparison: "Pathogen result read against the presence/absence criterion",
    }),
  ]),

  /*
   * RULE-MIC-01 makes this a mandatory check of its own rather than a line in
   * the results: a count is only meaningful if the point was sampled when the
   * schedule says it should have been.
   */
  section("watermicro", "Sampling Schedule", 4, [
    flagged({
      prefix: P,
      flagId: "MIC-F07",
      sopReference: sopFor("3"),
      exceptionType: "Schedule Not Verified",
      label: "Sampling schedule verification",
      subLabel: "Mandatory check — RULE-MIC-01",
      reference: "Monitoring point WS-PW-07",
      checkDescription:
        "NeuraTrace looked for confirmation that this monitoring point was sampled on its scheduled rotation. A point sampled off-schedule produces a count that cannot be trended against the ones before it.",
      expected: "Sampling schedule confirmed for the monitoring point",
      actual: "Not verified — no schedule confirmation recorded for WS-PW-07",
      expectedSource: sopFor("3"),
      comparison:
        "NeuraTrace found no schedule confirmation against the monitoring point for this sampling round",
      flagReason: `MIC-F07 — Sampling Schedule for this monitoring point has not been confirmed. Mandatory check per RULE-MIC-01. Source: ${sopFor("3")}`,
      flagAction: "Verify sampling schedule before proceeding.",
      source: "Caliber LIMS",
    }),
  ]),
  section("watermicro", "Analysis Record", 5, analysisRecordRows("3")),
  logBookSection(
    "watermicro",
    6,
    "R2A agar",
    "R2A-2026-0804",
    "Filtration manifold FM-MB-002",
  ),

  /* ---- 4. Environmental Monitoring — §4.6.1.4 -------------------------- */
  section("em", "Media and Equipment", 1, [
    ...mediaRows("4", "Soybean casein digest agar", "SCDA-2026-0812"),
    ...equipmentRows("4", "Air sampler AS-MB-001", false),
  ]),

  /*
   * RULE-MIC-02. Environmental monitoring takes a negative control only —
   * the method does not use a positive one, so its absence is not a finding
   * here the way it would be anywhere else in this domain.
   */
  section("em", "Controls", 2, controlRows("4", false)),

  section("em", "EM Results", 3, [
    flagged({
      prefix: P,
      flagId: "MIC-F01",
      sopReference: sopFor("4"),
      exceptionType: "OOL Result",
      label: "Total Bacterial Count",
      subLabel: "Requires OOL investigation per site SOP",
      reference: "28 CFU/m³",
      checkDescription:
        "NeuraTrace read the total bacterial count against the alert limit for this grade of area. A count over the limit says the room was not holding its condition while the product was exposed to it.",
      expected: "Not more than 25 CFU/m³ — STP-MB-EM-004",
      actual: "28 CFU/m³",
      expectedSource: "STP-MB-EM-004",
      comparison: "Count exceeds the alert limit by 3 CFU/m³",
      flagReason: `MIC-F01 — Total Bacterial Count (28 CFU/m³) exceeds alert limit (NMT 25 CFU/m³). Source: ${sopFor("4")}`,
      flagAction:
        "Investigate exceedance. Do not release until investigation complete.",
      source: "Caliber LIMS",
      table: {
        caption: "Environmental monitoring — active air, 20-Aug-2026",
        columns: ["Parameter", "Result", "Limit", "Status"],
        rows: [
          {
            cells: [
              "Total Bacterial Count",
              "28 CFU/m³",
              "NMT 25 CFU/m³",
              "OOL",
            ],
            flagged: true,
          },
          { cells: ["TYMC", "2 CFU/m³", "NMT 50 CFU/m³", "Within limit"] },
          {
            cells: [
              "Total Viable Count",
              "30 CFU/m³",
              "NMT 100 CFU/m³",
              "Within limit",
            ],
          },
        ],
      },
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("4"),
      label: "Total Combined Yeast and Mould Count",
      reference: "2 CFU/m³",
      statusText: "Within limit",
      checkDescription:
        "NeuraTrace read the mould count against its limit. Mould in an air sample points at the fabric of the room rather than at the people in it, which is a different investigation from a bacterial exceedance.",
      expected: "Not more than 50 CFU/m³ — STP-MB-EM-004",
      actual: "2 CFU/m³",
      expectedSource: "STP-MB-EM-004",
      source: "Caliber LIMS",
      comparison: "Count read against the limit",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("4"),
      label: "Total Viable Count",
      reference: "30 CFU/m³",
      statusText: "Within limit",
      checkDescription:
        "NeuraTrace read the total viable count against its limit. It sits inside its own limit even though the bacterial count above does not, which is why both are reported rather than one standing for the other.",
      expected: "Not more than 100 CFU/m³ — STP-MB-EM-004",
      actual: "30 CFU/m³",
      expectedSource: "STP-MB-EM-004",
      source: "Caliber LIMS",
      comparison: "Count read against the limit",
    }),
  ]),
  section(
    "em",
    "Analysis Record",
    4,
    analysisRecordRows("4", "Environmental monitoring"),
  ),
  logBookSection(
    "em",
    5,
    "Soybean casein digest agar",
    "SCDA-2026-0812",
    "Air sampler AS-MB-001",
  ),

  /* ---- 5. Water Chemical — §4.6.1.5 ------------------------------------ */
  section("waterchem", "Description and Physical", 1, [
    compliant({
      prefix: P,
      sopReference: sopFor("5"),
      label: "Description",
      reference: "Clear, colourless",
      statusText: "Complies",
      checkDescription:
        "NeuraTrace read the visual description. Turbidity or colour in purified water is the first sign of a system problem and is seen before any instrument reports it.",
      expected: "Clear, colourless liquid — STP-MB-WC-005",
      actual: "Clear, colourless",
      expectedSource: "STP-MB-WC-005",
      source: "Caliber LIMS",
      comparison: "Description read against the monograph requirement",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("5"),
      label: "pH",
      reference: "6.8",
      statusText: "Within limit",
      checkDescription:
        "NeuraTrace read the pH against its range. Purified water is weakly buffered, so a pH outside the range usually means something has been picked up from the system rather than from the sample.",
      expected: "5.0 to 7.0 — STP-MB-WC-005",
      actual: "6.8",
      expectedSource: "STP-MB-WC-005",
      source: "Caliber LIMS",
      comparison: "Result read against the specification range",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("5"),
      label: "Conductivity",
      reference: "1.1 µS/cm",
      statusText: "Within limit",
      checkDescription:
        "NeuraTrace read the conductivity against its limit. It is the quickest indicator that ionic material has entered the loop, which is why it is trended rather than simply passed.",
      expected: "Not more than 4.3 µS/cm — STP-MB-WC-005",
      actual: "1.1 µS/cm",
      expectedSource: "STP-MB-WC-005",
      source: "Caliber LIMS",
      comparison: "Result read against the specification limit",
    }),
  ]),
  section("waterchem", "Nitrates and Nitrites", 2, [
    compliant({
      prefix: P,
      sopReference: sopFor("5"),
      label: "Nitrates and standard preparation",
      reference: "0.12 ppm",
      statusText: "Within limit",
      checkDescription:
        "NeuraTrace read the nitrate result and the standard it was measured against. A colourimetric result is only as good as the standard behind it, so the preparation is checked with the number.",
      expected: "Not more than 0.2 ppm — STP-MB-WC-005",
      actual: "0.12 ppm — standard prepared 20-Aug-2026, lot NIT-2026-0033",
      expectedSource: "STP-MB-WC-005",
      source: "Caliber LIMS",
      comparison:
        "Result read against the limit, standard preparation verified",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("5"),
      label: "Nitrites and standard preparation",
      reference: "<0.01 ppm",
      statusText: "Within limit",
      checkDescription:
        "NeuraTrace read the nitrite result and its standard. Nitrite indicates biological activity in the loop, so a rising figure matters even while it is inside the limit.",
      expected: "Not more than 0.02 ppm — STP-MB-WC-005",
      actual: "<0.01 ppm — standard prepared 20-Aug-2026, lot NIT-2026-0034",
      expectedSource: "STP-MB-WC-005",
      source: "Caliber LIMS",
      comparison:
        "Result read against the limit, standard preparation verified",
    }),
  ]),

  /*
   * RULE-MIC-03. The TOC number on its own is not the record — the analyser's
   * print is, and without it there is nothing to check the transcription
   * against.
   */
  section("waterchem", "TOC", 3, [
    compliant({
      prefix: P,
      sopReference: sopFor("5"),
      label: "TOC result",
      reference: "142 ppb",
      statusText: "Within limit",
      checkDescription:
        "NeuraTrace read the TOC against its limit. Organic carbon is the measure of what the loop is growing or leaching, so it is read alongside the microbial count rather than separately from it.",
      expected: "Not more than 500 ppb — STP-MB-WC-005",
      actual: "142 ppb",
      expectedSource: "STP-MB-WC-005",
      source: "Caliber LIMS",
      comparison: "Result read against the specification limit",
    }),
    flagged({
      prefix: P,
      flagId: "MIC-F08",
      sopReference: sopFor("5"),
      exceptionType: "Print Not Attached",
      label: "TOC result print",
      subLabel: "Print verification required — RULE-MIC-03",
      reference: "TOC analyser TOC-MB-001",
      checkDescription:
        "NeuraTrace looked for the analyser print behind the TOC figure. The transcribed number cannot be checked against anything without it, so the result stands on somebody's typing.",
      expected: "TOC result print attached to the worksheet",
      actual: "Result recorded as 142 ppb — no print attached",
      expectedSource: sopFor("5"),
      comparison:
        "The result is on the worksheet and the instrument print that produced it is not",
      flagReason: `MIC-F08 — TOC result recorded but print not attached. Print verification required per RULE-MIC-03. Source: ${sopFor("5")}`,
      flagAction: "Attach TOC print before marking this section reviewed.",
      source: "Caliber LIMS",
    }),
  ]),
  section("waterchem", "Additional Parameters", 4, [
    compliant({
      prefix: P,
      sopReference: sopFor("5"),
      label: "Acidity or alkalinity",
      reference: "Complies",
      statusText: "Complies",
      checkDescription:
        "NeuraTrace read the acidity/alkalinity result. It catches ionic contamination that a single pH reading can sit inside without showing.",
      expected: "Complies — STP-MB-WC-005",
      actual: "Complies",
      expectedSource: "STP-MB-WC-005",
      source: "Caliber LIMS",
      comparison: "Result read against the monograph requirement",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("5"),
      label: "Heavy metals",
      reference: "Complies",
      statusText: "Complies",
      checkDescription:
        "NeuraTrace read the heavy metals result. Metal picked up from the distribution loop carries into every product made with the water.",
      expected: "Complies — STP-MB-WC-005",
      actual: "Complies",
      expectedSource: "STP-MB-WC-005",
      source: "Caliber LIMS",
      comparison: "Result read against the monograph requirement",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("5"),
      label: "Ammonia",
      reference: "Complies",
      statusText: "Complies",
      checkDescription:
        "NeuraTrace read the ammonia result. Like nitrite, it points at biological activity upstream in the system rather than at the sample itself.",
      expected: "Complies — STP-MB-WC-005",
      actual: "Complies",
      expectedSource: "STP-MB-WC-005",
      source: "Caliber LIMS",
      comparison: "Result read against the monograph requirement",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("5"),
      label: "Non-volatile substances",
      reference: "Complies",
      statusText: "Complies",
      checkDescription:
        "NeuraTrace read the non-volatile residue. What is left after evaporation is what the loop has been leaching.",
      expected: "Complies — STP-MB-WC-005",
      actual: "Complies",
      expectedSource: "STP-MB-WC-005",
      source: "Caliber LIMS",
      comparison: "Result read against the monograph requirement",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("5"),
      label: "Oxidizable substances",
      reference: "Complies",
      statusText: "Complies",
      checkDescription:
        "NeuraTrace read the oxidisable substances result. It is a second read on organic load, independent of the TOC analyser.",
      expected: "Complies — STP-MB-WC-005",
      actual: "Complies",
      expectedSource: "STP-MB-WC-005",
      source: "Caliber LIMS",
      comparison: "Result read against the monograph requirement",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("5"),
      label: "Total dissolved solids",
      reference: "Complies",
      statusText: "Complies",
      checkDescription:
        "NeuraTrace read the dissolved solids result against the conductivity above it — the two answer the same question by different routes and should agree.",
      expected: "Complies — STP-MB-WC-005",
      actual: "Complies",
      expectedSource: "STP-MB-WC-005",
      source: "Caliber LIMS",
      comparison: "Result read against the monograph requirement",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("5"),
      label: "Hardness",
      reference: "Complies",
      statusText: "Complies",
      checkDescription:
        "NeuraTrace read the hardness result. Calcium and magnesium breaking through say the softening stage of the plant is not holding.",
      expected: "Complies — STP-MB-WC-005",
      actual: "Complies",
      expectedSource: "STP-MB-WC-005",
      source: "Caliber LIMS",
      comparison: "Result read against the monograph requirement",
    }),
  ]),
  logBookSection(
    "waterchem",
    5,
    "Not applicable — chemical testing",
    "—",
    "TOC analyser TOC-MB-001",
  ),

  /* ---- 6. Method Validation — §4.6.1.6 --------------------------------- */
  section("methodval", "Media and Equipment", 1, [
    ...mediaRows("6", "Soybean casein digest agar", "SCDA-2026-0812"),
    ...equipmentRows("6", "Incubator INC-MB-004"),
  ]),
  section("methodval", "Controls", 2, [
    compliant({
      prefix: P,
      sopReference: sopFor("6"),
      label: "Neutraliser efficacy",
      reference: "Verified",
      statusText: "Effective",
      checkDescription:
        "NeuraTrace read the neutraliser efficacy result. It is what shows the neutraliser actually stops the product inhibiting growth, rather than being assumed to.",
      expected: "Neutraliser demonstrated effective against the product",
      actual: "Efficacy verified — recovery within 50 to 200 % of the inoculum",
      expectedSource: sopFor("6"),
      source: "Caliber LIMS",
      comparison: "Efficacy result read against the acceptance criterion",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("6"),
      label: "Neutraliser toxicity",
      reference: "Non-toxic",
      statusText: "Non-toxic",
      checkDescription:
        "NeuraTrace read the toxicity result. A neutraliser that suppresses the organism itself would under-count exactly the way the product would, and look like a clean sample.",
      expected: "Neutraliser not toxic to the challenge organisms",
      actual: "Non-toxic — recovery comparable with the inoculum control",
      expectedSource: sopFor("6"),
      source: "Caliber LIMS",
      comparison: "Toxicity result read against the inoculum control",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("6"),
      label: "Inoculum control",
      reference: "Within range",
      statusText: "Within range",
      checkDescription:
        "NeuraTrace read the inoculum control. It fixes how many organisms were actually added, which is the denominator every recovery percentage is calculated from.",
      expected: "Inoculum within the specified count range",
      actual: "Inoculum control 98 CFU — within the 50 to 150 CFU range",
      expectedSource: sopFor("6"),
      source: "Caliber LIMS",
      comparison: "Inoculum count read against the specified range",
    }),
    ...controlRows("6", true),
  ]),

  /*
   * RULE-MIC-04. Each ratio is checked explicitly rather than the series
   * being taken as a whole: an error in one dilution moves only the results
   * calculated from it, and would otherwise hide inside a passing set.
   */
  section(
    "methodval",
    "Dilution Series",
    3,
    ["1:10", "1:50", "1:100", "1:500"].map((ratio) =>
      compliant({
        prefix: P,
        flagId: "MIC-F09",
        sopReference: sopFor("6"),
        label: `Dilution ${ratio}`,
        reference: ratio,
        statusText: "Verified",
        checkDescription: `NeuraTrace read the ${ratio} dilution against the prepared volumes. Each ratio is verified on its own because an error in one moves only the results calculated from it, and would pass unnoticed inside the set.`,
        expected: `${ratio} prepared and verified — RULE-MIC-04`,
        actual: `${ratio} — volumes verified against the preparation record`,
        expectedSource: sopFor("6"),
        source: "Caliber LIMS",
        comparison: "Prepared volumes read against the stated ratio",
      }),
    ),
  ),
  section("methodval", "Recovery", 4, [
    compliant({
      prefix: P,
      flagId: "MIC-F10",
      sopReference: sopFor("6"),
      label: "TAMC recovery percentage",
      reference: "82 %",
      statusText: "Within range",
      checkDescription:
        "NeuraTrace read the TAMC recovery against the acceptance range. Recovery is what says the method can find organisms in this product — a low figure means routine counts have been under-reading all along.",
      expected: "50 % to 200 % recovery — RULE-MIC-05",
      actual: "82 %",
      expectedSource: sopFor("6"),
      source: "Caliber LIMS",
      comparison: "Recovery read against the acceptance range",
    }),
    compliant({
      prefix: P,
      flagId: "MIC-F10",
      sopReference: sopFor("6"),
      label: "TYMC recovery percentage",
      reference: "78 %",
      statusText: "Within range",
      checkDescription:
        "NeuraTrace read the TYMC recovery against the acceptance range. Mould recovery is checked separately because it is the harder of the two to demonstrate.",
      expected: "50 % to 200 % recovery — RULE-MIC-05",
      actual: "78 %",
      expectedSource: sopFor("6"),
      source: "Caliber LIMS",
      comparison: "Recovery read against the acceptance range",
    }),
  ]),
  section("methodval", "Method Validation Results", 5, [
    compliant({
      prefix: P,
      sopReference: sopFor("6"),
      label: "Result for TAMC",
      reference: "Method suitable",
      statusText: "Suitable",
      checkDescription:
        "NeuraTrace read the TAMC validation outcome. This is the conclusion the routine MLT test depends on: without it, a passing count means nothing.",
      expected: "Method demonstrated suitable for TAMC",
      actual: "Suitable — recovery within range across all dilutions",
      expectedSource: sopFor("6"),
      source: "Caliber LIMS",
      comparison: "Validation outcome read against the protocol criteria",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("6"),
      label: "Result for TYMC",
      reference: "Method suitable",
      statusText: "Suitable",
      checkDescription:
        "NeuraTrace read the TYMC validation outcome against the protocol.",
      expected: "Method demonstrated suitable for TYMC",
      actual: "Suitable — recovery within range across all dilutions",
      expectedSource: sopFor("6"),
      source: "Caliber LIMS",
      comparison: "Validation outcome read against the protocol criteria",
    }),
    compliant({
      prefix: P,
      sopReference: sopFor("6"),
      label: "Pathogens",
      reference: "Method suitable",
      statusText: "Suitable",
      checkDescription:
        "NeuraTrace read the pathogen recovery outcome. Presence testing has to be shown to work in this product before an 'absent' result can be relied on.",
      expected: "Method demonstrated suitable for pathogen recovery",
      actual: "Suitable — each specified organism recovered",
      expectedSource: sopFor("6"),
      source: "Caliber LIMS",
      comparison: "Validation outcome read against the protocol criteria",
    }),
  ]),
  section("methodval", "Analysis Record", 6, analysisRecordRows("6")),
  logBookSection(
    "methodval",
    7,
    "Soybean casein digest agar",
    "SCDA-2026-0812",
    "Incubator INC-MB-004",
  ),
];

/* -------------------------------------------------------------------------- */
/* Attendance                                                                 */
/* -------------------------------------------------------------------------- */

const ATT = "mb-att";

const withAttendance = (
  entries: Section[],
  analyst: string,
  date: string,
): Section[] => {
  const parameters = [...new Set(entries.map((entry) => entry.parameter))];

  const attendance = parameters.map((parameter) =>
    section(parameter, "Attendance Verification", 0, [
      attendanceCheck(ATT, analyst, date, true),
    ]),
  );

  return [...attendance, ...entries];
};

/* -------------------------------------------------------------------------- */
/* Batch                                                                      */
/* -------------------------------------------------------------------------- */

export const MICROBIOLOGY_BATCHES: Batch[] = [
  {
    id: "07-MB-26-0089",
    arNumber: "07-MB-26-0089",
    product: "Amoxicillin 250mg Tablet (Microbiology)",
    batchNumber: "AMX-2026-0341",
    domain: "MICROBIOLOGY",
    specVersion: "v3.2",
    specCurrent: true,
    slaDeadline: "03-Sep-2026 16:00",
    slaStatus: "green",
    slaLabel: "Within SLA",
    status: "NEEDS_REVIEW",
    limsStatus: "Pending QA Review",
    assignedTo: "arjun-mehta",
    analyst: "Sunita Menon",
    lastActivity: "26-Aug-2026 · 11:05",
    parameters: MB_PARAMETERS,
    sections: withAttendance(sections, "Sunita Menon", "20-Aug-2026"),
    dataSources: ["HRMS System", "Caliber LIMS"],
  },
];
