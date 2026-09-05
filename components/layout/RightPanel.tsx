"use client";

import { useReview } from "@/context/ReviewContext";
import { flaggedItemsInBatch, reviewableSections, sourcesUsedIn } from "@/data";
import {
  requiresConfirmation,
  requiresNote,
  requiresPnc,
  type Batch,
} from "@/types";
import { SourceBadge } from "@/components/review/Badges";

export function RightPanel({ batch }: { batch: Batch }) {
  const { reviewedCount, totalSections, isNoted, hasPnc, isConfirmed } =
    useReview();

  const reviewed = reviewedCount(batch.arNumber);
  const total = totalSections(batch.arNumber);
  const exceptions = flaggedItemsInBatch(batch);

  const readyCount = batch.parameters.filter(
    (parameter) => parameter.readiness === "READY",
  ).length;
  const inProgressCount = batch.parameters.filter(
    (parameter) => parameter.readiness === "IN_PROGRESS",
  ).length;

  /* What is actually blocking the reviewer, across the whole batch — flags
     and entries NeuraTrace could not conclude both wait on a note. */
  const unnoted = reviewableSections(batch)
    .flatMap((section) => section.items)
    .filter((item) =>
      requiresPnc(item)
        ? !hasPnc(item.id)
        : requiresConfirmation(item)
          ? !isConfirmed(item.id)
          : requiresNote(item) && !isNoted(item.id),
    ).length;

  return (
    <aside className="hidden w-44 shrink-0 overflow-y-auto border-l border-slate-200 bg-white px-3.5 py-4 xl:block">
      <div className="mb-3 text-[11px] font-semibold tracking-wide text-source-text uppercase">
        What&rsquo;s Left
      </div>

      <div className="mb-3.5">
        <div className="mb-1 text-[11px] text-slate-400">Sections</div>
        <div className="text-xl font-bold text-navy tabular-nums">
          {reviewed}{" "}
          <span className="text-[13px] font-normal text-slate-400">
            / {total}
          </span>
        </div>
      </div>

      {unnoted > 0 ? (
        <div className="mb-3.5 rounded-[5px] border border-warn-text/30 bg-warn-bg px-2.5 py-2 text-[11px] leading-relaxed font-medium text-warn-text">
          <span aria-hidden="true">&#9888;</span> {unnoted}{" "}
          {unnoted === 1 ? "entry needs" : "entries need"} your note
        </div>
      ) : null}

      {/* In-process review runs test by test, so how many are even
          reviewable yet is part of what is left. */}
      {batch.parameters.some((parameter) => parameter.readiness) ? (
        <div className="mb-3.5 border-t border-slate-100 pt-3 text-[11px] leading-relaxed">
          <div className="mb-1 text-slate-400">Test parameters</div>
          <div className="text-compliant-text">
            {readyCount} ready for review
          </div>
          <div className="text-slate-400">{inProgressCount} in progress</div>
        </div>
      ) : null}

      <div className="mb-3.5">
        <div className="mb-1 text-[11px] text-slate-400">Exceptions</div>
        <div
          className={`text-xl font-bold tabular-nums ${
            exceptions > 0 ? "text-flagged-text" : "text-navy"
          }`}
        >
          {exceptions}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <div className="mb-2 text-[11px] text-slate-400">Data Sources</div>
        <div className="flex flex-col items-start gap-1">
          {sourcesUsedIn(batch).map((source) => (
            <SourceBadge key={source} source={source} />
          ))}
        </div>
      </div>
    </aside>
  );
}
