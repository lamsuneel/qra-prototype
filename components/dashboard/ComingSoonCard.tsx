/**
 * A domain QRA does not review yet.
 *
 * Deliberately not a Domain: it has no batches, no queue and no route, so
 * adding it to the domain list would put it into the batch lists, the search
 * index and the management breakdown as an empty shell. It is a card and
 * nothing else.
 *
 * Rendered as a plain div rather than a disabled button so that nothing
 * offers itself to the keyboard or the pointer as something to open.
 */
export function ComingSoonCard({
  name,
  abbreviation,
  note,
}: {
  name: string;
  abbreviation: string;
  note: string;
}) {
  return (
    <div
      aria-label={`${name} — coming soon, not yet available for review`}
      className="cursor-default rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-5 text-left opacity-70"
    >
      <div className="mb-3.5 flex items-start justify-between">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              {name}
            </span>
            <span className="rounded-full bg-slate-200 px-2 py-[2px] text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
              Coming Soon
            </span>
          </div>

          {/* Same shape as a live card, with nothing counted. */}
          <div
            aria-hidden="true"
            className="text-[26px] leading-none font-bold text-slate-300 tabular-nums"
          >
            &mdash;
          </div>
          <div className="mt-1 text-xs text-slate-400">not yet in review</div>
        </div>

        <span className="flex size-9 items-center justify-center rounded-[7px] bg-slate-200/70 text-[11px] font-bold text-slate-400">
          {abbreviation}
        </span>
      </div>

      <div className="border-t border-slate-200/80 pt-3 text-[11px] leading-relaxed text-slate-400">
        {note}
      </div>
    </div>
  );
}
