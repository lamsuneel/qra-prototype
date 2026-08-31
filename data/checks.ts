/**
 * The checks that are the same wherever they are asked.
 *
 * An audit trail review does not change because the sample did: the same
 * fourteen questions are put to Empower whether it ran an assay in Finished
 * Product or a blend uniformity in IPFP. Writing them out once per domain
 * would mean five copies drifting apart, so they are built here and the
 * domain supplies only what is true of that analysis.
 */

import type { CheckItem } from "@/types";
import { compliant, flagged } from "./factories";
import { SOP } from "./rules";

/* -------------------------------------------------------------------------- */
/* Attendance                                                                 */
/* -------------------------------------------------------------------------- */

export const HRMS_SOP = "FU7-QA-GEN-080 RULE-EMP-06 / CROSS-09";

/**
 * Whether the analyst was on site the day the analysis is recorded against.
 *
 * A cheap check against an expensive class of problem — data recorded under
 * the name of somebody who was not there. Asked of every review, which is why
 * it leads every parameter rather than sitting inside one of them.
 */
export const attendanceCheck = (
  prefix: string,
  analyst: string,
  date: string,
  verified = true,
): CheckItem =>
  compliant({
    prefix,
    label: `Analyst attendance verified (HRMS): ${analyst}`,
    sopReference: HRMS_SOP,
    reference: date,
    statusText: verified ? "Present" : "Not verified",
    expected: "Present — HRMS record confirmed",
    actual: verified
      ? `Present — HRMS record confirmed for ${date}`
      : `Not verified — no HRMS record retrieved for ${date}`,
    expectedSource: HRMS_SOP,
    source: "HRMS System",
    comparison: verified
      ? "The HRMS attendance record covers the day the analysis is recorded against"
      : "QRA could not retrieve an HRMS record for the day of analysis",
    /* No record fetched is not the same as absent. It is amber, and the
       reviewer opens HRMS themselves — which is a different question from a
       missing prescribed quantity, so it asks in its own words. */
    verification: verified
      ? undefined
      : {
          warning: `Verify attendance in HRMS: no record retrieved for ${analyst} on ${date}`,
          prefill:
            "Analyst attendance manually verified against HRMS system — confirmed present on date of analysis.",
          placeholder: "Confirm attendance verified in HRMS...",
          blocking: `Confirm analyst attendance verification for “${analyst}” before marking this section reviewed.`,
        },
  });

/* -------------------------------------------------------------------------- */
/* Empower audit trail — EMP-F01 to EMP-F14                                   */
/* -------------------------------------------------------------------------- */

interface EmpowerOptions {
  /** The reprocessed run EMP-F09 asks about, where one was found. */
  reprocessed?: string;
}

/**
 * The chromatography data system's own record of what was done to the data.
 *
 * Every item here is a way of asking the same question — was the result
 * changed after it was produced, and if so does anyone know why. Most of them
 * pass silently; the ones that do not are the whole reason the review exists.
 */
