"use client";

import { use, useMemo, useState } from "react";
import { notFound, redirect, useRouter } from "next/navigation";
import { Inter, JetBrains_Mono } from "next/font/google";

import {
  getBatch,
  isException,
  orderedSections,
  sectionsForParameter,
  sourcesUsedIn,
} from "@/data";
import { documentUrl } from "@/data/config";
import { PROFILES } from "@/data/profiles";
import { useReview } from "@/context/ReviewContext";
import {
  resultFor,
  type Batch,
  type CheckItem,
  type ItemResult,
  type Section,
} from "@/types";
import { PageTitle } from "@/components/layout/PageTitle";
import { DarkTopbar } from "@/components/dark/DarkTopbar";
import { V3Badge } from "@/components/dark/Badge";
import { V3JourneyMap, type V3NodeState } from "@/components/dark/JourneyMap";
import { V3ReviewNavigator } from "@/components/dark/ReviewNavigator";
import { V3AiraRail } from "@/components/dark/AiraRail";
import { V3EvidenceTable } from "@/components/dark/EvidenceTable";
import { V3DocumentRow } from "@/components/dark/DocumentRow";
import { V3FindingPanel } from "@/components/dark/FindingPanel";
import { V3ReviewerAction } from "@/components/dark/ReviewerAction";
import { V3StatusBar } from "@/components/dark/StatusBar";
import { V3SectionEntryCard } from "@/components/dark/SectionEntryCard";
import { V3BatchIntegrityBar } from "@/components/dark/BatchIntegrityBar";
import { AiraGlyph } from "@/components/dark/Icons";
import { draftObservation, evidenceRowsFor } from "@/components/dark/evidence";
import {
  V3_RESULT_LABEL,
  V3_RESULT_TONE,
  V3_THEME_CSS,
  V3_TONE,
} from "@/components/dark/theme";

/* The two faces this design uses, scoped to the v3 subtree. */
const inter = Inter({ subsets: ["latin"], variable: "--v3-font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--v3-font-mono" });

const ADVISORY_RESULTS = new Set<ItemResult>([
  "NEEDS_VERIFICATION",
  "CONDITIONAL_PASS",
]);

/** Worst first. One order, used by the dot, the node and the badge alike. */
const SEVERITY: ItemResult[] = [
  "HARD_INVALID",
  "FLAGGED",
  "NEEDS_VERIFICATION",
  "CONDITIONAL_PASS",
  "COMPLIANT",
];

const countWhere = (items: CheckItem[], match: (item: CheckItem) => boolean) =>
  items.filter(match).length;

const isAdvisory = (item: CheckItem) => ADVISORY_RESULTS.has(resultFor(item));
const isClear = (item: CheckItem) => resultFor(item) === "COMPLIANT";

const worstResult = (section: Section): ItemResult => {
  const results = section.items.map(resultFor);
  return SEVERITY.find((result) => results.includes(result)) ?? "COMPLIANT";
};

/**
 * Where a section stands, for the strip at the top.
 *
 * Verdict first, because that is what the reviewer is scanning for. The ring
 * marking where they are standing is applied over the top by the caller.
 */
const stateFor = (section: Section): V3NodeState => {
  const worst = worstResult(section);
  if (worst === "HARD_INVALID") return "invalid";
  if (worst === "FLAGGED") return "flagged";
  if (ADVISORY_RESULTS.has(worst)) return "advisory";
  return "compliant";
};

/**
 * The placeholder names the investigation series the finding already names,
 * so the reference format in the record is never in doubt. Same rule as the
 * light workspace, so the two produce the same shape of record.
 */
const placeholderFor = (item: CheckItem): string => {
  const text = `${item.reference ?? ""} ${item.flagReason ?? ""} ${item.flagAction ?? ""}`;
  const series = text.match(/(OOS|DEV|OOT|LIR)-\d{4}-\d{4}/)?.[1];

  return series
    ? `Record your observation and ${series} investigation reference (e.g. ${series}-2026-XXXX)...`
    : "Record your observation and any investigation reference (e.g. DEV-2026-XXXX)...";
};

/** The entry a section should open on: its worst unresolved one. */
const openingItem = (section: Section): CheckItem =>
  section.items.find(isException) ??
  section.items.find((item) => !isClear(item)) ??
  section.items[0];

/* -------------------------------------------------------------------------- */

