"use client";

import { useState } from "react";

import { AiraGlyph, SendIcon } from "./Icons";
import { V3Badge } from "./Badge";
import type { V3Tone } from "./theme";

/**
 * AIRA's rail, at the foot of the navigator.
 *
 * Everything it says here is counted from the batch in front of it — how much
 * it read, which systems it read from, what it could not settle. It offers the
 * sections carrying those findings as the way in, because that is the only
 * navigation a reviewer opening a flagged batch actually wants.
 */
export function V3AiraRail({
  reviewer,
  arNumber,
  product,
  checksRead,
  sources,
  blocking,
  advisory,
  gate,
  suggestions,
  onSuggest,
  banner,
  message,
}: {
  reviewer: string;
  arNumber: string;
  product: string;
  checksRead: number;
  sources: string[];
  blocking: number;
  advisory: number;
  gate: { done: number; total: number };
  suggestions: { id: string; label: string }[];
  onSuggest: (sectionId: string) => void;
  /** A one-line verdict on the batch, shown under the source pills. */
  banner?: { label: string; tone: V3Tone };
  /** Replaces the opening paragraph when the screen has its own to say. */
  message?: React.ReactNode;
}) {
  const [question, setQuestion] = useState("");
  const percent =
    gate.total === 0 ? 0 : Math.round((gate.done / gate.total) * 100);

  return (
    <section
      aria-label="AIRA"
      className="shrink-0 border-t border-[var(--v3-border-default)]"
    >
      <div className="flex items-center gap-2 border-b border-[var(--v3-border-subtle)] px-4 py-2.5">
        <span className="text-[var(--v3-aira)]">
          <AiraGlyph size={16} />
        </span>
        <span className="flex-1 text-[13px] font-semibold text-[var(--v3-aira-name)]">
          AIRA
        </span>
        <span className="text-[9px] tracking-[0.08em] text-[var(--v3-text-muted)] uppercase">
          Review Assistant
        </span>
      </div>

      <div className="border-b border-[var(--v3-border-subtle)] px-4 py-3">
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

        <div className="mt-3 mb-1.5 text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
          Gate readiness
        </div>
        <div className="h-1 overflow-hidden rounded-[2px] bg-[var(--v3-border-strong)]">
          <div
            className="h-full rounded-[2px]"
            style={{
              width: `${percent}%`,
              background:
                blocking > 0 ? "var(--v3-advisory)" : "var(--v3-compliant)",
            }}
          />
        </div>
        <div
          className="mt-1.5 text-right font-mono text-[11px] font-semibold tabular-nums"
          style={{
            color: blocking > 0 ? "var(--v3-advisory)" : "var(--v3-compliant)",
          }}
        >
          {percent}%
        </div>
      </div>

      <div className="border-b border-[var(--v3-border-subtle)] px-4 py-3">
        <div className="rounded-[0_8px_8px_8px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] px-3 py-2.5">
          <p className="text-[11px] leading-[1.6] text-[var(--v3-aira-text)]">
            {message ?? (
              <>
                Good morning, {reviewer}. I pre-reviewed{" "}
                <span className="font-mono text-[10px] text-[var(--v3-accent)]">
                  {arNumber}
                </span>{" "}
                &mdash; {product}. I read{" "}
                <span className="font-semibold text-[var(--v3-text-primary)]">
                  {checksRead} checks
                </span>{" "}
                across {sources.length}{" "}
                {sources.length === 1 ? "system" : "systems"}.{" "}
                {blocking > 0
                  ? `${blocking} ${blocking === 1 ? "finding needs" : "findings need"} your judgment before this batch can move.`
                  : "Nothing is blocking; the conditions below still need confirming."}
                {advisory > 0
                  ? ` ${advisory} more ${advisory === 1 ? "entry is" : "entries are"} outstanding.`
                  : ""}
              </>
            )}
          </p>
        </div>

        {suggestions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => onSuggest(suggestion.id)}
                className="cursor-pointer rounded-[4px] border border-[var(--v3-border-strong)] bg-[var(--v3-bg-card)] px-2.5 py-1 text-[10px] text-[var(--v3-text-secondary)] transition-colors duration-[120ms] hover:bg-[var(--v3-bg-card-hover)] hover:text-[var(--v3-text-primary)]"
              >
                {suggestion.label} &rarr;
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="px-3.5 py-2.5">
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            aria-label="Ask AIRA about this batch"
            placeholder="Ask AIRA about this batch..."
            className="v3-ask w-full rounded-[6px] border border-[var(--v3-aira-border)] bg-[var(--v3-bg-input)] py-2 pr-10 pl-3 text-[11px] text-[var(--v3-text-primary)] transition-colors duration-[120ms] outline-none"
          />
          <span className="pointer-events-none absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--v3-aira)] text-white">
            <SendIcon />
          </span>
        </div>
      </div>
    </section>
  );
}
