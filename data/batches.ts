/**
 * Hardcoded sample data for the workflow validation prototype.
 *
 * No backend, no API, no database. Every value below is fixed data that
 * imitates real Empower and Caliber LIMS records.
 *
 * Vocabulary rules enforced throughout this file:
 *   - A rule that does not raise a finding is "Compliant". Never "Pass"/"Passed".
 *   - No use of "Approve", "Approved" or "Released" anywhere.
 */

export type Severity = "Critical" | "Major" | "Minor";

export type FindingStatus = "Pending" | "Acknowledged" | "Escalated";

export type RuleOutcome = "Finding" | "Compliant";

export type SessionStatus = "New" | "Paused" | "Completed";

export type SectionId =
  | "summary"
  | "general"
  | "standards"
  | "column"
  | "audit-trail"
  | "notes";

export interface Section {
  id: SectionId;
  label: string;
  /** Rules surfaced by this filter. `null` means "every rule" (Summary). */
  ruleIds: string[] | null;
}

export interface RuleDefinition {
  id: string;
  name: string;
}

export interface RuleResult {
  ruleId: string;
  outcome: RuleOutcome;
  /** Present only when outcome is "Finding". */
  severity?: Severity;
  expected: string;
  actual: string;
  source: string;
  explanation: string;
  /** One-line value summary shown on the finding card in the centre column. */
  summary: string;
  /** Seeded reviewer state. Used for Batch C's paused session. */
  initialStatus?: FindingStatus;
}

export interface AssemblyStep {
  label: string;
  value: string;
  state: "ok" | "warning";
}

export interface Batch {
  arNumber: string;
  product: string;
  testType: string;
  analyst: string;
  analystUserId: string;
  submitted: string;
  analysisDate: string;
  sampleSet: string;
  method: string;
  workingStandard: string;
  referenceStandard: string;
  column: string;
  auditEvents: string;
  sessionStatus: SessionStatus;
  /** Sub-line on the Recent Reviews card. */
  activityLabel: string;
  assembly: AssemblyStep[];
  results: RuleResult[];
  /** Rule id the reviewer was last on. Seeded for paused sessions only. */
  checklistPosition?: string;
}

export const REVIEWER = "Shrikrishna";

export const REVIEWER_USER_ID = "skrishna";

/** The ten rules evaluated by the prototype, in canonical order. */
export const RULES: RuleDefinition[] = [
  { id: "RULE-001", name: "Review SLA Met" },
  { id: "RULE-002", name: "Audit Trail Exists" },
  { id: "RULE-003", name: "Working Standard Active" },
  { id: "RULE-004", name: "Working Standard Not Expired" },
  { id: "RULE-006", name: "Reference Standard Active" },
  { id: "RULE-009", name: "Column Active" },
  { id: "RULE-010", name: "Column Usage Within Limit" },
  { id: "RULE-013", name: "Audit Reason Present" },
  { id: "RULE-014", name: "Role Segregation" },
  { id: "RULE-015", name: "Analyst Present" },
];

export const RULE_NAMES: Record<string, string> = Object.fromEntries(
  RULES.map((rule) => [rule.id, rule.name]),
);

/** Left-column section navigation. Filters the findings list. */
export const SECTIONS: Section[] = [
  { id: "summary", label: "Summary", ruleIds: null },
  { id: "general", label: "General", ruleIds: ["RULE-001", "RULE-014", "RULE-015"] },
  { id: "standards", label: "Standards", ruleIds: ["RULE-003", "RULE-004", "RULE-006"] },
  { id: "column", label: "Column", ruleIds: ["RULE-009", "RULE-010"] },
  { id: "audit-trail", label: "Audit Trail", ruleIds: ["RULE-002", "RULE-013"] },
  { id: "notes", label: "Notes", ruleIds: [] },
];

/* -------------------------------------------------------------------------- */
/* Batch A — AR-2026-000121 — Paracetamol 500mg                               */
/* Purpose: validate the clean-batch path. Zero findings, ten rules compliant. */
/* -------------------------------------------------------------------------- */

