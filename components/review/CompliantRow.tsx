import type { CheckItem } from "@/types";
import { CompliantBadge, SourceBadge } from "./Badges";

/**
 * A compliant item needs no reviewer action, so this is a static row.
 * Deliberately not a button: no onClick, no hover state, nothing that
 * suggests there is something to open.
 */
export function CompliantRow({ item }: { item: CheckItem }) {
  return (
    <div className="flex items-center gap-3.5 border-b border-slate-100 py-2.5 text-[13px]">
      <span className="flex-1 text-slate-700">{item.label}</span>
      {item.reference ? (
        <span className="hidden text-[11px] text-slate-400 sm:inline">{item.reference}</span>
      ) : null}
      {item.statusText ? (
        <span className="hidden text-[11px] text-slate-400 md:inline">{item.statusText}</span>
      ) : null}
      <CompliantBadge />
      <SourceBadge source={item.source} />
    </div>
  );
}
