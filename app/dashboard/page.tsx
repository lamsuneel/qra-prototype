"use client";

import { useRouter } from "next/navigation";
import { Inter, JetBrains_Mono } from "next/font/google";

import {
  ALL_BATCHES,
  batchesForDomain,
  domainSummaries,
  flaggedItemsInBatch,
} from "@/data";
import { KPIS } from "@/data/dashboard";
import { SITE_NAME } from "@/data/profiles";
import { DEMO_TODAY } from "@/data/clock";
import { DOMAIN_META, DOMAINS, resultFor } from "@/types";
import type { Batch, Domain, SlaStatus } from "@/types";
import { PageTitle } from "@/components/layout/PageTitle";
import { DarkTopbar } from "@/components/dark/DarkTopbar";
import { V3KpiCard } from "@/components/dark/KpiCard";
import { V3DomainCard } from "@/components/dark/DomainCard";
import { V3ActivityRow } from "@/components/dark/ActivityRow";
import { V3AiraHeading, V3InsightCard } from "@/components/dark/InsightCard";
import { V3AiraAgent } from "@/components/dark/AiraAgent";
import type { AiraTopic } from "@/components/dark/AiraAgent";
import {
  AlertCircleIcon,
  ClockIcon,
  DOMAIN_ICON,
  LayersIcon,
  TargetIcon,
} from "@/components/dark/Icons";
import {
  V3_SLA_TONE,
  V3_THEME_CSS,
  V3_TONE,
  type V3Tone,
} from "@/components/dark/theme";

/* The design's two faces. Scoped to this subtree — the rest of the app is on
   Geist and stays there. */
const inter = Inter({ subsets: ["latin"], variable: "--v3-font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--v3-font-mono" });

/* -------------------------------------------------------------------------- */
/* Counting                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Blocking and advisory, split the way the review model already splits them:
 * a flagged or unusable entry stops the batch, while a condition to confirm
 * or a comparison NeuraTrace could not make is work still to do. The dashboard's two
 * numbers are those two states, not a new severity scheme laid over them.
 */
const countIn = (batch: Batch, results: string[]): number =>
  batch.sections.reduce(
    (total, section) =>
      total +
      section.items.filter((item) => results.includes(resultFor(item))).length,
    0,
  );

const advisoryItemsInBatch = (batch: Batch): number =>
  countIn(batch, ["NEEDS_VERIFICATION", "CONDITIONAL_PASS"]);

const compliantItemsInBatch = (batch: Batch): number =>
  countIn(batch, ["COMPLIANT"]);

const totalItemsInBatch = (batch: Batch): number =>
  batch.sections.reduce((total, section) => total + section.items.length, 0);

const sum = (batches: Batch[], of: (batch: Batch) => number): number =>
  batches.reduce((total, batch) => total + of(batch), 0);

/** Flags first, then conditions, then the SLA state when there is neither. */
const badgeFor = (
  blocking: number,
  advisory: number,
  sla: SlaStatus,
  clear: string,
): { tone: V3Tone; label: string } => {
  if (blocking > 0) return { tone: "blocking", label: `${blocking} flagged` };
  if (advisory > 0) return { tone: "advisory", label: `${advisory} advisory` };
  return { tone: V3_SLA_TONE[sla], label: clear };
};

/** Worst SLA first — what a reviewer opening the screen has to deal with. */
const URGENCY: Record<SlaStatus, number> = { red: 0, amber: 1, green: 2 };

/**
 * The batch a domain opens on.
 *
 * Flags first, then SLA — deliberately not the order Recent Reviews uses.
 * That list answers "what is most urgent"; a domain card answers the count
 * printed on its own face, which is a flag count. Sorting by SLA here opened
 * Finished Product's one clean batch from a card reading "9 flagged".
 */
const leadBatchFor = (domain: Domain): Batch | undefined =>
  [...batchesForDomain(domain)].sort(
    (a, b) =>
      flaggedItemsInBatch(b) - flaggedItemsInBatch(a) ||
      URGENCY[a.slaStatus] - URGENCY[b.slaStatus],
  )[0];

/**
 * The batches the dashboard offers, named rather than derived.
 *
 * A sort would re-rank these whenever a fixture changed, which is how the
 * list came to lead on a batch with nothing in it. The demo walks a fixed
 * path, so the path is written down.
 */
