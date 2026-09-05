"use client";

import { V3Badge } from "./Badge";
import { V3_RESULT_LABEL, V3_RESULT_TONE, V3_TONE } from "./theme";
import type { CheckItem, ItemResult } from "@/types";

/**
 * One entry in a section, as a card.
 *
 * The section reads as a list now rather than one finding at a time, so every
 * entry has to state its own verdict, what was expected and what was found.
 * The evidence behind it stays folded away: a section can carry fifteen
 * entries, and fifteen open evidence tables is not a page anyone reads.
 */
export function V3SectionEntryCard({
  item,
  verdict,
  expanded,
  onToggle,
  recorded = false,
  children,
}: {
  item: CheckItem;
  verdict: ItemResult;
  expanded: boolean;
  onToggle: () => void;
  /** Whether an observation has already been recorded against this entry. */
  recorded?: boolean;
  /** The evidence, and whatever else the entry needs once it is open. */
  children?: React.ReactNode;
}) {
  const tone = V3_RESULT_TONE[verdict];
  const blocking = verdict === "FLAGGED" || verdict === "HARD_INVALID";
  const clear = verdict === "COMPLIANT";

  return (
    <div
      onClick={(event) => {
        if (
          (event.target as HTMLElement).closest(
            "button, a, input, textarea, select, label",
          )
        ) {
          return;
        }
        onToggle();
      }}
      className={`mb-2 cursor-pointer rounded-[8px] border border-l-[3px] px-4 py-3 ${
        blocking
          ? "border-[var(--v3-blocking-border)] bg-[rgba(229,83,75,0.06)]"
          : "border-[var(--v3-border-default)] bg-[var(--v3-bg-card)]"
      }`}
      style={{ borderLeftColor: V3_TONE[tone] }}
    >
      <div className="flex flex-wrap items-center gap-2">
        {clear ? (
          <span
            aria-hidden="true"
            className="shrink-0 text-[12px] text-[var(--v3-compliant)]"
          >
            &#10003;
          </span>
        ) : null}

        <span
          className={
            blocking
              ? "text-[13px] font-semibold text-[var(--v3-text-primary)]"
              : "text-[12px] text-[var(--v3-text-primary)]"
          }
        >
          {item.exceptionType ?? item.label}
        </span>

        {/* A lot or batch number identifies the thing the entry is about, so
            it sits beside the name rather than down in the evidence. */}
        {item.reference ? (
          <span className="font-mono text-[11px] text-[var(--v3-text-mono)]">
            {item.reference}
          </span>
        ) : null}

        <V3Badge tone={tone}>{V3_RESULT_LABEL[verdict]}</V3Badge>

        {recorded ? (
          <V3Badge tone="compliant">Observation recorded</V3Badge>
        ) : null}

        <span className="flex-1" />

        {item.flagId ? (
          <span className="shrink-0 font-mono text-[10px] text-[var(--v3-text-muted)]">
            {item.flagId}
          </span>
        ) : null}
      </div>

      {item.exceptionType ? (
        <p className="mt-1 text-[11px] text-[var(--v3-text-secondary)]">
          {item.label}
        </p>
      ) : null}

      <div className="mt-2 flex flex-col gap-1">
        <div className="flex gap-2 text-[11px]">
          <span className="w-[58px] shrink-0 text-[var(--v3-text-secondary)]">
            Expected:
          </span>
          <span className="min-w-0 text-[var(--v3-text-primary)]">
            {item.expected}
          </span>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="w-[58px] shrink-0 text-[var(--v3-text-secondary)]">
            Actual:
          </span>
          {/* The found value carries the verdict's colour — it is the thing
              the verdict is about. */}
          <span className="min-w-0" style={{ color: V3_TONE[tone] }}>
            {item.actual}
          </span>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        {item.source ? (
          <span className="rounded-[4px] border border-[var(--v3-border-strong)] bg-[var(--v3-bg-surface)] px-2 py-[2px] text-[9px] tracking-[0.04em] text-[var(--v3-text-secondary)] uppercase">
            {item.source}
          </span>
        ) : null}

        <span className="flex-1" />

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="cursor-pointer rounded-[4px] border border-[var(--v3-border-strong)] px-2.5 py-1 text-[10px] text-[var(--v3-text-secondary)] transition-colors duration-[120ms] hover:text-[var(--v3-text-primary)]"
        >
          View evidence {expanded ? <>&#9650;</> : <>&#9660;</>}
        </button>
      </div>

      {expanded ? (
        <div className="mt-3 border-t border-[var(--v3-border-subtle)] pt-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}
