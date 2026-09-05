"use client";

import { useRef, useState } from "react";

import { useReview } from "@/context/ReviewContext";
import { cn } from "@/lib/utils";

/**
 * The reviewer's observation, and the only thing that unlocks a section.
 *
 * Two entries ask for one. A flagged entry asks because NeuraTrace compared the
 * record against the criterion and the comparison failed. An entry needing
 * verification asks for the opposite reason: NeuraTrace could not make the
 * comparison at all, so the reviewer makes it against the worksheet and
 * records that they did. Same field, same gate, different colour — amber
 * reads as work outstanding, red as a finding.
 */
export type NoteTone = "flagged" | "unverified";

export function ReviewerNote({
  itemId,
  tone,
  heading,
  placeholder,
  prefill,
  templates,
}: {
  itemId: string;
  tone: NoteTone;
  heading: string;
  placeholder: string;
  /** Starting text the reviewer can edit. Not recorded until confirmed. */
  prefill?: string;
  templates?: readonly string[];
}) {
  const { noteFor, setNote, isNoted } = useReview();
  const [draft, setDraft] = useState(() => noteFor(itemId) || (prefill ?? ""));
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const flagged = tone === "flagged";
  const accent = flagged ? "text-flagged-text" : "text-warn-text";
  const rule = flagged ? "border-flagged-text/20" : "border-warn-text/25";

  const applyTemplate = (text: string) => {
    setDraft(text);
    const field = noteRef.current;
    if (!field) return;
    field.focus();
    /* Caret at the end, so the reviewer types on from the template. */
    window.requestAnimationFrame(() => {
      field.selectionStart = field.selectionEnd = field.value.length;
    });
  };

  const confirmed = isNoted(itemId);

  const confirm = () => {
    if (draft.trim()) setNote(itemId, draft.trim());
  };

  return (
    <div className={cn("border-t pt-3", rule)}>
      <div
        className={cn(
          "mb-2 text-[10px] font-semibold tracking-wider uppercase",
          accent,
        )}
      >
        {heading} <span className={accent}>*</span>
      </div>

      {confirmed ? (
        <div className="flex flex-wrap items-center gap-2.5 rounded-[5px] border border-compliant-text/30 bg-compliant-bg/50 px-3.5 py-2.5">
          <span className="flex-1 text-[13px] text-slate-700 italic">
            &ldquo;{noteFor(itemId)}&rdquo;
          </span>
          <span className="rounded bg-compliant-bg px-2 py-[2px] text-[11px] font-medium text-compliant-text">
            Noted
          </span>
        </div>
      ) : (
        <>
          {templates && templates.length > 0 ? (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {templates.map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  aria-pressed={draft === template}
                  className={cn(
                    "cursor-pointer rounded-full border px-2.5 py-[3px] text-[11px] transition-colors duration-150",
                    "focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 focus-visible:outline-none",
                    draft === template
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
                className={cn(
                  "cursor-pointer rounded-full border border-dashed px-2.5 py-[3px] text-[11px] transition-colors duration-150",
                  "focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 focus-visible:outline-none",
                  "border-slate-300 bg-white text-source-text hover:border-navy-accent hover:text-navy",
                )}
              >
                Custom note
              </button>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea
              ref={noteRef}
              rows={2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                /* Enter is a new line here; the button confirms, and so does
                   the shortcut for anyone working from the keyboard. */
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  confirm();
                }
              }}
              placeholder={placeholder}
              className="flex-1 resize-y rounded-[5px] border border-slate-200 bg-white px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-navy-accent focus:ring-3 focus:ring-navy-accent/10"
            />
            <button
              type="button"
              onClick={confirm}
              className="h-fit shrink-0 cursor-pointer rounded-[5px] bg-compliant-text px-3.5 py-2 text-xs font-medium text-white transition-opacity duration-150 hover:opacity-90"
            >
              Confirm
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * The starting text on an entry NeuraTrace could not conclude. It states the check
 * the reviewer is being asked to make, so an untouched field is never a
 * silent confirmation — they still have to press Confirm.
 */
export const VERIFICATION_PREFILL =
  "Manually verified against LIMS worksheet — quantity confirmed.";

export const VERIFICATION_PLACEHOLDER =
  "Confirm manual verification against LIMS worksheet...";
