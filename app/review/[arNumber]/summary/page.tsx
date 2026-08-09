"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, Home } from "lucide-react";

import {
  getBatch,
  REVIEWER,
  SECTION_LABELS,
  sectionRecordLabel,
  type Entry,
  type Section,
} from "@/data/batches";
import { useReview } from "@/context/ReviewContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Labels and tones                                                           */
/* -------------------------------------------------------------------------- */

const LABEL_TONES: Record<string, string> = {
  CRITICAL: "text-red-700 dark:text-red-400",
  EXCEPTION: "text-red-700 dark:text-red-400",
  "NEEDS VERIFICATION": "text-amber-700 dark:text-amber-400",
  ADVISORY: "text-amber-700 dark:text-amber-400",
  COMPLIANT: "text-emerald-700 dark:text-emerald-400",
  "N/A": "text-muted-foreground",
};

const SLA_TONES = {
  within: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
} as const;

function truncate(value: string, max = 60): string {
  const clean = value.trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** One-line detail beside the record label. */
function sectionDetail(section: Section): string {
  const label = sectionRecordLabel(section);
  if (label === "COMPLIANT") return "";
  if (!section.applicable) return truncate(section.naReason ?? "");
  if (section.recordNote) return truncate(section.recordNote);

  const flagged = section.actualEntries.find((entry) => entry.status === "flagged");
  if (flagged?.finding) return truncate(flagged.finding);
  const advisory = section.actualEntries.find((entry) => entry.status === "advisory");
  return advisory?.advisory ? truncate(advisory.advisory) : "";
}

/**
 * Compact statement of what was verified in a compliant section, built from
 * the batch data rather than fixed strings.
 */
function compliantSummary(section: Section): string {
  const entries = section.actualEntries;
  if (entries.length === 0) return "Nothing recorded.";

  switch (section.type) {
    case "chemicals":
      return `${entries.length} ${entries.length === 1 ? "chemical" : "chemicals"} verified — all in specification`;

    case "chromatographySystem":
      return entries
        .map((entry) => `${entry.label} — ${entry.details.Status ?? "Active"}`)
        .join(" · ");

    case "standards":
      return entries
        .map((entry) => {
          const id =
            entry.details["Working Standard"] ??
            entry.details["Reference Standard"] ??
            entry.details["Water Standard"] ??
            entry.label;
          return `${id} ${entry.details.Status ?? ""}`.trim();
        })
        .join(" · ");

    case "instruments":
      return `${entries.length} ${entries.length === 1 ? "instrument" : "instruments"} — all active and calibrated`;

    case "column":
      // SST parameters now; the column context line carries the usage counts.
      return [
        section.contextSummary,
        entries
          .map((entry) => `${entry.label} ${entry.details.Actual ?? ""}`.trim())
          .join(" · "),
      ]
        .filter(Boolean)
        .join(" — ");
  }
}

function DetailGrid({ entry }: { entry: Entry }) {
  return (
    <dl className="flex flex-col gap-1">
      {Object.entries(entry.details).map(([key, value]) => (
        <div key={key} className="grid grid-cols-[9rem_1fr] gap-2 text-xs">
          <dt className="text-muted-foreground">{key}</dt>
          <dd className="leading-relaxed">{value}</dd>
        </div>
      ))}
      <div className="grid grid-cols-[9rem_1fr] gap-2 text-xs">
        <dt className="text-muted-foreground">Source</dt>
        <dd className="leading-relaxed">{entry.sourceLabel}</dd>
      </div>
    </dl>
  );
}

/* -------------------------------------------------------------------------- */
/* Section row                                                                */
/* -------------------------------------------------------------------------- */

function SectionRow({ section }: { section: Section }) {
  const label = sectionRecordLabel(section);
  const detail = sectionDetail(section);

  const flagged = section.actualEntries.find((entry) => entry.status === "flagged");
  const advisory = section.actualEntries.find((entry) => entry.status === "advisory");
  const highlighted = flagged ?? advisory;

  return (
    <div className="flex flex-col gap-1.5 py-1.5">
      <div className="grid grid-cols-[11rem_9rem_1fr] items-baseline gap-2 text-sm">
        <span className="text-muted-foreground">{SECTION_LABELS[section.type]}</span>
        <span className={cn("font-medium", LABEL_TONES[label])}>[{label}]</span>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </div>

      {/* Exceptions, criticals, needs-verification and advisories open by
          default — the reviewer should never have to hunt for a finding. */}
      {highlighted ? (
        <div
          className={cn(
            "ml-[11rem] flex flex-col gap-2 rounded-lg border px-3 py-2.5",
            flagged
              ? "border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30"
              : "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30",
          )}
        >
          <p className="text-xs font-medium">
            {flagged ? "Finding" : "Advisory"}
          </p>
          <p className="text-xs leading-relaxed">
            {flagged ? flagged.finding : advisory?.advisory}
          </p>

          <DetailGrid entry={highlighted} />

          {flagged?.action ? (
            <>
              <p className="text-xs font-medium">Action required</p>
              <p className="text-xs leading-relaxed">{flagged.action}</p>
            </>
          ) : null}
        </div>
      ) : label === "COMPLIANT" ? (
        <Collapsible className="ml-[11rem]">
          <CollapsibleTrigger className="group/row flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ChevronDown className="size-3.5 transition-transform group-data-[panel-open]/row:rotate-180" />
            Show details
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1.5 rounded-lg border bg-muted/40 px-3 py-2 text-xs leading-relaxed">
            {compliantSummary(section)}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function DigitalReviewRecordPage() {
  const router = useRouter();
  const params = useParams<{ arNumber: string }>();
  const { getSession, getSlaStatus, startReview, completeReview } = useReview();

  const batch = getBatch(params.arNumber);

  useEffect(() => {
    if (!batch) router.replace("/");
  }, [batch, router]);

  useEffect(() => {
    if (!batch) return;
    const session = getSession(batch.arNumber);

    // Reached by direct URL with no session — create one so the record always
    // carries a real completion timestamp rather than a placeholder.
    if (!session) {
      startReview(batch.arNumber);
      completeReview(batch.arNumber);
      return;
    }

    // Guarded: completeReview stamps lastActiveTime, so re-running it on a
    // revisit would rewrite the recorded completion time.
    if (session.status !== "Completed") completeReview(batch.arNumber);
  }, [batch, getSession, startReview, completeReview]);

  if (!batch) return null;

  const session = getSession(batch.arNumber);
  const sla = getSlaStatus(batch.arNumber);
  const notes = session?.reviewerNotes.trim() ?? "";

  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground italic">
            DIGITAL REVIEW RECORD — PROTOTYPE DEMONSTRATION OUTPUT
          </p>
          <h1 className="font-heading text-3xl font-medium">Review Complete</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{batch.arNumber}</span> · {batch.product}
            <span className="block">
              Batch <span className="font-mono">{batch.batchNumber}</span>
            </span>
          </p>

          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-fit"
            onClick={() => router.push("/")}
          >
            <Home data-icon="inline-start" />
            Return to Home
          </Button>
        </header>

        {/* Details strip */}
        <section className="grid grid-cols-2 gap-4 rounded-xl border px-5 py-4 sm:grid-cols-5">
          <DetailItem label="Reviewer">{REVIEWER}</DetailItem>
          <DetailItem label="Analyst">{batch.analyst}</DetailItem>
          <DetailItem label="Completed">{session?.lastActiveTime ?? ""}</DetailItem>
          <DetailItem label="SLA Status">
            {sla ? (
              <Badge variant="secondary" className={SLA_TONES[sla.status]}>
                {sla.status === "overdue" ? "OVERDUE" : "Within SLA"}
              </Badge>
            ) : null}
          </DetailItem>
          <DetailItem label="Profile">{sla?.profileName ?? ""}</DetailItem>
        </section>

        {/* Test results */}
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-base font-medium">Test Results</h2>

          <div className="flex flex-col gap-5 rounded-xl border px-5 py-4">
            {batch.tests.map((test, index) => (
              <div key={test.id} className="flex flex-col gap-1">
                {index > 0 ? <Separator className="mb-3" /> : null}

                <div className="flex flex-wrap items-center gap-2 pb-1">
                  <h3 className="text-sm font-medium">{test.name}</h3>
                  <Badge variant="outline">{test.methodType}</Badge>
                </div>

                {test.sections.map((section) => (
                  <SectionRow key={section.type} section={section} />
                ))}
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Simulated LIMS data (Caliber LIMS in production)
          </p>
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

        <p className="text-xs text-muted-foreground italic">
          This output demonstrates the V2 prototype workflow only. The production MVP
          will map the review workflow to the applicable customer checklist, including
          the 17-item Analytical Data Review Checklist provided by Shrikrishna.
        </p>

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
