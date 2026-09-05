"use client";

import { useSyncExternalStore } from "react";

import { PROFILES } from "@/data/profiles";
import { useReview } from "@/context/ReviewContext";
import {
  readV3Profile,
  serverV3Profile,
  subscribeToV3Profile,
} from "./profiles";
import { SearchIcon } from "./Icons";
import { DarkWordmark } from "./Wordmark";

/**
 * The v3 top bar.
 *
 * Falls back to the reviewer profile when none has been selected: this screen
 * is reachable directly during the rebuild, and a header with an empty name
 * on it would read as a bug rather than as an unauthenticated state.
 */
export function DarkTopbar({
  user,
  search = true,
  notice,
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
  /**
   * A standing caveat about the screen below — currently that its batch is a
   * stand-in. It sits in the bar rather than in the page because it qualifies
   * everything on the page, and it is worded as demo data rather than as an
   * error, which is what it is.
   */
  notice?: string;
} = {}) {
  const { profile } = useReview();

  /* sessionStorage does not exist on the server, so it is read through a
     store with an explicit server snapshot rather than during render. The
     server and the hydrating client both see null and draw the fallback
     below — the same person the selector offers first — and the real choice
     arrives once, without a mismatch to correct. */
  const chosen = useSyncExternalStore(
    subscribeToV3Profile,
    readV3Profile,
    serverV3Profile,
  );

  const signedIn = profile ?? PROFILES[0];

  /* The prop wins: a screen that speaks for one office says so outright, and
     must not be relabelled by whoever happens to have signed in. Then the v3
     selection, then the light app's context, then the reviewer. */
  const who = user ??
    chosen ?? {
      name: signedIn.name,
      roleLabel: signedIn.roleLabel,
      initials: signedIn.initials,
      avatarColour: "var(--v3-aira)",
    };

  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-[var(--v3-border-default)] bg-[var(--v3-bg-surface)] px-6">
      <div className="flex items-center gap-4">
        <div>
          <DarkWordmark className="text-[16px] leading-none font-bold" />
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

      {notice ? (
        <span
          role="status"
          className="mx-4 flex min-w-0 items-center gap-2 truncate rounded-[4px] border border-[var(--v3-advisory-border)] bg-[var(--v3-advisory-bg)] px-2.5 py-1 text-[10px] font-semibold tracking-[0.04em] text-[var(--v3-advisory)] uppercase"
        >
          {notice}
        </span>
      ) : null}

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
