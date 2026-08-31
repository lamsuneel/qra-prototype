"use client";

import type { CorrectionRecord } from "@/types";

/**
 * What this batch was sent back for, last time round.
 *
 * A corrected batch arrives looking like any other, which is exactly the
 * problem: the reviewer has no way of knowing which figures were touched
 * unless someone tells them. This tells them.
 */
export function CorrectionHistory({ history }: { history: CorrectionRecord[] }) {
  if (history.length === 0) return null;

  return (
    <div className="mb-4 rounded-md border border-warn-text/30 bg-warn-bg/40 px-4 py-3">
      <div className="mb-2 text-[10px] font-semibold tracking-wider text-warn-text uppercase">
        Correction history — {history.length}{" "}
        {history.length === 1 ? "recheck" : "rechecks"} on this batch
      </div>

      <ol className="flex flex-col gap-2.5">
        {history.map((entry, index) => (
          <li
            key={`${entry.returnedOn}-${index}`}
            className="border-l-[3px] border-warn-text/50 pl-3 text-[12px] leading-relaxed"
          >
            <div className="text-slate-700">
              Returned on {entry.returnedOn} by {entry.returnedBy}
            </div>
            <div className="text-source-text">
              Reason: <span className="italic">{entry.reason}</span>
            </div>
            <div className="text-slate-400">
              {entry.correctedOn
                ? `Correction submitted on ${entry.correctedOn}`
                : "Awaiting correction from the lab"}
            </div>
            {entry.correctionNote ? (
              <div className="mt-0.5 text-source-text">
                Correction: <span className="italic">{entry.correctionNote}</span>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
