"use client";

import { EXCEPTION_DRILLDOWN } from "@/data/dashboard";
import { cn } from "@/lib/utils";
import { DrilldownHeadings, DrilldownPanel } from "./DrilldownPanel";

/**
 * The batches behind one bar.
 *
 * Eight related-substances exceptions could be one product drifting or eight
 * unconnected ones, and the count cannot tell them apart. This can: the AR
 * numbers, the domains, and what each reviewer wrote — which is the evidence
 * a CQO would otherwise have to ask someone for.
 */
export function ExceptionDrilldown({
  category,
  onClose,
}: {
  category: string;
  onClose: () => void;
}) {
  const rows = EXCEPTION_DRILLDOWN[category] ?? [];

  return (
    <DrilldownPanel
      title={`${category} — ${rows.length} ${
        rows.length === 1 ? "exception" : "exceptions"
      } this month`}
      onClose={onClose}
    >
      <table className="w-full border-collapse text-sm">
        <DrilldownHeadings
          headings={[
            "AR Number",
            "Product",
            "Domain",
            "Exception Detail",
            "Reviewer Note",
            "Status",
          ]}
        />
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.arNumber}-${row.detail}`}
              className="border-b border-slate-50 last:border-b-0"
            >
              <td className="py-2 pr-3 font-semibold whitespace-nowrap text-navy-mid">
                {row.arNumber}
              </td>
              <td className="py-2 pr-3 text-slate-700">{row.product}</td>
              <td className="py-2 pr-3 text-slate-700">{row.domain}</td>
              <td className="py-2 pr-3 text-slate-700">{row.detail}</td>
              <td className="py-2 pr-3 text-source-text italic">
                &ldquo;{row.reviewerNote}&rdquo;
              </td>
              <td className="py-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-[2px] text-xs font-medium",
                    row.status === "Open"
                      ? "bg-warn-bg text-warn-text"
                      : "bg-compliant-bg text-compliant-text",
                  )}
                >
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DrilldownPanel>
  );
}
