import type { V3EvidenceRow } from "./evidence";
import { V3_TONE } from "./theme";

/**
 * What QRA read, one row per fact.
 *
 * Result and timestamp are blanked with a dash rather than filled: an empty
 * cell would read as an oversight, and a borrowed value would read as a
 * record that does not exist.
 */
export function V3EvidenceTable({ rows }: { rows: V3EvidenceRow[] }) {
  return (
    <div className="overflow-x-auto rounded-[6px] border border-[var(--v3-border-default)]">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["Parameter", "Value", "Result", "Timestamp", "Source"].map(
              (heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="border-b border-[var(--v3-border-default)] bg-[var(--v3-bg-surface)] px-3 py-2 text-left text-[9px] font-semibold tracking-[0.05em] whitespace-nowrap text-[var(--v3-text-mono)] uppercase"
                >
                  {heading}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.parameter}-${index}`}>
              <td className="border-b border-[var(--v3-border-subtle)] px-3 py-2.5 align-top text-[11px] whitespace-nowrap text-[var(--v3-text-secondary)]">
                {row.parameter}
              </td>
              <td className="border-b border-[var(--v3-border-subtle)] px-3 py-2.5 align-top font-mono text-[11px] leading-[1.5] text-[var(--v3-text-primary)]">
                {row.value}
              </td>
              <td
                className="border-b border-[var(--v3-border-subtle)] px-3 py-2.5 align-top text-[11px] whitespace-nowrap"
                style={{
                  color: row.tone ? V3_TONE[row.tone] : "var(--v3-text-muted)",
                }}
              >
                {row.result ?? "—"}
              </td>
              <td className="border-b border-[var(--v3-border-subtle)] px-3 py-2.5 align-top font-mono text-[11px] whitespace-nowrap text-[var(--v3-text-secondary)]">
                {row.timestamp ?? "—"}
              </td>
              <td className="border-b border-[var(--v3-border-subtle)] px-3 py-2.5 align-top font-mono text-[11px] whitespace-nowrap text-[var(--v3-text-muted)]">
                {row.source ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
