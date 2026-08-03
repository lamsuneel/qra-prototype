"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { getBatch, REVIEWER, type RuleResult } from "@/data/batches";
import { useReview } from "@/context/ReviewContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export default function SummaryPage() {
  const router = useRouter();
  const params = useParams<{ arNumber: string }>();
  const { getSession, getFindingState, getProgress, getDuration, completeReview } =
    useReview();

  const batch = getBatch(params.arNumber);
  const arNumber = batch?.arNumber ?? "";

  useEffect(() => {
    if (!batch) router.replace("/");
  }, [batch, router]);

  useEffect(() => {
    if (!batch) return;

    // Guarded rather than unconditional: completeReview stamps lastActiveTime,
    // so re-running it on a revisit would rewrite the completion time and
    // stretch the recorded duration.
    const session = getSession(batch.arNumber);
    if (session && session.status !== "Completed") {
      completeReview(batch.arNumber);
    }
  }, [batch, getSession, completeReview]);

  if (!batch) return null;

  const session = getSession(arNumber);
  const progress = getProgress(arNumber);
  const duration = getDuration(arNumber);
  const notes = session?.reviewerNotes.trim() ?? "";

  const findings = batch.results.filter((result) => result.outcome === "Finding");

  const tally = (severity: RuleResult["severity"]) => {
    const matching = findings.filter((result) => result.severity === severity);
    const states = matching.map((result) => getFindingState(arNumber, result.ruleId));
    return {
      total: matching.length,
      acknowledged: states.filter((state) => state === "Acknowledged").length,
      escalated: states.filter((state) => state === "Escalated").length,
    };
  };

  const critical = tally("Critical");
  const major = tally("Major");
  const minor = tally("Minor");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-14">
        {/* Header */}
        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-medium">Review Complete</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{batch.arNumber}</span> · {batch.product}
          </p>
        </header>

        {/* Details */}
        <section className="grid grid-cols-2 gap-4 rounded-xl border px-5 py-4 sm:grid-cols-4">
          <DetailItem label="Reviewer" value={REVIEWER} />
          <DetailItem label="Completed" value={session?.lastActiveTime ?? "—"} />
          <DetailItem label="Duration" value={duration?.label ?? "—"} />
          <DetailItem label="Test Type" value={batch.testType} />
        </section>

        {/* Findings */}
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-base font-medium">Findings</h2>

          <div className="flex flex-col gap-2 rounded-xl border px-5 py-4 text-sm">
            {findings.length === 0 ? (
              <p className="text-muted-foreground">No compliance exceptions found</p>
            ) : (
              <>
                {critical.total > 0 ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-red-700 dark:text-red-400">
                      Critical Findings
                    </span>
                    <span className="tabular-nums">
                      {critical.total} ({critical.acknowledged} Acknowledged
                      {critical.escalated > 0
                        ? ` · ${critical.escalated} Escalated`
                        : ""}
                      )
                    </span>
                  </div>
                ) : null}

                {major.total > 0 ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-amber-700 dark:text-amber-400">
                      Major Findings
                    </span>
                    <span className="tabular-nums">
                      {major.total} ({major.acknowledged} Acknowledged ·{" "}
                      {major.escalated} Escalated)
                    </span>
                  </div>
                ) : null}

                {minor.total > 0 ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Minor Findings</span>
                    <span className="tabular-nums">
                      {minor.total} ({minor.acknowledged} Acknowledged ·{" "}
                      {minor.escalated} Escalated)
                    </span>
                  </div>
                ) : null}

                <Separator className="my-1" />
              </>
            )}

            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Compliant Rules</span>
              <span className="tabular-nums">{progress.compliant}</span>
            </div>
          </div>
        </section>

        {/* Reviewer notes */}
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-base font-medium">Reviewer Notes</h2>

          {notes ? (
            <div className="rounded-xl border bg-muted/40 px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap">
              {notes}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No notes recorded during this review.
            </p>
          )}
        </section>

        {/* QA disposition — label only. No button, no action. */}
        <section className="rounded-xl border bg-muted/50 px-5 py-4">
          <h2 className="font-heading text-base font-medium">QA Disposition</h2>
          <p className="mt-2 text-sm">Record the batch disposition in Caliber LIMS.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This review does not constitute batch approval or release.
          </p>
        </section>

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.push("/")}>
            Return to Home
          </Button>
        </div>
      </main>

      <footer className="px-6 pb-8 text-center text-xs text-muted-foreground">
        QRA · Compliance Intelligence · Read-only · QA retains final disposition
        authority
      </footer>
    </div>
  );
}
