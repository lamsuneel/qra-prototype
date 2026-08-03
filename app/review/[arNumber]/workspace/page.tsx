"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  PauseCircle,
  X,
} from "lucide-react";

import {
  getBatch,
  RULE_NAMES,
  SECTIONS,
  type RuleResult,
  type SectionId,
  type Severity,
} from "@/data/batches";
import { useReview, type FindingState } from "@/context/ReviewContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Tones                                                                      */
/* -------------------------------------------------------------------------- */

const SEVERITY_TONES: Record<Severity, string> = {
  Critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  Major: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  Minor: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
};

const SEVERITY_BORDERS: Record<Severity, string> = {
  Critical: "border-l-red-500",
  Major: "border-l-amber-500",
  Minor: "border-l-slate-400",
};

const STATE_TONES: Record<FindingState, string> = {
  Pending: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  Acknowledged:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  Escalated: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
};

const COMPLIANT_TONE =
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";

const SEVERITY_RANK: Record<Severity, number> = {
  Critical: 0,
  Major: 1,
  Minor: 2,
};

/* -------------------------------------------------------------------------- */
/* Notes editor                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Reviewer notes are a single shared string on the session, so the workspace
 * can show two editors at once — the Notes section and the evidence panel.
 *
 * The textarea is uncontrolled so typing never round-trips through context.
 * The value is committed on blur, and the key remounts the field whenever the
 * committed value changes, which keeps the other editor in sync.
 */
