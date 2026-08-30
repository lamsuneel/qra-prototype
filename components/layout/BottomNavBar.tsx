"use client";

import { useRouter } from "next/navigation";

import { orderedSections, sectionSlug } from "@/data";
import { useReview } from "@/context/ReviewContext";
import {
  requiresNote,
  requiresPnc,
  resultFor,
  type Batch,
  type Section,
} from "@/types";
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
  const { sectionStatus, markSectionReviewed, canMarkReviewed, isNoted, hasPnc } =
    useReview();

  const all = orderedSections(batch);
  const index = all.findIndex((candidate) => candidate.id === section.id);
  const previous = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  const reviewed = sectionStatus(section.id) === "REVIEWED";
  const unlocked = canMarkReviewed(section);

  /* Name the entry that is actually blocking, not "flagged items". The two
     kinds block for opposite reasons, so the message says which. */
  const awaiting = section.items.filter(
    (item) => requiresNote(item) || requiresPnc(item),
  );
  const outstanding = awaiting.filter((item) =>
    requiresPnc(item) ? !hasPnc(item.id) : !isNoted(item.id),
  );
  const blocker = outstanding[0];
  const blockerResult = blocker ? resultFor(blocker) : null;
  const blockingMessage = blocker
    ? blockerResult === "HARD_INVALID"
      ? `“${blocker.label}” is not a usable result — enter the PNC number raised for it to continue.`
      : awaiting.length > 1
        ? `${outstanding.length} of ${awaiting.length} entries still ${
            outstanding.length === 1 ? "needs" : "need"
          } your note — ${blocker.label}.`
        : blockerResult === "FLAGGED"
          ? `Open the flagged entry “${blocker.label}” and add your observation note to continue.`
          : `Confirm your worksheet verification of “${blocker.label}” to continue.`
    : null;

  const goTo = (target: Section) =>
    router.push(
      `/batches/${batch.arNumber}/review/${target.parameter}/${sectionSlug(target)}`,
    );

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white">
      {/* Stated on the bar, not only in a tooltip — a reviewer should never
          have to hover to find out what is blocking them. */}
      {!unlocked && !reviewed && blockingMessage ? (
        <div className="flex items-center gap-1.5 border-b border-warn-text/20 bg-warn-bg px-6 py-1.5 text-[11px] font-medium text-warn-text">
          <span aria-hidden="true">&#9888;</span> {blockingMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5">
        <button
          type="button"
          disabled={!previous}
          /* The accessible name must contain the visible label — WCAG 2.5.3. */
          aria-label={
            previous
              ? `Previous Section: ${previous.name}`
              : "Previous Section, none"
          }
          onClick={() => previous && goTo(previous)}
          className={cn(
            "rounded-[5px] border px-3.5 py-[7px] text-[13px] transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:outline-none",
            previous
              ? "cursor-pointer border-slate-200 text-source-text hover:bg-navy hover:text-white"
              : "cursor-not-allowed border-slate-200 text-slate-300 opacity-40",
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
                "rounded-[5px] px-3.5 py-[7px] text-[13px] font-medium transition-colors duration-150",
                reviewed
                  ? "cursor-default bg-compliant-bg text-compliant-text"
                  : unlocked
                    ? "cursor-pointer bg-navy text-white hover:bg-navy-mid"
                    : "cursor-not-allowed bg-slate-200 text-slate-400 opacity-40",
              )}
            >
              {reviewed ? "Section Reviewed" : "Mark Section Reviewed"}
            </button>
            {!unlocked && !reviewed && blockingMessage ? (
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden w-[320px] -translate-x-1/2 rounded bg-slate-900 px-2.5 py-1.5 text-[11px] leading-relaxed text-white group-hover:block">
                {blockingMessage}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() =>
              next
                ? goTo(next)
                : router.push(`/batches/${batch.arNumber}/summary`)
            }
            aria-label={next ? `Next Section: ${next.name}` : "View Summary"}
            className="cursor-pointer rounded-[5px] bg-navy px-4 py-[7px] text-[13px] text-white transition-colors duration-150 hover:bg-navy-mid focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {next ? "Next Section" : "View Summary"}
          </button>
        </div>
      </div>
    </div>
  );
}
