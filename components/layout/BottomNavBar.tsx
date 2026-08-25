"use client";

import { useRouter } from "next/navigation";

import { orderedSections, sectionSlug } from "@/data";
import { useReview } from "@/context/ReviewContext";
import type { Batch, Section } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Always visible. Previous / Next walk every section across every parameter,
 * so the reviewer never has to go back to a list mid-review.
 */
export function BottomNavBar({
  batch,
  section,
}: {
  batch: Batch;
  section: Section;
}) {
  const router = useRouter();
  const { sectionStatus, markSectionReviewed, canMarkReviewed } = useReview();

  const all = orderedSections(batch);
  const index = all.findIndex((candidate) => candidate.id === section.id);
  const previous = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  const reviewed = sectionStatus(section.id) === "REVIEWED";
  const unlocked = canMarkReviewed(section);

  const goTo = (target: Section) =>
    router.push(
      `/batches/${batch.arNumber}/review/${target.parameter}/${sectionSlug(target)}`,
    );

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-2.5">
      <button
        type="button"
        disabled={!previous}
        onClick={() => previous && goTo(previous)}
        className={cn(
          "rounded-[5px] border px-3.5 py-[7px] text-[13px]",
          previous
            ? "border-slate-200 text-source-text hover:bg-slate-50"
            : "cursor-not-allowed border-slate-200 text-slate-300",
        )}
      >
        Previous Section
      </button>

      <div className="text-center text-[13px] font-medium text-slate-700">
        {section.name} · {index + 1} of {all.length} sections
      </div>

      <div className="flex items-center gap-2.5">
        <div className="group relative">
          <button
            type="button"
            disabled={!unlocked || reviewed}
            onClick={() => markSectionReviewed(section.id)}
            className={cn(
              "rounded-[5px] px-3.5 py-[7px] text-[13px] font-medium",
              reviewed
                ? "cursor-default bg-compliant-bg text-compliant-text"
                : unlocked
                  ? "bg-navy text-white"
                  : "cursor-not-allowed bg-slate-200 text-slate-400",
            )}
          >
            {reviewed ? "Section Reviewed" : "Mark Section Reviewed"}
          </button>
          {!unlocked && !reviewed ? (
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-[11px] whitespace-nowrap text-white group-hover:block">
              Add a note to flagged items first
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() =>
            next ? goTo(next) : router.push(`/batches/${batch.arNumber}/summary`)
          }
          className="rounded-[5px] bg-navy px-4 py-[7px] text-[13px] text-white"
        >
          {next ? "Next Section" : "View Summary"}
        </button>
      </div>
    </div>
  );
}
