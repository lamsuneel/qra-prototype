"use client";

/**
 * Exceptions by type, longest bar first.
 *
 * Each bar opens: a count says how often something happened, not whether it
 * is one product misbehaving or six unrelated ones, and that is the question
 * that decides whether anything needs doing.
 */
export function V3ExceptionBars({
  points,
  selected,
  onSelect,
  title,
  subtitle,
}: {
  points: { category: string; count: number }[];
  selected: string | null;
  onSelect: (category: string) => void;
  title: string;
  subtitle: string;
}) {
  const most = Math.max(...points.map((point) => point.count), 1);

  return (
    <section className="rounded-[12px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] p-5">
      <h2 className="text-[13px] font-semibold text-[var(--v3-text-primary)]">
        {title}
      </h2>
      <p className="mt-0.5 mb-4 text-[10px] text-[var(--v3-text-muted)]">
        {subtitle}
      </p>

      <div className="rounded-[6px] bg-[var(--v3-bg-base)] p-3">
        {points.map((point) => {
          const open = selected === point.category;

          return (
            <button
              key={point.category}
              type="button"
              onClick={() => onSelect(point.category)}
              aria-pressed={open}
              className="mb-2 flex w-full cursor-pointer items-center gap-2.5 text-left last:mb-0 focus-visible:ring-2 focus-visible:ring-[var(--v3-accent)] focus-visible:outline-none"
            >
              <span
                title={point.category}
                className="w-[170px] shrink-0 truncate text-right text-[10px]"
                style={{
                  color: open
                    ? "var(--v3-text-primary)"
                    : "var(--v3-text-secondary)",
                }}
              >
                {point.category}
              </span>
              <span className="h-6 flex-1 overflow-hidden rounded-[4px] bg-[var(--v3-blocking-bg)]">
                <span
                  className="block h-full rounded-[4px] bg-[var(--v3-blocking)] transition-opacity duration-[120ms]"
                  style={{
                    width: `${(point.count / most) * 100}%`,
                    opacity: open ? 1 : 0.85,
                  }}
                />
              </span>
              <span className="w-8 shrink-0 text-right font-mono text-[11px] text-[var(--v3-text-mono)] tabular-nums">
                {point.count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
