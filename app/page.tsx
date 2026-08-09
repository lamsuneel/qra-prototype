"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, PauseCircle, Search } from "lucide-react";

import { BATCHES, getBatch, type Batch } from "@/data/batches";
import { useReview, type SessionStatus } from "@/context/ReviewContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** The seed status on the batch, before any session exists. */
type SeedStatus = Batch["sessionStatus"];

type CardStatus = SessionStatus | SeedStatus;

type CardAction = "summary" | "resume" | "begin";

const STATUS_LABELS: Record<CardStatus, string> = {
  NotStarted: "New",
  New: "New",
  ContextBuilding: "In Progress",
  InProgress: "In Progress",
  Paused: "Paused",
  Completed: "Completed",
};

const STATUS_TONES: Record<CardStatus, string> = {
  NotStarted: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  New: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  ContextBuilding: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  InProgress: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  Paused: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  Completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

function actionFor(status: CardStatus): CardAction {
  if (status === "Completed") return "summary";
  if (status === "Paused") return "resume";
  return "begin";
}

/** "AR-2026-000121, AR-2026-000122, or AR-2026-000123" — derived, never typed. */
function listArNumbers(): string {
  const numbers = BATCHES.map((batch) => batch.arNumber);
  if (numbers.length < 2) return numbers.join("");
  return `${numbers.slice(0, -1).join(", ")}, or ${numbers[numbers.length - 1]}`;
}

export default function EntryPage() {
  const router = useRouter();
  const { getSession, startReview, resumeReview } = useReview();

  const [arInput, setArInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function openReview(arNumber: string, action: CardAction) {
    if (action === "summary") {
      router.push(`/review/${arNumber}/summary`);
      return;
    }

    if (action === "resume") {
      // Resume goes straight to the workspace at the paused position.
      resumeReview(arNumber);
      router.push(`/review/${arNumber}/workspace`);
      return;
    }

    startReview(arNumber);
    router.push(`/review/${arNumber}/tests`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const batch = getBatch(arInput);
    if (!batch) {
      setError(`AR Number not found. Try ${listArNumbers()}`);
      return;
    }

    setError(null);

    // A paused session resumes; anything else starts fresh at test parameters.
    const paused = getSession(batch.arNumber)?.status === "Paused";
    openReview(batch.arNumber, paused ? "resume" : "begin");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
        {/* Section 1 — AR number entry */}
        <Card className="[--card-spacing:--spacing(6)]">
          <CardHeader>
            <CardTitle className="text-2xl">QA Compliance Review</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter an AR Number to begin or resume a review
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={arInput}
                    onChange={(event) => setArInput(event.target.value)}
                    placeholder="e.g. AR-2026-000121"
                    aria-label="AR Number"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "ar-entry-error" : undefined}
                    autoComplete="off"
                    autoFocus
                    className="h-11 pl-9 font-mono tracking-tight"
                  />
                </div>
                <Button type="submit" size="lg" className="h-11 px-6">
                  Begin Review
                </Button>
              </div>

              {error ? (
                <p
                  id="ar-entry-error"
                  role="alert"
                  className="mt-3 text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>

        {/* Section 2 — Recent Reviews */}
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Recent Reviews
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {BATCHES.map((batch) => {
              const session = getSession(batch.arNumber);
              const status: CardStatus = session?.status ?? batch.sessionStatus;
              const action = actionFor(status);

              return (
                <Card key={batch.arNumber} className="justify-between">
                  <CardHeader className="gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-sm font-semibold tracking-tight">
                        {batch.arNumber}
                      </span>
                      <Badge variant="secondary" className={STATUS_TONES[status]}>
                        {STATUS_LABELS[status]}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{batch.product}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Submitted {batch.submittedAt}
                    </p>
                  </CardHeader>

                  <CardContent>
                    <Button
                      variant={action === "summary" ? "outline" : "default"}
                      className={cn(
                        "w-full",
                        action === "resume" &&
                          "bg-amber-600 text-white hover:bg-amber-600/85",
                      )}
                      onClick={() => openReview(batch.arNumber, action)}
                    >
                      {action === "summary" ? (
                        <>
                          <ClipboardCheck data-icon="inline-start" />
                          View Summary
                        </>
                      ) : action === "resume" ? (
                        <>
                          <PauseCircle data-icon="inline-start" />
                          Resume Review
                        </>
                      ) : (
                        "Begin Review"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      {/* Section 3 — Footer */}
      <footer className="px-6 pb-8 text-center text-xs text-muted-foreground">
        QRA · Compliance Intelligence · Read-only · QA retains final disposition
        authority
      </footer>
    </div>
  );
}
