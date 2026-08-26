"use client";

import type { CheckItem } from "@/types";
import { cn } from "@/lib/utils";
import { CalibrationBadge, SourceBadge } from "./Badges";
import {
  EvidencePanel,
  evidenceKind,
  expectationFor,
  readingFor,
} from "./EvidencePanel";

const CAL_DUE = /^Cal\. due (.+)$/;

/**
 * A compliant entry. QRA did the checking, so the reviewer is never required
 * to open it — but the evidence is always one click away and the row says so.
 * "View evidence" is always on the row at low opacity; the whole row is the
 * click target.
 *
 * Expanding a compliant entry has no effect on the section gate.
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

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        "group cursor-pointer border-b border-slate-100 px-3 py-3 text-left transition-colors duration-150",
        expanded
          ? "border-l-4 border-l-compliant-text bg-[#F0FDF4]"
          : "bg-white hover:bg-blue-50",
      )}
    >
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <span
          aria-hidden="true"
          className="mt-[1px] shrink-0 text-[13px] font-semibold text-compliant-text"
        >
          &#10003;
        </span>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-slate-800">{item.label}</div>

          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-source-text">
            {calibration ? (
              <CalibrationBadge due={calibration} />
            ) : item.reference ? (
              <span>{item.reference} ·</span>
            ) : null}
            <span className="font-medium text-compliant-text">Compliant</span>
          </div>

          <div className="mt-0.5 text-[11px] text-source-text">
            <span className="text-slate-400">Expected: </span>
            {expectationFor(item)}
            <span className="text-slate-400"> · Actual: </span>
            {readingFor(item)}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <SourceBadge source={item.source} />
            <span className="inline-flex shrink-0 items-center rounded bg-source-bg px-[7px] py-[2px] text-[10px] text-source-text">
              {evidenceKind(item)}
            </span>
          </div>

          {/* Always on the row, never hidden — the reviewer should never have
              to discover that the evidence exists. */}
          <div
            className={cn(
              "mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium transition-opacity duration-150",
              expanded
                ? "text-compliant-text opacity-100"
                : "text-navy-accent opacity-40 group-hover:opacity-100",
            )}
          >
            {expanded ? (
              <>
                Hide evidence <span aria-hidden="true">&#9650;</span>
              </>
            ) : (
              <>
                View evidence <span aria-hidden="true">&#9660;</span>
              </>
            )}
          </div>
        </div>
      </div>

      {expanded ? <EvidencePanel item={item} /> : null}
    </div>
  );
}
