"use client";

import { useState } from "react";

import { integrityChecks } from "@/components/review/BatchIntegrity";
import type { Batch } from "@/types";

/**
 * The checks that belong to the batch rather than to any one test.
 *
 * It sits above the section rather than inside it. These three answer for the
 * whole AR — whether it was opened twice, whether the COA and the worksheet
 * were printed the number of times the log says — so repeating them under
 * Chemicals and again under Standards would state a batch-level fact as
 * though the section had earned it.
 *
 * Collapsed by default: three green checks are worth saying and not worth
 * reading every time. Shares `integrityChecks` with the light workspace
 * rather than restating them, since two lists of what a batch was checked
 * for would eventually disagree.
 */
export function V3BatchIntegrityBar({ batch }: { batch: Batch }) {
  const [open, setOpen] = useState(false);
  const checks = integrityChecks(batch);
  const failed = checks.filter((check) => !check.ok);
  const clear = failed.length === 0;

  /* A failing check restates the bar in the blocking tone: the batch itself
     is in question, which outranks anything the section has to say. */
  const tint = clear ? "61, 184, 122" : "229, 83, 75";
  const colour = clear ? "var(--v3-compliant)" : "var(--v3-blocking)";

  return (
    <div
      className="shrink-0 border-b"
      style={{
        background: `rgba(${tint}, 0.06)`,
        borderBottomColor: `rgba(${tint}, 0.15)`,
      }}
    >
      <div className="flex items-center justify-between px-5 py-2">
        <span
          className="flex items-center gap-1.5 text-[11px] font-medium"
          style={{ color: colour }}
        >
          <span aria-hidden="true">{clear ? <>&#10003;</> : <>!</>}</span>
          Batch Integrity &mdash;{" "}
          {clear
            ? `${checks.length} ${checks.length === 1 ? "check" : "checks"} clear`
            : `${failed.length} ${failed.length === 1 ? "check" : "checks"} failed`}
        </span>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="cursor-pointer text-[10px] text-[var(--v3-text-muted)] transition-colors duration-[120ms] hover:text-[var(--v3-text-secondary)]"
        >
          {open ? <>Hide &#9650;</> : <>Show &#9660;</>}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[var(--v3-border-subtle)] bg-[var(--v3-bg-surface)] px-5 py-1">
          {checks.map((check) => (
            <div
              key={check.label}
              className="border-b border-[var(--v3-border-subtle)] py-2.5 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="text-[11px]"
                  style={{
                    color: check.ok
                      ? "var(--v3-compliant)"
                      : "var(--v3-blocking)",
                  }}
                >
                  {check.ok ? <>&#10003;</> : <>&#10007;</>}
                </span>
                <span className="text-[12px] font-medium text-[var(--v3-text-primary)]">
                  {check.label}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-[1.6] text-[var(--v3-text-secondary)]">
                {check.detail}
              </p>
              <p className="mt-1 font-mono text-[10px] text-[var(--v3-text-muted)]">
                {check.source}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
