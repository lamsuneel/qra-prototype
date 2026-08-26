"use client";

import type { CheckItem, DetailField } from "@/types";
import { cn } from "@/lib/utils";
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
 * What the expanded view lists. Entries carrying `details` show exactly what
 * QRA read field by field; the rest fall back to the fields every entry has,
 * so nothing is ever left with an empty panel.
 */
const detailsFor = (item: CheckItem): DetailField[] => {
  if (item.details?.length) return item.details;

  const fallback: DetailField[] = [];
  if (item.reference) fallback.push({ label: "Reference", value: item.reference });
  if (item.statusText) fallback.push({ label: "Status", value: item.statusText });
  fallback.push({ label: "Recorded value", value: item.actual });

  return fallback;
};

/**
 * A compliant entry needs no reviewer action, so the row body is inert — no
 * onClick, nothing that suggests the reviewer has to open it. It still has to
 * be readable at a glance and inspectable on demand: the summary sits on the
 * row, and the chevron on the right opens everything QRA read for that entry.
 *
 * Four columns: entry, recorded value, source, result.
 */
export function CompliantRow({
  item,
  expanded,
  onToggle,
}: {
  item: CheckItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const calibration = item.reference?.match(CAL_DUE)?.[1];
  const reading = readingFor(item, Boolean(calibration));
  const details = detailsFor(item);

  return (
    <div
      className={cn(
        "group border-b border-slate-100 py-2.5 text-[13px] transition-colors duration-150",
        expanded ? "bg-[#F0F4FF]" : "bg-white",
      )}
    >
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3.5">
        <span className="shrink-0 text-slate-700 sm:w-[30%]">{item.label}</span>

        <span className="flex flex-1 flex-wrap items-center gap-2 text-[12px] text-source-text">
          {calibration ? <CalibrationBadge due={calibration} /> : null}
          <span>{reading}</span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <SourceBadge source={item.source} />
          <CompliantBadge />

          {/* Kept out of the way until the reviewer looks for it. */}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={
              expanded ? `Hide details for ${item.label}` : `Show details for ${item.label}`
            }
            className={cn(
              "flex size-5 cursor-pointer items-center justify-center rounded text-slate-400 transition-all duration-150 hover:bg-slate-100 hover:text-navy focus-visible:opacity-100",
              expanded ? "rotate-90 opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            <span aria-hidden="true">&rsaquo;</span>
          </button>
        </span>
      </div>

      <div className="mt-1 text-[11px] text-slate-400">Expected {item.expected}</div>

      {expanded ? (
        <dl className="mt-3 grid grid-cols-[minmax(120px,150px)_1fr] gap-x-4 gap-y-[3px] rounded-[5px] border border-slate-200 bg-white px-4 py-3 text-[12px]">
          {details.map((field) => (
            <div key={field.label} className="contents">
              <dt className="text-slate-400">{field.label}</dt>
              <dd className="text-slate-700">{field.value}</dd>
            </div>
          ))}

          <dt className="text-slate-400">Source</dt>
          <dd className="text-slate-700">{item.source}</dd>

          <dt className="text-slate-400">Expected</dt>
          <dd className="text-slate-700">
            {item.expected}
            {/* Most expectations already name their document — do not repeat it. */}
            {item.expectedSource && !item.expected.includes(item.expectedSource) ? (
              <span className="ml-1.5 text-slate-400">{item.expectedSource}</span>
            ) : null}
          </dd>

          <dt className="text-slate-400">Result</dt>
          <dd className="text-compliant-text">
            <span aria-hidden="true">&#10003;</span> All checks compliant
          </dd>
        </dl>
      ) : null}

      {item.table ? <EvidenceTable table={item.table} /> : null}
    </div>
  );
}
