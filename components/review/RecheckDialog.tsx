"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Sending a batch back for correction.
 *
 * "Send back" describes what happens to the paperwork; "recheck" describes
 * what the lab is being asked to do, which is the thing the person reading
 * it needs to know. The reason is mandatory because it is the only part of
 * this that survives — the next reviewer reads it, not the button press.
 */
const REASONS = [
  "Working standard quantity to be corrected",
  "Chemical lot number incorrect",
  "Instrument usage entry missing in LIMS",
  "Sample weight mismatch — verify weight slips",
] as const;

export function RecheckDialog({
  open,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);

  if (!open) return null;

  const applyTemplate = (text: string) => {
    setReason(text);
    const element = field.current;
    if (!element) return;
    element.focus();
    window.requestAnimationFrame(() => {
      element.selectionStart = element.selectionEnd = element.value.length;
    });
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-7 shadow-2xl">
        <h2 className="mb-1.5 text-base font-bold text-slate-900">
          Request Recheck
        </h2>
        <p className="mb-4 text-[13px] leading-relaxed text-source-text">
          The batch returns to the lab for correction. What you write here is
          what the next reviewer will see.
        </p>

        <label
          htmlFor="recheck-reason"
          className="mb-2 block text-xs font-semibold text-slate-700"
        >
          Reason for recheck (required) <span className="text-flagged-text">*</span>
        </label>

        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {REASONS.map((template) => (
            <button
              key={template}
              type="button"
              onClick={() => applyTemplate(template)}
              aria-pressed={reason === template}
              className={cn(
                "cursor-pointer rounded-full border px-2.5 py-[3px] text-[11px] transition-colors duration-150",
                "focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 focus-visible:outline-none",
                reason === template
                  ? "border-navy-accent bg-blue-50 font-medium text-navy"
                  : "border-slate-300 bg-white text-source-text hover:border-navy-accent hover:text-navy",
              )}
            >
              {template}
            </button>
          ))}
          <button
            type="button"
            onClick={() => applyTemplate("")}
            className="cursor-pointer rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-[3px] text-[11px] text-source-text transition-colors duration-150 hover:border-navy-accent hover:text-navy focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 focus-visible:outline-none"
          >
            Custom reason
          </button>
        </div>

        <textarea
          id="recheck-reason"
          ref={field}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Say what has to be corrected before this comes back..."
          className="h-24 w-full resize-none rounded-[5px] border border-slate-200 p-2.5 text-[13px] outline-none focus:border-navy-accent focus:ring-3 focus:ring-navy-accent/10"
        />

        <div className="mt-3.5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-[13px] text-source-text transition-colors duration-150 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!reason.trim()}
            onClick={() => reason.trim() && onSubmit(reason.trim())}
            className={cn(
              "rounded-md px-5 py-2 text-[13px] font-semibold transition-colors duration-150",
              reason.trim()
                ? "cursor-pointer bg-navy text-white hover:bg-navy-mid"
                : "cursor-not-allowed bg-slate-200 text-slate-400 opacity-40",
            )}
          >
            Submit Recheck Request
          </button>
        </div>
      </div>
    </div>
  );
}
