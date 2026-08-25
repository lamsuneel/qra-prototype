import type { Batch, ChamberReading, Section, TestParameter } from "@/types";

/**
 * Stability review — 6-month accelerated study.
 *
 * LEVEL D — demonstration scenario. Two findings that belong together: a
 * chamber excursion, and a related substances result trending out of trend at
 * the same timepoint. Chamber Conditions is deliberately the first section so
 * the reviewer sees the storage context before the analytical result.
 */

const STB_PARAMETERS: TestParameter[] = [
  {
    id: "storage",
    name: "Storage Conditions",
    shortName: "Storage",
    methodType: "Chamber monitoring",
    stpReference: "SOP-STB-001",
  },
  {
    id: "rs",
    name: "Related Substances",
    shortName: "RS",
    methodType: "HPLC",
    stpReference: "STP-AMX-RS-001",
  },
];

/** 40C / 75% RH accelerated condition. Days 88 to 92 show the excursion. */
const CHAMBER_READINGS: ChamberReading[] = [
  { day: "Day 0", temperature: 40.1, humidity: 75.2 },
  { day: "Day 15", temperature: 39.9, humidity: 74.8 },
  { day: "Day 30", temperature: 40.2, humidity: 75.1 },
  { day: "Day 45", temperature: 40.0, humidity: 74.9 },
  { day: "Day 60", temperature: 40.1, humidity: 75.3 },
  { day: "Day 75", temperature: 39.8, humidity: 74.6 },
  { day: "Day 88", temperature: 43.7, humidity: 78.9 },
  { day: "Day 92", temperature: 44.2, humidity: 79.4 },
  { day: "Day 105", temperature: 40.3, humidity: 75.0 },
  { day: "Day 120", temperature: 40.0, humidity: 74.7 },
  { day: "Day 150", temperature: 39.9, humidity: 75.2 },
  { day: "Day 180", temperature: 40.1, humidity: 75.1 },
];

const sections: Section[] = [
  {
    id: "storage-chamber-conditions",
    parameter: "storage",
    name: "Chamber Conditions",
    order: 1,
    status: "NOT_STARTED",
    chamberReadings: CHAMBER_READINGS,
    chamberLimits: { temperature: "40C plus or minus 2C", humidity: "75% RH plus or minus 5%" },
    items: [
      {
        id: "stb-flag-1",
        label: "Chamber excursion — temperature above limit",
        reference: "Day 88 to Day 92",
        expected: "40C plus or minus 2C throughout the study — SOP-STB-001",
        actual: "Peak 44.2C on Day 92, above limit for approximately 4 days",
        expectedSource: "SOP-STB-001",
        source: "Chamber Monitoring System",
        result: "FLAGGED",
        comparison:
          "Chamber trace exceeds the upper temperature limit of 42C between Day 88 and Day 92",
        flagReason:
          "The stability chamber ran above the permitted temperature band for approximately four days. Samples on study during the excursion were exposed to conditions outside the protocol.",
        flagAction:
          "Confirm the excursion report reference and the impact assessment before accepting the timepoint. Check whether the related substances result at the 6-month pull is attributable to this excursion.",
      },
      {
        id: "stb-ok-1",
        label: "Humidity control",
        reference: "75% RH nominal",
        statusText: "Within limit",
        expected: "75% RH plus or minus 5% — SOP-STB-001",
        actual: "Range 74.6 to 79.4% RH, remained within the permitted band",
        expectedSource: "SOP-STB-001",
        source: "Chamber Monitoring System",
        result: "COMPLIANT",
      },
      {
        id: "stb-ok-2",
        label: "Chamber calibration",
        reference: "Cal. due 12-Dec-2026",
        statusText: "Calibrated",
        expected: "Calibration due date after the study period — SOP-INST-004",
        actual: "STB-CH-002 — calibrated, due 12-Dec-2026",
        expectedSource: "SOP-INST-004",
        source: "Chamber Monitoring System",
        result: "COMPLIANT",
      },
    ],
  },
  {
    id: "rs-results",
    parameter: "rs",
    name: "Timepoint Results",
    order: 1,
    status: "NOT_STARTED",
    items: [
      {
        id: "stb-flag-2",
        label: "Total impurities out of trend at 6 months",
        reference: "6-month pull",
        expected: "Within the trend established at 0, 3 and 6 months — SOP-STB-001",
        actual: "Total impurities 1.42% against a trended expectation of 0.90 to 1.10%",
        expectedSource: "SOP-STB-001",
        source: "Waters Empower",
        result: "FLAGGED",
        comparison:
          "Result is inside the shelf-life specification but outside the established trend for this study",
        flagReason:
          "Total impurities are out of trend at the 6-month timepoint. The result remains within the 2.0% specification limit, so this is an out-of-trend observation rather than an out-of-specification result.",
        flagAction:
          "Assess against the chamber excursion recorded in Storage Conditions. Confirm whether an out-of-trend investigation is required before the timepoint is accepted.",
      },
      {
        id: "stb-ok-3",
        label: "Individual unspecified impurity",
        reference: "Largest 0.18%",
        statusText: "Within limit",
        expected: "Not more than 0.20% — STP-AMX-RS-001",
        actual: "Largest individual unspecified impurity 0.18%",
        expectedSource: "STP-AMX-RS-001",
        source: "Waters Empower",
        result: "COMPLIANT",
      },
      {
        id: "stb-ok-4",
        label: "Total impurities against specification",
        reference: "1.42%",
        statusText: "Within specification",
        expected: "Not more than 2.0% — STP-AMX-RS-001",
        actual: "Total impurities 1.42%",
        expectedSource: "STP-AMX-RS-001",
        source: "Waters Empower",
        result: "COMPLIANT",
      },
    ],
  },
  {
    id: "rs-instruments",
    parameter: "rs",
    name: "Instruments",
    order: 2,
    status: "NOT_STARTED",
    items: [
      {
        id: "stb-ok-5",
        label: "HPLC System HPLC-002",
        reference: "Cal. due 28-Feb-2027",
        statusText: "Calibrated",
        expected: "Calibration due date after date of use — SOP-INST-004",
        actual: "HPLC-002 — calibrated, due 28-Feb-2027, used 10:05 to 16:40",
        expectedSource: "SOP-INST-004",
        source: "Waters Empower",
        result: "COMPLIANT",
      },
    ],
  },
];

export const STABILITY_BATCHES: Batch[] = [
  {
    id: "AR-2026-000148",
    arNumber: "AR-2026-000148",
    product: "Amoxicillin 250mg — 6 Month Accelerated",
    batchNumber: "AMX-2025-0912",
    domain: "STABILITY",
    specVersion: "v3.2",
    specCurrent: true,
    slaDeadline: "05-Aug-2026 17:00",
    slaStatus: "green",
    slaLabel: "Within SLA",
    status: "NEEDS_REVIEW",
    assignedTo: "arjun-mehta",
    analyst: "Kavita Menon",
    lastActivity: "Yesterday",
    parameters: STB_PARAMETERS,
    sections,
    dataSources: ["Chamber Monitoring System", "Waters Empower", "Caliber LIMS"],
  },
];
