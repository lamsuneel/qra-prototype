"use client";

import { V3Badge } from "./Badge";
import type { V3Tone } from "./theme";

/* The same trio the status pills use, so a section named here carries the
   colour it carries everywhere else on the screen. */
const CHIP: Record<V3Tone, string> = {
  invalid:
    "bg-[var(--v3-invalid-bg)] border-[var(--v3-invalid-border)] text-[var(--v3-invalid)]",
  blocking:
    "bg-[var(--v3-blocking-bg)] border-[var(--v3-blocking-border)] text-[var(--v3-blocking)]",
  advisory:
    "bg-[var(--v3-advisory-bg)] border-[var(--v3-advisory-border)] text-[var(--v3-advisory)]",
  compliant:
    "bg-[var(--v3-compliant-bg)] border-[var(--v3-compliant-border)] text-[var(--v3-compliant)]",
  muted:
    "bg-[var(--v3-bg-card)] border-[var(--v3-border-strong)] text-[var(--v3-text-secondary)]",
};

/**
 * What the batch was read from, and where its findings are.
 *
 * This was AIRA's rail. AIRA speaks about the finding in the panel on the
 * right, and having it speak again on the left put two assistants and two ask
 * boxes on one screen -- the left one reading as an assistant only while it
 * was pinned to the foot of the rail, which it no longer is.
 *
 * Taking the voice out left two facts worth keeping: which systems the batch
 * was read from, and which sections carry the findings. The gate-readiness
 * bar went with it, being the section count from Review Progress under a
 * second name.
 */
export function V3BatchSummary({
  sources,
  banner,
  suggestions,
  suggestionsLabel,
  onSuggest,
}: {
  sources: string[];
  /** A one-line verdict on the batch, under the pills. */
  banner?: { label: string; tone: V3Tone };
  /** What the group of sections below is. */
  suggestionsLabel: string;
  /** Sections offered as the way in, each in the colour it carries. */
  suggestions: { id: string; label: string; tone: V3Tone }[];
  onSuggest: (sectionId: string) => void;
}) {
  return (
    <section
      aria-label="Batch summary"
      className="shrink-0 border-t border-[var(--v3-border-default)] px-4 py-3"
    >
      <span className="mb-2 block text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
        Sources read
      </span>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source) => (
          <span
            key={source}
            className="rounded-[4px] border border-[rgba(77,158,255,0.20)] bg-[rgba(77,158,255,0.10)] px-2 py-[2px] text-[9px] font-semibold text-[var(--v3-accent)]"
          >
            {source}
          </span>
        ))}
      </div>

      {banner ? (
        <div className="mt-2.5 flex justify-center">
          <V3Badge tone={banner.tone}>{banner.label}</V3Badge>
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <>
          <span className="mt-3.5 mb-1.5 block text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
            {suggestionsLabel}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => onSuggest(suggestion.id)}
                className={`cursor-pointer rounded-[4px] border px-2.5 py-1 text-[10px] font-medium transition-opacity duration-[120ms] hover:opacity-80 ${CHIP[suggestion.tone]}`}
              >
                {suggestion.label} &rarr;
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
