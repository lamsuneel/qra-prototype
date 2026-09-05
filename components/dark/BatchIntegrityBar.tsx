"use client";

import { useState } from "react";

import { integrityChecks } from "@/components/review/BatchIntegrity";
import type { Batch } from "@/types";

/**
 * The checks that belong to the batch rather than to any one test.
 *
 * Collapsed by default. Three green checks are worth stating and not worth
 * reading every time, so the bar says the count and opens on request. It
 * shares `integrityChecks` with the light workspace rather than restating
 * them: two lists of what a batch was checked for would eventually disagree.
 */
export function V3BatchIntegrityBar({ batch }: { batch: Batch }) {
  const [open, setOpen] = useState(false);
  const checks = integrityChecks(batch);
  const issues = checks.filter((check) => !check.ok);
  const clear = issues.length === 0;

  return (
    <div
      className="mt-4 rounded-[6px] border"
      style={{
        borderColor: clear
          ? "rgba(61, 184, 122, 0.15)"
          : "var(--v3-blocking-border)",
        background: clear
          ? "rgba(61, 184, 122, 0.06)"
          : "var(--v3-blocking-bg)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-left"
        style={{ color: clear ? "var(--v3-compliant)" : "var(--v3-blocking)" }}
      >
        <span aria-hidden="true" className="text-[11px]">
          {clear ? <>&#10003;</> : <>&#9888;</>}
        </span>
        <span className="text-[11px] font-semibold">Batch Integrity</span>
        <span className="text-[11px] opacity-90">
          &mdash;{" "}
          {clear
            ? `${checks.length} ${checks.length === 1 ? "check" : "checks"} clear`
            : `${issues.length} of ${checks.length} need attention`}
        </span>
        <span className="flex-1" />
        <span aria-hidden="true" className="text-[10px]">
          {open ? <>&#9650;</> : <>&#9660;</>}
        </span>
      </button>

      {open ? (
        <div className="px-3.5 pb-3">
          {checks.map((check) => (
            <div
              key={check.label}
              className="border-t border-[var(--v3-border-subtle)] py-2.5"
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
