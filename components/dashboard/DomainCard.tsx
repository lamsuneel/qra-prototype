"use client";

import { useRouter } from "next/navigation";

import { DOMAIN_META, type DomainSummary } from "@/types";
import { cn } from "@/lib/utils";

const DOT: Record<string, string> = {
  green: "bg-compliant-text text-compliant-text",
  amber: "bg-warn-text text-warn-text",
  red: "bg-flagged-text text-flagged-text",
};

export function DomainCard({
  summary,
  note,
}: {
  summary: DomainSummary;
  /** Only where there is something true to say about the domain's scope. */
  note?: string;
}) {
  const router = useRouter();
  const meta = DOMAIN_META[summary.domain];

  return (
    <button
      type="button"
      onClick={() => router.push(`/legacy/batches/${meta.slug}`)}
      aria-label={`Open ${meta.name} review queue — ${summary.batchCount} batches, ${summary.flaggedCount} flagged`}
      className={cn(
        "cursor-pointer rounded-lg border border-slate-200 bg-white p-5 text-left transition-all duration-150 hover:border-navy-accent hover:shadow-md focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:outline-none",
        /* A breached SLA reads from the card itself, not only the dot. */
        summary.slaStatus === "red" && "border-l-[3px] border-l-flagged-text",
      )}
    >
      <div className="mb-3.5 flex items-start justify-between">
        <div>
          <div className="mb-1.5 text-[11px] font-semibold tracking-wider text-source-text uppercase">
            {meta.name}
          </div>
          <div className="text-[26px] leading-none font-bold text-navy tabular-nums">
            {summary.batchCount}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {summary.batchCount === 1 ? "batch" : "batches"} to review
          </div>
        </div>
        <span className="flex size-9 items-center justify-center rounded-[7px] bg-blue-50 text-[11px] font-bold text-navy-mid">
          {meta.abbreviation}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <span
          className={cn(
            "rounded-full px-2 py-[2px] text-[11px] font-medium",
            summary.flaggedCount > 0
              ? "bg-flagged-bg text-flagged-text"
              : "bg-source-bg text-source-text",
          )}
        >
          {summary.flaggedCount} flagged
        </span>
        <span className="text-[11px] text-slate-400">
          · {summary.needsReviewCount} needs review
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px]">
          <span
            className={cn("size-1.5 rounded-full", DOT[summary.slaStatus])}
          />
          <span className={DOT[summary.slaStatus].split(" ")[1]}>
            {summary.slaNote}
          </span>
        </span>
      </div>

      {note ? (
        <div className="mt-2.5 border-t border-slate-100 pt-2.5 text-[11px] leading-relaxed text-slate-400">
          {note}
        </div>
      ) : null}
    </button>
  );
}
