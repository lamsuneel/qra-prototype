"use client";

import { useReview } from "@/context/ReviewContext";
import { flaggedItemsInBatch, orderedSections, sourcesUsedIn } from "@/data";
import { resultFor, type Batch } from "@/types";
import { SourceBadge } from "@/components/review/Badges";

export function RightPanel({ batch }: { batch: Batch }) {
  const { reviewedCount, totalSections, isNoted } = useReview();

  const reviewed = reviewedCount(batch.arNumber);
  const total = totalSections(batch.arNumber);
  const exceptions = flaggedItemsInBatch(batch);

  /* What is actually blocking the reviewer, across the whole batch. */
  const unnoted = orderedSections(batch)
    .flatMap((section) => section.items)
    .filter((item) => resultFor(item) === "FLAGGED" && !isNoted(item.id)).length;

  return (
    <aside className="hidden w-44 shrink-0 overflow-y-auto border-l border-slate-200 bg-white px-3.5 py-4 xl:block">
      <div className="mb-3 text-[11px] font-semibold tracking-wide text-source-text uppercase">
        What&rsquo;s Left
      </div>

      <div className="mb-3.5">
        <div className="mb-1 text-[11px] text-slate-400">Sections</div>
        <div className="text-xl font-bold text-navy tabular-nums">
          {reviewed} <span className="text-[13px] font-normal text-slate-400">/ {total}</span>
        </div>
      </div>

      {unnoted > 0 ? (
        <div className="mb-3.5 rounded-[5px] border border-warn-text/30 bg-warn-bg px-2.5 py-2 text-[11px] leading-relaxed font-medium text-warn-text">
          <span aria-hidden="true">&#9888;</span> {unnoted}{" "}
          {unnoted === 1 ? "flag needs" : "flags need"} your note
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
