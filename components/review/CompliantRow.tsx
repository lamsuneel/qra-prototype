import type { CheckItem } from "@/types";
import { CalibrationBadge, CompliantBadge, SourceBadge } from "./Badges";
import { EvidenceTable } from "./EvidenceTable";

/**
 * A compliant item needs no reviewer action, so this is a static row.
 * Deliberately not a button: no onClick, no hover state, nothing that
 * suggests there is something to open.
 */
const CAL_DUE = /^Cal\. due (.+)$/;

export function CompliantRow({ item }: { item: CheckItem }) {
  const calibration = item.reference?.match(CAL_DUE)?.[1];

  return (
    <div className="border-b border-slate-100 py-2.5">
      <div className="flex items-center gap-3.5 text-[13px]">
        <span className="flex-1 text-slate-700">{item.label}</span>
        {calibration ? (
          <CalibrationBadge due={calibration} />
        ) : item.reference ? (
          <span className="hidden text-[11px] text-slate-400 sm:inline">
            {item.reference}
          </span>
        ) : null}
        {item.statusText ? (
          <span className="hidden text-[11px] text-slate-400 md:inline">
            {item.statusText}
          </span>
        ) : null}
        <CompliantBadge />
        <SourceBadge source={item.source} />
      </div>

      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[11px] text-source-text">
        <span className="text-slate-400">Recorded</span>
        <span className="text-slate-600">{item.actual}</span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 text-[11px] text-source-text">
        <span className="text-slate-400">Expected</span>
        <span>{item.expected}</span>
      </div>

      {item.table ? <EvidenceTable table={item.table} /> : null}
    </div>
  );
}
