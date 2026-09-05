"use client";

/**
 * One headline figure.
 *
 * The accent stripe is what tells the four cards apart at a glance: it is
 * present only where the number has a state attached to it, so a card without
 * one is a count rather than a judgement.
 */
export function V3KpiCard({
  icon,
  iconColour = "var(--v3-text-secondary)",
  accent,
  dense = false,
  label,
  value,
  unit,
  valueColour = "var(--v3-text-primary)",
  sub,
  subColour = "var(--v3-text-secondary)",
  action,
}: {
  /** Left out on a row of six, where six icons would be six distractions. */
  icon?: React.ReactNode;
  iconColour?: string;
  /** Colour of the left stripe. Omitted where the figure carries no status. */
  accent?: string;
  /** Tighter, for rows carrying more than four figures. */
  dense?: boolean;
  label: string;
  value: string;
  /** The figure's unit, set beside it rather than inside it so the number
      stays a number the eye can compare down a row of cards. */
  unit?: string;
  valueColour?: string;
  sub: string;
  subColour?: string;
  action?: { label: string; colour: string; onClick: () => void };
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[12px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] ${dense ? "p-4" : "p-5"}`}
    >
      {accent ? (
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 h-full w-[3px] rounded-l-[12px]"
          style={{ background: accent }}
        />
      ) : null}

      {icon ? (
        <div className="mb-2" style={{ color: iconColour }}>
          {icon}
        </div>
      ) : null}

      <div className="mb-2 text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
        {label}
      </div>

      <div className="flex items-baseline gap-1">
        <span
          className={`font-mono leading-none font-bold tabular-nums ${dense ? "text-[28px]" : "text-[32px]"}`}
          style={{ color: valueColour }}
        >
          {value}
        </span>
        {unit ? (
          <span className="text-[13px] text-[var(--v3-text-secondary)]">
            {unit}
          </span>
        ) : null}
      </div>

      <div
        className={`mt-1 ${dense ? "text-[10px]" : "text-[11px]"}`}
        style={{ color: subColour }}
      >
        {sub}
      </div>

      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1.5 cursor-pointer text-[10px] hover:underline"
          style={{ color: action.colour }}
        >
          {action.label} &rarr;
        </button>
      ) : null}
    </div>
  );
}
