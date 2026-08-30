import type { CheckItem } from "@/types";
import { borderLimitDistance, quantityComparison, resultFor } from "@/types";
import { SourceBadge } from "./Badges";
import { EvidenceTable } from "./EvidenceTable";
import { AuditTrailTimeline } from "./AuditTrailTimeline";

/**
 * The evidence visibility principle, in one component.
 *
 * Every review item — compliant or flagged — exposes what QRA checked, what
 * was expected and where that came from, what was actually recorded and where
 * that came from, how the two compared, and why the item carries the status it
 * does. Compliant and flagged differ only in what follows the result: a
 * compliant entry closes with "no action required", a flagged one opens into
 * why it was flagged, what to do, and the reviewer's observation.
 */

const CAL_DUE = /^Cal\. due (.+)$/;

/**
 * What kind of exception this is, for the heading of a flagged entry. An
 * entry may state its own type; the rest are inferred from their wording.
 */
export const flagType = (item: CheckItem): string => {
  if (item.exceptionType) return item.exceptionType;

  const text = `${item.reference ?? ""} ${item.label} ${item.flagReason ?? ""}`;

  if (/OOS/.test(text)) return "OOS Result";
  if (/OOT|out-of-trend|out of trend/i.test(text)) return "Out-of-Trend Result";
  if (/calibrat/i.test(text)) return "Calibration Gap";
  if (/excursion/i.test(text)) return "Storage Excursion";
  if (/inactivated/i.test(text)) return "Inactivated Entry";
  if (/expired|expiry/i.test(text)) return "Expired Entry";
  return "Exception";
};

/** Where the evidence physically sits, named on the collapsed row. */
export const evidenceKind = (item: CheckItem): string => {
  if (item.source === "Paper Logbook") return "Logbook";
  if (item.source === "HRMS System") return "Attendance Record";
  if (
    item.source === "Caliber LIMS" ||
    item.source === "Caliber LIMS — Manual Entry" ||
    item.source === "Test method configuration"
  ) {
    return "Worksheet";
  }
  return "Audit Trail";
};

/** The recorded value, with the opening repeat of the row label removed. */
export const readingFor = (item: CheckItem): string => {
  const parts = item.actual.split(" — ").map((part) => part.trim());
  const label = item.label.toLowerCase();

  if (
    parts.length > 1 &&
    (label.includes(parts[0].toLowerCase()) || parts[0].toLowerCase().includes(label))
  ) {
    parts.shift();
  }

  return parts.join(" · ");
};

/** Short form of the expectation for the collapsed row. */
export const expectationFor = (item: CheckItem): string =>
  item.expected.split(" — ")[0].trim();

const checkedSentence = (item: CheckItem): string => {
  if (item.checkDescription) return item.checkDescription;

  const against = item.expectedSource
    ? `the requirement in ${item.expectedSource}`
    : "the applicable specification";

  return `QRA read the recorded value for ${item.label} from ${item.source} and compared it against ${against}.`;
};

const comparisonFor = (item: CheckItem): string => {
  if (item.comparison) return item.comparison;
  if (item.statusText) return `${item.statusText} — matches the requirement`;
  return "Matches the requirement";
};

