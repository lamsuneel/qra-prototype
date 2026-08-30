"use client";

import type { CheckItem } from "@/types";
import { resultFor } from "@/types";
import { useReview } from "@/context/ReviewContext";
import { cn } from "@/lib/utils";
import { CalibrationBadge, InactivationBadge, SourceBadge } from "./Badges";
import {
  EvidencePanel,
  evidenceKind,
  expectationFor,
  readingFor,
} from "./EvidencePanel";
import { PncInput } from "./PncInput";
import { ReviewerNote } from "./ReviewerNote";

/**
 * A flagged entry. It carries the same evidence structure as a compliant one —
 * what QRA checked, expected against actual with their sources, comparison and
 * result — and then the three things only a flagged item needs: why it was
 * flagged, what the reviewer has to do, and their observation.
 *
 * It opens by default: the reviewer has to act on it, so nothing is hidden.
 * The note is what unlocks Mark Section Reviewed for the section.
 */
const CAL_DUE = /^Cal\. due (.+)$/;

/**
 * Quick-select observations. Starting points, never locked text — the
 * reviewer can edit or replace whatever a template puts in the field, and
 * typing straight into it without touching a template is equally valid.
 */
const TEMPLATES = [
  "Reviewed — found satisfactory",
  "Exception noted — investigation initiated",
  "Deviation raised",
] as const;

/**
 * The placeholder tells the reviewer what to write, not merely that they may
 * write. Where the finding already names an investigation, it names the same
 * series so the reference format is unambiguous.
 */
const notePlaceholder = (item: CheckItem): string => {
  const reference = `${item.reference ?? ""} ${item.flagReason ?? ""} ${item.flagAction ?? ""}`;
  const series = reference.match(/(OOS|DEV|OOT|LIR)-\d{4}-\d{4}/)?.[1];

  return series
    ? `Record your observation and ${series} investigation reference (e.g. ${series}-2026-XXXX)...`
    : "Record your observation and any investigation reference (e.g. DEV-2026-XXXX)...";
};

export function FlaggedCard({
  item,
  expanded,
  onToggle,
}: {
  item: CheckItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const calibration = item.reference?.match(CAL_DUE)?.[1];
  const { isNoted, hasPnc } = useReview();

  /* An unusable result is answered with a PNC number, not an observation. */
  const invalid = resultFor(item) === "HARD_INVALID";
  const confirmed = invalid ? hasPnc(item.id) : isNoted(item.id);

  return (
    <div
      className={cn(
        "mb-4 rounded-[7px] border border-l-4 px-4 py-3.5",
        invalid
          ? "border-invalid-text/40 border-l-invalid-text bg-invalid-bg"
          : "border-flagged-text/40 border-l-flagged-text bg-[#FEF2F2]",
      )}
    >
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <span
          aria-hidden="true"
          className={cn(
            "mt-[1px] shrink-0 text-[13px] font-bold",
            invalid ? "text-invalid-text" : "text-flagged-text",
          )}
        >
          !
        </span>

        <div className="min-w-0 flex-1">
          {/* The expanded panel leads with its own heading, so the card header
              only announces the flag while collapsed. */}
          {expanded ? null : (
            <div
              className={cn(
                "text-[13px] font-semibold",
                invalid ? "text-invalid-text" : "text-flagged-text",
              )}
            >
              {invalid ? "RESULT INVALID" : "FLAGGED — Action Required"}
            </div>
          )}
          <div
            className={cn(
              "text-[13px] font-medium text-slate-800",
              expanded ? null : "mt-0.5",
            )}
          >
            {item.label}
          </div>
          {item.subLabel ? (
            <div className="mt-0.5 text-[12px] text-source-text">
              {item.subLabel}
            </div>
          ) : null}

          <div className="mt-0.5 text-[11px] text-source-text">
            <span className="text-slate-400">Expected: </span>
            {expectationFor(item)}
            <span className="text-slate-400"> · Actual: </span>
            {readingFor(item)}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {calibration ? <CalibrationBadge due={calibration} /> : null}
            <SourceBadge source={item.source} />
            <span className="inline-flex shrink-0 items-center rounded bg-source-bg px-[7px] py-[2px] text-[10px] text-source-text">
              {evidenceKind(item)}
            </span>
            {item.inactivationStatus ? (
              <InactivationBadge status={item.inactivationStatus} />
            ) : null}
            {confirmed ? (
              <span className="rounded bg-compliant-bg px-2 py-[2px] text-[10px] font-medium text-compliant-text">
                {invalid ? "PNC recorded" : "Observation recorded"}
              </span>
            ) : null}
          </div>
        </div>

        {/*
          Always offered. Only one entry is expanded at a time, so opening a
          compliant entry collapses this card — without a way back the
          reviewer could never record the observation the gate waits for.
        */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className={cn(
            "shrink-0 cursor-pointer text-[11px] font-medium transition-colors duration-150 hover:underline",
            invalid ? "text-invalid-text" : "text-flagged-text",
          )}
        >
          {expanded ? "Hide evidence ▲" : "View evidence ▼"}
        </button>
      </div>

      {expanded ? (
        <EvidencePanel item={item}>
          <div
            className={cn(
              "mt-3 border-t pt-3",
              invalid ? "border-invalid-text/20" : "border-flagged-text/20",
            )}
          >
            <div
              className={cn(
                "mb-1 text-[10px] font-semibold tracking-wider uppercase",
                invalid ? "text-invalid-text" : "text-flagged-text",
              )}
            >
              {invalid ? "Why invalid" : "Why flagged"}
            </div>
            <p className="text-[13px] leading-relaxed text-slate-700">
              {item.flagReason}
            </p>
          </div>

          {/* Level 4 — the instruction, amber so it reads apart from the finding. */}
          <div className="mt-3 rounded-[5px] bg-warn-bg px-3.5 py-2.5">
            <div className="mb-1 flex items-center gap-1.5 text-[13px] font-bold text-warn-text">
              <span aria-hidden="true">&#9888;</span> Required action
            </div>
            <p className="text-[13px] leading-relaxed text-slate-700">
              {item.flagAction}
            </p>
          </div>

          <div className="mt-3.5">
            {invalid ? (
              <PncInput itemId={item.id} />
            ) : (
              <ReviewerNote
                itemId={item.id}
                tone="flagged"
                heading="Reviewer observation"
                placeholder={notePlaceholder(item)}
                templates={TEMPLATES}
              />
            )}
          </div>
        </EvidencePanel>
      ) : null}
    </div>
  );
}
