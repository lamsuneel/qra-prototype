"use client";

import { resultFor, type CheckItem } from "@/types";
import { V3Badge } from "./Badge";
import { AiraGlyph } from "./Icons";
import { V3_RESULT_LABEL, V3_RESULT_TONE, V3_TONE } from "./theme";

/**
 * The six facts an open entry leads with.
 *
 * Taken from the entry own expanded record where it keeps one, because that
 * is what the reviewer would read off the source system. Where it keeps none,
 * the comparison QRA made stands in its place. Nothing is invented to fill a
 * cell: a card with four facts shows four.
 */
const gridFor = (item: CheckItem): { label: string; value: string }[] => {
  const rows: { label: string; value: string }[] = [];
  const push = (label: string, value?: string) => {
    if (!value) return;
    if (rows.some((row) => row.label.toLowerCase() === label.toLowerCase())) {
      return;
    }
    rows.push({ label, value });
  };

  for (const detail of item.details ?? []) push(detail.label, detail.value);
  push("Reference", item.reference);
  push("Status", item.statusText);
  push("Expected", item.expected);
  push("Recorded", item.actual);
  push("Source", item.source);

  return rows.slice(0, 6);
};

/**
 * One entry in the section list.
 *
 * Collapsed it states its verdict and nothing else, because a reviewer
 * scanning a clean section is counting greens rather than reading them.
 * Open, it shows what QRA read and offers the only action a compliant entry
 * has: agreeing with it.
 */
export function V3EntryCard({
  item,
  expanded,
  onToggle,
  reviewed,
  onMarkReviewed,
}: {
  item: CheckItem;
  expanded: boolean;
  onToggle: () => void;
  /** True once this entry has been signed off on this screen. */
  reviewed: boolean;
  onMarkReviewed: () => void;
}) {
  const verdict = resultFor(item);
  const tone = V3_RESULT_TONE[verdict];
  const edge = expanded ? "var(--v3-accent)" : V3_TONE[tone];
  const rows = gridFor(item);
  const reason = item.checkDescription ?? item.comparison ?? item.flagReason;

  return (
    <div
      className={`mb-2 overflow-hidden rounded-[8px] border ${
        expanded
          ? "border-[var(--v3-accent-border)]"
          : "border-[var(--v3-border-default)]"
      } bg-[var(--v3-bg-card)]`}
      style={{ borderLeft: `3px solid ${edge}` }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2 shrink-0 rounded-full"
            style={{ background: edge }}
          />
          <span className="truncate text-[13px] font-medium text-[var(--v3-text-primary)]">
            {item.label}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {expanded ? (
            <V3Badge tone="compliant">In review</V3Badge>
          ) : (
            <V3Badge tone={tone}>
              {[V3_RESULT_LABEL[verdict], item.reference]
                .filter(Boolean)
                .join(" · ")}
            </V3Badge>
          )}
          <span
            aria-hidden="true"
            className="text-[12px] text-[var(--v3-text-muted)]"
          >
            {expanded ? "▴" : "▾"}
          </span>
        </span>
      </button>

      {expanded ? (
        <>
          <div className="border-t border-[var(--v3-border-default)] bg-[var(--v3-bg-base)] px-4 py-3">
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              {rows.map((row) => (
                <div key={row.label} className="min-w-0">
                  <div className="mb-1 text-[9px] font-medium tracking-[0.06em] text-[var(--v3-text-secondary)] uppercase">
                    {row.label}
                  </div>
                  <div className="font-mono text-[11px] leading-[1.5] break-words text-[var(--v3-text-mono)]">
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {reason ? (
            <div className="flex items-start gap-2.5 border-t border-[var(--v3-aira-border)] bg-[rgba(124,92,252,0.06)] px-4 py-2.5">
              <span className="mt-px shrink-0 text-[var(--v3-aira)]">
                <AiraGlyph size={14} />
              </span>
              <p className="text-[11px] leading-[1.55] text-[var(--v3-aira-text)]">
                <span className="font-semibold text-[var(--v3-aira-name)]">
                  AIRA:{" "}
                </span>
                {reason}
              </p>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-[var(--v3-border-default)] bg-[var(--v3-bg-base)] px-4 py-2">
            <button
              type="button"
              onClick={onMarkReviewed}
              disabled={reviewed}
              className="cursor-pointer rounded-[6px] border border-[var(--v3-compliant-border)] bg-[var(--v3-compliant-bg)] px-3.5 py-1.5 text-[11px] font-semibold text-[var(--v3-compliant)] transition-colors duration-[120ms] hover:bg-[rgba(61,184,122,0.20)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reviewed ? "Reviewed ✓" : "Mark as reviewed ✓"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