/**
 * The batch every thin fixture falls back to, and the bar it has to clear.
 *
 * Some ARs in the demo data carry a single parameter, which draws a journey
 * map with one node row and reads as a broken screen rather than as a batch
 * with nothing wrong in it. Those hand over to the one batch that fills the
 * workspace, and say so rather than pretending the reviewer asked for it.
 */
const DEMO_FALLBACK_AR = "07-FP-26-0122";
const MIN_PARAMETERS = 5;

export default function V3ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ ar: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { ar } = use(params);
  const { from } = use(searchParams);
  const requested = decodeURIComponent(ar);
  const batch = getBatch(requested);

  /* The guard is on the fallback itself, not just on the request: if that
     batch is ever thinned below the bar this would otherwise redirect to
     itself forever. */
  if (!batch || batch.parameters.length < MIN_PARAMETERS) {
    if (requested === DEMO_FALLBACK_AR) notFound();
    redirect(
      `/review/${DEMO_FALLBACK_AR}?from=${encodeURIComponent(requested)}`,
    );
  }

  return <Workspace batch={batch} standingIn={from} />;
}

function Workspace({
  batch,
  standingIn,
}: {
  batch: Batch;
  /** The AR the reviewer actually asked for, when this is a stand-in. */
  standingIn?: string;
}) {
  const router = useRouter();
  const {
    profile,
    noteFor,
    setNote,
    isNoted,
    sectionStatus,
    markSectionReviewed,
    reviewedCount,
    totalSections,
  } = useReview();

  const sections = useMemo(() => orderedSections(batch), [batch]);
  const allItems = useMemo(
    () => sections.flatMap((section) => section.items),
    [sections],
  );

  const exceptions = useMemo(
    () =>
      sections.flatMap((section) =>
        section.items.filter(isException).map((item) => ({ section, item })),
      ),
    [sections],
  );

  /* The screen opens on the first thing stopping the batch. */
  const [selectedId, setSelectedId] = useState(
    () => exceptions[0]?.item.id ?? sections[0].items[0].id,
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  /* Which entry's evidence is open. One at a time: the list is the view
     now, and two open tables push the rest of the section off the screen. */
  const [openId, setOpenId] = useState<string | null>(null);

  /* Where the reviewer is standing. Derived from the id rather than held as
     an object, so a section list rebuilt on every render cannot leave the
     workspace pointing at a stale copy of the entry it is showing. */
  const activeSection =
    sections.find((section) =>
      section.items.some((entry) => entry.id === selectedId),
    ) ?? sections[0];
  const activeItem =
    activeSection.items.find((entry) => entry.id === selectedId) ??
    activeSection.items[0];

  const parameter =
    batch.parameters.find((entry) => entry.id === activeSection.parameter) ??
    batch.parameters[0];

  const selectSection = (sectionId: string) => {
    const section = sections.find((entry) => entry.id === sectionId);
    if (section) setSelectedId(openingItem(section).id);
  };

  /* ---- Counts. One set, read by the rail, the strip and the status bar. --- */

  const passed = countWhere(allItems, isClear);
  const advisory = countWhere(allItems, isAdvisory);
  const blocking = countWhere(allItems, isException);
  /* Reviewer progress rather than a verdict: the checks sitting in sections
     nobody has closed yet. It overlaps the three counts above on purpose —
     they say what NeuraTrace found, this says how much has been signed off. */
  const unreviewed = sections
    .filter((section) => sectionStatus(section.id) !== "REVIEWED")
    .reduce((total, section) => total + section.items.length, 0);

  const groups = batch.parameters.map((entry, index) => {
    const owned = sectionsForParameter(batch, entry.id);
    const items = owned.flatMap((section) => section.items);
    const flagged = countWhere(items, isException);
    const unsettled = countWhere(items, isAdvisory);

    return {
      id: entry.id,
      label: entry.shortName,
      index: index + 1,
      nodes: owned.map((section) => ({
        id: section.id,
        label: `${entry.shortName} · ${section.name}`,
        state:
          section.id === activeSection.id
            ? ("current" as V3NodeState)
            : entry.readiness === "IN_PROGRESS"
              ? ("pending" as V3NodeState)
              : stateFor(section),
      })),
      clear: countWhere(items, isClear),
      total: items.length,
      flagged,
      advisory: unsettled,
      active: entry.id === parameter.id,
      tone:
        flagged > 0
          ? ("blocking" as const)
          : unsettled > 0
            ? ("advisory" as const)
            : ("compliant" as const),
    };
  });

  /* ---- The entry in front of the reviewer -------------------------------- */

  const verdict = resultFor(activeItem);
  const tone = V3_RESULT_TONE[verdict];
  const recorded = isNoted(activeItem.id);
  const reasonFor = (entry: CheckItem) =>
    entry.flagReason ??
    entry.checkDescription ??
    entry.comparison ??
    entry.expected;
  const ruleUrlFor = (entry: CheckItem) =>
    entry.sopReference ? documentUrl(entry.sopReference) : undefined;

  const outstanding = activeSection.items.filter(
    (item) => resultFor(item) === "FLAGGED" && !isNoted(item.id),
  ).length;
  const sectionReviewed = sectionStatus(activeSection.id) === "REVIEWED";

  /* The section, split the way a reviewer works it: what stops the batch,
     what needs a second look, and what came back clean. Invalid entries lead
     the flagged group -- they are not a result at all. */
  const flaggedEntries = [
    ...activeSection.items.filter(
      (entry) => resultFor(entry) === "HARD_INVALID",
    ),
    ...activeSection.items.filter((entry) => resultFor(entry) === "FLAGGED"),
  ];
  const advisoryEntries = activeSection.items.filter((entry) =>
    ["CONDITIONAL_PASS", "NEEDS_VERIFICATION"].includes(resultFor(entry)),
  );
  const compliantEntries = activeSection.items.filter(
    (entry) => resultFor(entry) === "COMPLIANT",
  );

  /* Every document this finding traces back to, each named once. */
  const documentsFor = (entry: CheckItem) =>
    [
      {
        reference: parameter.stpReference,
        description: `Test method — ${parameter.name} by ${parameter.methodType}`,
      },
      ...(entry.sopReference
        ? [
            {
              reference: entry.sopReference,
              description: "Rule this check answers to",
            },
          ]
        : []),
      ...(entry.expectedSource
        ? [
            {
              reference: entry.expectedSource,
              description: "Source of the expectation",
            },
          ]
        : []),
    ].filter(
      (document, index, list) =>
        list.findIndex((other) => other.reference === document.reference) ===
        index,
    );

  const instrument = activeSection.standaloneInstrument;
  const logbook = activeSection.paperLogbook;

  const worksheetFor = (
    entry: CheckItem,
  ): { label: string; value: string }[] => [
    {
      label: "Test parameter",
      value: `${parameter.name} · ${parameter.methodType}`,
    },
    { label: "Method reference", value: parameter.stpReference },
    { label: "Expected condition", value: entry.expected },
    ...(entry.requiresQuantityCheck
      ? [
          {
            label: "Prescribed quantity",
            value: entry.prescribedQty ?? "Not recorded on the worksheet",
          },
          {
            label: "Quantity used",
            value: entry.actualQty ?? "Not recorded",
          },
        ]
      : []),
    ...(logbook
      ? [
          {
            label: "Paper record",
            value: `${logbook.reference} · page ${logbook.page}`,
          },
        ]
      : []),
  ];

  /* One entry, with everything it traces back to folded inside it. The
     evidence table that used to be the whole screen is now this. */
  const renderEntry = (entry: CheckItem) => {
    const entryVerdict = resultFor(entry);
    const entryNeedsNote =
      entryVerdict === "FLAGGED" || entryVerdict === "NEEDS_VERIFICATION";
    const entryRule = ruleUrlFor(entry);

    return (
      <V3SectionEntryCard
        key={entry.id}
        item={entry}
        verdict={entryVerdict}
        expanded={openId === entry.id}
        recorded={isNoted(entry.id)}
        onToggle={() => {
          /* Opening an entry also selects it, so the finding panel beside
             the list is always about the entry being read. */
          setSelectedId(entry.id);
          setOpenId((current) => (current === entry.id ? null : entry.id));
        }}
      >
        <div className="mb-3 flex gap-2.5 rounded-[8px] border border-[var(--v3-aira-border)] bg-[var(--v3-aira-bg)] p-3">
          <span className="mt-0.5 shrink-0 text-[var(--v3-aira)]">
            <AiraGlyph size={14} />
          </span>
          <div className="min-w-0 flex-1">
            <span className="mb-1 block text-[9px] font-bold tracking-[0.08em] text-[var(--v3-aira)] uppercase">
              AIRA analysis
            </span>
            <p className="text-[12px] leading-[1.6] text-[var(--v3-aira-text)]">
              {reasonFor(entry)}
            </p>
            {entryRule ? (
              <div className="mt-2 flex justify-end">
                <a
                  href={entryRule}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-[4px] border border-[var(--v3-aira-border)] px-2.5 py-1 text-[10px] text-[var(--v3-aira-name)] transition-colors duration-[120ms] hover:bg-[var(--v3-aira-bg)]"
                >
                  View rule details &rarr;
                </a>
              </div>
            ) : null}
          </div>
        </div>

        <span className="mb-2 block text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
          Evidence from source
        </span>
        <V3EvidenceTable rows={evidenceRowsFor(entry)} />

        <span className="mt-3 mb-2 block text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
          Supporting documents
        </span>
        <div className="flex flex-col gap-2">
          {documentsFor(entry).map((document) => (
            <V3DocumentRow
              key={document.reference}
              reference={document.reference}
              description={document.description}
            />
          ))}
          {instrument ? (
            <V3DocumentRow
              reference={instrument.pdfFilename}
              description={`${instrument.name} ${instrument.version} audit trail`}
              meta={`${instrument.analyst} · ${instrument.loginAt}`}
            />
          ) : null}
        </div>

        <span className="mt-3 mb-1 block text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
          Comparison with worksheet
        </span>
        {worksheetFor(entry).map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-3 border-b border-[var(--v3-border-subtle)] py-2 last:border-b-0"
          >
            <span className="shrink-0 text-[12px] text-[var(--v3-text-secondary)]">
              {row.label}
            </span>
            <span className="text-right font-mono text-[11px] text-[var(--v3-text-primary)]">
              {row.value}
            </span>
          </div>
        ))}

        {entryNeedsNote ? (
          <div className="mt-3">
            <V3ReviewerAction
              value={drafts[entry.id] ?? noteFor(entry.id)}
              onChange={(next) => {
                setDrafts((current) => ({ ...current, [entry.id]: next }));
                setSavedId(null);
              }}
              placeholder={placeholderFor(entry)}
              required
              recorded={isNoted(entry.id)}
              onRecord={() => {
                const text = (drafts[entry.id] ?? noteFor(entry.id)).trim();
                if (text) setNote(entry.id, text);
              }}
              onSaveDraft={() => setSavedId(entry.id)}
              saved={savedId === entry.id}
            />
          </div>
        ) : null}
      </V3SectionEntryCard>
    );
  };

  const reviewer = profile ?? PROFILES[0];

  return (
    <div
      className={`v3-root ${inter.variable} ${mono.variable} flex h-dvh flex-col overflow-hidden bg-[var(--v3-bg-base)] text-[var(--v3-text-primary)]`}
    >
      <style dangerouslySetInnerHTML={{ __html: V3_THEME_CSS }} />
      <PageTitle title={`${batch.arNumber} — Review Workspace`} />

      <div className="shrink-0">
        <DarkTopbar
          notice={
            standingIn
              ? `Demo data — ${standingIn} has no full review fixture`
              : undefined
          }
        />
      </div>

      <V3JourneyMap groups={groups} onSelect={selectSection} />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <V3ReviewNavigator
          context={[
            { label: "AR Number", value: batch.arNumber, mono: true },
            { label: "Product", value: batch.product },
            { label: "Batch No.", value: batch.batchNumber, mono: true },
            { label: "Analyst", value: batch.analyst },
            { label: "LIMS status", value: batch.limsStatus },
          ]}
          stats={[
            { label: "Passed", value: passed, colour: V3_TONE.compliant },
            { label: "Advisory", value: advisory, colour: V3_TONE.advisory },
            { label: "Blocking", value: blocking, colour: V3_TONE.blocking },
            { label: "Unreviewed", value: unreviewed, colour: V3_TONE.muted },
          ]}
          progress={{
            done: reviewedCount(batch.arNumber),
            total: totalSections(batch.arNumber),
            tone: blocking > 0 ? "advisory" : "compliant",
          }}
          parameterName={parameter.shortName}
          sections={sectionsForParameter(batch, parameter.id).map(
            (section) => ({
              id: section.id,
              name: section.name,
              tone: V3_RESULT_TONE[worstResult(section)],
              clear: countWhere(section.items, isClear),
              total: section.items.length,
              active: section.id === activeSection.id,
              reviewed: sectionStatus(section.id) === "REVIEWED",
            }),
          )}
          onSelect={selectSection}
          updatedAt={batch.lastActivity}
        >
          <V3AiraRail
            reviewer={reviewer.name.split(" ")[0]}
            arNumber={batch.arNumber}
            product={batch.product}
            checksRead={allItems.length}
            sources={sourcesUsedIn(batch)}
            blocking={blocking}
            advisory={advisory}
            gate={{
              done: reviewedCount(batch.arNumber),
              total: totalSections(batch.arNumber),
            }}
            suggestions={exceptions.slice(0, 3).map(({ section }) => ({
              id: section.id,
              label: section.name,
            }))}
            onSuggest={selectSection}
          />
        </V3ReviewNavigator>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Batch-level, so it sits above the section rather than in it,
              and stays put while the section content scrolls. */}
          <V3BatchIntegrityBar batch={batch} />

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {/* Breadcrumb */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="cursor-pointer text-[11px] text-[var(--v3-accent)] transition-opacity duration-[120ms] hover:opacity-80"
              >
                &larr; Dashboard
              </button>
              <span className="text-[11px] text-[var(--v3-text-muted)]">
                &rsaquo;
              </span>
              <span className="text-[11px] font-semibold tracking-[0.06em] text-[var(--v3-text-secondary)] uppercase">
                {parameter.shortName}
              </span>
              <span className="text-[11px] text-[var(--v3-text-muted)]">
                &rsaquo;
              </span>
              <span className="text-[11px] font-semibold tracking-[0.06em] text-[var(--v3-text-secondary)] uppercase">
                {activeSection.name}
              </span>
              <span className="text-[11px] text-[var(--v3-text-muted)]">
                &rsaquo;
              </span>
              <span className="text-[11px] text-[var(--v3-text-secondary)]">
                {activeItem.exceptionType ?? activeItem.label}
              </span>
              <V3Badge tone={tone}>{V3_RESULT_LABEL[verdict]}</V3Badge>
              <span className="flex-1" />
              {activeItem.flagId ? (
                <span className="font-mono text-[11px] text-[var(--v3-text-muted)]">
                  {activeItem.flagId}
                </span>
              ) : null}
            </div>

            {flaggedEntries.length > 0 ? (
              <>
                <div className="mb-2 text-[11px] font-semibold text-[var(--v3-blocking)]">
                  FLAGGED &mdash; Action Required
                </div>
                {flaggedEntries.map(renderEntry)}
              </>
            ) : null}

            {advisoryEntries.length > 0 ? (
              <div className="mt-4">
                <div className="mb-2 text-[11px] font-semibold tracking-[0.06em] text-[var(--v3-advisory)] uppercase">
                  {advisoryEntries.length}{" "}
                  {advisoryEntries.length === 1
                    ? "entry needs"
                    : "entries need"}{" "}
                  a second look
                </div>
                {advisoryEntries.map(renderEntry)}
              </div>
            ) : null}

            {compliantEntries.length > 0 ? (
              <div className="mt-4">
                <div className="mb-2 text-[11px] tracking-[0.06em] text-[var(--v3-text-secondary)] uppercase">
                  {activeSection.name} &mdash; {compliantEntries.length}{" "}
                  {compliantEntries.length === 1
                    ? "compliant entry"
                    : "compliant entries"}
                </div>
                {compliantEntries.map(renderEntry)}
              </div>
            ) : null}
          </div>
        </main>

        <V3FindingPanel
          item={activeItem}
          sectionName={`${parameter.shortName} · ${activeSection.name}`}
          recorded={recorded}
          onFillObservation={() => {
            setDrafts((current) => ({
              ...current,
              [activeItem.id]: draftObservation(activeItem),
            }));
            setSavedId(null);
          }}
        />
      </div>

      <V3StatusBar
        context={`${parameter.shortName} · ${activeSection.name}`}
        counts={[
          { label: "blocking", value: blocking, colour: V3_TONE.blocking },
          { label: "advisory", value: advisory, colour: V3_TONE.advisory },
          { label: "passed", value: passed, colour: V3_TONE.compliant },
          { label: "unreviewed", value: unreviewed, colour: V3_TONE.muted },
        ]}
        outstanding={outstanding}
        reviewed={sectionReviewed}
        onMarkReviewed={() => markSectionReviewed(activeSection.id)}
      />
    </div>
  );
}