function Column({
  heading,
  value,
  lines,
  emphasis = false,
}: {
  heading: string;
  value: string;
  lines: { label: string; value: string }[];
  /** The recorded value carries more weight than the requirement beside it. */
  emphasis?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold tracking-wider text-source-text uppercase">
        {heading}
      </div>
      <div
        className={
          emphasis
            ? "text-[14px] leading-relaxed font-medium text-slate-900"
            : "text-[14px] leading-relaxed text-source-text"
        }
      >
        {value}
      </div>
      {lines.map((line) => (
        <div key={line.label} className="mt-0.5 text-[11px] text-source-text">
          <span className="text-slate-400">{line.label}: </span>
          {line.value}
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="py-[5px] text-[11px] font-semibold tracking-wide text-source-text uppercase">
        {label}
      </dt>
      <dd className="py-[5px] pl-3 text-[13px] leading-relaxed text-slate-800">
        {children}
      </dd>
    </>
  );
}

export function EvidencePanel({
  item,
  children,
}: {
  item: CheckItem;
  /** Flagged items append why, action and the reviewer observation. */
  children?: React.ReactNode;
}) {
  /* Derived, so an unauthorised inactivation reads as flagged here too. */
  const flagged = resultFor(item) === "FLAGGED";
  const invalid = resultFor(item) === "HARD_INVALID";
  const unverified = resultFor(item) === "NEEDS_VERIFICATION";
  const comparison = quantityComparison(item);
  const border = item.borderLimit
    ? borderLimitDistance(item.borderLimit)
    : null;
  const calibration = item.reference?.match(CAL_DUE)?.[1];

  const actualLines: { label: string; value: string }[] = [];
  if (item.reference && !calibration) {
    actualLines.push({ label: "Reference", value: item.reference });
  }
  if (calibration) actualLines.push({ label: "Calibration due", value: calibration });
  /* A reference standard is read from two LIMS modules, so the panel names
     each one rather than collapsing them into a single source. */
  if (item.usageSource && item.potencySource) {
    actualLines.push({ label: "Usage data source", value: item.usageSource });
    actualLines.push({ label: "Potency/assigned value source", value: item.potencySource });
  } else {
    actualLines.push({
      label: "Source",
      value:
        item.source === "Paper Logbook"
          ? "Paper Logbook — no electronic record"
          : `${item.source} — ${evidenceKind(item)}`,
    });
  }

  return (
    <div className="mt-3">
      {/* Level 1 — the finding itself, the first thing the eye lands on. */}
      {invalid ? (
        <div className="mb-3.5 flex items-center gap-2 rounded-[5px] bg-invalid-bg px-3.5 py-2.5 text-[16px] font-bold text-invalid-text">
          <span aria-hidden="true">&#9888;</span> RESULT INVALID
        </div>
      ) : flagged ? (
        <div className="mb-3.5 flex items-center gap-2 rounded-[5px] bg-flagged-bg px-3.5 py-2.5 text-[16px] font-bold text-flagged-text">
          <span aria-hidden="true">&#9888;</span> FLAGGED — {flagType(item)}
        </div>
      ) : null}

      <div className="mb-3">
        <div className="mb-1 text-[10px] font-semibold tracking-wider text-source-text uppercase">
          What QRA checked
        </div>
        <p className="text-[13px] leading-relaxed text-slate-700">
          {checkedSentence(item)}
        </p>
      </div>

      {/* Level 2 — the core facts. Actual leads; expected is muted beside it. */}
      <div className="grid gap-4 border-t border-slate-200/70 pt-3 sm:grid-cols-2">
        <Column heading="Actual" value={readingFor(item)} lines={actualLines} emphasis />
        <Column
          heading="Expected"
          value={item.expected}
          lines={
            item.expectedSource ? [{ label: "Source", value: item.expectedSource }] : []
          }
        />
      </div>

      {item.inactivationStatus ? (
        <dl className="mt-3 grid grid-cols-[minmax(180px,220px)_1fr] gap-x-4 gap-y-[3px] border-t border-slate-200/70 pt-3 text-[12px]">
          <dt className="text-slate-400">Inactivation reason</dt>
          <dd className="text-slate-700">
            {item.inactivationReason ?? "Not recorded"}
          </dd>

          <dt className="text-slate-400">Initiated by</dt>
          <dd className="text-slate-700">
            {item.inactivationInitiatedBy ?? "Not recorded"}
            {item.inactivationInitiatedDate
              ? ` · ${item.inactivationInitiatedDate}`
              : null}
          </dd>

          {/* The second signature is the whole point: one In-Charge starting a
              withdrawal is not a withdrawal. */}
          <dt className="text-slate-400">Approved by</dt>
          <dd
            className={
              item.inactivationApprovedBy
                ? "text-slate-700"
                : "font-medium text-warn-text"
            }
          >
            {item.inactivationApprovedBy
              ? `${item.inactivationApprovedBy}${
                  item.inactivationApprovalDate
                    ? ` · ${item.inactivationApprovalDate}`
                    : ""
                }`
              : "Pending"}
          </dd>

          <dt className="text-slate-400">Inactivation status</dt>
          <dd
            className={
              item.inactivationStatus === "Approved"
                ? "font-medium text-compliant-text"
                : "font-medium text-warn-text"
            }
          >
            {item.inactivationStatus}
          </dd>

          <dt className="text-slate-400">Both approvals required per</dt>
          <dd className="text-slate-700">FU7-QA-GEN-080 + APL-GP-GEN-0023</dd>
        </dl>
      ) : null}

      {item.requiresQuantityCheck ? (
        <dl className="mt-3 grid grid-cols-[minmax(180px,220px)_1fr] gap-x-4 gap-y-[3px] border-t border-slate-200/70 pt-3 text-[12px]">
          <dt className="text-slate-400">Prescribed quantity (LIMS worksheet)</dt>
          <dd className={item.prescribedQty ? "text-slate-700" : "text-warn-text"}>
            {item.prescribedQty ?? "Not fetched from LIMS"}
          </dd>

          <dt className="text-slate-400">Actual quantity used</dt>
          <dd className={item.actualQty ? "text-slate-700" : "text-warn-text"}>
            {item.actualQty ?? "Not fetched from LIMS"}
          </dd>

          <dt className="text-slate-400">Comparison</dt>
          <dd
            className={
              comparison ? "font-medium text-compliant-text" : "font-medium text-warn-text"
            }
          >
            {comparison ?? "NO COMPARISON — VERIFY AGAINST WORKSHEET"}
          </dd>
        </dl>
      ) : null}

      {border && item.borderLimit ? (
        <dl className="mt-3 grid grid-cols-[minmax(180px,220px)_1fr] gap-x-4 gap-y-[3px] border-t border-slate-200/70 pt-3 text-[12px]">
          <dt className="text-slate-400">Result</dt>
          <dd className="text-slate-700">
            {item.borderLimit.result}
            {item.borderLimit.unit}
          </dd>

          <dt className="text-slate-400">Specification</dt>
          <dd className="text-slate-700">
            {item.borderLimit.lower !== undefined
              ? `${item.borderLimit.lower}${item.borderLimit.unit}`
              : "—"}{" "}
            to{" "}
            {item.borderLimit.upper !== undefined
              ? `${item.borderLimit.upper}${item.borderLimit.unit}`
              : "—"}
          </dd>

          <dt className="text-slate-400">Distance from limit</dt>
          <dd className="font-medium text-warn-text">
            {border.distance.toFixed(1)}
            {item.borderLimit.unit} above the {border.edge} limit
          </dd>

          <dt className="text-slate-400">Required action</dt>
          <dd className="text-slate-700">
            Stability/trend evaluation mandatory before disposition per
            RULE-EMP-02. If no stability data available: batch charged for
            stability. Head-QA decides disposition.
          </dd>
        </dl>
      ) : null}

      {item.details?.length ? (
        <dl className="mt-3 grid grid-cols-[minmax(120px,160px)_1fr] gap-x-4 gap-y-[3px] border-t border-slate-200/70 pt-3 text-[12px]">
          {item.details.map((field) => (
            <div key={field.label} className="contents">
              <dt className="text-slate-400">{field.label}</dt>
              <dd className="text-slate-700">{field.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <AuditTrailTimeline
        steps={item.auditTrailSequence}
        continuity={item.serialContinuity}
      />

      {item.table ? <EvidenceTable table={item.table} /> : null}

      {/* Level 3 — supporting context, deliberately quiet. */}
      <div className="mt-3 border-t border-slate-200/70 pt-2.5">
        <div className="mb-0.5 text-[10px] font-semibold tracking-wider text-source-text uppercase">
          Comparison performed
        </div>
        <p className="text-[13px] leading-relaxed text-source-text">{comparisonFor(item)}</p>
      </div>

      {flagged || invalid ? null : (
        <dl className="mt-2.5 grid grid-cols-[110px_1fr]">
          <Field label="Result">
            {unverified ? (
              <span className="inline-flex items-center gap-1 rounded bg-warn-bg px-2 py-[2px] text-[11px] font-medium text-warn-text">
                <span aria-hidden="true">&#9888;</span> Needs verification
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-compliant-bg px-2 py-[2px] text-[11px] font-medium text-compliant-text">
                <span aria-hidden="true">&#10003;</span> Compliant
              </span>
            )}
          </Field>
        </dl>
      )}

      {/*
        Present on every entry, prominent on none. An automated check the
        reviewer cannot trace to a named document is a check they have to
        take on trust, and this app is built on not asking them to.
      */}
      {item.sopReference ? (
        <div className="mt-2.5 border-t border-slate-200/70 pt-2 text-[11px] text-slate-400">
          <span className="font-medium">Regulatory source: </span>
          {item.sopReference}
          {item.flagId ? <span> · {item.flagId}</span> : null}
        </div>
      ) : null}

      {flagged || invalid ? (
        children
      ) : unverified ? (
        <p className="mt-2.5 rounded-[5px] bg-warn-bg px-3 py-2 text-[11px] leading-relaxed font-medium text-warn-text">
          <span aria-hidden="true">&#9888;</span> Verify against worksheet: prescribed
          quantity not fetched from LIMS. Confirm the quantity used against the LIMS
          worksheet before marking this section as Reviewed.
        </p>
      ) : (
        <p className="mt-2.5 text-[11px] text-slate-400">
          No action required — this entry requires no reviewer action.
        </p>
      )}
    </div>
  );
}

export { SourceBadge };
