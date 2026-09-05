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
 * or a comparison QRA could not make is work still to do. The dashboard's two
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
 * The dark review workspace takes a single batch, so a domain has to name
 * one. It names the batch a reviewer would reach for first: worst SLA, then
 * most flags — the same order the Recent Reviews list is sorted in.
 */
const leadBatchFor = (domain: Domain): Batch | undefined =>
  [...batchesForDomain(domain)].sort(
    (a, b) =>
      URGENCY[a.slaStatus] - URGENCY[b.slaStatus] ||
      flaggedItemsInBatch(b) - flaggedItemsInBatch(a),
  )[0];

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

  const recent = [...ALL_BATCHES]
    .sort(
      (a, b) =>
        URGENCY[a.slaStatus] - URGENCY[b.slaStatus] ||
        flaggedItemsInBatch(b) - flaggedItemsInBatch(a),
    )
    .slice(0, 5);

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
    </div>
  );
}
