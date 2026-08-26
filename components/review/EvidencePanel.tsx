import type { CheckItem } from "@/types";
import { SourceBadge } from "./Badges";
import { EvidenceTable } from "./EvidenceTable";

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

/** Where the evidence physically sits, named on the collapsed row. */
export const evidenceKind = (item: CheckItem): string => {
  if (item.source === "Paper Logbook") return "Logbook";
  if (item.source === "Caliber LIMS" || item.source === "Test method configuration") {
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
}: {
  heading: string;
  value: string;
  lines: { label: string; value: string }[];
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold tracking-wider text-source-text uppercase">
        {heading}
      </div>
      <div className="text-[13px] leading-relaxed text-slate-800">{value}</div>
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
  const flagged = item.result === "FLAGGED";
  const calibration = item.reference?.match(CAL_DUE)?.[1];

  const actualLines: { label: string; value: string }[] = [];
  if (item.reference && !calibration) {
    actualLines.push({ label: "Reference", value: item.reference });
  }
  if (calibration) actualLines.push({ label: "Calibration due", value: calibration });
  actualLines.push({
    label: "Source",
    value:
      item.source === "Paper Logbook"
        ? "Paper Logbook — no electronic record"
        : `${item.source} — ${evidenceKind(item)}`,
  });

  return (
    <div className="mt-3">
      <div className="mb-3">
        <div className="mb-1 text-[10px] font-semibold tracking-wider text-source-text uppercase">
          What QRA checked
        </div>
        <p className="text-[13px] leading-relaxed text-slate-700">
          {checkedSentence(item)}
        </p>
      </div>

      <div className="grid gap-4 border-t border-slate-200/70 pt-3 sm:grid-cols-2">
        <Column
          heading="Expected"
          value={item.expected}
          lines={
            item.expectedSource ? [{ label: "Source", value: item.expectedSource }] : []
          }
        />
        <Column heading="Actual" value={readingFor(item)} lines={actualLines} />
      </div>

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

      {item.table ? <EvidenceTable table={item.table} /> : null}

      <dl className="mt-3 grid grid-cols-[110px_1fr] border-t border-slate-200/70 pt-1">
        <Field label="Comparison">{comparisonFor(item)}</Field>
        <Field label="Result">
          {flagged ? (
            <span className="inline-flex items-center rounded bg-flagged-bg px-2 py-[2px] text-[11px] font-medium text-flagged-text">
              Flagged — requires reviewer verification
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-compliant-bg px-2 py-[2px] text-[11px] font-medium text-compliant-text">
              <span aria-hidden="true">&#10003;</span> Compliant
            </span>
          )}
        </Field>
      </dl>

      {flagged ? (
        children
      ) : (
        <p className="mt-2.5 text-[11px] text-slate-400">
          No action required — this entry requires no reviewer action.
        </p>
      )}
    </div>
  );
}

export { SourceBadge };
