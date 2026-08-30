"use client";

import { useState } from "react";

import { isValidPnc } from "@/types";
import { useReview } from "@/context/ReviewContext";
import { cn } from "@/lib/utils";

/**
 * The PNC number raised against a result that cannot be used.
 *
 * Deliberately not the observation field. An observation explains a finding;
 * there is nothing here to explain. The analysis has to be repeated, and what
 * the record needs is the number of the notification raised in the site's own
 * system — so there are no templates to pick from and nothing to write.
 */
export function PncInput({ itemId }: { itemId: string }) {
  const { pncFor, setPnc, hasPnc } = useReview();
  const [draft, setDraft] = useState(() => pncFor(itemId));
  const [touched, setTouched] = useState(false);

  const recorded = hasPnc(itemId);
  const malformed = touched && draft.trim().length > 0 && !isValidPnc(draft);

  const confirm = () => {
    setTouched(true);
    if (isValidPnc(draft)) setPnc(itemId, draft.trim().toUpperCase());
  };

  return (
    <div className="border-t border-invalid-text/25 pt-3">
      <div className="mb-2 text-[10px] font-semibold tracking-wider text-invalid-text uppercase">
        PNC Number (required) <span className="text-invalid-text">*</span>
      </div>

      {recorded ? (
        <div className="flex flex-wrap items-center gap-2.5 rounded-[5px] border border-compliant-text/30 bg-compliant-bg/50 px-3.5 py-2.5">
          <span className="flex-1 font-mono text-[13px] font-semibold text-slate-700">
            {pncFor(itemId)}
          </span>
          <span className="rounded bg-compliant-bg px-2 py-[2px] text-[11px] font-medium text-compliant-text">
            PNC recorded
          </span>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={draft}
              aria-label="PNC Number (required)"
              aria-invalid={malformed}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => setTouched(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  confirm();
                }
              }}
              placeholder="e.g. PNC-2026-0089"
              className={cn(
                "flex-1 rounded-[5px] border bg-white px-3 py-2 font-mono text-[13px] outline-none",
                malformed
                  ? "border-invalid-text focus:ring-3 focus:ring-invalid-text/15"
                  : "border-slate-200 focus:border-navy-accent focus:ring-3 focus:ring-navy-accent/10",
              )}
            />
            <button
              type="button"
              onClick={confirm}
              className="h-fit shrink-0 cursor-pointer rounded-[5px] bg-invalid-text px-3.5 py-2 text-xs font-medium text-white transition-opacity duration-150 hover:opacity-90"
            >
              Record PNC
            </button>
          </div>

          {malformed ? (
            <p className="mt-1.5 text-[11px] font-medium text-invalid-text">
              Format: PNC-YYYY-NNNN, e.g. PNC-2026-0089.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
