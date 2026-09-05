"use client";

import { useState } from "react";

import { resultFor, type CheckItem } from "@/types";
import { V3Badge } from "./Badge";
import { AiraGlyph, SendIcon } from "./Icons";
import { V3_RESULT_LABEL, V3_RESULT_TONE } from "./theme";

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--v3-border-subtle)] px-4 py-3">
      <span className="mb-1.5 block text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * AIRA on the entry in front of the reviewer: what it found, why that is a
 * finding, what it compared, and what it suggests doing about it.
 *
 * Every line is the entry's own words. Where an entry carries no reason —
 * a compliant one, mostly — the block is left out rather than filled with a
 * sentence AIRA would have had to make up.
 */
export function V3FindingPanel({
  item,
  sectionName,
  onFillObservation,
  recorded,
  footer,
}: {
  item: CheckItem;
  sectionName: string;
  onFillObservation: () => void;
  /** True once the reviewer has recorded an observation against this entry. */
  recorded: boolean;
  /**
   * Replaces the draft-observation block. A compliant entry has nothing to
   * observe, so the screen showing one puts its own action here instead.
   */
  footer?: React.ReactNode;
}) {
  const [question, setQuestion] = useState("");
  const verdict = resultFor(item);
  const tone = V3_RESULT_TONE[verdict];
  const reason = item.flagReason ?? item.checkDescription ?? item.comparison;

  return (
    <aside
      aria-label="AIRA finding detail"
      className="flex w-[280px] shrink-0 flex-col overflow-hidden border-l border-[var(--v3-border-default)] bg-[var(--v3-bg-surface)]"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--v3-border-default)] px-4 py-3.5">
        <span className="text-[var(--v3-aira)]">
          <AiraGlyph size={14} />
        </span>
        <span className="flex-1 text-[15px] font-semibold text-[var(--v3-aira-name)]">
          AIRA
        </span>
        <V3Badge tone={tone}>{V3_RESULT_LABEL[verdict]}</V3Badge>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Block label="Finding">
          <div className="text-[13px] leading-[1.45] font-semibold text-[var(--v3-text-primary)]">
            {item.label}
          </div>
          <div className="mt-1 text-[10px] text-[var(--v3-text-muted)]">
            {sectionName}
            {item.reference ? ` · ${item.reference}` : ""}
          </div>
          {item.flagId || item.sopReference ? (
            <div className="mt-1.5 font-mono text-[10px] text-[var(--v3-text-mono)]">
              {[item.flagId, item.sopReference].filter(Boolean).join(" · ")}
            </div>
          ) : null}
        </Block>

        {reason ? (
          <Block
            label={
              verdict === "COMPLIANT"
                ? "What AIRA checked"
                : "Why this is flagged"
            }
          >
            <p className="text-[11px] leading-[1.6] text-[var(--v3-aira-text)]">
              {reason}
            </p>
          </Block>
        ) : null}

        <Block label="Expected">
          <p className="font-mono text-[11px] leading-[1.6] text-[var(--v3-text-primary)]">
            {item.expected}
          </p>
          {item.expectedSource ? (
            <div className="mt-1 font-mono text-[10px] text-[var(--v3-text-muted)]">
              {item.expectedSource}
            </div>
          ) : null}
        </Block>

        <Block label="Actual">
          <p className="font-mono text-[11px] leading-[1.6] text-[var(--v3-text-primary)]">
            {item.actual}
          </p>
          <div className="mt-1 font-mono text-[10px] text-[var(--v3-text-muted)]">
            {item.source}
          </div>
        </Block>

        {item.flagAction ? (
          <Block label="Recommended action">
            <p className="text-[11px] leading-[1.6] text-[var(--v3-aira-text)]">
              {item.flagAction}
            </p>
          </Block>
        ) : null}

        <div className="px-4 py-3">
          {footer ?? (
            <>
              <button
                type="button"
                onClick={onFillObservation}
                disabled={recorded}
                className="w-full cursor-pointer rounded-[6px] border border-[var(--v3-aira-border)] bg-[var(--v3-aira-bg)] py-[7px] text-[11px] font-semibold text-[var(--v3-aira-name)] transition-colors duration-[120ms] hover:bg-[rgba(124,92,252,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {recorded ? "Observation recorded" : "Draft my observation"}
              </button>
              <p className="mt-2 text-center text-[9px] leading-[1.4] text-[var(--v3-text-muted)]">
                AIRA drafts; the observation on record is the one you write.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-[var(--v3-border-subtle)] px-3.5 py-2.5">
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            aria-label="Ask AIRA about this finding"
            placeholder="Ask AIRA about this finding..."
            className="v3-ask w-full rounded-[6px] border border-[var(--v3-aira-border)] bg-[var(--v3-bg-input)] py-2 pr-10 pl-3 text-[11px] text-[var(--v3-text-primary)] transition-colors duration-[120ms] outline-none"
          />
          <span className="pointer-events-none absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--v3-aira)] text-white">
            <SendIcon />
          </span>
        </div>
      </div>
    </aside>
  );
}
