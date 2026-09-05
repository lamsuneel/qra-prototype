import type { ItemResult } from "@/types";

/**
 * The v3 dark palette, as one block of CSS custom properties.
 *
 * Scoped to `.v3-root` rather than added to globals.css: the rest of the app
 * is still on the light theme, and a v3 screen must be able to sit beside it
 * without either one reaching into the other's colours.
 *
 * Values are the design's own tokens, unchanged.
 */
export const V3_THEME_CSS = `
.v3-root {
  /* next/font sets --v3-font-sans and --v3-font-mono on this element; the
     Tailwind tokens are pointed at them so font-sans and font-mono resolve to
     the v3 faces inside this subtree and the light app's Geist everywhere
     else. */
  font-family: var(--v3-font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-sans: var(--v3-font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--v3-font-mono), ui-monospace, monospace;

  --v3-bg-base: #0D0F1A;
  --v3-bg-surface: #111320;
  --v3-bg-card: #13151F;
  --v3-bg-card-hover: #181A28;
  --v3-bg-input: #0D0F1A;

  --v3-border-subtle: #161828;
  --v3-border-default: #1E2238;
  --v3-border-strong: #2A2D45;

  --v3-text-primary: #E8E9F0;
  --v3-text-secondary: #8B8FA8;
  --v3-text-muted: #4A4E6A;
  --v3-text-mono: #A8B0C8;

  --v3-blocking: #E5534B;
  --v3-blocking-bg: rgba(229, 83, 75, 0.12);
  --v3-blocking-border: rgba(229, 83, 75, 0.25);

  --v3-advisory: #E8A030;
  --v3-advisory-bg: rgba(232, 160, 48, 0.12);
  --v3-advisory-border: rgba(232, 160, 48, 0.25);

  --v3-compliant: #3DB87A;
  --v3-compliant-bg: rgba(61, 184, 122, 0.12);
  --v3-compliant-border: rgba(61, 184, 122, 0.25);

  --v3-aira: #7C5CFC;
  --v3-aira-bg: rgba(124, 92, 252, 0.10);
  --v3-aira-border: rgba(124, 92, 252, 0.20);
  /* AIRA's prose sits a long way off the brand purple on purpose: at 12px on
     a near-black ground the accent itself is unreadable, so the panel writes
     in a desaturated tint of it and keeps the accent for the name and rules. */
  --v3-aira-text: #9B93C8;
  --v3-aira-name: #8B82C4;

  /* A result that is not a result at all. Above blocking, and its own colour
     because the reviewer answers it with a PNC rather than an observation. */
  --v3-invalid: #FF6B6B;
  --v3-invalid-bg: rgba(123, 0, 0, 0.20);
  --v3-invalid-border: rgba(123, 0, 0, 0.35);

  --v3-blocking-glow: rgba(229, 83, 75, 0.35);

  /* The brand teal, flat. The mark and wordmark carry it as a gradient
     (#9af7e8 -> #19d9d0 -> #00a9c7); this is that gradient's middle, for
     anywhere a single value is needed. Brand, not status — it never carries
     a verdict, so it sits apart from the tones above. */
  --v3-brand: #19d9d0;

  --v3-accent: #4D9EFF;
  --v3-accent-bg: rgba(77, 158, 255, 0.12);
  --v3-accent-border: rgba(77, 158, 255, 0.25);
}

.v3-root ::placeholder {
  color: #6B7090;
}

.v3-search:focus {
  border-color: rgba(77, 158, 255, 0.4);
}

.v3-field:focus {
  border-color: rgba(124, 92, 252, 0.35);
}

.v3-ask:focus {
  border-color: rgba(124, 92, 252, 0.45);
}

/* The one node on the journey map that stops the batch. It pulses because a
   12px dot in a row of thirty is otherwise found by reading, not by looking. */
@keyframes v3-pulse {
  0%,
  100% {
    box-shadow: 0 0 8px var(--v3-blocking-glow);
  }
  50% {
    box-shadow:
      0 0 16px var(--v3-blocking-glow),
      0 0 4px rgba(229, 83, 75, 0.5);
  }
}

.v3-flag-node {
  animation: v3-pulse 2s ease-in-out infinite;
}

/* AIRA's own pulse. The flag node's is a glow on a red dot; this one is a
   7px lamp beside a heading, where a box-shadow would read as a smudge. */
@keyframes v3-aira-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.3);
  }
}

.v3-aira-dot {
  animation: v3-aira-pulse 2s ease-in-out infinite;
}

/* The profile cards arrive rather than appear. Three is few enough that a
   stagger reads as a sequence instead of as a wait. */
@keyframes v3-fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.v3-fade-up {
  opacity: 0;
  animation: v3-fade-up 300ms ease forwards;
}

/* The panels scroll against a dark ground, and the platform draws its bar
   for a light one. Thin, and only as present as it needs to be. */
.v3-root * {
  scrollbar-width: thin;
  scrollbar-color: var(--v3-border-strong) transparent;
}
.v3-root *::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.v3-root *::-webkit-scrollbar-track {
  background: transparent;
}
.v3-root *::-webkit-scrollbar-thumb {
  background: var(--v3-border-strong);
  border-radius: 4px;
}
.v3-root *::-webkit-scrollbar-thumb:hover {
  background: #3a3e5c;
}

@media (prefers-reduced-motion: reduce) {
  .v3-root *,
  .v3-flag-node {
    animation: none !important;
    transition: none !important;
  }

  /* The rule above cancels the animation that would have ended at opacity 1,
     so the starting opacity has to be undone by hand or the cards never
     become visible at all. */
  .v3-fade-up {
    opacity: 1;
  }
}
`;

/** The three severity tones, as the colour variable each one paints with. */
export const V3_TONE = {
  invalid: "var(--v3-invalid)",
  blocking: "var(--v3-blocking)",
  advisory: "var(--v3-advisory)",
  compliant: "var(--v3-compliant)",
  muted: "var(--v3-text-muted)",
} as const;

export type V3Tone = keyof typeof V3_TONE;

/** SLA status to tone. Red blocks, amber warns, green is clear. */
export const V3_SLA_TONE: Record<"red" | "amber" | "green", V3Tone> = {
  red: "blocking",
  amber: "advisory",
  green: "compliant",
};

/**
 * What each review verdict is painted as.
 *
 * `resultFor` already decides what an entry is; this only says what colour
 * that is, so the journey map, the badges and the counts can never disagree
 * about an entry's state.
 */
export const V3_RESULT_TONE: Record<ItemResult, V3Tone> = {
  HARD_INVALID: "invalid",
  FLAGGED: "blocking",
  NEEDS_VERIFICATION: "advisory",
  CONDITIONAL_PASS: "advisory",
  COMPLIANT: "compliant",
};

/** The word a verdict goes by on screen. */
export const V3_RESULT_LABEL: Record<ItemResult, string> = {
  HARD_INVALID: "Not usable",
  FLAGGED: "Blocking",
  NEEDS_VERIFICATION: "Advisory",
  CONDITIONAL_PASS: "Advisory",
  COMPLIANT: "Compliant",
};
