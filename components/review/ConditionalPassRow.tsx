"use client";

import type { CheckItem } from "@/types";
import { useReview } from "@/context/ReviewContext";
import { DocumentLink } from "@/components/common/DocumentLink";
import { cn } from "@/lib/utils";
import { SourceBadge } from "./Badges";
import { EvidencePanel, evidenceKind } from "./EvidencePanel";

/**
 * An entry the rule set accepts provided something holds that QRA cannot
 * read for itself.
 *
 * A titration interrupted and continued is exactly what the audit trail
 * records when the method calls for adding solution mid-run — and exactly
 * what it records when someone intervened in a run they should not have. The
 * sequence alone does not tell you which. So the row states what was found
 * and the condition that separates the two, and waits.
 *
 * Nothing is written here: either the method says so or it does not, and a
 * free-text box would invite a sentence where a decision belongs.
 */
export function ConditionalPassRow({
  item,
  expanded,
  onToggle,
}: {
  item: CheckItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { isConfirmed, setConfirmed } = useReview();
  const confirmed = isConfirmed(item.id);
  const rule = item.acceptability;

  if (!rule) return null;

  return (
    <div
      className={cn(
        "mb-3 rounded-[7px] border border-l-4 px-4 py-3.5 transition-colors duration-150",
        confirmed
          ? "border-compliant-text/30 border-l-compliant-text bg-[#F0FDF4]"
          : "border-condition-text/40 border-l-condition-text bg-condition-bg",
      )}
    >
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <span
          aria-hidden="true"
          className={cn(
            "mt-[1px] shrink-0 text-[13px] font-semibold",
            confirmed ? "text-compliant-text" : "text-condition-text",
          )}
        >
          {confirmed ? "✓" : "?"}
        </span>

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "text-[13px] font-semibold",
              confirmed ? "text-compliant-text" : "text-condition-text",
            )}
          >
            {confirmed ? "Condition confirmed" : "Verify Condition"}
          </div>
          <div className="mt-0.5 text-[13px] font-medium text-slate-800">
            {item.label}
          </div>

          {/* What the audit trail actually recorded, in its own words. */}
          <div className="mt-1.5 rounded-[5px] bg-white/70 px-3 py-2 text-[12px] leading-relaxed text-slate-700">
            <span className="text-slate-400">Found: </span>
            {rule.found}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <SourceBadge source={item.source} />
            <span className="inline-flex shrink-0 items-center rounded bg-source-bg px-[7px] py-[2px] text-[10px] text-source-text">
              {evidenceKind(item)}
            </span>
            <span className="inline-flex shrink-0 items-center rounded bg-source-bg px-[7px] py-[2px] text-[10px] text-source-text">
              {rule.id}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className={cn(
            "shrink-0 cursor-pointer text-[11px] font-medium transition-colors duration-150 hover:underline",
            confirmed ? "text-compliant-text" : "text-condition-text",
          )}
        >
          {expanded ? "Hide evidence ▲" : "View evidence ▼"}
        </button>
      </div>

      {expanded ? <EvidencePanel item={item} /> : null}

      <div
        className={cn(
          "mt-3 border-t pt-3",
          confirmed ? "border-compliant-text/20" : "border-condition-text/25",
        )}
      >
        <div
          className={cn(
            "mb-1.5 text-[10px] font-semibold tracking-wider uppercase",
            confirmed ? "text-compliant-text" : "text-condition-text",
          )}
        >
          Condition to verify
        </div>
        <p className="mb-2.5 text-[13px] leading-relaxed text-slate-700">
          {rule.condition}
        </p>

        <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-slate-700">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(item.id, event.target.checked)}
            className="mt-[3px] size-[15px] shrink-0 cursor-pointer accent-compliant-text"
          />
          <span>I confirm this condition is met</span>
        </label>

        <div className="mt-2 text-[11px] text-slate-400">
          Source: {rule.id} —{" "}
          <DocumentLink
            reference={item.sopReference ?? "APL-CP-F-QCCI-GEN-0013"}
            tooltip
          />
        </div>
      </div>
    </div>
  );
}
