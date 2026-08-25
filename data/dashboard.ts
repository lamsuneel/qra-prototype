import type {
  ActivityEntry,
  CycleTimePoint,
  DomainBreakdownRow,
  ExceptionPoint,
  Kpi,
  ManagementAlert,
} from "@/types";

/**
 * Management dashboard figures.
 *
 * Cycle time is derived from four process milestones only: review opened,
 * section reviewed, submitted for authorisation, review authorised. Nothing
 * here measures an individual reviewer, and nothing here can be used to.
 *
 * LEVEL D — demonstration scenario. Replaced by real milestone data in pilot.
 */

export const RECENT_ACTIVITY: ActivityEntry[] = [
  {
    at: "09:47 AM",
    description:
      "Arjun Mehta submitted AR-2026-000122 (Amoxicillin 250mg) for authorisation",
  },
  {
    at: "08:30 AM",
    description:
      "Priya Sharma opened review of AR-2026-000131 (Amoxicillin Trihydrate API)",
  },
  {
    at: "Yesterday",
    description:
      "Rajesh Kumar authorised AR-2026-000115 (Metformin 500mg) — 26 sections compliant, 0 exceptions",
  },
];

export const KPIS: Kpi[] = [
  { title: "Avg Cycle Time", value: "1.8d", trend: "42% faster vs prior quarter", trendGood: true },
  { title: "Right First Time", value: "94.2%", trend: "up from 91.4%", trendGood: true },
  { title: "SLA Compliance", value: "97.8%", trend: "1 breach this month", trendGood: true },
  { title: "Batches Reviewed", value: "47", trend: "this month", trendGood: true },
];

/** Amber above the 2.0 day SLA target, green at or below it. */
export const SLA_TARGET_DAYS = 2.0;

export const CYCLE_TIME_TREND: CycleTimePoint[] = [
  { month: "Mar", days: 3.1 },
  { month: "Apr", days: 2.9 },
  { month: "May", days: 2.6 },
  { month: "Jun", days: 2.4 },
  { month: "Jul", days: 2.1 },
  { month: "Aug", days: 1.8 },
];

export const EXCEPTIONS_BY_PARAMETER: ExceptionPoint[] = [
  { category: "Related Substances", count: 8 },
  { category: "Standards expired", count: 5 },
  { category: "LCMS genotoxic", count: 3 },
  { category: "KF determinations", count: 3 },
  { category: "Instruments calibration", count: 2 },
  { category: "Chemicals inactivated", count: 2 },
];

export const DOMAIN_BREAKDOWN: DomainBreakdownRow[] = [
  { domain: "Finished Product", completed: 23, avgDays: "1.9d", exceptions: 14 },
  { domain: "Raw Material", completed: 11, avgDays: "1.6d", exceptions: 5 },
  { domain: "Packing Material", completed: 8, avgDays: "1.3d", exceptions: 2 },
  { domain: "IPFP", completed: 3, avgDays: "2.4d", exceptions: 2 },
  { domain: "Stability", completed: 2, avgDays: "2.1d", exceptions: 1 },
];

export const MANAGEMENT_ALERTS: ManagementAlert[] = [
  {
    title: "SLA Breached — IPFP",
    detail: "AR-2026-000141 · Amoxicillin 250mg compression · 1 day overdue",
    severity: "high",
  },
  {
    title: "Approaching SLA — Raw Material",
    detail: "AR-2026-000131 · Amoxicillin Trihydrate API · 6 hours remaining",
    severity: "medium",
  },
  {
    title: "OOS Open — Requires Close-Out",
    detail: "OOS-2026-0089 · LCMS Genotoxic Impurity · AR-2026-000122",
    severity: "medium",
  },
];

export const MANAGEMENT_FOOTER_NOTE =
  "Cycle time measures total process time from review opened to authorisation. Individual reviewer activity is not tracked.";