export const empowerAuditTrail = (
  prefix: string,
  options: EmpowerOptions = {},
): CheckItem[] => {
  const items: CheckItem[] = [
    compliant({
      prefix,
      flagId: "EMP-F01",
      sopReference: SOP.EMPOWER,
      label: "Results stored values reconcile",
      statusText: "Reconciled",
      expected: "# Results stored matches the injections reported",
      actual: "# Results stored 12, matching the 12 injections in the sample set",
      expectedSource: SOP.EMPOWER,
      source: "Waters Empower",
      comparison: "Stored result count read against the sample set",
    }),
    compliant({
      prefix,
      flagId: "EMP-F02",
      sopReference: SOP.EMPOWER,
      label: "Altered flag on every channel",
      statusText: "FALSE",
      expected: "Altered flag = FALSE on every channel",
      actual: "Altered flag FALSE across all 12 channels",
      expectedSource: SOP.EMPOWER,
      source: "Waters Empower",
      comparison: "Channel list read for any channel marked altered",
    }),
    compliant({
      prefix,
      flagId: "EMP-F03",
      sopReference: SOP.EMPOWER,
      label: "Processing Locked on every channel",
      statusText: "TRUE",
      expected: "Processing Locked = TRUE — channels must be processing-locked",
      actual: "Processing Locked TRUE across all 12 channels",
      expectedSource: SOP.EMPOWER,
      source: "Waters Empower",
      comparison: "Channel list read for any channel left unlocked",
    }),
    compliant({
      prefix,
      flagId: "EMP-F04",
      sopReference: SOP.EMPOWER,
      label: "Single injections in the audit trail",
      statusText: "None",
      expected: "No single injections outside the sample set",
      actual: "No single injections recorded",
      expectedSource: SOP.EMPOWER,
      source: "Waters Empower",
      comparison: "Audit trail read for injections run outside the sample set",
    }),
    compliant({
      prefix,
      flagId: "EMP-F05",
      sopReference: SOP.EMPOWER,
      label: "Deletions in the audit trail",
      statusText: "None",
      expected: "No deletions present",
      actual: "No deletion entries in the audit trail",
      expectedSource: SOP.EMPOWER,
      source: "Waters Empower",
      comparison: "Audit trail read for deleted results, channels or injections",
    }),
    compliant({
      prefix,
      flagId: "EMP-F06",
      sopReference: SOP.EMPOWER,
      label: "System audit trail",
      statusText: "No discrepancy",
      expected: "No discrepancy in the system audit trail",
      actual: "System audit trail read for the analysis window — no discrepancy",
      expectedSource: SOP.EMPOWER,
      source: "Waters Empower",
      comparison: "System audit trail read across the acquisition window",
    }),
    compliant({
      prefix,
      flagId: "EMP-F07",
      sopReference: SOP.EMPOWER,
      label: "Method history comparison",
      statusText: "No differences",
      expected: "No differences between method versions used",
      actual: "Method history compared across the run — no differences found",
      expectedSource: SOP.EMPOWER,
      source: "Waters Empower",
      comparison: "Method history versions compared pairwise",
    }),
    compliant({
      prefix,
      flagId: "EMP-F08",
      sopReference: SOP.EMPOWER,
      label: "Unprocessed runs",
      statusText: "None",
      expected: "No unprocessed runs present",
      actual: "Every acquired run has been processed",
      expectedSource: SOP.EMPOWER,
      source: "Waters Empower",
      comparison: "Acquired runs read against processed results",
    }),
  ];

  items.push(
    options.reprocessed
      ? flagged({
          prefix,
          flagId: "EMP-F09",
          sopReference: SOP.EMPOWER,
          exceptionType: "Reprocessed Run",
          label: "Reprocessed run detected",
          subLabel: "Evaluate the reason and document it before proceeding",
          expected: "No reprocessed or repetitive runs without a documented reason",
          actual: options.reprocessed,
          expectedSource: SOP.EMPOWER,
          comparison:
            "The audit trail records a second processing of a run already processed",
          flagReason: `EMP-F09 — a run was processed more than once. Reprocessing is not prohibited, but a result that has been produced twice needs the reason on the record. Source: ${SOP.EMPOWER}.`,
          flagAction: `Verify reason for reprocessing. Document finding. Source: ${SOP.EMPOWER}.`,
          source: "Waters Empower",
        })
      : compliant({
          prefix,
          flagId: "EMP-F09",
          sopReference: SOP.EMPOWER,
          label: "Reprocessed or repetitive runs",
          statusText: "None",
          expected: "No reprocessed or repetitive runs present",
          actual: "No run was processed more than once",
          expectedSource: SOP.EMPOWER,
          source: "Waters Empower",
          comparison: "Processing history read for repeated processing of a run",
        }),
  );

  items.push(
    compliant({
      prefix,
      flagId: "EMP-F10",
      sopReference: SOP.EMPOWER,
      label: "Manual integrations",
      statusText: "None",
      expected: "No manual integrations present",
      actual: "All peaks integrated by the processing method",
      expectedSource: SOP.EMPOWER,
      source: "Waters Empower",
      comparison: "Integration type read on every reported peak",
    }),
    compliant({
      prefix,
      flagId: "EMP-F11",
      sopReference: SOP.EMPOWER,
      label: "Alterations in the sample set",
      statusText: "None",
      expected: "No alterations to the sample set after acquisition",
      actual: "Sample set unchanged after acquisition began",
      expectedSource: SOP.EMPOWER,
      source: "Waters Empower",
      comparison: "Sample set history read from acquisition to sign-off",
    }),
    compliant({
      prefix,
      flagId: "EMP-F12",
      sopReference: SOP.EMPOWER,
      label: "Chromatogram signatures",
      statusText: "All signed",
      expected: "All chromatograms signed",
      actual: "All 12 chromatograms carry a signature",
      expectedSource: SOP.EMPOWER,
      source: "Waters Empower",
      comparison: "Signature state read on every chromatogram",
    }),
    compliant({
      prefix,
      flagId: "EMP-F13",
      sopReference: SOP.EMPOWER,
      label: "Sign-off count",
      statusText: "2 of 2",
      expected: "Two sign-offs — analyst and reviewer",
      actual: "Signed by the analyst and countersigned by the reviewer",
      expectedSource: SOP.EMPOWER,
      source: "Waters Empower",
      comparison: "Sign-off count read against the SOP requirement",
    }),
    compliant({
      prefix,
      flagId: "EMP-F14",
      sopReference: SOP.EMPOWER,
      label: "Instrument method locked",
      statusText: "Locked",
      expected: "Instrument method locked before analysis",
      actual: "Instrument method locked before the first injection",
      expectedSource: SOP.EMPOWER,
      source: "Waters Empower",
      comparison: "Method lock state read at the start of acquisition",
    }),
  );

  return items;
};

