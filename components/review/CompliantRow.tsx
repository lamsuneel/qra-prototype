"use client";

import type { CheckItem } from "@/types";
import { resultFor } from "@/types";
import { cn } from "@/lib/utils";
import { CalibrationBadge, InactivationBadge, SourceBadge } from "./Badges";
import {
  EvidencePanel,
  evidenceKind,
  expectationFor,
  readingFor,
} from "./EvidencePanel";

const CAL_DUE = /^Cal\. due (.+)$/;

/**
 * An entry that is not flagged — either compliant, or waiting on a comparison
 * QRA could not make. A chemical or working standard has no fixed
 * specification: it is checked against the quantity the worksheet prescribes,
 * so without both figures the row reads amber, never green.
 *
 * QRA did the checking, so the reviewer is never required to open the row —
 * but the evidence is always one click away and the row says so. Expanding
 * has no effect on the section gate.
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
  const unverified = resultFor(item) === "NEEDS_VERIFICATION";

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
          ? unverified
            ? "border-l-4 border-l-warn-text bg-[#FFF8F0]"
            : "border-l-4 border-l-compliant-text bg-[#F0FDF4]"
          : "bg-white hover:bg-blue-50",
      )}
    >
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <span
          aria-hidden="true"
          className={cn(
            "mt-[1px] shrink-0 text-[13px] font-semibold",
            unverified ? "text-warn-text" : "text-compliant-text",
          )}
        >
          {unverified ? "⚠" : "✓"}
        </span>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-slate-800">{item.label}</div>

          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-source-text">
            {calibration ? (
              <CalibrationBadge due={calibration} />
            ) : item.reference ? (
              <span>{item.reference} ·</span>
            ) : null}
            <span
              className={cn(
                "font-medium",
                unverified ? "text-warn-text" : "text-compliant-text",
              )}
            >
              {unverified ? "Needs Verification" : "Compliant"}
            </span>
          </div>

          {unverified ? (
            <div className="mt-0.5 text-[11px] font-medium text-warn-text">
              Verify against worksheet: prescribed quantity not fetched from LIMS
            </div>
          ) : null}

          <div className="mt-0.5 text-[11px] text-source-text">
            <span className="text-slate-400">Expected: </span>
            {expectationFor(item)}
            <span className="text-slate-400"> · Actual: </span>
            {readingFor(item)}
          </div>

          {/* The quantity check sits alongside the criterion, never instead of
              it — the row still has to say what was expected. */}
          {item.prescribedQty && item.actualQty ? (
            <div className="mt-0.5 text-[11px] text-source-text">
              <span className="text-slate-400">Prescribed: </span>
              {item.prescribedQty}
              <span className="text-slate-400"> · Used: </span>
              {item.actualQty}
            </div>
          ) : null}

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <SourceBadge source={item.source} />
            <span className="inline-flex shrink-0 items-center rounded bg-source-bg px-[7px] py-[2px] text-[10px] text-source-text">
              {evidenceKind(item)}
            </span>
            {item.inactivationStatus ? (
              <InactivationBadge status={item.inactivationStatus} />
            ) : null}
          </div>

          {/* Always on the row, never hidden — the reviewer should never have
              to discover that the evidence exists. */}
          <div
            className={cn(
              "mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium transition-opacity duration-150",
              expanded
                ? unverified
                  ? "text-warn-text opacity-100"
                  : "text-compliant-text opacity-100"
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
