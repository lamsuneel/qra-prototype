import { quantityComparison, resultFor, type CheckItem } from "@/types";
import { V3_RESULT_LABEL, V3_RESULT_TONE, type V3Tone } from "./theme";

/**
 * One line of what QRA read for an entry.
 *
 * Result and timestamp are optional because most of what QRA reads is a fact
 * rather than a verdict, and most facts in these systems are not stamped. A
 * row without them says so rather than borrowing a neighbour's.
 */
export interface V3EvidenceRow {
  parameter: string;
  value: string;
  result?: string;
  tone?: V3Tone;
  timestamp?: string;
  source?: string;
}

const AUDIT_RESULT: Record<string, { label: string; tone: V3Tone }> = {
  ok: { label: "In sequence", tone: "compliant" },
  missing: { label: "Missing", tone: "blocking" },
  "out-of-order": { label: "Out of order", tone: "blocking" },
};

const QUANTITY_TONE: Record<string, V3Tone> = {
  MATCH: "compliant",
  "WITHIN TOLERANCE": "compliant",
  MISMATCH: "blocking",
};

/**
 * Everything QRA read for one entry, as table rows.
 *
 * Built from the entry rather than written per screen: the comparison it made
 * is always there, and each further block — a quantity check, an inactivation
 * record, an instrument's own trail — appears only on the entries that carry
 * one. Nothing is invented to fill a column.
 */
export const evidenceRowsFor = (item: CheckItem): V3EvidenceRow[] => {
  const verdict = resultFor(item);
  const rows: V3EvidenceRow[] = [
    {
      parameter: "Expected",
      value: item.expected,
      result: "Requirement",
      tone: "muted",
      source: item.expectedSource ?? item.sopReference,
    },
    {
      parameter: "Recorded",
      value: item.actual,
      result: V3_RESULT_LABEL[verdict],
      tone: V3_RESULT_TONE[verdict],
      source: item.source,
    },
  ];

  if (item.comparison) {
    rows.push({
      parameter: "Comparison",
      value: item.comparison,
      source: "NeuraTrace",
    });
  }

  if (item.requiresQuantityCheck) {
    const compared = quantityComparison(item);
    rows.push({
      parameter: "Prescribed quantity",
      value: item.prescribedQty ?? "Not recorded on the worksheet",
      result: item.prescribedQty ? undefined : "Missing",
      tone: item.prescribedQty ? undefined : "advisory",
      source: item.usageSource ?? item.source,
    });
    rows.push({
      parameter: "Quantity used",
      value: item.actualQty ?? "Not recorded",
      result: compared ?? "Not comparable",
      tone: compared ? QUANTITY_TONE[compared] : "advisory",
      source: item.usageSource ?? item.source,
    });
  }

  if (item.inactivationStatus) {
    const approved = item.inactivationStatus === "Approved";
    rows.push({
      parameter: "Inactivation status",
      value: item.inactivationStatus,
      result: approved ? "Authorised" : "Incomplete",
      tone: approved ? "compliant" : "blocking",
      timestamp: item.inactivationApprovalDate,
      source: item.source,
    });
    if (item.inactivationReason) {
      rows.push({
        parameter: "Reason recorded",
        value: item.inactivationReason,
        source: item.source,
      });
    }
    if (item.inactivationInitiatedBy) {
      rows.push({
        parameter: "Initiated by",
        value: item.inactivationInitiatedBy,
        timestamp: item.inactivationInitiatedDate,
        source: item.source,
      });
    }
    /* Withdrawal needs two signatures. The second is the one that is usually
       missing, so it gets a row of its own whether or not it exists. */
    rows.push({
      parameter: "Second approval",
      value: item.inactivationApprovedBy ?? "Not recorded",
      result: item.inactivationApprovedBy ? "Countersigned" : "Outstanding",
      tone: item.inactivationApprovedBy ? "compliant" : "blocking",
      timestamp: item.inactivationApprovalDate,
      source: item.source,
    });
  }

  for (const step of item.auditTrailSequence ?? []) {
    const outcome = AUDIT_RESULT[step.status];
    rows.push({
      parameter: `Step ${step.step}`,
      value: step.label,
      result: outcome.label,
      tone: outcome.tone,
      timestamp: step.timestamp,
      source: item.source,
    });
  }

  if (item.serialContinuity) {
    rows.push({
      parameter: "Serial range reviewed",
      value: item.serialContinuity.range,
      result: item.serialContinuity.gap ? "Break in run" : "Continuous",
      tone: item.serialContinuity.gap ? "blocking" : "compliant",
      source: item.source,
    });
    if (item.serialContinuity.gap) {
      rows.push({
        parameter: "Break found",
        value: item.serialContinuity.gap,
        result: "Break in run",
        tone: "blocking",
        source: item.source,
      });
    }
  }

  /* The expanded record, minus anything already stated above — the same fact
     twice under two names reads as two findings. */
  const stated = new Set(rows.map((row) => row.parameter.toLowerCase()));
  for (const detail of item.details ?? []) {
    if (stated.has(detail.label.toLowerCase())) continue;
    stated.add(detail.label.toLowerCase());
    rows.push({
      parameter: detail.label,
      value: detail.value,
      source: item.source,
    });
  }

  return rows;
};

/**
 * A first draft of the reviewer's observation, from the finding itself.
 *
 * Deliberately unfinished: it states what was found and where the rule comes
 * from, and stops at the investigation reference, which is the one thing QRA
 * cannot know and the reviewer must supply.
 */
export const draftObservation = (item: CheckItem): string => {
  const parts = [
    item.exceptionType
      ? `${item.exceptionType} — ${item.label}.`
      : `${item.label}.`,
    item.comparison ? `${item.comparison}.` : "",
    item.sopReference ? `Checked against ${item.sopReference}.` : "",
    "Investigation reference: ",
  ];

  return parts.filter(Boolean).join(" ");
};
