"use client";

import { V3_TONE, type V3Tone } from "./theme";

/**
 * What one section looks like on the strip.
 *
 * `current` is where the reviewer is standing, so it overrides the section's
 * own verdict — the ring says "you are here", the colours behind it say what
 * is there.
 */
export type V3NodeState =
  "compliant" | "advisory" | "flagged" | "invalid" | "current" | "pending";

export interface V3JourneyNode {
  id: string;
  label: string;
  state: V3NodeState;
}

export interface V3JourneyGroup {
  id: string;
  label: string;
  /** Position in the run of tests — the badge, unless the group is flagged. */
  index: number;
  nodes: V3JourneyNode[];
  clear: number;
  total: number;
  flagged: number;
  advisory: number;
  active: boolean;
  tone: V3Tone;
}

const NODE_CLASS: Record<V3NodeState, string> = {
  compliant: "size-3",
  advisory: "size-3.5",
  flagged: "v3-flag-node size-5 text-[9px] font-bold text-white",
  invalid: "v3-flag-node size-5 text-[9px] font-bold text-white",
  current:
    "size-[18px] border-2 border-[var(--v3-accent)] bg-[var(--v3-accent-bg)]",
  pending: "size-3 border border-[var(--v3-border-strong)] bg-[#1A1D30]",
};

const NODE_FILL: Partial<Record<V3NodeState, string>> = {
  compliant: V3_TONE.compliant,
  advisory: V3_TONE.advisory,
  flagged: V3_TONE.blocking,
  invalid: V3_TONE.invalid,
};

/**
 * The parameter strip across the top of the workspace.
 *
 * One node per section rather than per check: a section is the unit a
 * reviewer opens, marks and moves on from, so it is the unit the map has to
 * be clickable at.
 */
export function V3JourneyMap({
  groups,
  onSelect,
}: {
  groups: V3JourneyGroup[];
  onSelect: (sectionId: string) => void;
}) {
  return (
    <div className="flex h-20 shrink-0 items-center overflow-x-auto border-b border-[var(--v3-border-default)] bg-[var(--v3-bg-surface)] px-5">
      {groups.map((group, position) => (
        <div
          key={group.id}
          className={`flex h-full shrink-0 flex-col justify-center gap-[5px] px-3.5 ${
            position > 0 && !group.active
              ? "border-l border-[var(--v3-border-subtle)]"
              : ""
          } ${group.active ? "rounded-[6px] bg-[rgba(77,158,255,0.03)]" : ""}`}
        >
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`flex size-[18px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                group.flagged > 0
                  ? "border border-[var(--v3-blocking)] bg-[var(--v3-blocking)] text-white"
                  : "border border-[var(--v3-border-strong)] bg-[var(--v3-bg-card)] text-[var(--v3-text-muted)]"
              }`}
            >
              {group.flagged > 0 ? "!" : group.index}
            </span>
            <span
              className={`text-[9px] tracking-[0.06em] uppercase ${
                group.active
                  ? "font-semibold text-[var(--v3-text-primary)]"
                  : "font-medium text-[var(--v3-text-secondary)]"
              }`}
            >
              {group.label}
            </span>
            <span
              className="ml-1 font-mono text-[9px] whitespace-nowrap"
              style={{
                color:
                  group.clear === group.total
                    ? "var(--v3-text-secondary)"
                    : V3_TONE[group.tone],
              }}
            >
              {group.clear} / {group.total} clear
            </span>
          </div>

          <div className="flex items-center">
            {group.nodes.map((node, nodeIndex) => (
              <div key={node.id} className="flex items-center">
                {nodeIndex > 0 ? (
                  <span
                    aria-hidden="true"
                    className="h-px w-2.5 shrink-0"
                    style={{
                      background:
                        node.state === "flagged" || node.state === "invalid"
                          ? "rgba(229, 83, 75, 0.45)"
                          : "var(--v3-border-default)",
                    }}
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => onSelect(node.id)}
                  title={node.label}
                  aria-label={`${node.label} — ${node.state}`}
                  aria-current={node.state === "current" ? "step" : undefined}
                  className={`flex shrink-0 cursor-pointer items-center justify-center rounded-full ${NODE_CLASS[node.state]}`}
                  style={{ background: NODE_FILL[node.state] }}
                >
                  {node.state === "flagged" || node.state === "invalid"
                    ? "!"
                    : null}
                </button>
              </div>
            ))}
          </div>

          <div className="h-[2px] overflow-hidden rounded-[1px] bg-[var(--v3-border-strong)]">
            <div
              className="h-full rounded-[1px]"
              style={{
                width: `${group.total === 0 ? 0 : Math.round((group.clear / group.total) * 100)}%`,
                background: V3_TONE[group.tone],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
