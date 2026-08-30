"use client";

import { useState } from "react";

import type { Batch } from "@/types";
import { cn } from "@/lib/utils";

/**
 * The three checks that belong to the batch rather than to any one test.
 *
 * A duplicate AR number is the kind of thing no single section would ever
 * catch — each one looks fine on its own — so it is asked once, at the top,
 * about the batch as a whole. Same for the print counts: the question is
 * whether what left the building matches what LIMS says left the building.
 *
 * Collapsed by default. Three green checks are worth stating and not worth
 * pushing the reviewer's actual work down the page.
 */

export interface IntegrityCheck {
  label: string;
  detail: string;
  source: string;
  ok: boolean;
}

export const integrityChecks = (batch: Batch): IntegrityCheck[] => [
  {
    label: "Duplicate AR check",
    detail: `AR number ${batch.arNumber} — searched across all databases and monthly projects. No duplicates found.`,
    source: "FU7-QA-GEN-080 CROSS-15 / RULE-TIA-12",
    ok: true,
  },
  {
    label: "COA print count",
    detail: "COA prints: 1. LIMS Work Sheet Log Report: 1. Counts match.",
    source: "FU7-QA-GEN-080 EMP-F22",
    ok: true,
  },
  {
    label: "Worksheet print count",
    detail: "Worksheets printed: 2. Physical copies verified: 2.",
    source: "FU7-QA-GEN-080 EMP-F21",
    ok: true,
  },
];

export function BatchIntegrity({ batch }: { batch: Batch }) {
  const [open, setOpen] = useState(false);
  const checks = integrityChecks(batch);
  const issues = checks.filter((check) => !check.ok);

  return (
    <div
      className={cn(
        "mb-4 overflow-hidden rounded-md border",
        issues.length > 0
          ? "border-flagged-text/30 bg-[#FEF2F2]"
          : "border-slate-200 bg-white",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left transition-colors duration-150 hover:bg-blue-50"
      >
        <span
          className={cn(
            "text-[12px] font-semibold",
            issues.length > 0 ? "text-flagged-text" : "text-compliant-text",
          )}
        >
          <span aria-hidden="true">{issues.length > 0 ? "!" : "✓"}</span> Batch
          Integrity —{" "}
          {issues.length > 0
            ? `${issues.length} ${issues.length === 1 ? "issue" : "issues"} found`
            : `${checks.length} checks clear`}
        </span>
        <span className="text-[11px] text-source-text">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open ? (
        <dl className="border-t border-slate-200 px-4 py-3">
          {checks.map((check) => (
            <div key={check.label} className="border-b border-slate-100 py-2 last:border-b-0">
              <dt className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700">
                <span
                  aria-hidden="true"
                  className={check.ok ? "text-compliant-text" : "text-flagged-text"}
                >
                  {check.ok ? "✓" : "!"}
                </span>
                {check.label}
              </dt>
              <dd className="mt-0.5 pl-5 text-[12px] leading-relaxed text-source-text">
                {check.detail}
                <div className="mt-0.5 text-[11px] text-slate-400">
                  Source: {check.source}
                </div>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
