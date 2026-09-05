"use client";

import { LockIcon } from "./Icons";

export interface V3StatusCount {
  label: string;
  value: number;
  colour: string;
}

/**
 * The bar the reviewer works against: what is in this batch, and whether the
 * section they are in can be closed yet.
 *
 * The gate is the app's own rule — every flagged entry in the section carries
 * an observation — so the button here cannot open on a section the rest of
 * the app would keep shut.
 */
export function V3StatusBar({
  context,
  counts,
  outstanding,
  reviewed,
  onMarkReviewed,
  clearMessage,
}: {
  context: string;
  counts: V3StatusCount[];
  /** Flagged entries in this section still without an observation. */
  outstanding: number;
  reviewed: boolean;
  onMarkReviewed: () => void;
  /** Shown in place of the lock line when nothing is outstanding. */
  clearMessage?: string;
}) {
  const locked = outstanding > 0;

  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-t border-[var(--v3-border-default)] bg-[var(--v3-bg-surface)] px-5">
      <span className="text-[11px] text-[var(--v3-text-secondary)]">
        {context}
      </span>

      <div className="flex items-center gap-4">
        {counts.map((count) => (
          <div key={count.label} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: count.colour }}
            />
            <span
              className="font-mono text-[11px] tabular-nums"
              style={{ color: count.colour }}
            >
              {count.value}
            </span>
            <span className="text-[11px] text-[var(--v3-text-secondary)]">
              {count.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2.5">
        {locked ? (
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--v3-advisory)]">
            <LockIcon />
            Record {outstanding}{" "}
            {outstanding === 1 ? "observation" : "observations"} to unlock
          </span>
        ) : clearMessage ? (
          <span className="text-[11px] text-[var(--v3-compliant)]">
            {clearMessage}
          </span>
        ) : null}
        <button
          type="button"
          onClick={onMarkReviewed}
          disabled={locked || reviewed}
          className={`rounded-[5px] border px-[14px] py-[5px] text-[11px] font-semibold transition-colors duration-[120ms] ${
            locked || reviewed
              ? "cursor-not-allowed border-[var(--v3-border-strong)] bg-transparent text-[var(--v3-text-muted)] opacity-50"
              : "cursor-pointer border-[rgba(61,184,122,0.25)] bg-[rgba(61,184,122,0.12)] text-[var(--v3-compliant)] hover:bg-[rgba(61,184,122,0.20)]"
          }`}
        >
          {reviewed ? "Reviewed" : "Mark as Reviewed"}
        </button>
      </div>
    </div>
  );
}
