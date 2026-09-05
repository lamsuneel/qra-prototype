"use client";

import { use, useMemo, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Inter, JetBrains_Mono } from "next/font/google";

import {
  getBatch,
  isException,
  orderedSections,
  sectionsForParameter,
  sourcesUsedIn,
} from "@/data";
import { PROFILES } from "@/data/profiles";
import { useReview } from "@/context/ReviewContext";
import {
  resultFor,
  type Batch,
  type CheckItem,
  type ItemResult,
  type Section,
  type TestParameter,
} from "@/types";
import { PageTitle } from "@/components/layout/PageTitle";
import { DarkTopbar } from "@/components/dark/DarkTopbar";
import { V3JourneyMap, type V3NodeState } from "@/components/dark/JourneyMap";
import { V3ReviewNavigator } from "@/components/dark/ReviewNavigator";
import { V3AiraRail } from "@/components/dark/AiraRail";
import { V3EntryCard } from "@/components/dark/EntryCard";
import { V3FindingPanel } from "@/components/dark/FindingPanel";
import { V3StatusBar } from "@/components/dark/StatusBar";
import { V3_RESULT_TONE, V3_THEME_CSS, V3_TONE } from "@/components/dark/theme";

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

const stateFor = (section: Section): V3NodeState => {
  const worst = worstResult(section);
  if (worst === "HARD_INVALID") return "invalid";
  if (worst === "FLAGGED") return "flagged";
  if (ADVISORY_RESULTS.has(worst)) return "advisory";
  return "compliant";
};

/** A section every check in which QRA settled as compliant. */
const isCleanSection = (section: Section) =>
  section.items.length > 0 && section.items.every(isClear);

/**
 * Where a clean review opens.
 *
 * The screen has to land somewhere every check is passing, and it finds that
 * place in the batch rather than being told it: the first parameter QRA
 * settled end to end, and inside that the clean section carrying the most
 * checks, because that is the one that shows what a clean section looks like.
 * A batch with nothing clean in it falls back to its first section, and the
 * header then says how far short of clean that section is.
 */
const openOn = (
  batch: Batch,
  sections: Section[],
): { parameter: TestParameter; section: Section } => {
  const clean = sections.filter(isCleanSection);

  const settled = batch.parameters.find((parameter) => {
    const owned = sectionsForParameter(batch, parameter.id);
    return (
      owned.length > 0 &&
      owned.every((section) => !section.items.some(isException))
    );
  });

  const candidates = settled
    ? clean.filter((section) => section.parameter === settled.id)
    : clean;

  const section =
    [...candidates].sort((a, b) => b.items.length - a.items.length)[0] ??
    sections[0];

  const parameter =
    batch.parameters.find((entry) => entry.id === section.parameter) ??
    batch.parameters[0];

  return { parameter, section };
};

/* -------------------------------------------------------------------------- */

export default function V3CleanReviewPage({
  params,
}: {
  params: Promise<{ ar: string }>;
}) {
  const { ar } = use(params);
  const batch = getBatch(decodeURIComponent(ar));

  if (!batch) notFound();

  return <Workspace batch={batch} />;
}