const DEMO_PATH = ["07-FP-26-0122", "07-RM-26-4417", "07-FP-26-0121"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* -------------------------------------------------------------------------- */

export default function V3DashboardPage() {
  const router = useRouter();

  const summaries = domainSummaries();
  const blockingTotal = sum(ALL_BATCHES, flaggedItemsInBatch);
  const advisoryTotal = sum(ALL_BATCHES, advisoryItemsInBatch);

  const cycle = KPIS.find((kpi) => kpi.title === "Avg Cycle Time");
  const sla = KPIS.find((kpi) => kpi.title === "SLA Compliance");

  /* The domain carrying the most flags, and the first batch past its SLA —
     what the two drill-down links on the KPI cards point at. */
  const worstDomain = [...summaries].sort(
    (a, b) => b.flaggedCount - a.flaggedCount,
  )[0];
  const breached = ALL_BATCHES.find((batch) => batch.slaStatus === "red");
  const worstFlagged = worstDomain
    ? leadBatchFor(worstDomain.domain)
    : undefined;

  /* The batch carrying the most conditions to confirm. Not the same batch as
     the worst flagged one: a flag stops the batch, a condition is work still
     to do, and they pile up in different places. */
  const worstAdvisory = [...ALL_BATCHES].sort(
    (a, b) => advisoryItemsInBatch(b) - advisoryItemsInBatch(a),
  )[0];

  const breachedCount = ALL_BATCHES.filter(
    (batch) => batch.slaStatus === "red",
  ).length;

  const recent = DEMO_PATH.map((ar) =>
    ALL_BATCHES.find((batch) => batch.arNumber === ar),
  ).filter((batch): batch is Batch => batch !== undefined);

  /* What AIRA can be asked here. Every figure is the one already rendered
     above, so the agent restates the dashboard rather than second-guessing
     it — and the questions are the ones this desk actually opens with. */
  const topics: AiraTopic[] = [
    {
      id: "flags",
      question: "Where are the flags?",
      keywords: ["flag", "block", "worst", "domain", "exception"],
      answer: worstDomain
        ? `${blockingTotal} flags are open across ${ALL_BATCHES.length} batches. ${
            worstDomain.flaggedCount
          } of them sit in ${
            DOMAIN_META[worstDomain.domain as Domain].name
          }, over ${worstDomain.batchCount} ${
            worstDomain.batchCount === 1 ? "batch" : "batches"
          } — more than any other domain.`
        : "No blocking entries are open on any batch under review.",
      action: worstFlagged
        ? {
            label: `Open ${worstFlagged.arNumber}`,
            onClick: () => router.push(`/review/${worstFlagged.arNumber}`),
          }
        : undefined,
    },
    {
      id: "advisory",
      question: "What needs verifying?",
      keywords: ["verif", "advisory", "condition", "confirm", "pending"],
      answer: worstAdvisory
        ? `${advisoryTotal} entries passed on value but carry a condition I could not confirm from the record. ${
            worstAdvisory.arNumber
          } holds ${advisoryItemsInBatch(
            worstAdvisory,
          )} of them. None block release — each needs a reviewer to say so.`
        : "Nothing is waiting on a condition. Every entry either passed outright or is flagged.",
      action: worstAdvisory
        ? {
            label: `Open ${worstAdvisory.arNumber}`,
            onClick: () => router.push(`/review/${worstAdvisory.arNumber}`),
          }
        : undefined,
    },
    {
      id: "sla",
      question: "Which batches are late?",
      keywords: ["late", "sla", "overdue", "breach", "time", "slow"],
      answer: breached
        ? `${breachedCount} of ${ALL_BATCHES.length} batches are past their review SLA, including ${breached.arNumber} (${breached.product}) — ${breached.slaLabel}.`
        : `All ${ALL_BATCHES.length} batches under review are inside their SLA window.`,
      action: breached
        ? {
            label: `Open ${breached.arNumber}`,
            onClick: () => router.push(`/review/${breached.arNumber}`),
          }
        : undefined,
    },
    {
      id: "start",
      question: "Where should I start?",
      keywords: ["start", "first", "next", "priorit", "should i", "do now"],
      answer: worstFlagged
        ? `${worstFlagged.arNumber} (${worstFlagged.product}). It carries ${flaggedItemsInBatch(
            worstFlagged,
          )} flags — the most of any batch — and a flag stops release, so it is the one that decides whether this domain moves.`
        : "Nothing is blocked. The queue is conditions to confirm rather than flags to clear.",
      action: worstFlagged
        ? {
            label: `Open ${worstFlagged.arNumber}`,
            onClick: () => router.push(`/review/${worstFlagged.arNumber}`),
          }
        : undefined,
    },
  ];

  return (
    <div
      className={`v3-root ${inter.variable} ${mono.variable} min-h-dvh bg-[var(--v3-bg-base)] text-[var(--v3-text-primary)]`}
    >
      <style dangerouslySetInnerHTML={{ __html: V3_THEME_CSS }} />
      <PageTitle title="QA Dashboard" />

      <DarkTopbar />

      <main className="p-8">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-semibold text-[var(--v3-text-primary)]">
            QA Dashboard
          </h1>
          <div className="flex items-center gap-4 text-[12px] text-[var(--v3-text-secondary)]">
            <span>{SITE_NAME}</span>
            <span>
              {MONTHS[DEMO_TODAY.getMonth()]} {DEMO_TODAY.getFullYear()}
            </span>
          </div>
        </div>
        <p className="mb-6 text-[12px] text-[var(--v3-text-secondary)]">
          {DOMAINS.length} domains &middot; {ALL_BATCHES.length} batches under
          review &middot; {blockingTotal} flags open
        </p>

        {/* Row 1 — the four headline figures */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          <V3KpiCard
            icon={<LayersIcon />}
            label="Batches Under Review"
            value={String(ALL_BATCHES.length)}
            sub={`Across ${DOMAINS.length} domains`}
          />

          <V3KpiCard
            icon={<AlertCircleIcon />}
            iconColour={V3_TONE.blocking}
            accent={V3_TONE.blocking}
            label="Flags Open"
            value={String(blockingTotal)}
            valueColour={V3_TONE.blocking}
            sub={`${blockingTotal} blocking · ${advisoryTotal} advisory`}
            action={
              worstFlagged
                ? {
                    label: "View blocking",
                    colour: V3_TONE.blocking,
                    onClick: () =>
                      router.push(`/review/${worstFlagged.arNumber}`),
                  }
                : undefined
            }
          />

          <V3KpiCard
            icon={<ClockIcon />}
            iconColour={V3_TONE.advisory}
            accent={V3_TONE.compliant}
            label="Avg Cycle Time"
            value={(cycle?.value ?? "").replace(" days", "")}
            sub={`days · ${cycle?.trend ?? ""}`}
            subColour={V3_TONE.compliant}
          />

          <V3KpiCard
            icon={<TargetIcon />}
            iconColour={V3_TONE.advisory}
            accent={V3_TONE.advisory}
            label="SLA Compliance"
            value={sla?.value ?? ""}
            sub={sla?.trend ?? ""}
            subColour={V3_TONE.advisory}
            action={
              breached
                ? {
                    label: "View breach",
                    colour: V3_TONE.advisory,
                    onClick: () => router.push(`/review/${breached.arNumber}`),
                  }
                : undefined
            }
          />
        </div>

        {/* Row 2 — the review domains */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--v3-text-primary)]">
            Review Domains
          </h2>
          <button
            type="button"
            onClick={() => router.push("/legacy/dashboard")}
            className="cursor-pointer text-[11px] text-[var(--v3-accent)] hover:underline"
          >
            View all &rarr;
          </button>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-4">
          {summaries.map((summary) => {
            const meta = DOMAIN_META[summary.domain as Domain];
            const batches = batchesForDomain(summary.domain);
            const advisory = sum(batches, advisoryItemsInBatch);
            const items = sum(batches, totalItemsInBatch);
            const clean = sum(batches, compliantItemsInBatch);
            /* What share of this domain's checks came back clean. The design
               leaves the bar's meaning undefined; this is the one figure the
               card can carry without repeating a number printed above it. */
            const share = items === 0 ? 0 : Math.round((clean / items) * 100);
            const Icon = DOMAIN_ICON[summary.domain as Domain];

            return (
              <V3DomainCard
                key={summary.domain}
                name={meta.name}
                arNumber={leadBatchFor(summary.domain)?.arNumber ?? ""}
                icon={<Icon />}
                colour={V3_TONE[V3_SLA_TONE[summary.slaStatus]]}
                badge={badgeFor(
                  summary.flaggedCount,
                  advisory,
                  summary.slaStatus,
                  summary.slaNote,
                )}
                meta={`${summary.batchCount} ${
                  summary.batchCount === 1 ? "batch" : "batches"
                } · ${summary.flaggedCount} flagged`}
                progress={share}
                progressLabel={`${share}% of checks compliant`}
                time={
                  batches[0] ? `Last activity ${batches[0].lastActivity}` : ""
                }
              />
            );
          })}
        </div>

        {/* Row 2b — what AIRA noticed --------------------------------- */}
        <V3AiraHeading
          title="&#10022; AIRA Insights"
          subtitle="Evidence-backed signals requiring attention"
        />

        <div className="mb-8 grid grid-cols-3 gap-3">
          <V3InsightCard
            tag="Pattern detected"
            title={
              worstDomain
                ? `${DOMAIN_META[worstDomain.domain as Domain].name} carries ${
                    worstDomain.flaggedCount
                  } of ${blockingTotal} open flags`
                : "No flags open across any domain"
            }
            body={
              worstDomain
                ? `${worstDomain.flaggedCount} of the ${blockingTotal} flags open across the estate sit in ${
                    DOMAIN_META[worstDomain.domain as Domain].name
                  }, over ${worstDomain.batchCount} ${
                    worstDomain.batchCount === 1 ? "batch" : "batches"
                  }. Clearing that domain clears most of the board.`
                : "Every batch under review is free of blocking entries."
            }
            action={
              worstFlagged
                ? {
                    label: `Open ${worstFlagged.arNumber}`,
                    onClick: () =>
                      router.push(`/review/${worstFlagged.arNumber}`),
                  }
                : undefined
            }
          />

          <V3InsightCard
            tag="Needs verification"
            title={`${advisoryTotal} entries need a condition confirmed`}
            body={
              worstAdvisory
                ? `${advisoryTotal} entries passed on value but carry a condition NeuraTrace could not confirm from the record. ${
                    worstAdvisory.arNumber
                  } holds ${advisoryItemsInBatch(
                    worstAdvisory,
                  )} of them — the most of any batch. None of these block release; all of them need a reviewer to say so.`
                : "Every entry either passed outright or is already flagged."
            }
            action={
              worstAdvisory
                ? {
                    label: `Open ${worstAdvisory.arNumber}`,
                    onClick: () =>
                      router.push(`/review/${worstAdvisory.arNumber}`),
                  }
                : undefined
            }
          />

          <V3InsightCard
            tag="Potential concern"
            title={
              breachedCount > 0
                ? `${breachedCount} ${
                    breachedCount === 1 ? "batch is" : "batches are"
                  } past the review SLA`
                : "Every batch is inside its review SLA"
            }
            body={
              breached
                ? `${breachedCount} of ${ALL_BATCHES.length} batches under review are past their SLA, ${breached.arNumber} (${breached.product}) among them — ${breached.slaLabel}.`
                : `All ${ALL_BATCHES.length} batches under review are inside their SLA window.`
            }
            action={
              breached
                ? {
                    label: `Open ${breached.arNumber}`,
                    onClick: () => router.push(`/review/${breached.arNumber}`),
                  }
                : undefined
            }
          />
        </div>

        {/* Row 3 — the batches themselves */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--v3-text-primary)]">
            Recent Reviews
          </h2>
          <button
            type="button"
            onClick={() => router.push("/legacy/dashboard")}
            className="cursor-pointer text-[11px] text-[var(--v3-accent)] hover:underline"
          >
            View all &rarr;
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {recent.map((batch) => {
            const blocking = flaggedItemsInBatch(batch);
            const advisory = advisoryItemsInBatch(batch);

            return (
              <V3ActivityRow
                key={batch.arNumber}
                arNumber={batch.arNumber}
                product={batch.product}
                domain={DOMAIN_META[batch.domain].name}
                badge={badgeFor(
                  blocking,
                  advisory,
                  batch.slaStatus,
                  batch.slaLabel,
                )}
                dotColour={V3_TONE[V3_SLA_TONE[batch.slaStatus]]}
                time={batch.lastActivity}
              />
            );
          })}
        </div>
      </main>

      <V3AiraAgent
        scope={`the QA Dashboard — ${ALL_BATCHES.length} batches across ${DOMAINS.length} domains`}
        greeting={`I have read all ${ALL_BATCHES.length} batches under review. ${blockingTotal} flags are open and ${advisoryTotal} entries need a condition confirmed. Ask me where to start.`}
        topics={topics}
      />
    </div>
  );
}
