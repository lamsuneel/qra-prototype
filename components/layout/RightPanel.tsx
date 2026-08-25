"use client";

import { useReview } from "@/context/ReviewContext";
import { flaggedItemsInBatch } from "@/data";
import type { Batch } from "@/types";
import { SourceBadge } from "@/components/review/Badges";

export function RightPanel({ batch }: { batch: Batch }) {
  const { reviewedCount, totalSections } = useReview();

  const reviewed = reviewedCount(batch.arNumber);
  const total = totalSections(batch.arNumber);
  const exceptions = flaggedItemsInBatch(batch);

  return (
    <aside className="hidden w-44 shrink-0 overflow-y-auto border-l border-slate-200 bg-white px-3.5 py-4 xl:block">
      <div className="mb-3 text-[11px] font-semibold tracking-wide text-source-text uppercase">
        Review Progress
      </div>

      <div className="mb-3.5">
        <div className="mb-1 text-[11px] text-slate-400">Sections</div>
        <div className="text-xl font-bold text-navy tabular-nums">
          {reviewed} <span className="text-[13px] font-normal text-slate-400">/ {total}</span>
        </div>
      </div>

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
          {batch.dataSources.map((source) => (
            <SourceBadge key={source} source={source} />
          ))}
        </div>
      </div>
    </aside>
  );
}
