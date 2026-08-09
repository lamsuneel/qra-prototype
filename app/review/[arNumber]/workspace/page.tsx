"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  PauseCircle,
  X,
} from "lucide-react";

import {
  applicableSections,
  getBatch,
  SECTION_LABELS,
  type Entry,
  type Section,
  type SectionType,
} from "@/data/batches";
import { useReview } from "@/context/ReviewContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Tones                                                                      */
/* -------------------------------------------------------------------------- */

const SLA_TONES = {
  within: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
} as const;

const ENTRY_TONES: Record<Entry["status"], string> = {
  ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  flagged: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  advisory: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  na: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
};

const ENTRY_LABELS: Record<Entry["status"], string> = {
  ok: "OK",
  flagged: "FLAGGED",
  advisory: "ADVISORY",
  na: "N/A",
};

function EntryIcon({ status }: { status: Entry["status"] }) {
  if (status === "flagged") {
    return <X className="size-4 shrink-0 text-red-600 dark:text-red-400" />;
  }
  if (status === "advisory") {
    return <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />;
  }
  return <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />;
}

/** First flagged entry, else first advisory, else first entry. */
function defaultEntryId(section: Section): string | null {
  const flagged = section.actualEntries.find((entry) => entry.status === "flagged");
  if (flagged) return flagged.id;
  const advisory = section.actualEntries.find((entry) => entry.status === "advisory");
  if (advisory) return advisory.id;
  return section.actualEntries[0]?.id ?? null;
}

