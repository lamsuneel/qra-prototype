"use client";

import { useRouter } from "next/navigation";

import { V3Badge } from "./Badge";
import type { V3Tone } from "./theme";

/**
 * A review domain, as a card.
 *
 * The left edge, the badge and the bar all take the domain's status colour,
 * so the card reads the same whether the eye lands on the edge or the number.
 */
export function V3DomainCard({
  name,
  arNumber,
  icon,
  colour,
  badge,
  meta,
  progress,
  progressLabel,
  time,
}: {
  name: string;
  /**
   * The batch this card opens.
   *
   * It used to be the domain's slug, pointing at the light listing page.
   * The dark workspace reviews one batch rather than listing many, so the
   * dashboard resolves the domain to the batch a reviewer would open first
   * and hands that over instead.
   */
  arNumber: string;
  icon: React.ReactNode;
  /** The domain's status colour — edge, icon and bar all use it. */
  colour: string;
  badge: { tone: V3Tone; label: string };
  meta: string;
  /** 0-100. What share of this domain's checks came back clean. */
  progress: number;
  progressLabel: string;
  time: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/review/${arNumber}`)}
      aria-label={`Open ${name} — ${meta}`}
      className="relative w-full cursor-pointer overflow-hidden rounded-[12px] border border-[var(--v3-border-default)] border-l-[3px] bg-[var(--v3-bg-card)] p-5 text-left transition-colors duration-150 hover:bg-[var(--v3-bg-card-hover)] focus-visible:ring-2 focus-visible:ring-[var(--v3-accent)] focus-visible:outline-none"
      style={{ borderLeftColor: colour }}
    >
      <div className="flex items-center justify-between">
        <span style={{ color: colour }}>{icon}</span>
        <V3Badge tone={badge.tone}>{badge.label}</V3Badge>
      </div>

      <div className="mt-3 text-[15px] font-semibold text-[var(--v3-text-primary)]">
        {name}
      </div>
      <div className="mt-1 text-[12px] text-[var(--v3-text-secondary)]">
        {meta}
      </div>

      <div
        role="img"
        aria-label={progressLabel}
        title={progressLabel}
        className="mt-3 h-[3px] overflow-hidden rounded-[2px] bg-[var(--v3-border-strong)]"
      >
        <div
          className="h-full rounded-[2px]"
          style={{ width: `${progress}%`, background: colour }}
        />
      </div>

      <div className="mt-1.5 text-[9px] text-[var(--v3-text-secondary)]">
        {time}
      </div>
    </button>
  );
}
