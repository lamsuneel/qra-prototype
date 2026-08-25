import type { CheckItem } from "@/types";
import { CalibrationBadge, CompliantBadge, SourceBadge } from "./Badges";
import { EvidenceTable } from "./EvidenceTable";

const CAL_DUE = /^Cal\. due (.+)$/;

/**
 * The value the reviewer actually reads, taken from the recorded result.
 *
 * The recorded value usually opens by repeating the entry it belongs to —
 * "Acetonitrile HPLC grade — Lot AC-2024-0441 — active, expiry 30-Nov-2026".
 * The label already says which entry this is, so that opening segment is
 * dropped and the rest is joined with middots. Nothing is invented: every
 * part shown is a part of the recorded value.
 */
const readingFor = (item: CheckItem, calibrationShown: boolean): string => {
  const parts = item.actual.split(" — ").map((part) => part.trim());
  const label = item.label.toLowerCase();

  if (
    parts.length > 1 &&
    (label.includes(parts[0].toLowerCase()) || parts[0].toLowerCase().includes(label))
  ) {
    parts.shift();
  }

  const reading = parts.join(" · ");

  /* The calibration badge already carries the due date — do not print it twice. */
  return calibrationShown
    ? reading.replace(/,?\s*due \d{1,2}-[A-Za-z]{3}-\d{4}/, "").replace(/^,\s*/, "")
    : reading;
};

/**
 * A compliant entry needs no reviewer action, so this is a static row — no
 * onClick, no hover state, nothing that suggests there is something to open.
 * It still has to be readable: the reviewer confirms the data by eye, so the
 * recorded value sits on the row rather than behind a control.
 *
 * Four columns: entry, recorded value, source, result.
 */
export function CompliantRow({ item }: { item: CheckItem }) {
  const calibration = item.reference?.match(CAL_DUE)?.[1];
  const reading = readingFor(item, Boolean(calibration));

  return (
    <div className="border-b border-slate-100 bg-white py-2.5 text-[13px]">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3.5">
        <span className="shrink-0 text-slate-700 sm:w-[30%]">{item.label}</span>

        <span className="flex flex-1 flex-wrap items-center gap-2 text-[12px] text-source-text">
          {calibration ? <CalibrationBadge due={calibration} /> : null}
          <span>{reading}</span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <SourceBadge source={item.source} />
          <CompliantBadge />
        </span>
      </div>

      <div className="mt-1 text-[11px] text-slate-400 sm:pl-0">
        Expected {item.expected}
      </div>

      {item.table ? <EvidenceTable table={item.table} /> : null}
    </div>
  );
}
