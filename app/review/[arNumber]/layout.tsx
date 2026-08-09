"use client";

/**
 * Shell for every review screen — /tests, /workspace and /summary.
 *
 * Provides the persistent nav bar so the reviewer always knows where they are
 * and can always get back to the dashboard without side effects. The landing
 * page is outside this route group and keeps its own full-page layout.
 */

import { usePathname, useParams, useRouter } from "next/navigation";

import { getBatch } from "@/data/batches";
import { useReview } from "@/context/ReviewContext";

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ arNumber: string }>();
  const { getSession } = useReview();

  const batch = getBatch(params.arNumber);
  const session = batch ? getSession(batch.arNumber) : null;
  const test = batch?.tests.find((candidate) => candidate.id === session?.currentTestId);

  const segment = pathname.split("/").filter(Boolean).pop();

  const trail: string[] = [];
  if (batch) {
    trail.push(batch.product);
    if (segment === "workspace" && test) trail.push(test.name);
    if (segment === "summary") trail.push("Review Complete");
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-card px-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="font-heading text-sm font-semibold tracking-tight transition-colors hover:text-primary"
        >
          QRA
        </button>

        {batch ? (
          <>
            <span className="text-muted-foreground/50">/</span>
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2 truncate text-sm"
            >
              <span className="font-mono">{batch.arNumber}</span>
              {trail.map((crumb) => (
                <span key={crumb} className="flex items-center gap-2 text-muted-foreground">
                  <span aria-hidden>·</span>
                  <span>{crumb}</span>
                </span>
              ))}
            </nav>
          </>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
