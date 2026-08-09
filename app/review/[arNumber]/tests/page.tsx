"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, Check, ChevronLeft, ChevronRight } from "lucide-react";

import {
  applicableSections,
  getBatch,
  type TestParameter,
} from "@/data/batches";
import { useReview } from "@/context/ReviewContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SLA_TONES = {
  within: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
} as const;

const PROGRESS_TONES = {
  Complete: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  "Not Started": "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
} as const;

type ProgressLabel = keyof typeof PROGRESS_TONES;

/** Counts entries of a given status across the applicable sections of a test. */
function countEntries(test: TestParameter, status: "flagged" | "advisory"): number {
  return applicableSections(test).reduce(
    (total, section) =>
      total + section.actualEntries.filter((entry) => entry.status === status).length,
    0,
  );
}

export default function TestParametersPage() {
  const router = useRouter();
  const params = useParams<{ arNumber: string }>();
  const { getSession, getSlaStatus, getProgress, setCurrentTest } = useReview();

  const batch = getBatch(params.arNumber);
  const arNumber = batch?.arNumber ?? "";
  const session = batch ? getSession(batch.arNumber) : null;

  // No direct URL access — the reviewer must come through AR entry. Any live
  // session qualifies, including a completed one, so returning here after
  // Complete Review shows the record rather than silently bouncing home.
  const allowed = Boolean(batch && session);

  useEffect(() => {
    if (!allowed) router.replace("/");
  }, [allowed, router]);

  if (!batch || !allowed) return null;

  const sla = getSlaStatus(arNumber);

  function openTest(testId: string) {
    setCurrentTest(arNumber, testId);
    router.push(`/review/${arNumber}/workspace`);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
        <header className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 w-fit text-muted-foreground"
            onClick={() => router.push("/")}
          >
            <ChevronLeft data-icon="inline-start" />
            Home
          </Button>

          <h1 className="font-heading text-2xl font-medium">
            <span className="font-mono">{batch.arNumber}</span>
            <span className="text-muted-foreground"> · {batch.product}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Batch <span className="font-mono">{batch.batchNumber}</span> · Analyst{" "}
            {batch.analyst} · Submitted {batch.submittedAt}
          </p>

          {sla ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Review due: {sla.dueDate}</span>
              <span>·</span>
              <Badge variant="secondary" className={SLA_TONES[sla.status]}>
                {sla.status === "overdue" ? "OVERDUE" : "Within SLA"}
              </Badge>
              <span>{sla.detail}</span>
            </div>
          ) : null}
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Test Parameters
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batch.tests.map((test) => {
              const flagged = countEntries(test, "flagged");
              const advisory = countEntries(test, "advisory");
              const progress = getProgress(arNumber, test.id);

              const label: ProgressLabel =
                progress.reviewed === 0
                  ? "Not Started"
                  : progress.reviewed === progress.total
                    ? "Complete"
                    : "In Progress";

              return (
                <Card
                  key={test.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openTest(test.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openTest(test.id);
                    }
                  }}
                  className="cursor-pointer justify-between transition-all hover:ring-2 hover:ring-primary/30"
                >
                  <CardHeader className="gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{test.name}</CardTitle>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {test.methodType}
                    </Badge>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {flagged > 0 ? (
                        <Badge
                          variant="secondary"
                          className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        >
                          {flagged} {flagged === 1 ? "exception" : "exceptions"}
                        </Badge>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400">
                          <Check className="size-4" />
                          No exceptions
                        </span>
                      )}

                      {advisory > 0 ? (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                        >
                          <AlertTriangle className="size-3" />
                          {advisory} advisory
                        </Badge>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className={cn(PROGRESS_TONES[label])}>
                        {label}
                      </Badge>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {progress.reviewed} / {progress.total} sections
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            In production, tests are extracted from LIMS at AR entry. Representative
            data used in V2.
          </p>
        </section>
      </main>

      <footer className="px-6 pb-8 text-center text-xs text-muted-foreground">
        QRA · Compliance Intelligence · Read-only · QA retains final disposition
        authority
      </footer>
    </div>
  );
}
