import type { Batch, Section, TestParameter } from "@/types";

/**
 * Packing Material review — HDPE Bottle 60ml.
 *
 * LEVEL C — confirm with site QA before pilot. Open action: C-02
 * Packing material checks are partly recorded on paper at this site. The
 * paper logbook section below is deliberately shown as a gap rather than
 * pretending the data is available electronically.
 */

const PM_PARAMETERS: TestParameter[] = [
  {
    id: "identification",
    name: "Identification",
    shortName: "ID",
    methodType: "Visual / Barcode",
    stpReference: "STP-PM-BAR-001",
  },
  {
    id: "dimensions",
    name: "Dimensions",
    shortName: "Dimensions",
    methodType: "Gauge",
    stpReference: "STP-PM-DIM-001",
  },
];

const sections: Section[] = [
  {
    id: "identification-barcode",
    parameter: "identification",
    name: "Barcode Verification",
    order: 1,
    status: "NOT_STARTED",
    items: [
      // LEVEL D — demonstration scenario.
      {
        id: "pm-flag-1",
        label: "Barcode does not match artwork revision",
        reference: "ART-HDPE60-R4",
        expected: "Barcode encodes artwork revision R5 — SOP-PM-QC-004",
        actual: "Scanned barcode encodes artwork revision R4 on 3 of 20 sampled bottles",
        expectedSource: "SOP-PM-QC-004",
        source: "Caliber LIMS",
        result: "FLAGGED",
        comparison:
          "Three sampled units carry the superseded R4 artwork revision against the approved R5",
        flagReason:
          "Barcode verification found mixed artwork revisions in the sampled units. Mixed revisions in a single consignment indicate a segregation failure at the supplier or in goods receipt.",
        flagAction:
          "Quarantine the consignment and verify segregation with the supplier before disposition. Confirm whether R4 units are present elsewhere in the delivery.",
      },
      {
        id: "pm-ok-1",
        label: "Barcode readability",
        reference: "20 of 20 units",
        statusText: "Readable",
        expected: "All sampled units scan on first attempt — SOP-PM-QC-004",
        actual: "20 of 20 sampled units scanned on first attempt",
        expectedSource: "SOP-PM-QC-004",
        source: "Caliber LIMS",
        result: "COMPLIANT",
      },
    ],
  },
  {
    id: "identification-visual",
    parameter: "identification",
    name: "Visual Inspection",
    order: 2,
    status: "NOT_STARTED",
    items: [
      {
        id: "pm-ok-2",
        label: "Visual inspection — surface defects",
        reference: "AQL 0.65",
        statusText: "Within AQL",
        expected: "Defects within AQL 0.65 — SOP-PM-QC-004",
        actual: "1 minor defect in 200 units sampled, within AQL",
        expectedSource: "SOP-PM-QC-004",
        source: "Caliber LIMS",
        result: "COMPLIANT",
      },
    ],
    // LEVEL C — confirm with site QA before pilot. Open action: C-03
    paperLogbook: {
      reference: "PM-LOG-2026-014",
      description: "Visual inspection logbook — QC Packing Hall",
      note: "This record is not held electronically at this site. QRA shows the logbook reference so the reviewer knows where to look; the entry itself is verified against the physical logbook.",
    },
  },
  {
    id: "dimensions-measurement",
    parameter: "dimensions",
    name: "Measurement",
    order: 1,
    status: "NOT_STARTED",
    items: [
      {
        id: "pm-ok-3",
        label: "Neck finish diameter",
        reference: "28mm nominal",
        statusText: "Within tolerance",
        expected: "28.00mm plus or minus 0.20mm — STP-PM-DIM-001",
        actual: "Mean 28.04mm across 10 units, range 27.96 to 28.11mm",
        expectedSource: "STP-PM-DIM-001",
        source: "Caliber LIMS",
        result: "COMPLIANT",
      },
      {
        id: "pm-ok-4",
        label: "Fill volume capacity",
        reference: "60ml nominal",
        statusText: "Within tolerance",
        expected: "Not less than 60.0ml brimful — STP-PM-DIM-001",
        actual: "Mean 62.3ml across 10 units",
        expectedSource: "STP-PM-DIM-001",
        source: "Caliber LIMS",
        result: "COMPLIANT",
      },
    ],
  },
];

export const PACKING_MATERIAL_BATCHES: Batch[] = [
  {
    id: "AR-2026-000136",
    arNumber: "AR-2026-000136",
    product: "HDPE Bottle 60ml",
    batchNumber: "HDPE-2026-0221",
    domain: "PACKING_MATERIAL",
    specVersion: "v1.4",
    specCurrent: true,
    slaDeadline: "04-Aug-2026 12:00",
    slaStatus: "green",
    slaLabel: "Within SLA",
    status: "NEEDS_REVIEW",
    assignedTo: "arjun-mehta",
    analyst: "Sunil Rao",
    lastActivity: "Yesterday",
    parameters: PM_PARAMETERS,
    sections,
    dataSources: ["Caliber LIMS", "Paper Logbook"],
  },
];