/* -------------------------------------------------------------------------- */
/* Workspace                                                                  */
/* -------------------------------------------------------------------------- */

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams<{ arNumber: string }>();
  const {
    getSession,
    getSlaStatus,
    getProgress,
    getAllTestsProgress,
    setCurrentSection,
    markSectionReviewed,
    addNote,
    pauseReview,
    resumeReview,
    completeReview,
    activeSlaProfileId,
    slaProfiles,
    setSlaProfile,
  } = useReview();

  const otherProfile =
    slaProfiles.find((profile) => profile.id !== activeSlaProfileId) ?? slaProfiles[0];

  const batch = getBatch(params.arNumber);
  const arNumber = batch?.arNumber ?? "";
  const session = batch ? getSession(batch.arNumber) : null;
  const test = batch?.tests.find((candidate) => candidate.id === session?.currentTestId);

  const notesRef = useRef<HTMLTextAreaElement>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const [selectedBySection, setSelectedBySection] = useState<Record<string, string>>({});
  const [viewedSections, setViewedSections] = useState<Record<string, boolean>>({});
  const [paused, setPaused] = useState(false);
  /** Set when the reviewer navigates back into a section after completing all. */
  const [browsingSection, setBrowsingSection] = useState(false);

  /**
   * A resumed session is one that already carries reviewed sections and a
   * position. Checking status === "Paused" would never fire, because both
   * resume paths call resumeReview() before navigating here.
   */
  const [showResumeBanner, setShowResumeBanner] = useState(() => {
    const seed = getSession(batch?.arNumber ?? "");
    if (!seed?.currentTestId || !seed.currentSectionType) return false;
    const statuses = seed.sectionStatuses[seed.currentTestId] ?? {};
    return Object.values(statuses).some((status) => status === "Reviewed");
  });

  useEffect(() => {
    if (!batch || !session) {
      router.replace("/");
      return;
    }
    if (!session.currentTestId) {
      router.replace(`/review/${batch.arNumber}/tests`);
    }
  }, [batch, session, router]);

  if (!batch || !session || !test) return null;

  /* -------------------------------------------------------------------- */
  /* Derived                                                              */
  /* -------------------------------------------------------------------- */

  const firstApplicable = applicableSections(test)[0] ?? test.sections[0];
  const activeSection =
    test.sections.find((candidate) => candidate.type === session.currentSectionType) ??
    firstApplicable;

  const sectionStatuses = session.sectionStatuses[test.id] ?? {};
  const progress = getProgress(arNumber, test.id);
  const sla = getSlaStatus(arNumber);

  // Derived, not stored — no effect needed when the section changes.
  const autoSelectedId = defaultEntryId(activeSection);
  const selectedId = selectedBySection[activeSection.type] ?? autoSelectedId;
  const selected =
    activeSection.actualEntries.find((entry) => entry.id === selectedId) ?? null;

  const isReviewed = sectionStatuses[activeSection.type] === "Reviewed";

  const applicable = applicableSections(test);
  const allReviewed = progress.total > 0 && progress.remaining === 0;
  const showCompletion = allReviewed && !browsingSection && !paused;

  /**
   * Complete Review is gated on the whole AR, not one test. A Digital Review
   * Record built from partial coverage would be meaningless in a GMP context.
   */
  const batchProgress = getAllTestsProgress(arNumber);
  const allTestsReviewed =
    batchProgress.totalSections > 0 &&
    batchProgress.totalSections === batchProgress.reviewedSections;

  const testEntries = applicable.flatMap((section) => section.actualEntries);
  const flaggedCount = testEntries.filter((entry) => entry.status === "flagged").length;
  const advisoryCount = testEntries.filter((entry) => entry.status === "advisory").length;
  const allCompliant = flaggedCount === 0 && advisoryCount === 0;
  // N/A sections have no entries to open, so they are ready immediately.
  const canMarkReviewed =
    !activeSection.applicable || viewedSections[activeSection.type] === true;

  /* -------------------------------------------------------------------- */
  /* Handlers                                                             */
  /* -------------------------------------------------------------------- */

  function selectSection(type: SectionType) {
    setCurrentSection(arNumber, type);
    // Stepping back into a section replaces the completion banner.
    setBrowsingSection(true);
  }

  function selectEntry(entryId: string) {
    setSelectedBySection((current) => ({ ...current, [activeSection.type]: entryId }));
    setViewedSections((current) => ({ ...current, [activeSection.type]: true }));
  }

  function handleMarkReviewed() {
    markSectionReviewed(arNumber, test!.id, activeSection.type);

    // Advance to the next section that still needs review.
    const next = test!.sections.find(
      (candidate) =>
        candidate.applicable &&
        candidate.type !== activeSection.type &&
        sectionStatuses[candidate.type] !== "Reviewed",
    );
    if (next) {
      setCurrentSection(arNumber, next.type);
    } else {
      // That was the last section — surface the completion banner.
      setBrowsingSection(false);
    }
  }

  function handleCompleteReview() {
    completeReview(arNumber);
    router.push(`/review/${arNumber}/summary`);
  }

  /** Explicit save. Blur already commits — this is the visible confirmation. */
  function handleSaveNote() {
    const field = notesRef.current;
    if (!field) return;

    addNote(arNumber, field.value);
    setSavedFlash(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedFlash(false), 1600);
  }

  function handlePause() {
    pauseReview(arNumber);
    setPaused(true);
  }

  function handleResume() {
    resumeReview(arNumber);
    setPaused(false);
  }

  /* -------------------------------------------------------------------- */
  /* Render                                                               */
  /* -------------------------------------------------------------------- */

  return (
    <div className="flex h-full overflow-hidden">
      {/* ---------------------------------------------------------------- */}
      {/* LEFT COLUMN                                                      */}
      {/* ---------------------------------------------------------------- */}
      <aside className="flex w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r bg-card px-4 py-4">
        {/* Primary lateral navigation — client-side push so browser back
            returns here, and so in-memory state survives. */}
        <button
          type="button"
          onClick={() => router.push(`/review/${arNumber}/tests`)}
          className="flex w-fit items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
        >
          <ChevronLeft className="size-4" />
          All Tests
        </button>

        <div className="flex flex-col gap-1">
          <p className="font-mono text-sm font-bold tracking-tight">{batch.arNumber}</p>
          <p className="text-xs text-muted-foreground">
            {batch.product} · <span className="font-mono">{batch.batchNumber}</span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium">{test.name}</span>
            <Badge variant="outline">{test.methodType}</Badge>
          </div>
        </div>

        {sla ? (
          <div className="flex flex-col gap-1">
            <Badge variant="secondary" className={cn("w-fit", SLA_TONES[sla.status])}>
              {sla.status === "overdue" ? "OVERDUE" : "Within SLA"}
            </Badge>
            <p className="text-xs text-muted-foreground">{sla.detail}</p>
            <p className="text-xs text-muted-foreground">
              Due {sla.dueDate}
            </p>

            {/* SLA is configuration, not code — switching recalculates in place. */}
            <p className="mt-1 text-xs text-muted-foreground">
              Profile: {sla.profileName}
            </p>
            <button
              type="button"
              onClick={() => setSlaProfile(otherProfile.id)}
              className="w-fit text-xs text-primary transition-colors hover:underline"
            >
              Switch profile
            </button>
          </div>
        ) : null}

        <Separator />

        <nav className="flex flex-col gap-0.5">
          {test.sections.map((section) => {
            const reviewed = sectionStatuses[section.type] === "Reviewed";
            const active = section.type === activeSection.type;

            return (
              <button
                key={section.type}
                type="button"
                disabled={paused}
                onClick={() => selectSection(section.type)}
                className={cn(
                  paused && "cursor-not-allowed opacity-40",
                  "flex items-center justify-between gap-2 rounded-md border-l-2 px-2 py-1.5 text-left text-sm transition-colors",
                  active
                    ? "border-l-blue-500 bg-muted font-medium text-foreground"
                    : "border-l-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  !section.applicable && "opacity-55",
                )}
              >
                <span>{SECTION_LABELS[section.type]}</span>
                {!section.applicable ? (
                  <span className="text-xs">N/A</span>
                ) : reviewed ? (
                  <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : null}
              </button>
            );
          })}
        </nav>

        <Separator />

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium tabular-nums">
              {progress.reviewed} / {progress.total} sections reviewed
            </p>
            <Progress
              value={progress.total === 0 ? 0 : (progress.reviewed / progress.total) * 100}
            />
            <p className="text-xs text-muted-foreground tabular-nums">
              {progress.reviewed} reviewed · {progress.remaining} remaining
            </p>
          </div>

          <Button variant="outline" className="w-full" onClick={handlePause}>
            <PauseCircle data-icon="inline-start" />
            Pause Review
          </Button>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* CENTRE COLUMN                                                    */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-6">
          {paused ? (
            <section className="rounded-xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/40">
              <h2 className="font-heading text-lg font-medium text-amber-900 dark:text-amber-200">
                Review Paused
              </h2>
              <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-200/90">
                Your progress has been saved.
              </p>
              <p className="mt-3 font-mono text-sm text-amber-900 dark:text-amber-200">
                {batch.arNumber} · {progress.reviewed} of {progress.total} sections
                reviewed
              </p>
              <p className="mt-3 text-sm text-amber-900/90 dark:text-amber-200/90">
                Return to the landing screen to resume.
              </p>
              <div className="mt-5 flex gap-2">
                <Button onClick={handleResume}>Resume Review</Button>
                <Button variant="outline" onClick={() => router.push("/")}>
                  Return to Home
                </Button>
              </div>
            </section>
          ) : showCompletion ? (
            /* ------------------------ Completion banner ------------------ */
            <section className="flex flex-col items-center gap-3 py-12 text-center">
              {allCompliant ? (
                <CheckCircle2 className="size-14 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ClipboardCheck className="size-14 text-muted-foreground" />
              )}

              <h2 className="font-heading text-2xl font-medium">
                All sections reviewed
              </h2>

              <p className="text-sm text-muted-foreground">
                {applicable.map((section) => SECTION_LABELS[section.type]).join(" · ")}
              </p>

              <p className="text-sm font-medium">
                {allCompliant
                  ? "All Compliant"
                  : [
                      flaggedCount > 0
                        ? `${flaggedCount} ${flaggedCount === 1 ? "exception" : "exceptions"}`
                        : null,
                      advisoryCount > 0
                        ? `${advisoryCount} ${advisoryCount === 1 ? "advisory" : "advisories"}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
              </p>

              <p className="text-sm text-muted-foreground">Ready for QA Review</p>

              {allTestsReviewed ? (
                <>
                  <Button
                    size="lg"
                    className="mt-3 w-full max-w-xs"
                    onClick={handleCompleteReview}
                  >
                    Complete Review
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Record QA disposition in Caliber LIMS
                  </p>
                </>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  {batchProgress.totalSections - batchProgress.reviewedSections}{" "}
                  {batchProgress.totalSections - batchProgress.reviewedSections === 1
                    ? "section"
                    : "sections"}{" "}
                  remaining in other tests before this review can be completed.
                </p>
              )}
            </section>
          ) : (
            <>
              {showResumeBanner ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <div className="flex flex-1 flex-col gap-0.5 leading-relaxed">
                    <p>
                      Resuming{" "}
                      <span className="font-mono font-medium">{batch.arNumber}</span> —{" "}
                      {batch.product}
                    </p>
                    <p>
                      Test: {test.name} &nbsp;|&nbsp; Section:{" "}
                      {SECTION_LABELS[activeSection.type]}
                    </p>
                    <p>
                      {progress.reviewed} of {progress.total} sections reviewed —{" "}
                      {progress.remaining} remaining
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Dismiss resume banner"
                    onClick={() => setShowResumeBanner(false)}
                    className="rounded-md p-0.5 transition-colors hover:bg-amber-200/60 dark:hover:bg-amber-900/60"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : null}

              <header className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-xl font-medium">
                    {SECTION_LABELS[activeSection.type]}
                  </h1>
                  {isReviewed ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    >
                      <Check className="size-3" />
                      Reviewed
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeSection.applicable
                    ? "Simulated LIMS data (Caliber LIMS in production)"
                    : "Test method configuration"}
                </p>
              </header>

              {!activeSection.applicable ? (
                /* ------------------------- N/A panel ---------------------- */
                <section className="flex flex-col gap-3 rounded-xl border bg-muted/40 px-5 py-5">
                  <div className="flex items-center gap-2">
                    <Ban className="size-5 text-muted-foreground" />
                    <p className="font-medium">
                      {SECTION_LABELS[activeSection.type]} — Not applicable
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activeSection.naReason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Source: Test method configuration
                  </p>
                </section>
              ) : activeSection.expectedEntries ? (
                /* ------------------- Expected vs Actual ------------------- */
                <section className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-xs font-medium text-muted-foreground">
                      Expected (configured specification)
                    </h2>
                    <ol className="flex flex-col gap-1.5">
                      {activeSection.expectedEntries.map((expected, index) => (
                        <li
                          key={expected.id}
                          className="flex gap-2 rounded-md border border-dashed px-3 py-2 text-sm"
                        >
                          <span className="text-muted-foreground tabular-nums">
                            {index + 1}.
                          </span>
                          <span className="flex-1">
                            {expected.label}
                            {expected.requirement ? (
                              <span className="block text-xs text-muted-foreground">
                                {expected.requirement}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h2 className="text-xs font-medium text-muted-foreground">
                      Actual (Simulated LIMS data)
                    </h2>
                    <ol className="flex flex-col gap-1.5">
                      {activeSection.actualEntries.map((entry, index) => (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => selectEntry(entry.id)}
                            className={cn(
                              "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-all",
                              entry.status === "flagged" &&
                                "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
                              entry.status === "advisory" &&
                                "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
                              entry.id === selectedId && "ring-2 ring-blue-500/50",
                            )}
                          >
                            <span className="text-muted-foreground tabular-nums">
                              {index + 1}.
                            </span>
                            <span className="flex-1">
                              <span className="block">{entry.label}</span>
                              <span className="block text-xs text-muted-foreground">
                                {entry.value}
                              </span>
                            </span>
                            <EntryIcon status={entry.status} />
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>
                </section>
              ) : (
                /* ---------------------- Simple entry list ------------------ */
                <section className="flex flex-col gap-1.5">
                  {activeSection.actualEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => selectEntry(entry.id)}
                      className={cn(
                        "flex items-start gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-all",
                        entry.status === "flagged" &&
                          "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
                        entry.status === "advisory" &&
                          "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
                        entry.id === selectedId && "ring-2 ring-blue-500/50",
                      )}
                    >
                      <span className="flex-1">
                        <span className="block font-medium">{entry.label}</span>
                        <span className="block text-xs text-muted-foreground">
                          {entry.value}
                        </span>
                      </span>
                      <Badge variant="secondary" className={ENTRY_TONES[entry.status]}>
                        {ENTRY_LABELS[entry.status]}
                      </Badge>
                      <EntryIcon status={entry.status} />
                    </button>
                  ))}
                </section>
              )}

              <Separator className="mt-2" />

              <div className="flex flex-col items-start gap-2 pb-2">
                <Button onClick={handleMarkReviewed} disabled={!canMarkReviewed || isReviewed}>
                  {isReviewed ? "Section Reviewed" : "Mark as Reviewed"}
                </Button>
                {!canMarkReviewed && !isReviewed ? (
                  <p className="text-xs text-muted-foreground">
                    Open an entry to review its detail before marking this section.
                  </p>
                ) : null}

                {allTestsReviewed ? (
                  <Button className="mt-2 w-full" onClick={handleCompleteReview}>
                    Complete Review
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* RIGHT COLUMN — evidence, always inline, never a modal            */}
      {/* ---------------------------------------------------------------- */}
      <aside className="flex w-95 shrink-0 flex-col overflow-y-auto border-l bg-card px-5 py-5">
        {!selected ? (
          <p className="text-sm text-muted-foreground">
            {activeSection.applicable
              ? "Select an entry to view details"
              : "This section does not apply to this test."}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-base font-medium">{selected.label}</h2>
              <Badge variant="secondary" className={ENTRY_TONES[selected.status]}>
                {ENTRY_LABELS[selected.status]}
              </Badge>
            </div>

            <dl className="mt-4 flex flex-col gap-2.5">
              {Object.entries(selected.details).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[8.5rem_1fr] gap-2">
                  <dt className="text-xs font-medium text-muted-foreground">{key}</dt>
                  <dd className="text-sm leading-relaxed">{value}</dd>
                </div>
              ))}
              <div className="grid grid-cols-[8.5rem_1fr] gap-2">
                <dt className="text-xs font-medium text-muted-foreground">Source</dt>
                <dd className="text-sm leading-relaxed">{selected.sourceLabel}</dd>
              </div>
            </dl>

            {selected.status === "flagged" ? (
              <>
                <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 dark:border-red-900 dark:bg-red-950/40">
                  <p className="text-xs font-medium text-red-800 dark:text-red-300">
                    Finding
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-red-900 dark:text-red-200">
                    {selected.finding}
                  </p>
                </div>

                {selected.action ? (
                  <div className="mt-3 rounded-lg border bg-muted/50 px-3 py-2.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Action required
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{selected.action}</p>
                  </div>
                ) : null}
              </>
            ) : null}

            {selected.status === "advisory" ? (
              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 dark:border-amber-900 dark:bg-amber-950/40">
                <p className="text-xs font-medium text-amber-900 dark:text-amber-300">
                  Advisory
                </p>
                <p className="mt-1 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
                  {selected.advisory}
                </p>
              </div>
            ) : null}

            {selected.status === "flagged" || selected.status === "advisory" ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Use Reviewer Notes below to record observations about this finding.
              </p>
            ) : null}
          </>
        )}

        {/* Reviewer notes — always present, whatever is selected. One shared
            field for the whole review. Uncontrolled so typing never
            round-trips through context; the key remounts it when the
            committed value changes. */}
        <Separator className="mt-5" />

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex flex-col">
            <label htmlFor="reviewer-notes" className="text-xs font-medium">
              Reviewer Notes
            </label>
            <span className="text-xs text-muted-foreground">
              Shared across this review
            </span>
          </div>

          <Textarea
            id="reviewer-notes"
            key={session.reviewerNotes}
            ref={notesRef}
            defaultValue={session.reviewerNotes}
            rows={4}
            placeholder="Add notes about this review..."
            onBlur={(event) => addNote(arNumber, event.target.value)}
            className="max-h-48 min-h-24 overflow-y-auto text-sm"
          />

          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={handleSaveNote}
          >
            {savedFlash ? "Saved" : "Save Note"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
