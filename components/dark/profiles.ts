/**
 * Who can sign in to a v3 screen.
 *
 * Kept here rather than read from `data/profiles.ts` because the two lists
 * answer different questions. The light app's list is the demo's cast of
 * reviewers; this one is the set of desks the dark screens were drawn for,
 * and its three entries are deliberately not the same people. The quality
 * function cannot be headed by an analyst who runs the tests it reviews, so
 * the CQO and the GM-QA here are their own names, matching the identities
 * the /cqo and /operations screens already speak for.
 */
export interface V3Profile {
  id: string;
  name: string;
  initials: string;
  /** The role, as the card's second line. */
  role: string;
  /** What the role does here — the card's third line. */
  sub: string;
  /** The single line the top bar has room for. */
  roleLabel: string;
  badgeLabel: string;
  /**
   * The `data/profiles.ts` id this desk signs in as.
   *
   * The dark screens drill into light ones that have not been rebuilt yet —
   * the batch pages, the authorisation queue — and those read ReviewContext,
   * not this module. Selecting a profile has to satisfy both or the first
   * drill-down bounces the reviewer back to the selector.
   */
  legacyId: string;
  /**
   * The screen this desk opens on.
   *
   * Every profile used to land on the analyst's dashboard, so the CQO and the
   * GM-QA signed in and were handed somebody else's screen. Their own were
   * built and reachable by URL, just never routed to.
   */
  home: string;
  /** Colour variables rather than hex: the palette lives in theme.ts. */
  avatarColour: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const V3_PROFILES: V3Profile[] = [
  {
    id: "arjun-mehta",
    name: "Arjun Mehta",
    initials: "AM",
    role: "QA Analyst",
    sub: "Reviewer",
    roleLabel: "QA Analyst · Reviewer",
    badgeLabel: "QA Analyst",
    legacyId: "arjun-mehta",
    home: "/dashboard",
    avatarColour: "var(--v3-aira)",
    badgeBg: "var(--v3-aira-bg)",
    badgeBorder: "var(--v3-aira-border)",
    badgeText: "var(--v3-aira-name)",
  },
  {
    id: "sunita-rao",
    name: "Dr. Sunita Rao",
    initials: "SR",
    role: "Chief Quality Officer",
    sub: "CQO",
    roleLabel: "Chief Quality Officer",
    badgeLabel: "CQO",
    legacyId: "cqo",
    home: "/cqo",
    avatarColour: "var(--v3-blocking)",
    badgeBg: "var(--v3-blocking-bg)",
    badgeBorder: "var(--v3-blocking-border)",
    badgeText: "var(--v3-blocking)",
  },
  {
    id: "rajesh-reddy",
    name: "Rajesh Reddy",
    initials: "RR",
    role: "GM - Quality Assurance",
    sub: "Approver",
    roleLabel: "GM - Quality Assurance",
    badgeLabel: "GM-QA",
    legacyId: "rajesh-kumar",
    home: "/operations",
    avatarColour: "var(--v3-advisory)",
    badgeBg: "var(--v3-advisory-bg)",
    badgeBorder: "var(--v3-advisory-border)",
    badgeText: "var(--v3-advisory)",
  },
];

/** Where the choice is kept. Session, not local: closing the tab signs out. */
export const QRA_PROFILE_KEY = "qra_profile";

/**
 * The selection, or null.
 *
 * Every path out is null rather than a throw: sessionStorage is unavailable
 * on the server and can throw outright in a browser with site data blocked,
 * and a top bar is not worth failing a page over.
 */
export function readV3Profile(): V3Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(QRA_PROFILE_KEY);
    if (!raw) return null;
    const id = (JSON.parse(raw) as { id?: unknown }).id;
    if (typeof id !== "string") return null;
    /* Resolved by id rather than trusted whole, so a stale shape written by
       an older build cannot put half a profile in the header. */
    return V3_PROFILES.find((profile) => profile.id === id) ?? null;
  } catch {
    return null;
  }
}

/**
 * The two halves `useSyncExternalStore` needs around `readV3Profile`.
 *
 * Nothing writes to the key while a v3 screen is mounted — the selector
 * navigates away the moment it writes — so there is no change to subscribe
 * to, and the server has no storage to read at all. Going through the store
 * rather than an effect keeps the server and the hydrating client agreeing on
 * the same snapshot instead of correcting one into the other afterwards.
 *
 * `readV3Profile` is safe as a snapshot because it returns an element of
 * `V3_PROFILES`, so repeated calls hand back the same object, not a new one.
 */
export const subscribeToV3Profile = (): (() => void) => () => {};

export const serverV3Profile = (): V3Profile | null => null;

export function storeV3Profile(profile: V3Profile): void {
  try {
    window.sessionStorage.setItem(
      QRA_PROFILE_KEY,
      JSON.stringify({ id: profile.id, name: profile.name }),
    );
  } catch {
    /* Storage refused. The choice still routes; only its memory is lost. */
  }
}
