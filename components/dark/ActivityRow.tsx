"use client";

import { useRouter } from "next/navigation";

import { V3Badge, V3DomainBadge } from "./Badge";
import type { V3Tone } from "./theme";

/**
 * One batch, as a row.
 *
 * The dot repeats the badge's tone at the far left so a column of rows can be
 * scanned for trouble without reading any of the words.
 */
export function V3ActivityRow({
  arNumber,
  product,
  domain,
  badge,
  dotColour,
  time,
}: {
  arNumber: string;
  product: string;
  domain: string;
  badge: { tone: V3Tone; label: string };
  dotColour: string;
  time: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/review/${arNumber}`)}
      aria-label={`Open ${arNumber} ${product}`}
      className="flex w-full cursor-pointer items-center gap-3 rounded-[8px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] px-4 py-3 text-left transition-colors duration-150 hover:bg-[var(--v3-bg-card-hover)] focus-visible:ring-2 focus-visible:ring-[var(--v3-accent)] focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full"
        style={{ background: dotColour }}
      />
      <span className="w-[120px] shrink-0 font-mono text-[11px] text-[var(--v3-accent)]">
        {arNumber}
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--v3-text-primary)]">
        {product}
      </span>
      <V3DomainBadge>{domain}</V3DomainBadge>
      <V3Badge tone={badge.tone}>{badge.label}</V3Badge>
      {/* Wider than the design's 60px: the real activity strings are dates and
          times, not the "2h ago" the mock was drawn with. */}
      <span className="w-[150px] shrink-0 text-right font-mono text-[10px] text-[var(--v3-text-secondary)]">
        {time}
      </span>
    </button>
  );
}
