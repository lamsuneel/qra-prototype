"use client";

import { V3_TONE } from "./theme";

/** A month that has not yet reached the target keeps the historical blue. */
const HISTORICAL = "#1E3A5F";

/**
 * Cycle time, month by month, against the SLA target.
 *
 * The bars are coloured by the target rather than by recency: a month is
 * green because it came in at or under two days, not because it happens to be
 * the last column. A future month that slips goes back to blue on its own.
 */
export function V3CycleTimeChart({
  points,
  target,
  title,
  subtitle,
}: {
  points: { month: string; days: number }[];
  target: number;
  title: string;
  subtitle: string;
}) {
  /* Round the axis up to a whole day so the gridlines land on figures a
     reader recognises — 4 / 3 / 2 / 1 rather than 3.5 / 2.33 / 1.17. */
  const top = Math.max(Math.ceil(Math.max(...points.map((p) => p.days))), 1);
  const ticks = Array.from({ length: top + 1 }, (_, i) => top - i);
  const height = (days: number) => `${(days / top) * 100}%`;

  return (
    <section className="rounded-[12px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] p-5">
      <h2 className="text-[13px] font-semibold text-[var(--v3-text-primary)]">
        {title}
      </h2>
      <p className="mt-0.5 mb-4 text-[10px] text-[var(--v3-text-muted)]">
        {subtitle}
      </p>

      <div className="rounded-[6px] bg-[var(--v3-bg-base)] p-3">
        <div className="flex gap-2">
          <div className="flex h-40 shrink-0 flex-col justify-between pt-0.5 text-right">
            {ticks.map((tick) => (
              <span
                key={tick}
                className="font-mono text-[9px] text-[var(--v3-text-muted)] tabular-nums"
              >
                {tick.toFixed(1)}
              </span>
            ))}
          </div>

          <div className="relative flex-1">
            {ticks.map((tick) => (
              <span
                key={tick}
                aria-hidden="true"
                className="absolute left-0 h-px w-full bg-[var(--v3-border-subtle)]"
                style={{ bottom: height(tick) }}
              />
            ))}

            <span
              aria-hidden="true"
              className="absolute left-0 w-[88%] border-t border-dashed border-[var(--v3-advisory)]"
              style={{ bottom: height(target) }}
            />
            <span
              className="absolute right-0 -translate-y-full text-[9px] whitespace-nowrap text-[var(--v3-advisory)]"
              style={{ bottom: height(target) }}
            >
              Target {target.toFixed(1)}d
            </span>

            <div className="flex h-40 items-end gap-2">
              {points.map((point) => {
                const met = point.days <= target;

                return (
                  <div
                    key={point.month}
                    className="flex h-full flex-1 flex-col justify-end"
                  >
                    <span
                      className="mb-[3px] text-center font-mono text-[9px] tabular-nums"
                      style={{
                        color: met
                          ? V3_TONE.compliant
                          : "var(--v3-text-secondary)",
                      }}
                    >
                      {point.days.toFixed(1)}
                    </span>
                    <div
                      title={`${point.month} · ${point.days.toFixed(1)} days`}
                      className="w-full rounded-t-[4px] transition-opacity duration-[120ms] hover:opacity-80"
                      style={{
                        height: height(point.days),
                        background: met ? V3_TONE.compliant : HISTORICAL,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              {points.map((point) => {
                const met = point.days <= target;

                return (
                  <span
                    key={point.month}
                    className="mt-1.5 flex-1 text-center text-[9px]"
                    style={{
                      color: met ? V3_TONE.compliant : "var(--v3-text-muted)",
                      fontWeight: met ? 600 : 400,
                    }}
                  >
                    {point.month}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
