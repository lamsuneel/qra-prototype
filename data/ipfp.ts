import type { Batch, Section, TestParameter } from "@/types";

/**
 * In-Process Finished Product review — Amoxicillin 250mg compression stage.
 *
 * LEVEL D — demonstration scenario. Blend uniformity across ten sampling
 * locations is the characteristic in-process check, and this batch is also
 * the SLA breach shown on the management dashboard.
 */

const IPFP_PARAMETERS: TestParameter[] = [
  {
    id: "blend-uniformity",
    name: "Blend Uniformity",
    shortName: "Blend",
    methodType: "HPLC",
    stpReference: "STP-IPFP-BU-001",
  },
  {
    id: "compression",
    name: "Compression Parameters",
    shortName: "Compression",
    methodType: "In-process",
    stpReference: "STP-IPFP-CMP-001",
  },
];

/** Ten sampling locations. Locations 4 and 9 fall outside the range. */
const BLEND_RESULTS = [
  { location: "L1 — Top left", value: 99.2, ok: true },
  { location: "L2 — Top right", value: 98.7, ok: true },
  { location: "L3 — Middle left", value: 101.4, ok: true },
  { location: "L4 — Middle centre", value: 89.6, ok: false },
  { location: "L5 — Middle right", value: 100.8, ok: true },
  { location: "L6 — Bottom left", value: 99.9, ok: true },
  { location: "L7 — Bottom right", value: 98.1, ok: true },
  { location: "L8 — Discharge port", value: 102.3, ok: true },
  { location: "L9 — Blender wall", value: 112.7, ok: false },
  { location: "L10 — Blender shaft", value: 100.2, ok: true },
];

const sections: Section[] = [
  {
    id: "blend-uniformity-results",
    parameter: "blend-uniformity",
    name: "Sampling Results",
    order: 1,
    status: "NOT_STARTED",
    items: [
      {
        id: "ipfp-flag-1",
        label: "Blend uniformity outside acceptance range",
        reference: "2 of 10 locations",
        expected: "All locations 90.0 to 110.0% of label claim — STP-IPFP-BU-001",
        actual:
          "L4 at 89.6% and L9 at 112.7% fall outside the acceptance range; RSD 6.1%",
        expectedSource: "STP-IPFP-BU-001",
        source: "Caliber LIMS",
        result: "FLAGGED",
        comparison:
          "Two of ten sampling locations fall outside 90.0 to 110.0%, and the spread suggests incomplete blending",
        flagReason:
          "Blend uniformity is not demonstrated. Location L4 is below the lower limit and location L9 above the upper limit, indicating the blend is not homogeneous at the point of sampling.",
        flagAction:
          "Do not progress to compression until blend uniformity is resolved. Confirm sampling technique, review blender speed and time against the batch record, and raise an investigation if the result is confirmed.",
      },
      ...BLEND_RESULTS.map((row, index) => ({
        id: `ipfp-bu-${index + 1}`,
        label: row.location,
        reference: `${row.value.toFixed(1)}% of label claim`,
        statusText: row.ok ? "Within range" : "Outside range",
        expected: "90.0 to 110.0% of label claim — STP-IPFP-BU-001",
        actual: `${row.value.toFixed(1)}% of label claim`,
        expectedSource: "STP-IPFP-BU-001",
        source: "Caliber LIMS" as const,
        result: "COMPLIANT" as const,
      })),
    ],
  },
  {
    id: "blend-uniformity-instruments",
    parameter: "blend-uniformity",
    name: "Instruments",
    order: 2,
    status: "NOT_STARTED",
    items: [
      {
        id: "ipfp-inst-1",
        label: "HPLC System HPLC-004",
        reference: "Cal. due 30-Nov-2026",
        statusText: "Calibrated",
        expected: "Calibration due date after date of use — SOP-INST-004",
        actual: "HPLC-004 — calibrated, due 30-Nov-2026, used 09:00 to 15:20",
        expectedSource: "SOP-INST-004",
        source: "Waters Empower",
        result: "COMPLIANT",
      },
    ],
  },
  {
    id: "compression-parameters",
    parameter: "compression",
    name: "Process Parameters",
    order: 1,
    status: "NOT_STARTED",
    items: [
      {
        id: "ipfp-cmp-1",
        label: "Average tablet weight",
        reference: "550mg nominal",
        statusText: "Within tolerance",
        expected: "550mg plus or minus 5% — STP-IPFP-CMP-001",
        actual: "Mean 552mg across 20 tablets",
        expectedSource: "STP-IPFP-CMP-001",
        source: "Caliber LIMS",
        result: "COMPLIANT",
      },
      {
        id: "ipfp-cmp-2",
        label: "Tablet hardness",
        reference: "6 to 12 kp",
        statusText: "Within tolerance",
        expected: "6 to 12 kp — STP-IPFP-CMP-001",
        actual: "Mean 8.4 kp across 10 tablets",
        expectedSource: "STP-IPFP-CMP-001",
        source: "Caliber LIMS",
        result: "COMPLIANT",
      },
      {
        id: "ipfp-cmp-3",
        label: "Friability",
        reference: "NMT 1.0%",
        statusText: "Within tolerance",
        expected: "Not more than 1.0% — STP-IPFP-CMP-001",
        actual: "0.32%",
        expectedSource: "STP-IPFP-CMP-001",
        source: "Caliber LIMS",
        result: "COMPLIANT",
      },
    ],
  },
];

export const IPFP_BATCHES: Batch[] = [
  {
    id: "AR-2026-000141",
    arNumber: "AR-2026-000141",
    product: "Amoxicillin 250mg — Compression Stage",
    batchNumber: "AMX-2026-0341-C",
    domain: "IPFP",
    specVersion: "v3.2",
    specCurrent: true,
    slaDeadline: "31-Jul-2026 14:00",
    slaStatus: "red",
    slaLabel: "SLA Breached",
    status: "NEEDS_REVIEW",
    assignedTo: "arjun-mehta",
    analyst: "Deepa Nair",
    lastActivity: "1 day overdue",
    parameters: IPFP_PARAMETERS,
    sections,
    dataSources: ["Caliber LIMS", "Waters Empower"],
  },
];
