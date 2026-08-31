"use client";

import type { ReactNode } from "react";

/**
 * The card a chart opens into.
 *
 * Both dashboards do the same thing with a bar — a count is not actionable,
 * the rows behind it are — so they share the shell. Two copies of this chrome
 * would drift, and the whole point is that the two panels read as one idea.
 */
export function DrilldownPanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="animate-fadeIn mt-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${title} drill-down`}
          className="shrink-0 cursor-pointer rounded px-2 text-[18px] leading-none text-slate-400 transition-colors duration-150 hover:text-navy focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/** The header row every drill-down table uses. */
export function DrilldownHeadings({ headings }: { headings: string[] }) {
  return (
    <thead>
      <tr className="border-b border-slate-200 text-left text-slate-500">
        {headings.map((heading) => (
          <th
            key={heading}
            className="py-2 pr-3 text-xs font-semibold tracking-[0.05em] uppercase"
          >
            {heading}
          </th>
        ))}
      </tr>
    </thead>
  );
}
