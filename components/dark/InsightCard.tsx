"use client";

/**
 * One thing AIRA noticed across the month, and the evidence behind it.
 *
 * Every card ends in a link. A signal a reader cannot open is an assertion,
 * and an assertion is not what a quality system is allowed to offer.
 */
export function V3InsightCard({
  tag,
  title,
  body,
  action,
}: {
  tag: string;
  title: string;
  body: string;
  /** Omitted where the reading is worth stating but leads nowhere. */
  action?: { label: string; onClick: () => void };
}) {
  return (
    <article className="rounded-[12px] border border-[var(--v3-aira-border)] bg-[var(--v3-aira-bg)] p-4">
      <span className="mb-1.5 block text-[9px] font-bold tracking-[0.08em] text-[var(--v3-aira)] uppercase">
        {tag}
      </span>
      <h3 className="mb-1.5 text-[13px] font-semibold text-[var(--v3-text-primary)]">
        {title}
      </h3>
      <p className="text-[11px] leading-[1.5] text-[var(--v3-aira-text)]">
        {body}
      </p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2.5 cursor-pointer text-[11px] text-[var(--v3-aira-name)] hover:underline"
        >
          {action.label} &rarr;
        </button>
      ) : null}
    </article>
  );
}

/** The heading the insight row sits under, lamp and all. */
export function V3AiraHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-3.5 flex items-center gap-2">
      <span
        aria-hidden="true"
        className="v3-aira-dot size-[7px] shrink-0 rounded-full bg-[var(--v3-aira)]"
      />
      <div>
        <h2 className="text-[13px] font-semibold tracking-[0.05em] text-[var(--v3-aira-name)]">
          {title}
        </h2>
        <p className="mt-0.5 text-[10px] text-[var(--v3-text-muted)] italic">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
