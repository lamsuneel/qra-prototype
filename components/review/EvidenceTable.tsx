"use client";

import { useState } from "react";

import type { EvidenceTable as EvidenceTableData } from "@/types";
import { cn } from "@/lib/utils";

/** A column reads as numeric when every cell in it starts with a digit. */
const numericColumns = (table: EvidenceTableData): boolean[] =>
  table.columns.map((_, index) =>
    table.rows.every((row) => /^[\d—-]/.test(row.cells[index] ?? "")),
  );

/**
 * Inline tabular evidence — a blend uniformity sample set, a stability trend,
 * a dimensional check. Always visible, never behind a control: the reviewer
 * has to be able to read the numbers the finding was drawn from.
 */
export function EvidenceTable({ table }: { table: EvidenceTableData }) {
  const [open, setOpen] = useState(!table.collapsible);

  /* Context, not the finding — so it opens on request rather than pushing the
     result the reviewer came for down the panel. */
  if (table.collapsible && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 cursor-pointer text-[11px] font-medium text-navy-accent transition-colors duration-150 hover:underline"
      >
        {table.collapsedLabel ?? "View trend data"}{" "}
        <span aria-hidden="true">&#9660;</span>
      </button>
    );
  }

  const numeric = numericColumns(table);

  return (
    <div className="mt-3.5">
      {table.caption ? (
        <div className="mb-1.5 text-[11px] font-semibold tracking-wide text-source-text uppercase">
          {table.caption}
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-[5px] border border-slate-200 bg-white">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              {table.columns.map((column, index) => (
                <th
                  key={column}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-semibold tracking-wide text-source-text uppercase",
                    index > 0 && numeric[index] && "text-right",
                  )}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr
                key={row.cells.join("|")}
                className={cn(
                  "border-b border-slate-50 last:border-b-0",
                  row.flagged && "bg-flagged-bg/40",
                )}
              >
                {row.cells.map((cell, index) => (
                  <td
                    key={`${row.cells[0]}-${index}`}
                    className={cn(
                      "px-3 py-[5px]",
                      index > 0 && numeric[index] && "text-right tabular-nums",
                      row.flagged
                        ? "font-medium text-flagged-text"
                        : index === 0
                          ? "text-slate-700"
                          : "text-source-text",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
