"use client";

import { PROFILES } from "@/data/profiles";
import { useReview } from "@/context/ReviewContext";
import { SearchIcon } from "./Icons";

/**
 * The v3 top bar.
 *
 * Falls back to the reviewer profile when none has been selected: this screen
 * is reachable directly during the rebuild, and a header with an empty name
 * on it would read as a bug rather than as an unauthenticated state.
 */
export function V3Topbar({
  user,
  search = true,
}: {
  /**
   * Who the bar names. Given where the screen speaks for one office rather
   * than for whoever happens to be signed in.
   */
  user?: {
    name: string;
    roleLabel: string;
    initials: string;
    avatarColour: string;
  };
  /** The AR search. Off on screens that are not about a single batch. */
  search?: boolean;
} = {}) {
  const { profile } = useReview();
  const signedIn = profile ?? PROFILES[0];
  const who = user ?? {
    name: signedIn.name,
    roleLabel: signedIn.roleLabel,
    initials: signedIn.initials,
    avatarColour: "var(--v3-aira)",
  };

  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-[var(--v3-border-default)] bg-[var(--v3-bg-surface)] px-6">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-[16px] leading-none font-bold text-[var(--v3-text-primary)]">
            QRA
          </div>
          <div className="mt-[3px] text-[8px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
            Quality Review Assistant
          </div>
        </div>

        {search ? (
          <>
            <div className="h-5 w-px shrink-0 bg-[var(--v3-border-strong)]" />

            <div className="relative w-[360px]">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--v3-text-muted)]">
                <SearchIcon />
              </span>
              <input
                type="text"
                aria-label="Search AR number"
                placeholder="Search AR number e.g. 07-FP-26-0001"
                className="v3-search w-full rounded-[6px] border border-[var(--v3-border-strong)] bg-[var(--v3-bg-input)] py-2 pr-3 pl-9 text-[12px] text-[var(--v3-text-primary)] transition-colors duration-[120ms] outline-none"
              />
            </div>
          </>
        ) : (
          <div className="h-5 w-px shrink-0 bg-[var(--v3-border-strong)]" />
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <div className="text-right">
          <div className="text-[12px] font-semibold text-[var(--v3-text-primary)]">
            {who.name}
          </div>
          <div className="text-[10px] text-[var(--v3-text-secondary)]">
            {who.roleLabel}
          </div>
        </div>
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ background: who.avatarColour }}
        >
          {who.initials}
        </span>
        <span
          aria-hidden="true"
          className="text-[10px] text-[var(--v3-text-muted)]"
        >
          &#9662;
        </span>
      </div>
    </header>
  );
}
