import type { Batch, Section, TestParameter } from "@/types";

/**
 * Raw Material review — Amoxicillin Trihydrate API.
 *
 * LEVEL D — demonstration scenario. Identity by FTIR is the characteristic
 * raw material check; the flag is a spectral match below the library threshold.
 */

const RM_PARAMETERS: TestParameter[] = [
  {
    id: "identity",
    name: "Identity (FTIR)",
    shortName: "Identity",
    methodType: "FTIR",
    stpReference: "STP-RM-FTIR-001",
  },
  {
    id: "assay",
    name: "Assay",
    shortName: "Assay",
    methodType: "HPLC",
    stpReference: "STP-RM-ASSAY-001",
  },
];

const sections: Section[] = [
  {
    id: "identity-chemicals",
    parameter: "identity",
    name: "Chemicals",
    order: 1,
    status: "NOT_STARTED",
    items: [
      {
        id: "rm-chem-1",
        label: "Potassium bromide IR grade",
        reference: "Lot KBR-2024-031",
        statusText: "Active",
        expected: "Active entry, within expiry — SOP-CHEM-003",
        actual: "Potassium bromide IR grade — Lot KBR-2024-031 — active, expiry 31-Dec-2026",
        expectedSource: "SOP-CHEM-003",
        source: "Caliber LIMS",
        result: "COMPLIANT",
      },
    ],
  },
  {
    id: "identity-standards",
    parameter: "identity",
    name: "Standards",
    order: 2,
    status: "NOT_STARTED",
    items: [
      {
        id: "rm-std-1",
        label: "Amoxicillin Trihydrate Reference Spectrum",
        reference: "REF-SPEC-AMX-04",
        statusText: "Current",
        expected: "Current library reference spectrum — SOP-RM-QC-001",
        actual: "REF-SPEC-AMX-04 — current, issued 12-Mar-2026",
        expectedSource: "SOP-RM-QC-001",
        source: "Caliber LIMS",
        result: "COMPLIANT",
      },
    ],
  },
  {
    id: "identity-instruments",
    parameter: "identity",
    name: "Instruments",
    order: 3,
    status: "NOT_STARTED",
    items: [
      {
        id: "rm-inst-1",
        label: "FTIR Spectrometer FTIR-2024-002",
        reference: "Cal. due 20-Oct-2026",
        statusText: "Calibrated",
        expected: "Calibration due date after date of use — SOP-INST-004",
        actual: "FTIR-2024-002 — calibrated, due 20-Oct-2026, used 10:15 to 10:40",
        expectedSource: "SOP-INST-004",
        source: "Caliber LIMS",
        result: "COMPLIANT",
      },
    ],
  },
  {
    id: "identity-result",
    parameter: "identity",
    name: "Identity Result",
    order: 4,
    status: "NOT_STARTED",
    items: [
      // LEVEL D — demonstration scenario.
      {
        id: "rm-flag-1",
        label: "FTIR spectral match below threshold",
        reference: "Match 0.962",
        expected: "Correlation coefficient not less than 0.980 — STP-RM-FTIR-001",
        actual: "Correlation coefficient 0.962 against REF-SPEC-AMX-04",
        expectedSource: "STP-RM-FTIR-001",
        source: "Caliber LIMS",
        result: "FLAGGED",
        comparison:
          "Match factor is 0.018 below the acceptance threshold defined in the STP",
        flagReason:
          "The FTIR spectrum does not meet the identity acceptance threshold. A match factor below 0.980 does not confirm identity against the reference spectrum.",
        flagAction:
          "Verify sample preparation and re-run the identity scan. If the second scan also falls below threshold, raise a material investigation before disposition.",
      },
    ],
  },
];

export const RAW_MATERIAL_BATCHES: Batch[] = [
  {
    id: "AR-2026-000131",
    arNumber: "AR-2026-000131",
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
    dataSources: ["Caliber LIMS"],
  },
];