function Workspace({ batch }: { batch: Batch }) {
  const router = useRouter();
  const { profile, sectionStatus, markSectionReviewed } = useReview();

  const sections = useMemo(() => orderedSections(batch), [batch]);
  const opening = useMemo(() => openOn(batch, sections), [batch, sections]);

  const [sectionId, setSectionId] = useState(opening.section.id);
  const [expandedId, setExpandedId] = useState(
    () => opening.section.items[opening.section.items.length - 1]?.id ?? "",
  );
  const [signedOff, setSignedOff] = useState<string[]>([]);

  const activeSection =
    sections.find((section) => section.id === sectionId) ?? opening.section;
  const parameter =
    batch.parameters.find((entry) => entry.id === activeSection.parameter) ??
    opening.parameter;

  const expandedItem =
    activeSection.items.find((item) => item.id === expandedId) ??
    activeSection.items[activeSection.items.length - 1];

  const selectSection = (nextId: string) => {
    const next = sections.find((section) => section.id === nextId);
    if (!next) return;
    setSectionId(next.id);
    setExpandedId(next.items[next.items.length - 1]?.id ?? "");
  };

  /* ---- Counts, scoped to the parameter in front of the reviewer ----------
     This screen is the clean parameter, so a batch-wide tally would put one
     parameter's findings into a bar that is describing another. */

  const owned = sectionsForParameter(batch, parameter.id);
  const ownedItems = owned.flatMap((section) => section.items);

  const passed = countWhere(ownedItems, isClear);
  const advisory = countWhere(ownedItems, isAdvisory);
  const blocking = countWhere(ownedItems, isException);
  const unreviewed = owned
    .filter((section) => sectionStatus(section.id) !== "REVIEWED")
    .reduce((total, section) => total + section.items.length, 0);

  const reviewedHere = owned.filter(
    (section) => sectionStatus(section.id) === "REVIEWED",
  ).length;

  const groups = batch.parameters.map((entry, index) => {
    const entrySections = sectionsForParameter(batch, entry.id);
    const items = entrySections.flatMap((section) => section.items);
    const flagged = countWhere(items, isException);
    const unsettled = countWhere(items, isAdvisory);

    return {
      id: entry.id,
      label: entry.shortName,
      index: index + 1,
      nodes: entrySections.map((section) => ({
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

  const sectionClear = countWhere(activeSection.items, isClear);
  const sectionTotal = activeSection.items.length;
  const allClear = sectionClear === sectionTotal;
  const sectionReviewed = sectionStatus(activeSection.id) === "REVIEWED";
  const remaining = ownedItems.length - passed;

  const nextSections = owned
    .filter((section) => section.id !== activeSection.id)
    .slice(0, 3);

  const reviewer = profile ?? PROFILES[0];

  return (
    <div
      className={`v3-root ${inter.variable} ${mono.variable} flex h-dvh flex-col overflow-hidden bg-[var(--v3-bg-base)] text-[var(--v3-text-primary)]`}
    >
      <style dangerouslySetInnerHTML={{ __html: V3_THEME_CSS }} />
      <PageTitle title={`${batch.arNumber} — ${activeSection.name}`} />

      <div className="shrink-0">
        <DarkTopbar />
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
            {
              label: "Advisory",
              value: advisory,
              colour: advisory > 0 ? V3_TONE.advisory : V3_TONE.muted,
            },
            {
              label: "Blocking",
              value: blocking,
              colour: blocking > 0 ? V3_TONE.blocking : V3_TONE.muted,
            },
            { label: "Unreviewed", value: unreviewed, colour: V3_TONE.muted },
          ]}
          progress={{
            done: reviewedHere,
            total: owned.length,
            tone: blocking > 0 ? "advisory" : "compliant",
          }}
          parameterName={parameter.shortName}
          sections={owned.map((section) => ({
            id: section.id,
            name: section.name,
            tone: V3_RESULT_TONE[worstResult(section)],
            clear: countWhere(section.items, isClear),
            total: section.items.length,
            active: section.id === activeSection.id,
            reviewed: sectionStatus(section.id) === "REVIEWED",
          }))}
          onSelect={selectSection}
          updatedAt={batch.lastActivity}
        >
          <V3AiraRail
            reviewer={reviewer.name.split(" ")[0]}
            arNumber={batch.arNumber}
            product={batch.product}
            checksRead={ownedItems.length}
            sources={sourcesUsedIn(batch)}
            blocking={blocking}
            advisory={advisory}
            gate={{ done: reviewedHere, total: owned.length }}
            banner={
              blocking > 0
                ? undefined
                : advisory === 0
                  ? {
                      label: `0 flags · all ${passed} passing`,
                      tone: "compliant" as const,
                    }
                  : {
                      label: `0 flags · ${advisory} to confirm`,
                      tone: "advisory" as const,
                    }
            }
            message={
              <>
                All{" "}
                <span className="font-semibold text-[var(--v3-text-primary)]">
                  {passed} checks
                </span>{" "}
                in {parameter.shortName} are passing. You are on{" "}
                <span className="font-semibold text-[var(--v3-text-primary)]">
                  {activeSection.name}
                </span>
                {". "}
                {remaining > 0
                  ? `${remaining} more ${remaining === 1 ? "check" : "checks"} in this parameter still to settle.`
                  : "Nothing further to settle in this parameter."}
              </>
            }
            suggestions={nextSections.map((section) => ({
              id: section.id,
              label: section.name,
            }))}
            onSuggest={selectSection}
          />
        </V3ReviewNavigator>

        <main className="min-w-0 flex-1 overflow-y-auto p-5">
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
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-[var(--v3-text-primary)]">
                {activeSection.name}
              </span>
              {allClear ? (
                <span
                  aria-hidden="true"
                  className="text-[13px] text-[var(--v3-compliant)]"
                >
                  &#10003;
                </span>
              ) : null}
            </div>
            <div
              className="mt-1 font-mono text-[11px]"
              style={{
                color: allClear
                  ? "var(--v3-compliant)"
                  : "var(--v3-text-secondary)",
              }}
            >
              {sectionClear} of {sectionTotal} checks complete
              {allClear ? " · All compliant" : ""}
            </div>
          </div>

          {activeSection.items.map((item) => (
            <V3EntryCard
              key={item.id}
              item={item}
              expanded={item.id === expandedItem?.id}
              onToggle={() =>
                setExpandedId(item.id === expandedItem?.id ? "" : item.id)
              }
              reviewed={signedOff.includes(item.id)}
              onMarkReviewed={() =>
                setSignedOff((current) =>
                  current.includes(item.id) ? current : [...current, item.id],
                )
              }
            />
          ))}
        </main>

        {expandedItem ? (
          <V3FindingPanel
            item={expandedItem}
            sectionName={`${parameter.shortName} · ${activeSection.name}`}
            recorded={signedOff.includes(expandedItem.id)}
            onFillObservation={() => undefined}
            footer={
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSignedOff((current) =>
                      current.includes(expandedItem.id)
                        ? current
                        : [...current, expandedItem.id],
                    )
                  }
                  disabled={signedOff.includes(expandedItem.id)}
                  className="w-full cursor-pointer rounded-[6px] border border-[var(--v3-compliant-border)] bg-[var(--v3-compliant-bg)] py-[7px] text-[11px] font-semibold text-[var(--v3-compliant)] transition-colors duration-[120ms] hover:bg-[rgba(61,184,122,0.20)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {signedOff.includes(expandedItem.id)
                    ? "Reviewed ✓"
                    : "Mark as reviewed ✓"}
                </button>
                <p className="mt-2 text-center text-[9px] leading-[1.4] text-[var(--v3-text-muted)]">
                  No action required. Marking this agrees with what QRA read.
                </p>
              </>
            }
          />
        ) : null}
      </div>

      <V3StatusBar
        context={`${parameter.shortName} · ${activeSection.name}`}
        counts={[
          {
            label: "blocking",
            value: blocking,
            colour: blocking > 0 ? V3_TONE.blocking : V3_TONE.muted,
          },
          {
            label: "advisory",
            value: advisory,
            colour: advisory > 0 ? V3_TONE.advisory : V3_TONE.muted,
          },
          { label: "passed", value: passed, colour: V3_TONE.compliant },
          { label: "unreviewed", value: unreviewed, colour: V3_TONE.muted },
        ]}
        outstanding={0}
        reviewed={sectionReviewed}
        clearMessage={
          allClear ? "✓ All clear — section ready to mark" : undefined
        }
        tone="compliant"
        onMarkReviewed={() => markSectionReviewed(activeSection.id)}
      />
    </div>
  );
}
