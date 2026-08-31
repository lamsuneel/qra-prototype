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
      "Anil Kulkarni completed the 6-month pull for 07-ST-26-0089 (Amoxicillin 250mg accelerated)",
  },
  {
    at: "10:05 AM",
    description:
      "Caliber LIMS results received for 07-PM-26-8823 (HDPE Bottle 60ml) — 1 exception raised",
  },
  {
    at: "Yesterday 14:35",
    description:
      "Priya Sharma submitted 07-FP-26-0121 (Ciprofloxacin 500mg) for authorisation — 1 documented exception",
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
    detail: "07-IPFP-26-0122 · Amoxicillin 250mg compression · 0.5 days overdue",
    severity: "high",
    label: "SLA Breached",
  },
  {
    title: "Approaching SLA — Raw Material",
    detail: "07-RM-26-4417 · Amoxicillin Trihydrate API · 6 hours remaining",
    severity: "medium",
    label: "Approaching SLA",
  },
  {
    title: "OOS Open — Requires Close-Out",
    detail: "OOS-2026-0089 · LCMS Genotoxic Impurity · 07-FP-26-0122",
    severity: "medium",
    label: "OOS Open",
  },
  {
    title: "OOS Open — Requires Close-Out",
    detail: "OOS-2026-0091 · Known Impurity B at 6 months · 07-ST-26-0089",
    severity: "medium",
    label: "OOS Open",
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

/* -------------------------------------------------------------------------- */
/* GM-QA operations                                                           */
/* -------------------------------------------------------------------------- */

/**
 * What the GM-QA is responsible for is the pipeline, not any one batch: how
 * many samples are in the building, where they are stuck, and what is going
 * out of window while they wait. Nothing here measures a person — the same
 * rule the CQO view is built on.
 */

export interface PipelineStat {
  title: string;
  value: string;
}

export const PIPELINE_KPIS: PipelineStat[] = [
  { title: "Total Active Samples", value: "847" },
  { title: "Under Analysis", value: "312" },
  { title: "Under QC Review", value: "189" },
  { title: "Pending QA Review", value: "94" },
  { title: "Pending Manager Approval", value: "23" },
  { title: "Released This Month", value: "229" },
];

/**
 * A stability sample pulled outside its window is not comparable with the
 * timepoints before it, so the trend it feeds means less than it looks like.
 * These are the ones already past their date.
 */
export interface StabilityWindowRow {
  arNumber: string;
  product: string;
  stage: string;
  scheduled: string;
  daysOverdue: number;
  action: string;
}

export const STABILITY_WINDOW_STATUS = {
  title: "Stability Samples — Window Status",
  subheading:
    "Long-term ±45 days · Accelerated ±30 days · Post-expiry ±2 months",
  /* Over a week late stops being a scheduling slip and becomes an escalation. */
  escalationDays: 7,
} as const;

export const STABILITY_OUT_OF_WINDOW: StabilityWindowRow[] = [
  {
    arNumber: "07-ST-26-0089",
    product: "Amoxicillin 250mg",
    stage: "36M LT",
    scheduled: "28-Jul-2026",
    daysOverdue: 3,
    action: "Initiate OOT investigation",
  },
  {
    arNumber: "07-ST-26-0041",
    product: "Metformin 500mg",
    stage: "18M ACC",
    scheduled: "25-Jul-2026",
    daysOverdue: 6,
    action: "Initiate OOT investigation",
  },
  {
    arNumber: "07-ST-26-0102",
    product: "Atorvastatin 10mg",
    stage: "24M LT",
    scheduled: "22-Jul-2026",
    daysOverdue: 9,
    action: "Escalate — >7 days overdue",
  },
];

/** Why samples are sitting rather than moving. */
export interface PendingReason {
  reason: string;
  samples: number;
}

export const PENDING_BY_REASON: PendingReason[] = [
  { reason: "Instrument downtime", samples: 34 },
  { reason: "OOS investigation", samples: 12 },
  { reason: "Reagent unavailability", samples: 8 },
  { reason: "Analyst unavailability", samples: 5 },
];

/** Investigations open against the site, and what has closed this month. */
export interface QualityEvent {
  title: string;
  value: string;
  detail: string;
}

export const QUALITY_EVENTS: QualityEvent[] = [
  { title: "Active PNCs", value: "7", detail: "Raised this month: 3" },
  {
    title: "Active OOS Investigations",
    value: "2",
    detail: "1 closed this month (PGTMA)",
  },
  { title: "Active OOTs", value: "4", detail: "2 closed this month" },
];

/** How far each domain has got through the month's work. */
export interface ReleaseProgressRow {
  domain: string;
  samplesIn: number;
  completed: number;
  pending: number;
  percentComplete: number;
  avgDays: string;
}

export const DOMAIN_RELEASE_PROGRESS: ReleaseProgressRow[] = [
  { domain: "Finished Product", samplesIn: 89, completed: 71, pending: 18, percentComplete: 80, avgDays: "1.9d" },
  { domain: "Raw Material", samplesIn: 156, completed: 134, pending: 22, percentComplete: 86, avgDays: "1.6d" },
  { domain: "Packing Material", samplesIn: 203, completed: 188, pending: 15, percentComplete: 93, avgDays: "1.3d" },
  { domain: "IPFP", samplesIn: 67, completed: 54, pending: 13, percentComplete: 81, avgDays: "2.4d" },
  { domain: "Stability", samplesIn: 332, completed: 287, pending: 45, percentComplete: 86, avgDays: "2.1d" },
];

/** What is actually waiting on the GM-QA's signature. */
export const AWAITING_AUTHORISATION_COUNT = 23;

/* -------------------------------------------------------------------------- */
/* Exception drill-down                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The batches behind each bar on the exceptions chart.
 *
 * A count tells the CQO how often something happens; it does not tell them
 * whether it is one product misbehaving or six unrelated ones, which is the
 * question that decides whether anything needs doing. So the bar opens.
 */
export interface ExceptionDetail {
  arNumber: string;
  product: string;
  domain: string;
  detail: string;
  reviewerNote: string;
  status: "Open" | "Closed";
}

export const EXCEPTION_DRILLDOWN: Record<string, ExceptionDetail[]> = {
  "Related Substances": [
    {
      arNumber: "07-FP-26-0122",
      product: "Amoxicillin 250mg",
      domain: "FP",
      detail: "Known Impurity B 0.21% vs NMT 0.20%",
      reviewerNote: "Reviewed — found satisfactory",
      status: "Open",
    },
    {
      arNumber: "07-ST-26-0089",
      product: "Amoxicillin 250mg",
      domain: "Stability",
      detail: "RS OOT at 36M — increasing trend",
      reviewerNote: "Reviewed — found satisfactory",
      status: "Open",
    },
    {
      arNumber: "07-RM-26-4417",
      product: "Amoxicillin Trihydrate API",
      domain: "RM",
      detail: "FTIR correlation 0.942 vs 0.980 minimum",
      reviewerNote: "Exception noted — investigation initiated",
      status: "Open",
    },
    {
      arNumber: "07-FP-26-0118",
      product: "Metformin 500mg",
      domain: "FP",
      detail: "Unknown impurity at RRT 1.42 — 0.11% vs NMT 0.10%",
      reviewerNote: "Exception noted — investigation initiated",
      status: "Closed",
    },
    {
      arNumber: "07-ST-26-0041",
      product: "Metformin 500mg",
      domain: "Stability",
      detail: "Total impurities rising across 18M accelerated",
      reviewerNote: "Reviewed — found satisfactory",
      status: "Open",
    },
    {
      arNumber: "07-RM-26-4402",
      product: "Paracetamol API",
      domain: "RM",
      detail: "4-aminophenol 0.048% vs NMT 0.050%",
      reviewerNote: "Reviewed — found satisfactory",
      status: "Closed",
    },
    {
      arNumber: "07-FP-26-0115",
      product: "Atorvastatin 10mg",
      domain: "FP",
      detail: "Degradant at RRT 0.88 above reporting threshold",
      reviewerNote: "Deviation raised",
      status: "Closed",
    },
    {
      arNumber: "07-ST-26-0102",
      product: "Atorvastatin 10mg",
      domain: "Stability",
      detail: "Known Impurity C trending upward at 24M long-term",
      reviewerNote: "Reviewed — found satisfactory",
      status: "Open",
    },
  ],

  "Standards — expired or inactive": [
    {
      arNumber: "07-FP-26-0122",
      product: "Amoxicillin 250mg",
      domain: "FP",
      detail: "Acetonitrile inactivated entry",
      reviewerNote: "Reviewed — found satisfactory",
      status: "Open",
    },
    {
      arNumber: "07-RM-26-4417",
      product: "Amoxicillin Trihydrate API",
      domain: "RM",
      detail: "Triethylamine inactivation pending second approval",
      reviewerNote: "Exception noted — investigation initiated",
      status: "Open",
    },
    {
      arNumber: "07-FP-26-0119",
      product: "Metformin 500mg",
      domain: "FP",
      detail: "Working standard WS-2024-33 used one day past expiry",
      reviewerNote: "Deviation raised",
      status: "Closed",
    },
    {
      arNumber: "07-PM-26-8819",
      product: "HDPE Bottle 60ml",
      domain: "PM",
      detail: "Reference standard record not linked to the usage entry",
      reviewerNote: "Reviewed — found satisfactory",
      status: "Closed",
    },
    {
      arNumber: "07-ST-26-0089",
      product: "Amoxicillin 250mg",
      domain: "Stability",
      detail: "Standard potency taken from a superseded eLIMS record",
      reviewerNote: "Exception noted — investigation initiated",
      status: "Open",
    },
  ],

  "LCMS — genotoxic impurity": [
    {
      arNumber: "07-FP-26-0122",
      product: "Amoxicillin 250mg",
      domain: "FP",
      detail: "0.08 ppm vs ICH M7 NMT 0.05 ppm",
      reviewerNote: "Reviewed — found satisfactory",
      status: "Open",
    },
    {
      arNumber: "07-FP-26-0116",
      product: "Metformin 500mg",
      domain: "FP",
      detail: "NDMA 0.031 ppm vs NMT 0.032 ppm — border limit",
      reviewerNote: "Reviewed — found satisfactory",
      status: "Closed",
    },
    {
      arNumber: "07-RM-26-4409",
      product: "Metformin HCl API",
      domain: "RM",
      detail: "Mesylate ester detected above the reporting threshold",
      reviewerNote: "Exception noted — investigation initiated",
      status: "Open",
    },
  ],

  "KF — determination count": [
    {
      arNumber: "07-FP-26-0122",
      product: "Amoxicillin 250mg",
      domain: "FP",
      detail: "2 determinations performed vs 1 permitted",
      reviewerNote: "Reviewed — found satisfactory",
      status: "Open",
    },
    {
      arNumber: "07-IPFP-26-0122",
      product: "Amoxicillin 250mg compression",
      domain: "IPFP",
      detail: "Determination started with COND BUSY — result invalid",
      reviewerNote: "PNC-2026-0089 raised",
      status: "Open",
    },
    {
      arNumber: "07-RM-26-4411",
      product: "Paracetamol API",
      domain: "RM",
      detail: "3 determinations recorded, no instrument error documented",
      reviewerNote: "Deviation raised",
      status: "Closed",
    },
  ],

  "Instruments — calibration gap": [
    {
      arNumber: "07-FP-26-0122",
      product: "Amoxicillin 250mg",
      domain: "FP",
      detail: "UV Spectrophotometer calibration overdue",
      reviewerNote: "Reviewed — found satisfactory",
      status: "Open",
    },
    {
      arNumber: "07-FP-26-0121",
      product: "Ciprofloxacin 500mg",
      domain: "FP",
      detail: "Sonicator daily verification recorded after first use",
      reviewerNote: "Exception noted — investigation initiated",
      status: "Closed",
    },
  ],

  "Chemicals — inactivated entry": [
    {
      arNumber: "07-FP-26-0122",
      product: "Amoxicillin 250mg",
      domain: "FP",
      detail: "Acetonitrile inactivated — Initiated status",
      reviewerNote: "Reviewed — found satisfactory",
      status: "Open",
    },
    {
      arNumber: "07-RM-26-4417",
      product: "Amoxicillin Trihydrate API",
      domain: "RM",
      detail: "Triethylamine inactivated, second approval outstanding",
      reviewerNote: "Exception noted — investigation initiated",
      status: "Open",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Pending analysis drill-down                                                */
/* -------------------------------------------------------------------------- */

/**
 * The samples behind each reason on the pending chart.
 *
 * Thirty-four samples held by instrument downtime is a number a GM-QA can do
 * nothing with. Which instruments, since when, and whether an engineer is
 * already booked — that is the part they can act on, and it is what decides
 * whether the number falls next week or does not.
 *
 * Only the oldest few are listed; the rest are counted. A GM-QA reading this
 * is deciding where to push, not working a queue.
 */
export interface PendingSample {
  arNumber: string;
  product: string;
  domain: string;
  pendingSince: string;
  daysPending: number;
  note: string;
}

export interface PendingReasonDetail {
  /** The oldest samples, shown in full. */
  samples: PendingSample[];
  /** Everything under this reason, including the ones not listed. */
  total: number;
}

/** Over a week held is a different conversation from a few days. */
export const PENDING_ESCALATION_DAYS = 7;
export const PENDING_WATCH_DAYS = 3;

export const PENDING_DRILLDOWN: Record<string, PendingReasonDetail> = {
  "Instrument downtime": {
    total: 34,
    samples: [
      {
        arNumber: "07-FP-26-0089",
        product: "Ciprofloxacin 500mg",
        domain: "FP",
        pendingSince: "25-Aug-2026",
        daysPending: 6,
        note: "HPLC-002 under maintenance — parts ordered",
      },
      {
        arNumber: "07-RM-26-4401",
        product: "Paracetamol API",
        domain: "RM",
        pendingSince: "24-Aug-2026",
        daysPending: 7,
        note: "KF Titrator KFA2004 — sensor replacement",
      },
      {
        arNumber: "07-ST-26-0078",
        product: "Metformin 500mg",
        domain: "Stability",
        pendingSince: "22-Aug-2026",
        daysPending: 9,
        note: "LCMS offline — engineer visit scheduled",
      },
      {
        arNumber: "07-PM-26-8801",
        product: "Aluminium foil",
        domain: "PM",
        pendingSince: "28-Aug-2026",
        daysPending: 3,
        note: "FTIR FTR2001 — calibration due",
      },
    ],
  },

  "OOS investigation": {
    total: 12,
    samples: [
      {
        arNumber: "07-FP-26-0122",
        product: "Amoxicillin 250mg",
        domain: "FP",
        pendingSince: "28-Aug-2026",
        daysPending: 3,
        note: "OOS-2026-0089 — LCMS genotoxic impurity. Phase 1 investigation in progress",
      },
      {
        arNumber: "07-ST-26-0089",
        product: "Amoxicillin 250mg",
        domain: "Stability",
        pendingSince: "26-Aug-2026",
        daysPending: 5,
        note: "OOS-2026-0091 — Known Impurity B OOT. Root cause under investigation",
      },
      {
        arNumber: "07-RM-26-4417",
        product: "Amoxicillin Trihydrate",
        domain: "RM",
        pendingSince: "27-Aug-2026",
        daysPending: 4,
        note: "FTIR identity failure — reanalysis pending",
      },
    ],
  },

  "Reagent unavailability": {
    total: 8,
    samples: [
      {
        arNumber: "07-FP-26-0095",
        product: "Atorvastatin 10mg",
        domain: "FP",
        pendingSince: "29-Aug-2026",
        daysPending: 2,
        note: "Acetonitrile LC-MS grade — stock depleted. Order placed",
      },
      {
        arNumber: "07-RM-26-4409",
        product: "Metformin API",
        domain: "RM",
        pendingSince: "27-Aug-2026",
        daysPending: 4,
        note: "Karl Fischer Reagent — awaiting delivery",
      },
    ],
  },

  "Analyst unavailability": {
    total: 5,
    samples: [
      {
        arNumber: "07-FP-26-0091",
        product: "Amoxicillin 500mg",
        domain: "FP",
        pendingSince: "30-Aug-2026",
        daysPending: 1,
        note: "Analyst on approved leave — reassignment pending QC section in-charge",
      },
      {
        arNumber: "07-ST-26-0085",
        product: "Ciprofloxacin 500mg",
        domain: "Stability",
        pendingSince: "29-Aug-2026",
        daysPending: 2,
        note: "Analyst on training — returns 02-Sep-2026",
      },
    ],
  },
};
