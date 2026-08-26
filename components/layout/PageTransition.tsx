"use client";

import { usePathname } from "next/navigation";

/**
 * Fades each screen in on arrival. Keyed on the path so the animation runs on
 * every navigation rather than only on first mount — without the key, the
 * wrapper is never remounted and the transition would fire once per session.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-fadeIn flex min-h-full flex-1 flex-col">
      {children}
    </div>
  );
}
