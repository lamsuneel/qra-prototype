"use client";

import { EXCEPTION_DRILLDOWN } from "@/data/dashboard";
import { cn } from "@/lib/utils";

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
    <div className="animate-fadeIn mt-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold text-slate-900">
          {category} — {rows.length}{" "}
          {rows.length === 1 ? "exception" : "exceptions"} this month
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${category} drill-down`}
          className="shrink-0 cursor-pointer rounded px-2 text-[18px] leading-none text-slate-400 transition-colors duration-150 hover:text-navy focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              {[
                "AR Number",
                "Product",
                "Domain",
                "Exception Detail",
                "Reviewer Note",
                "Status",
              ].map((heading) => (
                <th
                  key={heading}
                  className="py-2 pr-3 text-xs font-semibold tracking-[0.05em] uppercase"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
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
      </div>
    </div>
  );
}
