/**
 * The compliance rule set QRA checks against.
 *
 * Transcribed from the site's audit trail SOPs — FU7-QA-GEN-080 for the
 * chromatography data system and the non-CDS instruments, and
 * QRA-CP-F-QCCI-GEN-0013 for the titrators. The rules live here rather than
 * inside a batch because they belong to the site, not to any one analysis:
 * a batch entry names the rule it answers to, and this is where the rule
 * says what it means.
 */

/** The documents every check traces back to. */
export const SOP = {
  /** Analytical data review, and the chromatography data system with it. */
  REVIEW: "FU7-QA-GEN-080",
  EMPOWER: "FU7-QA-GEN-080 §4.5.5.3",
  CHROMATOGRAM: "FU7-QA-GEN-080 §4.5.2.2",
  CHEMICALS: "FU7-QA-GEN-080 §4.5.1",
  INSTRUMENTS: "FU7-QA-GEN-080 §4.5.2",
  /** Titrator audit trail review. */
  TIAMO: "QRA-CP-F-QCCI-GEN-0013",
  /** LIMS data. */
  LIMS: "CQA-CP-QC-GEN-0010",
  /** The notification raised when a result cannot stand. */
  PNC: "QRA-GP-GEN-0023",
  /** Material release/reject review checklist — raw and packing material. */
  MATERIAL_CHECKLIST: "CQA-CP-GEN-042",
  /** Non-CDS instruments: the audit trail arrives as a PDF in LIMS. */
  NON_CDS: "FU7-QA-GEN-080 §4.5.5.3 (non-CDS)",
} as const;

export const PNC_INSTRUCTION = `Raise PNC per ${SOP.PNC}`;

/* -------------------------------------------------------------------------- */
/* Acceptability rules — the titrator                                         */
/* -------------------------------------------------------------------------- */

export interface AcceptabilityRule {
  id: string;
  /** What the audit trail records. */
  found: string;
  /** What has to hold for that to be acceptable. */
  condition: string;
}

/**
 * Entries that read like findings and are not, provided something holds that
 * the audit trail cannot tell you. Each one is a genuine ambiguity: the same
 * sequence is written whether the method called for it or somebody
 * intervened, so only a person who knows the method can close it.
 */
export const ACCEPTABILITY_RULES: AcceptabilityRule[] = [
  {
    id: "PASS-TIA-01",
    found: "Determination interrupted → Determination continued → Determination finished",
    condition: "Method specifies additional solution during titration",
  },
  {
    id: "PASS-TIA-02",
    found: "Determination series interrupted → series continued → series finished",
    condition: "Full sequence present",
  },
  {
    id: "PASS-TIA-03",
    found: "Sample data live modified (with REQUEST) before titration start",
    condition: "Old and new values verified",
  },
  {
    id: "PASS-TIA-04",
    found: "Access rights modified",
    condition: "SOP-authorised update",
  },
  {
    id: "PASS-TIA-05",
    found: "User added",
    condition: "Approved request exists",
  },
  {
    id: "PASS-TIA-06",
    found: "User Properties modified or User moved",
    condition: "Approved request exists",
  },
  {
    id: "PASS-TIA-07",
    found: "Settings according to 21 CFR part 11",
    condition: "Coincides with SOP revision",
  },
  {
    id: "PASS-TIA-08",
    found: "Audit Trail deleted",
    condition: "Procedure recommends it",
  },
  {
    id: "PASS-TIA-09",
    found: "Database Deleted",
    condition: "Procedure recommends it",
  },
  {
    id: "PASS-TIA-10",
    found: "Audit Trail option modified",
    condition: "Coincides with SOP revision",
  },
];

export const acceptabilityRule = (id: string): AcceptabilityRule => {
  const rule = ACCEPTABILITY_RULES.find((entry) => entry.id === id);
  if (!rule) throw new Error(`Unknown acceptability rule: ${id}`);
  return rule;
};

/* -------------------------------------------------------------------------- */
/* Attendance                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Whether the analyst was on site the day the analysis is recorded against.
 *
 * A cheap check that catches an expensive class of problem: data recorded
 * under the name of somebody who was not there. It is asked of every review,
 * which is why it sits at the top of every parameter rather than inside one.
 */
export const HRMS_SOP = "FU7-QA-GEN-080 RULE-EMP-06 / CROSS-09";
export const HRMS_SOURCE = "HRMS System";
