"use client";

import { V3Badge } from "./Badge";
import { V3_TONE, type V3Tone } from "./theme";

/**
 * One open alert.
 *
 * The AR number is pulled out of the alert's own detail line rather than
 * stored twice, so the row and the batch it points at can never disagree
 * about which batch that is.
 */
export function V3AlertRow({
  tone,
  label,
  arNumber,
  description,
  onOpen,
}: {
  tone: V3Tone;
  label: string;
  arNumber: string | null;
  description: string;
  onOpen?: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-[var(--v3-border-subtle)] py-2.5 last:border-b-0">
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full"
        style={{ background: V3_TONE[tone] }}
      />
      <V3Badge tone={tone}>{label}</V3Badge>
      {arNumber ? (
        <span className="shrink-0 font-mono text-[11px] text-[var(--v3-text-mono)]">
          {arNumber}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--v3-text-primary)]">
        {description}
      </span>
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className="shrink-0 cursor-pointer text-[10px] whitespace-nowrap text-[var(--v3-accent)] transition-opacity duration-[120ms] hover:opacity-70"
        >
          View &rarr;
        </button>
      ) : null}
    </div>
  );
}
