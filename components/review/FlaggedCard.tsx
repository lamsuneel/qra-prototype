"use client";

import { useState } from "react";

import type { CheckItem } from "@/types";
import { useReview } from "@/context/ReviewContext";
import { cn } from "@/lib/utils";
import { CalibrationBadge, SourceBadge } from "./Badges";
import { EvidencePanel, evidenceKind, expectationFor, readingFor } from "./EvidencePanel";

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
  const { noteFor, setNote, isNoted } = useReview();
  const [draft, setDraft] = useState(() => noteFor(item.id));

  const confirmed = isNoted(item.id);

  const confirm = () => {
    if (draft.trim()) setNote(item.id, draft.trim());
  };

  return (
    <div
      className={cn(
        "mb-4 rounded-[7px] border border-l-4 border-flagged-text/40 border-l-flagged-text bg-[#FEF2F2] px-4 py-3.5",
      )}
    >
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <span
          aria-hidden="true"
          className="mt-[1px] shrink-0 text-[13px] font-bold text-flagged-text"
        >
          !
        </span>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-flagged-text">
            FLAGGED — Action Required
          </div>
          <div className="mt-0.5 text-[13px] font-medium text-slate-800">{item.label}</div>

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
            {confirmed ? (
              <span className="rounded bg-compliant-bg px-2 py-[2px] text-[10px] font-medium text-compliant-text">
                Observation recorded
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
          className="shrink-0 cursor-pointer text-[11px] font-medium text-flagged-text transition-colors duration-150 hover:underline"
        >
          {expanded ? "Hide evidence ▲" : "View evidence ▼"}
        </button>
      </div>

      {expanded ? (
        <EvidencePanel item={item}>
          <div className="mt-3 border-t border-flagged-text/20 pt-3">
            <div className="mb-1 text-[10px] font-semibold tracking-wider text-flagged-text uppercase">
              Why flagged
            </div>
            <p className="text-[13px] leading-relaxed text-slate-700">{item.flagReason}</p>
          </div>

          <div className="mt-3">
            <div className="mb-1 text-[10px] font-semibold tracking-wider text-flagged-text uppercase">
              Required action
            </div>
            <p className="text-[13px] leading-relaxed text-slate-700">{item.flagAction}</p>
          </div>

          <div className="mt-3.5 border-t border-flagged-text/20 pt-3">
            <div className="mb-2 text-[10px] font-semibold tracking-wider text-flagged-text uppercase">
              Reviewer observation <span className="text-flagged-text">*</span>
            </div>

            {confirmed ? (
              <div className="flex flex-wrap items-center gap-2.5 rounded-[5px] border border-compliant-text/30 bg-compliant-bg/50 px-3.5 py-2.5">
                <span className="flex-1 text-[13px] text-slate-700 italic">
                  &ldquo;{noteFor(item.id)}&rdquo;
                </span>
                <span className="rounded bg-compliant-bg px-2 py-[2px] text-[11px] font-medium text-compliant-text">
                  Noted
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      confirm();
                    }
                  }}
                  placeholder="Record your observation and any investigation reference..."
                  className="flex-1 rounded-[5px] border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-navy-accent focus:ring-3 focus:ring-navy-accent/10"
                />
                <button
                  type="button"
                  onClick={confirm}
                  className="shrink-0 cursor-pointer rounded-[5px] bg-compliant-text px-3.5 py-2 text-xs font-medium text-white transition-opacity duration-150 hover:opacity-90"
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        </EvidencePanel>
      ) : null}
    </div>
  );
}
