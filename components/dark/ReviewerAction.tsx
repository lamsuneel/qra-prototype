"use client";

import { useRef } from "react";

import { LockIcon } from "./Icons";

/**
 * The templates the light workspace offers, kept word for word.
 *
 * Two screens offering the same three phrases in different words would put
 * two different sentences into the same audit record.
 */
export const V3_NOTE_TEMPLATES = [
  "Reviewed — found satisfactory",
  "Exception noted — investigation initiated",
  "Deviation raised",
] as const;

/**
 * The reviewer's observation, and the only thing that resolves a finding.
 *
 * The field starts empty. A pre-filled note is a note somebody else wrote,
 * and the record has to say what the reviewer decided — templates and AIRA's
 * draft are both offered, but both have to be chosen.
 */
export function V3ReviewerAction({
  value,
  onChange,
  placeholder,
  required,
  recorded,
  onRecord,
  onSaveDraft,
  saved,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  /** Flagged and unverified entries cannot be closed without one. */
  required: boolean;
  recorded: boolean;
  onRecord: () => void;
  onSaveDraft: () => void;
  saved: boolean;
}) {
  const field = useRef<HTMLTextAreaElement>(null);

  const applyTemplate = (text: string) => {
    onChange(text);
    const node = field.current;
    if (!node) return;
    node.focus();
    /* Caret at the end, so the reviewer types on from the template. */
    window.requestAnimationFrame(() => {
      node.selectionStart = node.selectionEnd = node.value.length;
    });
  };

  return (
    <section aria-label="Reviewer action">
      <div className="text-[13px] font-semibold text-[var(--v3-text-primary)]">
        Reviewer action
      </div>
      <div className="mt-1 mb-2.5 text-[11px] text-[var(--v3-text-secondary)]">
        Observation note {required ? "*" : "(optional)"}
      </div>

      <div className="mb-2.5 flex flex-wrap gap-1.5">
        {V3_NOTE_TEMPLATES.map((template) => (
          <button
            key={template}
            type="button"
            onClick={() => applyTemplate(template)}
            className={`cursor-pointer rounded-[4px] border px-2.5 py-1 text-[10px] whitespace-nowrap transition-colors duration-[120ms] ${
              value === template
                ? "border-[var(--v3-accent-border)] bg-[var(--v3-accent-bg)] text-[var(--v3-accent)]"
                : "border-[var(--v3-border-strong)] bg-[var(--v3-bg-surface)] text-[var(--v3-text-secondary)] hover:bg-[var(--v3-bg-card-hover)] hover:text-[var(--v3-text-primary)]"
            }`}
          >
            {template}
          </button>
        ))}
      </div>

      <textarea
        ref={field}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Reviewer observation"
        className="v3-field min-h-[80px] w-full resize-y rounded-[6px] border border-[var(--v3-border-strong)] bg-[var(--v3-bg-input)] px-3 py-2.5 text-[12px] leading-[1.6] text-[var(--v3-text-primary)] transition-colors duration-[120ms] outline-none"
      />

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onSaveDraft}
          className="cursor-pointer rounded-[6px] border border-[var(--v3-border-strong)] px-4 py-1.5 text-[11px] text-[var(--v3-text-secondary)] transition-colors duration-[120ms] hover:text-[var(--v3-text-primary)]"
        >
          {saved ? "Draft saved" : "Save draft"}
        </button>
        <button
          type="button"
          onClick={onRecord}
          disabled={!value.trim() || recorded}
          className="cursor-pointer rounded-[6px] border border-[var(--v3-accent-border)] bg-[var(--v3-accent-bg)] px-4 py-1.5 text-[11px] font-semibold text-[var(--v3-accent)] transition-colors duration-[120ms] hover:bg-[rgba(77,158,255,0.20)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {recorded ? "Observation recorded" : "Record observation"}
        </button>
      </div>

      {required && !recorded ? (
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-[var(--v3-text-muted)]">
          <LockIcon size={11} />
          An observation is required before this finding can be resolved
        </div>
      ) : null}
    </section>
  );
}
