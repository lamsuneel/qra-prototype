import type {
  ActivityEntry,
  CycleTimePoint,
  DomainBreakdownRow,
  ExceptionPoint,
  Kpi,
  ManagementAlert,
  RecurringIssue,
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
    at: "11:20 AM",
    description:
      "Anil Kulkarni completed the 6-month pull for ST-AR-2026-000089-6M (Amoxicillin 250mg accelerated)",
  },
  {
    at: "10:05 AM",
    description:
      "Caliber LIMS results received for PM-AR-2026-008823 (HDPE Bottle 60ml) — 1 exception raised",
  },
  {
    at: "Yesterday 14:35",
    description:
      "Priya Sharma submitted AR-2026-000121 (Ciprofloxacin 500mg) for authorisation — 1 documented exception",
  },
];

export const KPIS: Kpi[] = [
  {
    title: "Avg Cycle Time",
    value: "1.8 days",
    trend: "↓ 42% vs prior quarter",
    trendGood: true,
    target: "Target: ≤ 2 days · ✓ On target",
  },
  { title: "Right First Time", value: "94.2%", trend: "up from 91.4% last month", trendGood: true },
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

/**
 * The same six types the Recurring Review Issues table names, worded
 * identically — a reader comparing the two panels must never have to wonder
 * whether a row and a bar mean the same thing.
 */
export const EXCEPTIONS_BY_PARAMETER: ExceptionPoint[] = [
  { category: "Related Substances", count: 8 },
  { category: "Standards — expired or inactive", count: 5 },
  { category: "LCMS — genotoxic impurity", count: 3 },
  { category: "KF — determination count", count: 3 },
  { category: "Instruments — calibration gap", count: 2 },
  { category: "Chemicals — inactivated entry", count: 2 },
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
    detail: "IPFP-AR-2026-000122-03 · Amoxicillin 250mg compression · 0.5 days overdue",
    severity: "high",
  },
  {
    title: "Approaching SLA — Raw Material",
    detail: "RM-AR-2026-004417 · Amoxicillin Trihydrate API · 6 hours remaining",
    severity: "medium",
  },
  {
    title: "OOS Open — Requires Close-Out",
    detail: "OOS-2026-0089 · LCMS Genotoxic Impurity · AR-2026-000122",
    severity: "medium",
  },
  {
    title: "OOS Open — Requires Close-Out",
    detail: "OOS-2026-0091 · Known Impurity B at 6 months · ST-AR-2026-000089-6M",
    severity: "medium",
  },
];

/**
 * The same exceptions the Exceptions by Test Parameter chart is drawn from,
 * counted as a share of the 23 raised across all domains this month. The six
 * types below account for every exception in that chart — nothing new is
 * measured here, this is the recurring-problem view of data the dashboard
 * already carries.
 */
export const RECURRING_ISSUES: RecurringIssue[] = [
  { issue: "Related Substances", occurrences: 8, share: "35%" },
  { issue: "Standards — expired or inactive", occurrences: 5, share: "22%" },
  { issue: "LCMS — genotoxic impurity", occurrences: 3, share: "13%" },
  { issue: "KF — determination count", occurrences: 3, share: "13%" },
  { issue: "Instruments — calibration gap", occurrences: 2, share: "9%" },
  { issue: "Chemicals — inactivated entry", occurrences: 2, share: "9%" },
];

export const RECURRING_ISSUES_INSIGHT =
  "Related Substances accounts for more than a third of all 23 review exceptions raised this month.";

export const MANAGEMENT_FOOTER_NOTE =
  "Cycle time measures total process time from review opened to authorisation. Individual reviewer activity is not tracked.";
