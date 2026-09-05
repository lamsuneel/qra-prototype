import type { V3Tone } from "./theme";

const TONE_CLASS: Record<V3Tone, string> = {
  invalid:
    "bg-[var(--v3-invalid-bg)] border-[var(--v3-invalid-border)] text-[var(--v3-invalid)]",
  blocking:
    "bg-[var(--v3-blocking-bg)] border-[var(--v3-blocking-border)] text-[var(--v3-blocking)]",
  advisory:
    "bg-[var(--v3-advisory-bg)] border-[var(--v3-advisory-border)] text-[var(--v3-advisory)]",
  compliant:
    "bg-[var(--v3-compliant-bg)] border-[var(--v3-compliant-border)] text-[var(--v3-compliant)]",
  muted:
    "bg-[var(--v3-border-strong)] border-transparent text-[var(--v3-text-muted)]",
};

/**
 * A status pill. Tone carries the meaning, so the same words never appear in
 * two different colours on one screen.
 */
export function V3Badge({
  tone,
  children,
}: {
  tone: V3Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-[4px] border px-2 py-[2px] text-[9px] font-bold tracking-[0.05em] whitespace-nowrap uppercase ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}

/** Which domain a row belongs to — a label, not a status, so it stays grey. */
export function V3DomainBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-[4px] border border-[var(--v3-border-strong)] bg-[var(--v3-bg-surface)] px-2 py-[2px] text-[9px] font-medium whitespace-nowrap text-[var(--v3-text-secondary)] uppercase">
      {children}
    </span>
  );
}