/* -------------------------------------------------------------------------- */
/* Non-CDS audit trail — the six items EMP-F15 to EMP-F20 cover               */
/* -------------------------------------------------------------------------- */

/**
 * An instrument whose audit trail is not a data system's but a report.
 *
 * The same six questions, asked of a PDF attached in LIMS rather than of a
 * database — which is why they are asked at all: nothing here can be queried,
 * so somebody has to read it.
 */
export const nonCdsAuditTrail = (
  prefix: string,
  instrument: string,
  source: CheckItem["source"],
  serialRange: string,
): CheckItem[] => [
  compliant({
    prefix,
    flagId: "EMP-F15",
    sopReference: SOP.NON_CDS,
    label: "Reprocessed or repetitive runs",
    statusText: "None",
    expected: `No reprocessed runs in ${instrument}`,
    actual: "No run was processed more than once",
    expectedSource: SOP.NON_CDS,
    source,
    comparison: "Run list read for repeated processing",
  }),
  compliant({
    prefix,
    flagId: "EMP-F16",
    sopReference: SOP.NON_CDS,
    label: "Alterations or modifications",
    statusText: "None",
    expected: "No alterations or modifications recorded",
    actual: "No modification entries in the exported audit trail",
    expectedSource: SOP.NON_CDS,
    source,
    comparison: "Audit trail read for edits after acquisition",
  }),
  compliant({
    prefix,
    flagId: "EMP-F17",
    sopReference: SOP.NON_CDS,
    label: "Data folder",
    statusText: "Correct folder",
    expected: `Data saved in the designated ${instrument} data folder`,
    actual: `Results written to the designated ${instrument} folder for the month`,
    expectedSource: SOP.NON_CDS,
    source,
    comparison: "Save path read against the designated folder",
  }),
  compliant({
    prefix,
    flagId: "EMP-F18",
    sopReference: SOP.NON_CDS,
    label: "Deletions",
    statusText: "None",
    expected: "No deletions present",
    actual: "No deletion entries recorded",
    expectedSource: SOP.NON_CDS,
    source,
    comparison: "Audit trail read for deleted runs or results",
  }),
  compliant({
    prefix,
    flagId: "EMP-F19",
    sopReference: SOP.NON_CDS,
    label: "Signatures where electronic signature applies",
    statusText: "All signed",
    expected: "All data signed where electronic signature is applicable",
    actual: "All reported data carries a signature",
    expectedSource: SOP.NON_CDS,
    source,
    comparison: "Signature state read on every reported result",
  }),
  compliant({
    prefix,
    flagId: "EMP-F20",
    sopReference: SOP.NON_CDS,
    label: "Error log and event log",
    statusText: "Clear",
    expected: "No error or event log entries across the analysis window",
    actual: `No error or event log entries — serial continuity ${serialRange}`,
    expectedSource: SOP.NON_CDS,
    source,
    serialContinuity: { range: serialRange },
    comparison: "Error and event logs read across the acquisition window",
  }),
];