const batchA: Batch = {
  arNumber: "AR-2026-000121",
  product: "Paracetamol 500mg",
  testType: "InstrumentBased (HPLC Assay)",
  analyst: "Rajesh Kumar",
  analystUserId: "rkumar",
  submitted: "01-Aug-2026 09:00",
  analysisDate: "01-Aug-2026",
  sampleSet: "HPLC-2026-SS-441",
  method: "USP-HPLC-PARA-v3.2",
  workingStandard: "WS-2024-41 (Active)",
  referenceStandard: "RS-2024-18 (Active)",
  column: "COL-2024-07 (380 injections)",
  auditEvents: "14 events, all with reasons",
  sessionStatus: "Completed",
  activityLabel: "Reviewed 02-Aug-2026 10:00",
  assembly: [
    { label: "AR Found", value: "AR-2026-000121", state: "ok" },
    { label: "Sample Set", value: "HPLC-2026-SS-441", state: "ok" },
    { label: "Method", value: "USP-HPLC-PARA-v3.2", state: "ok" },
    { label: "Working Standard", value: "WS-2024-41", state: "ok" },
    { label: "Reference Standard", value: "RS-2024-18", state: "ok" },
    { label: "Column", value: "COL-2024-07", state: "ok" },
    { label: "Audit Trail", value: "14 events loaded", state: "ok" },
  ],
  results: [
    {
      ruleId: "RULE-001",
      outcome: "Compliant",
      summary: "Commenced 02-Aug-2026 10:00, 2 days ahead of due date",
      expected: "QA review commenced on or before the Caliber review due date of 04-Aug-2026 09:00",
      actual: "QA review commenced 02-Aug-2026 10:00 — 2 days ahead of due date",
      source: "Caliber LIMS — AR Header, Review Due Date",
      explanation:
        "The review was picked up inside the window Caliber recorded against this AR. No turnaround deviation to justify.",
    },
    {
      ruleId: "RULE-002",
      outcome: "Compliant",
      summary: "14 events retrieved for HPLC-2026-SS-441",
      expected: "An Empower audit trail retrievable for the sample set",
      actual: "14 events retrieved for HPLC-2026-SS-441, covering 01-Aug-2026 07:12 to 01-Aug-2026 08:54",
      source: "Empower — Project Audit Trail",
      explanation:
        "The audit trail is present and continuous from acquisition through final processing. Nothing in the sequence is missing a corresponding entry.",
    },
    {
      ruleId: "RULE-003",
      outcome: "Compliant",
      summary: "WS-2024-41 — Status = Active",
      expected: "Working standard status = Active on the analysis date",
      actual: "WS-2024-41 — Status = Active",
      source: "Empower — WorkingStandard custom field",
      explanation:
        "WS-2024-41 was active in Empower on 01-Aug-2026. There is no restriction on its use in this analysis.",
    },
    {
      ruleId: "RULE-004",
      outcome: "Compliant",
      summary: "WS-2024-41 — Expiry 30-Nov-2026, 121 days remaining",
      expected: "Working standard expiry date on or after the analysis date of 01-Aug-2026",
      actual: "WS-2024-41 — Expiry 30-Nov-2026 (121 days remaining at analysis)",
      source: "Empower — WorkingStandard custom field",
      explanation:
        "The working standard was well inside its assigned validity period when the sample set was acquired. Its assigned potency holds for this calculation.",
    },
    {
      ruleId: "RULE-006",
      outcome: "Compliant",
      summary: "RS-2024-18 — Status = Active, Expiry 31-Dec-2026",
      expected: "Reference standard status = Active on the analysis date",
      actual: "RS-2024-18 — Status = Active, Expiry 31-Dec-2026",
      source: "Empower — ReferenceStandard custom field",
      explanation:
        "The reference standard used to qualify WS-2024-41 was active and unexpired on the analysis date. The traceability chain back to the pharmacopoeial standard holds.",
    },
    {
      ruleId: "RULE-009",
      outcome: "Compliant",
      summary: "COL-2024-07 — Status = Active",
      expected: "Column status = Active on the analysis date",
      actual: "COL-2024-07 — Status = Active, qualified 12-Jan-2026",
      source: "Empower — Column custom field",
      explanation:
        "The column was in its qualified state for the whole sample set. No hold or withdrawal is recorded against it in Empower.",
    },
    {
      ruleId: "RULE-010",
      outcome: "Compliant",
      summary: "COL-2024-07 — 380 of 400 injections used",
      expected: "Cumulative injection count at or below the qualified limit of 400",
      actual: "COL-2024-07 — 380 injections at close of sample set (20 remaining)",
      source: "Empower — Column custom field, Injection Counter",
      explanation:
        "The column stayed inside its qualified injection life across the sample set. 20 injections remain before re-qualification falls due — worth noting for scheduling, but it is not a finding against this AR.",
    },
    {
      ruleId: "RULE-013",
      outcome: "Compliant",
      summary: "14 of 14 events carry a reason for change",
      expected: "A reason for change recorded against every audit trail event that requires one",
      actual: "14 of 14 events carry a reason for change",
      source: "Empower — Project Audit Trail, Reason field",
      explanation:
        "Every modification to processed data in this sample set carries a recorded reason. Each change is justified on its own entry.",
    },
    {
      ruleId: "RULE-014",
      outcome: "Compliant",
      summary: "Analyst rkumar, reviewer skrishna — different users",
      expected: "The analyst and the QA reviewer are different Empower users",
      actual: "Analyst: Rajesh Kumar (rkumar) · Reviewer: Shrikrishna (skrishna)",
      source: "Empower — User Group assignment / Caliber LIMS — Reviewer field",
      explanation:
        "The user who acquired and processed the data is not the user performing this review. Segregation of duties is intact for the AR.",
    },
    {
      ruleId: "RULE-015",
      outcome: "Compliant",
      summary: "Rajesh Kumar recorded on all injections",
      expected: "A named analyst recorded against every injection in the sample set",
      actual: "Rajesh Kumar (rkumar) recorded on all injections in HPLC-2026-SS-441",
      source: "Empower — Sample Set, Acquired By",
      explanation:
        "Every injection in the sample set is attributable to a named analyst. No injection is recorded against a shared or system account.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Batch B — AR-2026-000122 — Amoxicillin 250mg                               */
/* Purpose: validate the exception path.                                      */
/* 2 Critical (RULE-003, RULE-004) + 1 Major (RULE-010) + 7 Compliant = 10.   */
/* -------------------------------------------------------------------------- */

const batchB: Batch = {
  arNumber: "AR-2026-000122",
  product: "Amoxicillin 250mg",
  testType: "InstrumentBased (HPLC Assay)",
  analyst: "Priya Sharma",
  analystUserId: "psharma",
  submitted: "30-Jul-2026 16:00",
  analysisDate: "30-Jul-2026",
  sampleSet: "HPLC-2026-SS-439",
  method: "USP-HPLC-AMOX-v1.4",
  workingStandard: "WS-2024-44 (Inactive, expired)",
  referenceStandard: "RS-2024-18 (Active)",
  column: "COL-2024-09 (412 injections)",
  auditEvents: "11 events, all with reasons",
  sessionStatus: "New",
  activityLabel: "Not yet reviewed",
  assembly: [
    { label: "AR Found", value: "AR-2026-000122", state: "ok" },
    { label: "Sample Set", value: "HPLC-2026-SS-439", state: "ok" },
    { label: "Method", value: "USP-HPLC-AMOX-v1.4", state: "ok" },
    { label: "Working Standard", value: "WS-2024-44", state: "ok" },
    { label: "Reference Standard", value: "RS-2024-18", state: "ok" },
    { label: "Column", value: "COL-2024-09", state: "ok" },
    { label: "Audit Trail", value: "11 events loaded", state: "ok" },
  ],
  results: [
    {
      ruleId: "RULE-001",
      outcome: "Compliant",
      summary: "Commenced 03-Aug-2026, due date 03-Aug-2026 16:00",
      expected: "QA review commenced on or before the Caliber review due date of 03-Aug-2026 16:00",
      actual: "QA review commenced 03-Aug-2026 — due date is today",
      source: "Caliber LIMS — AR Header, Review Due Date",
      explanation:
        "The review is being commenced on its due date, so it is inside the window Caliber recorded. There is no margin left on this AR — if the review is paused past 16:00 today it will breach the turnaround commitment.",
    },
    {
      ruleId: "RULE-002",
      outcome: "Compliant",
      summary: "11 events retrieved for HPLC-2026-SS-439",
      expected: "An Empower audit trail retrievable for the sample set",
      actual: "11 events retrieved for HPLC-2026-SS-439, covering 30-Jul-2026 11:05 to 30-Jul-2026 15:31",
      source: "Empower — Project Audit Trail",
      explanation:
        "The audit trail is present and continuous from acquisition through final processing. Nothing in the sequence is missing a corresponding entry.",
    },
    {
      ruleId: "RULE-003",
      outcome: "Finding",
      severity: "Critical",
      summary: "WS-2024-44 — Status = Inactive, inactivated 20-Jul-2026",
      expected: "Working standard status = Active on the analysis date",
      actual: "WS-2024-44 — Status = Inactive (inactivated 20-Jul-2026)",
      source: "Empower — WorkingStandard custom field",
      explanation:
        "Working standard WS-2024-44 was set to Inactive in Empower on 20-Jul-2026 and was still inactive when sample set HPLC-2026-SS-439 was acquired on 30-Jul-2026. An inactive standard is withdrawn from use in regulated analysis, so it should not have appeared in the standard bracket at all. The assay result on this AR was calculated against that standard, which means the reported potency rests on a standard the laboratory had already withdrawn. Establish why an inactive standard was still selectable in the method, and confirm whether a re-analysis against a current standard exists, before recording your disposition.",
    },
    {
      ruleId: "RULE-004",
      outcome: "Finding",
      severity: "Critical",
      summary: "WS-2024-44 — Expiry 18-Jul-2026, expired 12 days before analysis",
      expected: "Working standard expiry date on or after the analysis date of 30-Jul-2026",
      actual: "WS-2024-44 — Expiry 18-Jul-2026 (expired 12 days before analysis)",
      source: "Empower — WorkingStandard custom field",
      explanation:
        "Working standard WS-2024-44 carried an expiry date of 18-Jul-2026. The sample set was acquired on 30-Jul-2026, twelve days past that date. Beyond expiry the assigned potency of a standard is no longer supported by its qualification data, so the standard response used in the assay calculation cannot be relied on and the reported result is not defensible as it stands. This compounds RULE-003 — the same standard was both withdrawn and out of date on the analysis date, so the two findings share one root cause and should be investigated together rather than closed separately.",
    },
    {
      ruleId: "RULE-006",
      outcome: "Compliant",
      summary: "RS-2024-18 — Status = Active, Expiry 31-Dec-2026",
      expected: "Reference standard status = Active on the analysis date",
      actual: "RS-2024-18 — Status = Active, Expiry 31-Dec-2026",
      source: "Empower — ReferenceStandard custom field",
      explanation:
        "The reference standard was active and unexpired on the analysis date. Note that this covers the reference standard only — it does not carry over to the working standard qualified against it, which is the subject of RULE-003 and RULE-004.",
    },
    {
      ruleId: "RULE-009",
      outcome: "Compliant",
      summary: "COL-2024-09 — Status = Active",
      expected: "Column status = Active on the analysis date",
      actual: "COL-2024-09 — Status = Active, qualified 03-Mar-2026",
      source: "Empower — Column custom field",
      explanation:
        "The column carried Active status in Empower for the whole sample set. Status is held separately from the injection counter, so this rule is met even though the counter has run past its limit — see RULE-010.",
    },
    {
      ruleId: "RULE-010",
      outcome: "Finding",
      severity: "Major",
      summary: "COL-2024-09 — 412 injections against a limit of 400",
      expected: "Cumulative injection count at or below the qualified limit of 400",
      actual: "COL-2024-09 — 412 injections at close of sample set (limit exceeded by 12)",
      source: "Empower — Column custom field, Injection Counter",
      explanation:
        "Column COL-2024-09 is qualified for 400 injections. The counter stood at 412 when sample set HPLC-2026-SS-439 closed, so the last 12 injections in the sequence were acquired past the column's qualified life. System suitability criteria were met across the sample set, so the chromatography itself gives no sign of degradation and the result is not invalid on its face. The column is nonetheless outside its qualified range and must be withdrawn or re-qualified before further use. Identify which injections in the sequence fall past 400, and confirm the sample injections concerned were bracketed by system suitability injections that met their acceptance criteria.",
    },
    {
      ruleId: "RULE-013",
      outcome: "Compliant",
      summary: "11 of 11 events carry a reason for change",
      expected: "A reason for change recorded against every audit trail event that requires one",
      actual: "11 of 11 events carry a reason for change",
      source: "Empower — Project Audit Trail, Reason field",
      explanation:
        "Every modification to processed data in this sample set carries a recorded reason. Each change is justified on its own entry.",
    },
    {
      ruleId: "RULE-014",
      outcome: "Compliant",
      summary: "Analyst psharma, reviewer skrishna — different users",
      expected: "The analyst and the QA reviewer are different Empower users",
      actual: "Analyst: Priya Sharma (psharma) · Reviewer: Shrikrishna (skrishna)",
      source: "Empower — User Group assignment / Caliber LIMS — Reviewer field",
      explanation:
        "The user who acquired and processed the data is not the user performing this review. Segregation of duties is intact for the AR.",
    },
    {
      ruleId: "RULE-015",
      outcome: "Compliant",
      summary: "Priya Sharma recorded on all injections",
      expected: "A named analyst recorded against every injection in the sample set",
      actual: "Priya Sharma (psharma) recorded on all injections in HPLC-2026-SS-439",
      source: "Empower — Sample Set, Acquired By",
      explanation:
        "Every injection in the sample set is attributable to a named analyst. No injection is recorded against a shared or system account.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Batch C — AR-2026-000123 — Metformin 500mg                                 */
/* Purpose: validate the pause and resume path.                               */
/* 2 Major (RULE-001 acknowledged, RULE-013 pending) + 8 Compliant = 10.      */
/* Seeded as a paused session; checklistPosition sits on RULE-013.            */
/* -------------------------------------------------------------------------- */

const batchC: Batch = {
  arNumber: "AR-2026-000123",
  product: "Metformin 500mg",
  testType: "InstrumentBased (HPLC Assay)",
  analyst: "Amit Patel",
  analystUserId: "apatel",
  submitted: "29-Jul-2026 14:00",
  analysisDate: "29-Jul-2026",
  sampleSet: "HPLC-2026-SS-438",
  method: "USP-HPLC-MET-v2.1",
  workingStandard: "WS-2024-39 (Active)",
  referenceStandard: "RS-2024-18 (Active)",
  column: "COL-2024-07 (380 injections)",
  auditEvents: "16 events, 2 missing reasons",
  sessionStatus: "Paused",
  activityLabel: "Paused 31-Jul-2026 17:35",
  checklistPosition: "RULE-013",
  assembly: [
    { label: "AR Found", value: "AR-2026-000123", state: "ok" },
    { label: "Sample Set", value: "HPLC-2026-SS-438", state: "ok" },
    { label: "Method", value: "USP-HPLC-MET-v2.1", state: "ok" },
    { label: "Working Standard", value: "WS-2024-39", state: "ok" },
    { label: "Reference Standard", value: "RS-2024-18", state: "ok" },
    { label: "Column", value: "COL-2024-07", state: "ok" },
    { label: "Audit Trail", value: "16 events loaded, 2 events flagged", state: "warning" },
  ],
  results: [
    {
      ruleId: "RULE-001",
      outcome: "Finding",
      severity: "Major",
      initialStatus: "Acknowledged",
      summary: "Review commenced 1 day past Caliber due date",
      expected: "QA review commenced on or before the Caliber review due date of 30-Jul-2026 14:00",
      actual: "QA review commenced 31-Jul-2026 15:10 — 1 day beyond due date",
      source: "Caliber LIMS — AR Header, Review Due Date",
      explanation:
        "Sample set HPLC-2026-SS-438 was submitted for QA review on 29-Jul-2026 14:00 against a Caliber review due date of 30-Jul-2026 14:00. The review was not commenced until 31-Jul-2026 15:10, one day past that date. A late review does not affect the validity of the analytical result — the data itself is unchanged — but the delay is a recorded breach of the review turnaround commitment for this AR and will be visible in Caliber's SLA reporting. Record the reason for the delay when you record your disposition.",
    },
    {
      ruleId: "RULE-002",
      outcome: "Compliant",
      summary: "16 events retrieved for HPLC-2026-SS-438",
      expected: "An Empower audit trail retrievable for the sample set",
      actual: "16 events retrieved for HPLC-2026-SS-438, covering 29-Jul-2026 09:48 to 29-Jul-2026 17:02",
      source: "Empower — Project Audit Trail",
      explanation:
        "The audit trail is present and continuous from acquisition through final processing — every action in the sequence has a corresponding entry. This rule tests only that the trail exists and is complete in coverage. Two of the sixteen entries are missing a reason for change, which is assessed separately under RULE-013.",
    },
    {
      ruleId: "RULE-003",
      outcome: "Compliant",
      summary: "WS-2024-39 — Status = Active",
      expected: "Working standard status = Active on the analysis date",
      actual: "WS-2024-39 — Status = Active",
      source: "Empower — WorkingStandard custom field",
      explanation:
        "WS-2024-39 was active in Empower on 29-Jul-2026. There is no restriction on its use in this analysis.",
    },
    {
      ruleId: "RULE-004",
      outcome: "Compliant",
      summary: "WS-2024-39 — Expiry 31-Oct-2026, 94 days remaining",
      expected: "Working standard expiry date on or after the analysis date of 29-Jul-2026",
      actual: "WS-2024-39 — Expiry 31-Oct-2026 (94 days remaining at analysis)",
      source: "Empower — WorkingStandard custom field",
      explanation:
        "The working standard was inside its assigned validity period when the sample set was acquired. Its assigned potency holds for this calculation.",
    },
    {
      ruleId: "RULE-006",
      outcome: "Compliant",
      summary: "RS-2024-18 — Status = Active, Expiry 31-Dec-2026",
      expected: "Reference standard status = Active on the analysis date",
      actual: "RS-2024-18 — Status = Active, Expiry 31-Dec-2026",
      source: "Empower — ReferenceStandard custom field",
      explanation:
        "The reference standard used to qualify WS-2024-39 was active and unexpired on the analysis date. The traceability chain back to the pharmacopoeial standard holds.",
    },
    {
      ruleId: "RULE-009",
      outcome: "Compliant",
      summary: "COL-2024-07 — Status = Active",
      expected: "Column status = Active on the analysis date",
      actual: "COL-2024-07 — Status = Active, qualified 12-Jan-2026",
      source: "Empower — Column custom field",
      explanation:
        "The column was in its qualified state for the whole sample set. No hold or withdrawal is recorded against it in Empower.",
    },
    {
      ruleId: "RULE-010",
      outcome: "Compliant",
      summary: "COL-2024-07 — 380 of 400 injections used",
      expected: "Cumulative injection count at or below the qualified limit of 400",
      actual: "COL-2024-07 — 380 injections at close of sample set (20 remaining)",
      source: "Empower — Column custom field, Injection Counter",
      explanation:
        "The column stayed inside its qualified injection life across the sample set. 20 injections remain before re-qualification falls due — worth noting for scheduling, but it is not a finding against this AR.",
    },
    {
      ruleId: "RULE-013",
      outcome: "Finding",
      severity: "Major",
      initialStatus: "Pending",
      summary: "14 of 16 events carry a reason — 2 events recorded without one",
      expected: "A reason for change recorded against every audit trail event that requires one (16 of 16)",
      actual: "14 of 16 events carry a reason for change — 2 events recorded without one",
      source: "Empower — Project Audit Trail, Reason field",
      explanation:
        "Two entries in the audit trail for sample set HPLC-2026-SS-438 were saved without a reason for change: at 29-Jul-2026 16:42, integration parameters were modified by A. Patel (peak width 0.20 to 0.35); at 29-Jul-2026 16:58, the result set was reprocessed by the same user. Both actions changed processed data and both therefore require a recorded reason. Without one, the change cannot be justified to an inspector and the reprocessed result cannot be shown to be a considered decision rather than an attempt to obtain a different outcome. This is the kind of gap that attracts a data integrity observation even when the underlying result is sound. Obtain the reason from the analyst, confirm it is contemporaneous with the change, and have it recorded against both entries before disposition.",
    },
    {
      ruleId: "RULE-014",
      outcome: "Compliant",
      summary: "Analyst apatel, reviewer skrishna — different users",
      expected: "The analyst and the QA reviewer are different Empower users",
      actual: "Analyst: Amit Patel (apatel) · Reviewer: Shrikrishna (skrishna)",
      source: "Empower — User Group assignment / Caliber LIMS — Reviewer field",
      explanation:
        "The user who acquired and processed the data is not the user performing this review. Segregation of duties is intact for the AR. Note that the reprocessing under RULE-013 was carried out by the analyst, not by a second user — that is permitted, but it is why the missing reason matters.",
    },
    {
      ruleId: "RULE-015",
      outcome: "Compliant",
      summary: "Amit Patel recorded on all injections",
      expected: "A named analyst recorded against every injection in the sample set",
      actual: "Amit Patel (apatel) recorded on all injections in HPLC-2026-SS-438",
      source: "Empower — Sample Set, Acquired By",
      explanation:
        "Every injection in the sample set is attributable to a named analyst. No injection is recorded against a shared or system account.",
    },
  ],
};

/** All three batches, in AR-number order — the order of the validation session. */
export const BATCHES: Batch[] = [batchA, batchB, batchC];

export function getBatch(arNumber: string): Batch | undefined {
  const needle = arNumber.trim().toUpperCase();
  return BATCHES.find((batch) => batch.arNumber.toUpperCase() === needle);
}
