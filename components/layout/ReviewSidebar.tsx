"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  exceptionContributors,
  firstUnresolvedSection,
  isException,
  orderedSections,
  sectionSlug,
  sectionsForParameter,
} from "@/data";
import { useReview } from "@/context/ReviewContext";
import type { Batch } from "@/types";
import { cn } from "@/lib/utils";
import { ExceptionCountPill } from "@/components/review/Badges";

/**
 * Two lists: the test parameters in this batch, then the sections inside the
 * active parameter. Clicking either navigates.
 */
export function ReviewSidebar({
  batch,
  parameterId,
  sectionId,
}: {
  batch: Batch;
  parameterId: string;
  sectionId: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const { sectionStatus } = useReview();
  const [blocked, setBlocked] = useState<string | null>(null);

  /*
   * What each exception badge is made of, for anyone checking a count against
   * the entries behind it. Development only — the demo build stays silent.
   */
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.groupCollapsed(`QRA exception counts — ${batch.arNumber}`);
    for (const parameter of batch.parameters) {
      const contributors = exceptionContributors(batch, parameter.id);
      console.log(
        `${parameter.shortName}: ${contributors.length}`,
        contributors.map((entry) => `${entry.section} → ${entry.item}`),
      );
    }
    console.groupEnd();
  }, [batch]);

  /* Arriving from search, mark where the work still is. */
  const fromSearch = params.get("from") === "search";
  const firstIncomplete = orderedSections(batch).find(
    (section) => sectionStatus(section.id) !== "REVIEWED",
  )?.id;

  const go = (param: string, section: string) =>
    router.push(`/batches/${batch.arNumber}/review/${param}/${section}`);

  return (
    <nav className="w-[200px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
      {blocked ? (
        <div
          role="status"
          className="border-b border-slate-200 bg-warn-bg px-3.5 py-2.5 text-[11px] leading-relaxed text-warn-text"
        >
          {blocked} is still under analysis. Review will be available once QC
          submits the data.
          <button
            type="button"
            onClick={() => setBlocked(null)}
            className="mt-1 block cursor-pointer font-medium underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}
      <div className="py-3">
        <div className="px-3.5 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Test Parameters
        </div>
        {batch.parameters.map((parameter) => {
          const sections = sectionsForParameter(batch, parameter.id);
          const flags = sections.reduce(
            (total, section) => total + section.items.filter(isException).length,
            0,
          );
          const active = parameter.id === parameterId;
          const inProgress = parameter.readiness === "IN_PROGRESS";

          return (
            <button
              key={parameter.id}
              type="button"
              onClick={() => {
                /* A test the lab has not released has nothing to review yet,
                   and saying so is more use than an empty screen. */
                if (inProgress) {
                  setBlocked(parameter.name);
                  return;
                }
                /* Open where the work is, not on the attendance row that
                   leads every parameter and is almost always clean. */
                const target = firstUnresolvedSection(batch, parameter.id);
                go(parameter.id, target ? sectionSlug(target) : sectionId);
              }}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 border-l-[3px] px-3.5 py-[7px] text-left transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:outline-none",
                active
                  ? "border-l-navy bg-blue-50 font-semibold text-navy hover:bg-blue-100"
                  : "border-l-transparent text-source-text hover:bg-blue-50 hover:text-navy",
              )}
            >
              <span
                className={cn(
                  "size-[7px] shrink-0 rounded-full",
                  inProgress
                    ? "bg-slate-300"
                    : flags > 0
                      ? "bg-flagged-text"
                      : "bg-compliant-text",
                )}
              />
              <span className="flex-1 truncate text-xs">
                {parameter.shortName}
                {parameter.readiness ? (
                  <span
                    className={cn(
                      "mt-0.5 block text-[10px] font-normal",
                      inProgress ? "text-slate-400" : "text-compliant-text",
                    )}
                  >
                    {inProgress ? "Analysis In Progress" : "Ready for Review"}
                  </span>
                ) : null}
              </span>
              {flags > 0 ? (
                <span className="rounded bg-flagged-bg px-[5px] text-[10px] text-flagged-text">
                  {flags}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="border-t border-slate-200 py-2.5">
        <div className="px-3.5 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Sections
        </div>
        {sectionsForParameter(batch, parameterId).map((section) => {
          const flags = section.items.filter(isException).length;
          const reviewed = sectionStatus(section.id) === "REVIEWED";
          const active = section.id === sectionId;
          const pulse = fromSearch && section.id === firstIncomplete;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => go(parameterId, sectionSlug(section))}
              aria-label={`Open section ${section.name}${flags > 0 ? `, ${flags} flagged` : ""}`}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 border-l-[3px] px-3.5 py-[7px] text-left transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:outline-none",
                active
                  ? flags > 0
                    ? "border-l-flagged-text bg-red-50/60 font-semibold text-navy hover:bg-red-100/70"
                    : "border-l-navy bg-blue-50 font-semibold text-navy hover:bg-blue-100"
                  : "border-l-transparent text-source-text hover:bg-blue-50 hover:text-navy",
                pulse && "animate-pulseAmber",
              )}
            >
              <span
                className={cn(
                  "shrink-0 text-[11px]",
                  reviewed
                    ? "text-compliant-text"
                    : flags > 0
                      ? "text-flagged-text"
                      : "text-slate-300",
                )}
              >
                {reviewed ? "✓" : flags > 0 ? "!" : "·"}
              </span>
              <span className="flex-1 truncate text-xs">{section.name}</span>
              {flags > 0 ? <ExceptionCountPill count={flags} /> : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
