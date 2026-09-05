"use client";

import { V3_TONE, type V3Tone } from "./theme";
import { RefreshIcon } from "./Icons";

export interface V3NavSection {
  id: string;
  name: string;
  tone: V3Tone;
  clear: number;
  total: number;
  active: boolean;
  reviewed: boolean;
}

export interface V3NavStat {
  label: string;
  value: number;
  colour: string;
}

/**
 * The left rail: what batch this is, how far through it the reviewer is, and
 * which section they are standing in.
 *
 * The section list is capped and scrolls. The parameter being reviewed can
 * carry nine sections, and a list that grows with it would push AIRA off the
 * bottom of the rail on exactly the batches where AIRA has most to say.
 */
export function V3ReviewNavigator({
  context,
  stats,
  progress,
  parameterName,
  sections,
  onSelect,
  updatedAt,
  children,
}: {
  context: { label: string; value: string; mono?: boolean }[];
  stats: V3NavStat[];
  progress: { done: number; total: number; tone: V3Tone };
  parameterName: string;
  sections: V3NavSection[];
  onSelect: (sectionId: string) => void;
  updatedAt: string;
  /** The AIRA rail, which sits below the list and stays visible. */
  children: React.ReactNode;
}) {
  const percent =
    progress.total === 0
      ? 0
      : Math.round((progress.done / progress.total) * 100);

  return (
    <nav className="flex w-[260px] shrink-0 flex-col overflow-hidden border-r border-[var(--v3-border-default)] bg-[var(--v3-bg-surface)]">
      <div className="shrink-0 border-b border-[var(--v3-border-subtle)] px-4 py-3">
        <span className="text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
          Review Navigator
        </span>
      </div>

      <div className="shrink-0 border-b border-[var(--v3-border-subtle)] px-4 py-3">
        <span className="mb-2.5 block text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
          Batch Context
        </span>
        {context.map((row) => (
          <div
            key={row.label}
            className="mb-1.5 flex items-baseline justify-between gap-2 last:mb-0"
          >
            <span className="shrink-0 text-[9px] whitespace-nowrap text-[var(--v3-text-secondary)]">
              {row.label}
            </span>
            <span
              className={`min-w-0 text-right text-[11px] ${
                row.mono
                  ? "font-mono text-[var(--v3-accent)]"
                  : "text-[var(--v3-text-primary)]"
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-b border-[var(--v3-border-subtle)] px-4 py-3">
        <span className="mb-2.5 block text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
          Review Progress
        </span>

        <div className="mb-2.5 grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[6px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] p-2 text-center"
            >
              <div
                className="font-mono text-[20px] leading-[1.1] font-bold tabular-nums"
                style={{ color: stat.colour }}
              >
                {stat.value}
              </div>
              <div className="mt-0.5 text-[9px] text-[var(--v3-text-muted)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-1.5 text-[10px] text-[var(--v3-text-secondary)]">
          Sections reviewed
        </div>
        <div className="mb-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-[var(--v3-border-strong)]">
            <div
              className="h-full rounded-[3px]"
              style={{
                width: `${percent}%`,
                background: V3_TONE[progress.tone],
              }}
            />
          </div>
          <span
            className="shrink-0 font-mono text-[11px] font-semibold tabular-nums"
            style={{ color: V3_TONE[progress.tone] }}
          >
            {percent}%
          </span>
        </div>
        <div className="text-[9px] text-[var(--v3-text-muted)]">
          {progress.done} of {progress.total} sections marked reviewed
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-b border-[var(--v3-border-subtle)]">
        <div className="shrink-0 px-4 py-2 text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
          {parameterName} sections
        </div>
        <div className="max-h-[184px] min-h-0 flex-1 overflow-y-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
              aria-current={section.active ? "true" : undefined}
              className={`flex w-full cursor-pointer items-center gap-2 py-1.5 text-left transition-colors duration-[120ms] hover:bg-[var(--v3-bg-card-hover)] ${
                section.active
                  ? "border-l-2 bg-[rgba(229,83,75,0.06)] pr-4 pl-[14px]"
                  : "px-4"
              }`}
              style={
                section.active
                  ? { borderLeftColor: V3_TONE[section.tone] }
                  : undefined
              }
            >
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: V3_TONE[section.tone] }}
              />
              <span
                className={`min-w-0 flex-1 truncate text-[12px] ${
                  section.active
                    ? "font-semibold text-[var(--v3-text-primary)]"
                    : "text-[var(--v3-text-secondary)]"
                }`}
              >
                {section.name}
              </span>
              <span
                className="shrink-0 font-mono text-[10px] whitespace-nowrap tabular-nums"
                style={{
                  color: section.active
                    ? V3_TONE[section.tone]
                    : "var(--v3-text-muted)",
                }}
              >
                {section.clear} / {section.total}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-[var(--v3-text-muted)]">
        <RefreshIcon />
        <span className="text-[9px]">Last activity {updatedAt}</span>
      </div>

      {children}
    </nav>
  );
}
