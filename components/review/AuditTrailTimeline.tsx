import type { AuditTrailStep, SerialContinuity } from "@/types";
import { cn } from "@/lib/utils";

/**
 * The instrument's audit trail, in the order the instrument wrote it.
 *
 * A compact vertical run rather than a table: the reviewer is checking a
 * sequence, and a sequence reads down. A step that is missing or out of
 * order is marked in red and says so on its own line, so the break is
 * legible without comparing timestamps by eye.
 */
export function AuditTrailTimeline({
  steps,
  continuity,
}: {
  steps?: AuditTrailStep[];
  continuity?: SerialContinuity;
}) {
  if (!steps?.length && !continuity) return null;

  return (
    <div className="mt-3 border-t border-slate-200/70 pt-3">
      {steps?.length ? (
        <>
          <div className="mb-2 text-[10px] font-semibold tracking-wider text-source-text uppercase">
            Audit trail sequence
          </div>

          <ol className="flex flex-col">
            {steps.map((entry, index) => {
              const broken = entry.status !== "ok";
              const last = index === steps.length - 1;

              return (
                <li key={`${entry.step}-${entry.label}`} className="flex gap-2.5">
                  {/* Dot and the line joining it to the next step. */}
                  <div className="flex w-3 shrink-0 flex-col items-center pt-[5px]">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-[7px] shrink-0 rounded-full",
                        broken ? "bg-flagged-text" : "bg-compliant-text",
                      )}
                    />
                    {last ? null : (
                      <span
                        aria-hidden="true"
                        className="w-px flex-1 bg-slate-200"
                        style={{ minHeight: 14 }}
                      />
                    )}
                  </div>

                  <div className={cn("pb-2 text-[12px]", last && "pb-0")}>
                    <span className="text-slate-400">{entry.step}. </span>
                    <span className={broken ? "font-medium text-flagged-text" : "text-slate-700"}>
                      {entry.label}
                    </span>
                    <span className="ml-2 text-[11px] text-slate-400">{entry.timestamp}</span>
                    {broken ? (
                      <div className="mt-0.5 text-[11px] font-medium text-flagged-text">
                        {entry.status === "missing"
                          ? "Missing from the audit trail"
                          : "Recorded out of order"}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      ) : null}

      {continuity ? (
        <div className={cn("text-[12px]", steps?.length && "mt-3 border-t border-slate-200/70 pt-3")}>
          <div className="mb-1 text-[10px] font-semibold tracking-wider text-source-text uppercase">
            Serial number continuity
          </div>
          <div className="text-slate-700">{continuity.range}</div>
          {continuity.gap ? (
            <div className="mt-0.5 text-[11px] font-medium text-flagged-text">
              <span aria-hidden="true">&#9888;</span> {continuity.gap}
            </div>
          ) : (
            <div className="mt-0.5 text-[11px] text-compliant-text">
              No gap in the reviewed run
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
