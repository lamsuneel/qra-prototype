"use client";

import {
  PENDING_DRILLDOWN,
  PENDING_ESCALATION_DAYS,
  PENDING_WATCH_DAYS,
} from "@/data/dashboard";
import { cn } from "@/lib/utils";
import { DrilldownHeadings, DrilldownPanel } from "./DrilldownPanel";

/**
 * The samples behind one reason.
 *
 * Thirty-four held by instrument downtime is a number nobody can act on.
 * Which instruments, since when, and whether an engineer is already booked is
 * the part a GM-QA can push on — so the oldest are named and the rest are
 * counted, because the job here is deciding where to push, not working a
 * queue.
 */
export function PendingReasonDrilldown({
  reason,
  onClose,
}: {
  reason: string;
  onClose: () => void;
}) {
  const detail = PENDING_DRILLDOWN[reason];
  if (!detail) return null;

  const remaining = detail.total - detail.samples.length;

  return (
    <DrilldownPanel
      title={`${reason} — ${detail.total} ${
        detail.total === 1 ? "sample" : "samples"
      } pending`}
      onClose={onClose}
    >
      <table className="w-full border-collapse text-sm">
        <DrilldownHeadings
          headings={[
            "AR Number",
            "Product",
            "Domain",
            "Pending Since",
            "Days Pending",
            "Notes",
          ]}
        />
        <tbody>
          {detail.samples.map((sample) => {
            /* Over a week held is a different conversation from a few days. */
            const tone =
              sample.daysPending > PENDING_ESCALATION_DAYS
                ? "bg-flagged-bg text-flagged-text"
                : sample.daysPending >= PENDING_WATCH_DAYS
                  ? "bg-warn-bg text-warn-text"
                  : "bg-compliant-bg text-compliant-text";

            return (
              <tr
                key={sample.arNumber}
                className="border-b border-slate-50 last:border-b-0"
              >
                <td className="py-2 pr-3 font-semibold whitespace-nowrap text-navy-mid">
                  {sample.arNumber}
                </td>
                <td className="py-2 pr-3 text-slate-700">{sample.product}</td>
                <td className="py-2 pr-3 text-slate-700">{sample.domain}</td>
                <td className="py-2 pr-3 whitespace-nowrap text-slate-700">
                  {sample.pendingSince}
                </td>
                <td className="py-2 pr-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-[2px] text-xs font-semibold whitespace-nowrap tabular-nums",
                      tone,
                    )}
                  >
                    {sample.daysPending}{" "}
                    {sample.daysPending === 1 ? "day" : "days"}
                  </span>
                </td>
                <td className="py-2 text-source-text">{sample.note}</td>
              </tr>
            );
          })}

          {/* The rest are counted rather than listed — the decision does not
              need every row, and a long table would bury the oldest ones. */}
          {remaining > 0 ? (
            <tr>
              <td
                colSpan={6}
                className="py-2.5 text-center text-[13px] text-slate-400 italic"
              >
                + {remaining} more {remaining === 1 ? "sample" : "samples"}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </DrilldownPanel>
  );
}
