"use client";

import { useRouter } from "next/navigation";

import type { UserRole } from "@/types";

export interface Crumb {
  label: string;
  /** Omitted on the current page — the last crumb is never a link. */
  href?: string;
}

/** Where "home" is depends on which screen the role lands on at sign-in. */
export const roleRoot = (role: UserRole): Crumb =>
  role === "REVIEWER"
    ? { label: "QA Dashboard", href: "/legacy/dashboard" }
    : role === "APPROVER"
      ? { label: "QA Operations Dashboard", href: "/legacy/management/gm-qa" }
      : { label: "Batch Review Performance", href: "/legacy/management" };

/**
 * Sticky trail below the top navigation. Every screen below a dashboard shows
 * one, so the reviewer can always see how deep they are and step back out
 * without using the browser's back button.
 */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const router = useRouter();

  return (
    <nav
      aria-label="Breadcrumb"
      className="sticky top-0 z-20 flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-200 bg-white px-7 py-2.5 text-xs text-source-text"
    >
      {crumbs.map((crumb, index) => {
        const last = index === crumbs.length - 1;

        return (
          <span
            key={`${crumb.label}-${index}`}
            className="flex items-center gap-x-2"
          >
            {crumb.href && !last ? (
              <button
                type="button"
                onClick={() => router.push(crumb.href as string)}
                className="cursor-pointer text-source-text transition-colors duration-150 hover:text-navy hover:underline"
              >
                {crumb.label}
              </button>
            ) : (
              <span className={last ? "text-slate-400" : undefined}>
                {crumb.label}
              </span>
            )}
            {last ? null : <span className="text-slate-300">&gt;</span>}
          </span>
        );
      })}
    </nav>
  );
}
