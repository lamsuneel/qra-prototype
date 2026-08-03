"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2 } from "lucide-react";

import { getBatch } from "@/data/batches";
import { useReview } from "@/context/ReviewContext";
import { cn } from "@/lib/utils";

/** Gap between each entity appearing. Mandatory — this must not feel instant. */
const STEP_MS = 400;

/** Hold on "Building Review Context..." before the workspace opens. */
const HOLD_MS = 1000;

export default function AssemblingPage() {
  const router = useRouter();
  const params = useParams<{ arNumber: string }>();
  const { startReview, setStatus } = useReview();

  const arNumber = params.arNumber;
  const batch = getBatch(arNumber);

  const [revealed, setRevealed] = useState(0);
  const [building, setBuilding] = useState(false);

  // Unknown AR number — nothing to assemble, and startReview is never called.
  useEffect(() => {
    if (!batch) router.replace("/");
  }, [batch, router]);

  useEffect(() => {
    if (!batch) return;

    startReview(batch.arNumber);

    const timers: ReturnType<typeof setTimeout>[] = [];

    batch.assembly.forEach((_, index) => {
      timers.push(
        setTimeout(() => setRevealed(index + 1), (index + 1) * STEP_MS),
      );
    });

    const assembled = batch.assembly.length * STEP_MS;

    timers.push(
      setTimeout(() => {
        setBuilding(true);
        setStatus(batch.arNumber, "ReadyForReview");
      }, assembled),
    );

    timers.push(
      setTimeout(() => {
        // replace, not push — the back button must not re-run the animation.
        router.replace(`/review/${batch.arNumber}/workspace`);
      }, assembled + HOLD_MS),
    );

    return () => timers.forEach(clearTimeout);
  }, [batch, router, startReview, setStatus]);

  if (!batch) return null;

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <ul className="flex flex-col gap-3">
          {batch.assembly.map((step, index) => {
            const isVisible = index < revealed;
            const isWarning = step.state === "warning";

            return (
              <li
                key={step.label}
                aria-hidden={!isVisible}
                className={cn(
                  "flex items-start gap-3 text-sm transition-all duration-300 ease-out",
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-1 opacity-0",
                )}
              >
                {isWarning ? (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                )}

                <span
                  className={cn(
                    isWarning && "text-amber-700 dark:text-amber-300",
                  )}
                >
                  <span className="text-muted-foreground">{step.label}</span>
                  <span className="mx-1.5 text-muted-foreground">—</span>
                  <span className="font-mono text-[0.8rem] tracking-tight">
                    {step.value}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>

        <div
          aria-live="polite"
          className={cn(
            "mt-8 flex items-center gap-2 text-sm text-muted-foreground transition-opacity duration-300",
            building ? "opacity-100" : "opacity-0",
          )}
        >
          <Loader2 className="size-4 animate-spin" />
          Building Review Context...
        </div>
      </div>
    </main>
  );
}