function NotesEditor({
  value,
  onCommit,
  placeholder,
  rows,
  className,
}: {
  value: string;
  onCommit: (next: string) => void;
  placeholder: string;
  rows: number;
  className?: string;
}) {
  return (
    <Textarea
      key={value}
      defaultValue={value}
      rows={rows}
      placeholder={placeholder}
      onBlur={(event) => onCommit(event.target.value)}
      className={className}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Evidence panel                                                             */
/* -------------------------------------------------------------------------- */

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm leading-relaxed">{value}</dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Workspace                                                                  */
/* -------------------------------------------------------------------------- */

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams<{ arNumber: string }>();
  const {
    getSession,
    getFindingState,
    getProgress,
    getNextPendingFinding,
    startReview,
    setStatus,
    acknowledgeFinding,
    escalateFinding,
    addNote,
    pauseReview,
    resumeReview,
    completeReview,
  } = useReview();

  const batch = getBatch(params.arNumber);
  const arNumber = batch?.arNumber ?? "";

  const centreRef = useRef<HTMLDivElement>(null);

  const [section, setSection] = useState<SectionId>("summary");
  const [paused, setPaused] = useState(false);

  /**
   * A resumed session is one that already carries a checklistPosition — the
   * reviewer had been working before. Checking session.status === "Paused"
   * would never fire, because the landing screen's Resume button calls
   * resumeReview() before navigating here.
   */
  const [showResumeBanner, setShowResumeBanner] = useState(() => {
    const session = getSession(batch?.arNumber ?? "");
    return Boolean(session?.checklistPosition);
  });

  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(() => {
    if (!batch) return null;

    const session = getSession(batch.arNumber);

    // The next finding still needing a decision, not the last one acted on.
    const resumeTarget =
      getNextPendingFinding(batch.arNumber) ?? session?.checklistPosition;
    if (resumeTarget) return resumeTarget;

    const findings = batch.results.filter((r) => r.outcome === "Finding");
    if (findings.length === 0) return null;

    const firstCritical = findings.find((r) => r.severity === "Critical");
    return (firstCritical ?? findings[0]).ruleId;
  });

  /* -------------------------------------------------------------------- */
  /* Lifecycle                                                            */
  /* -------------------------------------------------------------------- */

  useEffect(() => {
    if (!batch) router.replace("/");
  }, [batch, router]);

  useEffect(() => {
    if (!batch) return;

    const session = getSession(batch.arNumber);

    // Reached directly without assembly (or after a refresh cleared state) —
    // create a session so the workspace is not a dead end.
    if (!session) {
      startReview(batch.arNumber);
      return;
    }

    if (session.status === "ReadyForReview" || session.status === "ContextBuilding") {
      setStatus(batch.arNumber, "InReview");
    }
  }, [batch, getSession, startReview, setStatus]);

  /* -------------------------------------------------------------------- */
  /* Derived                                                              */
  /* -------------------------------------------------------------------- */

  const session = batch ? getSession(batch.arNumber) : null;
  const progress = getProgress(arNumber);
  const notes = session?.reviewerNotes ?? "";

  // Critical first, Major second, original rule order preserved within each.
  const findings: RuleResult[] = batch
    ? batch.results
        .filter((result) => result.outcome === "Finding")
        .sort(
          (a, b) =>
            SEVERITY_RANK[a.severity ?? "Minor"] - SEVERITY_RANK[b.severity ?? "Minor"],
        )
    : [];

  const compliant: RuleResult[] = batch
    ? batch.results.filter((result) => result.outcome === "Compliant")
    : [];

  const activeSection = SECTIONS.find((entry) => entry.id === section) ?? SECTIONS[0];

  const inSection = (ruleId: string) =>
    activeSection.ruleIds === null || activeSection.ruleIds.includes(ruleId);

  const visibleFindings = findings.filter((result) => inSection(result.ruleId));
  const visibleCompliant = compliant.filter((result) => inSection(result.ruleId));

  const selected = batch?.results.find((result) => result.ruleId === selectedRuleId) ?? null;
  const selectedState = selected ? getFindingState(arNumber, selected.ruleId) : "Pending";

  const isCleanBatch = findings.length === 0;
  const showEvidencePanel = selected !== null;

  if (!batch) return null;

  /* -------------------------------------------------------------------- */
  /* Handlers                                                             */
  /* -------------------------------------------------------------------- */

  function handlePause() {
    pauseReview(arNumber);
    setPaused(true);
  }

  function handleResumeFromPause() {
    resumeReview(arNumber);
    setPaused(false);
  }

  function handleCompleteReview() {
    completeReview(arNumber);
    router.push(`/review/${arNumber}/summary`);
  }

  function handleAddNote() {
    setSection("notes");
    centreRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDismissResumeBanner() {
    setStatus(arNumber, "InReview");
    setShowResumeBanner(false);
  }

  /* -------------------------------------------------------------------- */
  /* Render                                                               */
  /* -------------------------------------------------------------------- */

  const resumeTargetRuleId =
    getNextPendingFinding(arNumber) ?? session?.checklistPosition;
  const resumeRuleName = resumeTargetRuleId ? RULE_NAMES[resumeTargetRuleId] : null;

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* ---------------------------------------------------------------- */}
      {/* LEFT COLUMN                                                      */}
      {/* ---------------------------------------------------------------- */}
      <aside className="flex w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r bg-card px-4 py-5">
        <div>
          <p className="font-mono text-sm font-bold tracking-tight">
            {batch.arNumber}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{batch.product}</p>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          {progress.findings > 0 ? (
            <>
              {findings.filter((f) => f.severity === "Critical").length > 0 ? (
                <p className="text-red-700 dark:text-red-400">
                  <span className="font-semibold tabular-nums">
                    {findings.filter((f) => f.severity === "Critical").length}
                  </span>{" "}
                  Critical
                </p>
              ) : null}
              {findings.filter((f) => f.severity === "Major").length > 0 ? (
                <p className="text-amber-700 dark:text-amber-400">
                  <span className="font-semibold tabular-nums">
                    {findings.filter((f) => f.severity === "Major").length}
                  </span>{" "}
                  Major
                </p>
              ) : null}
            </>
          ) : null}
          <p className="text-muted-foreground">
            <span className="font-semibold tabular-nums">{progress.compliant}</span>{" "}
            Compliant
          </p>
        </div>

        <Separator />

        <nav className="flex flex-col gap-0.5">
          {SECTIONS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setSection(entry.id)}
              className={cn(
                "rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                section === entry.id
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {entry.label}
            </button>
          ))}
        </nav>

        <Separator />

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium tabular-nums">
              {progress.rulesAddressed} / {progress.total} rules addressed
            </p>
            <Progress
              value={
                progress.total === 0
                  ? 0
                  : (progress.rulesAddressed / progress.total) * 100
              }
            />
            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground tabular-nums">
              <p>
                {progress.findings} Findings · {progress.compliant} Compliant
              </p>
              <p>
                {progress.acknowledged} Acknowledged · {progress.pending} Pending
              </p>
            </div>
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
      <div ref={centreRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-6">
          {paused ? (
            /* ---------------------------- Pause state ------------------ */
            <section className="rounded-xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/40">
              <h2 className="font-heading text-lg font-medium text-amber-900 dark:text-amber-200">
                Review Paused
              </h2>
              <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-200/90">
                Your progress has been saved.
              </p>
              <p className="mt-3 font-mono text-sm text-amber-900 dark:text-amber-200">
                {batch.arNumber} · {progress.addressed} of {progress.findings}{" "}
                findings addressed
              </p>
              <p className="mt-3 text-sm text-amber-900/90 dark:text-amber-200/90">
                Return to the landing screen to resume.
              </p>
              <div className="mt-5 flex gap-2">
                <Button onClick={handleResumeFromPause}>Resume Review</Button>
                <Button variant="outline" onClick={() => router.push("/")}>
                  Return to Home
                </Button>
              </div>
            </section>
          ) : section === "notes" ? (
            /* ---------------------------- Notes ------------------------ */
            <section className="flex flex-col gap-2">
              <h2 className="font-heading text-base font-medium">Reviewer Notes</h2>
              <NotesEditor
                value={notes}
                onCommit={(next) => addNote(arNumber, next)}
                placeholder="Add notes about this review..."
                rows={6}
                className="min-h-40"
              />
            </section>
          ) : isCleanBatch ? (
            /* ---------------------------- Clean batch ------------------ */
            <>
              <section className="flex flex-col items-center gap-3 py-10 text-center">
                <CheckCircle2 className="size-14 text-emerald-600 dark:text-emerald-400" />
                <h2 className="font-heading text-2xl font-medium">
                  No Compliance Exceptions Found
                </h2>
                <p className="text-sm text-muted-foreground">
                  {progress.total} Rules Executed · {progress.compliant} Compliant ·{" "}
                  {progress.findings} Findings
                </p>
                <p className="text-sm text-muted-foreground">
                  Test Type: {batch.testType}
                </p>
                <Button size="lg" className="mt-3" onClick={handleCompleteReview}>
                  Complete Review
                </Button>
                <p className="text-xs text-muted-foreground">
                  Ready for QA Review — record disposition in Caliber LIMS
                </p>
              </section>

              <CompliantSection
                rules={visibleCompliant}
                selectedRuleId={selectedRuleId}
                onSelect={setSelectedRuleId}
              />
            </>
          ) : (
            /* ---------------------------- Findings --------------------- */
            <>
              {showResumeBanner && resumeRuleName ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="flex-1 leading-relaxed">
                    Resuming{" "}
                    <span className="font-mono font-medium">{batch.arNumber}</span> ·{" "}
                    {batch.product} · You left off at:{" "}
                    <span className="font-medium">{resumeRuleName}</span> ·{" "}
                    {progress.pending} of {progress.findings} findings remaining
                  </p>
                  <button
                    type="button"
                    aria-label="Dismiss resume banner"
                    onClick={handleDismissResumeBanner}
                    className="rounded-md p-0.5 transition-colors hover:bg-amber-200/60 dark:hover:bg-amber-900/60"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : null}

              {visibleFindings.map((result) => {
                const state = getFindingState(arNumber, result.ruleId);
                const severity = result.severity ?? "Minor";
                const isSelected = result.ruleId === selectedRuleId;

                return (
                  <button
                    key={result.ruleId}
                    type="button"
                    onClick={() => setSelectedRuleId(result.ruleId)}
                    className={cn(
                      "flex flex-col gap-2 rounded-lg border border-l-4 bg-card px-4 py-3 text-left transition-all",
                      isSelected
                        ? "border-l-blue-500 ring-1 ring-blue-500/40"
                        : SEVERITY_BORDERS[severity],
                      // Addressed findings stay visible but recede.
                      state !== "Pending" && !isSelected && "opacity-60",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {RULE_NAMES[result.ruleId]}
                      </span>
                      <Badge variant="secondary" className={SEVERITY_TONES[severity]}>
                        {severity}
                      </Badge>
                      <Badge variant="secondary" className={STATE_TONES[state]}>
                        {state}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.summary}</p>
                  </button>
                );
              })}

              {visibleFindings.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">
                  No findings in this section.
                </p>
              ) : null}

              <CompliantSection
                rules={visibleCompliant}
                selectedRuleId={selectedRuleId}
                onSelect={setSelectedRuleId}
              />

              <Separator className="mt-4" />

              <div className="flex flex-col items-center gap-2 pb-2">
                {progress.pending > 0 ? (
                  <>
                    <Button variant="outline" disabled>
                      Complete Review
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Acknowledge or escalate all findings to complete review
                    </p>
                  </>
                ) : (
                  <Button onClick={handleCompleteReview}>Complete Review</Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* RIGHT COLUMN — evidence, always inline, never a modal            */}
      {/* ---------------------------------------------------------------- */}
      {showEvidencePanel && selected ? (
        <aside className="w-95 shrink-0 overflow-y-auto border-l bg-card px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-base font-medium">
              {RULE_NAMES[selected.ruleId]}
            </h2>
            {selected.outcome === "Finding" ? (
              <Badge
                variant="secondary"
                className={SEVERITY_TONES[selected.severity ?? "Minor"]}
              >
                {selected.severity}
              </Badge>
            ) : (
              <Badge variant="secondary" className={COMPLIANT_TONE}>
                Compliant
              </Badge>
            )}
          </div>

          <dl className="mt-4 flex flex-col gap-3">
            <EvidenceRow label="Expected" value={selected.expected} />
            <EvidenceRow label="Actual" value={selected.actual} />
            <EvidenceRow label="Source" value={selected.source} />
            {batch.analysisDate ? (
              <EvidenceRow label="Analysis Date" value={batch.analysisDate} />
            ) : null}

            <div className="flex flex-col gap-1.5">
              <dt className="text-xs font-medium text-muted-foreground">
                Explanation
              </dt>
              <dd className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm leading-relaxed">
                {selected.explanation}
              </dd>
            </div>
          </dl>

          {selected.outcome === "Finding" ? (
            <>
              <div className="mt-5 flex flex-wrap gap-2">
                {selectedState === "Acknowledged" ? (
                  <Button
                    disabled
                    className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    <Check data-icon="inline-start" />
                    Acknowledged
                  </Button>
                ) : (
                  <Button
                    onClick={() => acknowledgeFinding(arNumber, selected.ruleId)}
                  >
                    Acknowledge
                  </Button>
                )}

                {selectedState === "Escalated" ? (
                  <Button
                    disabled
                    variant="outline"
                    className="border-amber-300 text-amber-800 dark:border-amber-900 dark:text-amber-300"
                  >
                    <ArrowUpRight data-icon="inline-start" />
                    Escalated
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => escalateFinding(arNumber, selected.ruleId)}
                  >
                    Mark for Follow-up
                  </Button>
                )}

                <Button variant="ghost" onClick={handleAddNote}>
                  Add Note
                </Button>
              </div>

              <div className="mt-3">
                <NotesEditor
                  value={notes}
                  onCommit={(next) => addNote(arNumber, next)}
                  placeholder="Add to reviewer notes..."
                  rows={3}
                />
              </div>
            </>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              This rule is compliant. No action required.
            </p>
          )}
        </aside>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Compliant rules — visible but collapsed. Never hidden.                     */
/* -------------------------------------------------------------------------- */

function CompliantSection({
  rules,
  selectedRuleId,
  onSelect,
}: {
  rules: RuleResult[];
  selectedRuleId: string | null;
  onSelect: (ruleId: string) => void;
}) {
  if (rules.length === 0) return null;

  return (
    <Collapsible className="mt-2">
      <CollapsibleTrigger className="group/trigger flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronDown className="size-4 transition-transform group-data-[panel-open]/trigger:rotate-180" />
        {rules.length} rules compliant — show
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 flex flex-col gap-1">
        {rules.map((result) => (
          <button
            key={result.ruleId}
            type="button"
            onClick={() => onSelect(result.ruleId)}
            className={cn(
              "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
              result.ruleId === selectedRuleId
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <span>{RULE_NAMES[result.ruleId]}</span>
            <Badge variant="secondary" className={COMPLIANT_TONE}>
              Compliant
            </Badge>
          </button>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
