"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inter, JetBrains_Mono } from "next/font/google";

import {
  AWAITING_AUTHORISATION_COUNT,
  DOMAIN_RELEASE_PROGRESS,
  PENDING_BY_REASON,
  PENDING_DRILLDOWN,
  PENDING_ESCALATION_DAYS,
  PENDING_WATCH_DAYS,
  PIPELINE_KPIS,
  STABILITY_OUT_OF_WINDOW,
  STABILITY_WINDOW_STATUS,
} from "@/data/dashboard";
import { SITE_NAME } from "@/data/profiles";
import { DEMO_TODAY } from "@/data/clock";
import { downloadOperationsReport } from "@/lib/gm-qa-report";
import { PageTitle } from "@/components/layout/PageTitle";
import { DarkTopbar } from "@/components/dark/DarkTopbar";
import { V3KpiCard } from "@/components/dark/KpiCard";
import { V3Badge } from "@/components/dark/Badge";
import { V3ExceptionBars } from "@/components/dark/ExceptionBars";
import { V3_THEME_CSS, V3_TONE, type V3Tone } from "@/components/dark/theme";

/* The design's two faces, scoped to the v3 subtree. */
const inter = Inter({ subsets: ["latin"], variable: "--v3-font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--v3-font-mono" });

/**
 * Whose desk this screen sits on.
 *
 * Named here rather than read from the signed-in profile: the page speaks for
 * one office, and it has to read the same whether or not anyone has picked a
 * profile on the way in.
 */
const GM_QA = {
  name: "Rajesh Reddy",
  roleLabel: "GM - Quality Assurance",
  initials: "RR",
  avatarColour: V3_TONE.advisory,
};

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

/**
 * A held sample's tone, on the same two thresholds the pipeline already uses:
 * a few days is a queue, past a week is a conversation.
 */
const heldTone = (days: number): V3Tone =>
  days > PENDING_ESCALATION_DAYS
    ? "blocking"
    : days >= PENDING_WATCH_DAYS
      ? "advisory"
      : "muted";

const valueOf = (title: string) =>
  PIPELINE_KPIS.find((kpi) => kpi.title === title)?.value ?? "";

/* -------------------------------------------------------------------------- */

export default function V3OperationsPage() {
  const router = useRouter();

  /* One bar open at a time; clicking the open one closes it. */
  const [drilldown, setDrilldown] = useState<string | null>(null);
  const held = drilldown ? PENDING_DRILLDOWN[drilldown] : undefined;

  const month = `${MONTHS[DEMO_TODAY.getMonth()]} ${DEMO_TODAY.getFullYear()}`;

  /* Past the escalation threshold is no longer a scheduling slip. */
  const escalated = STABILITY_OUT_OF_WINDOW.filter(
    (row) => row.daysOverdue > STABILITY_WINDOW_STATUS.escalationDays,
  ).length;

  return (
    <div
      className={`v3-root ${inter.variable} ${mono.variable} min-h-dvh bg-[var(--v3-bg-base)] text-[var(--v3-text-primary)]`}
    >
      <style dangerouslySetInnerHTML={{ __html: V3_THEME_CSS }} />
      <PageTitle title="QA Operations Dashboard" />

      <DarkTopbar user={GM_QA} search={false} />

      <main className="p-7">
        {/* Page header --------------------------------------------------- */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold text-[var(--v3-text-primary)]">
              QA Operations Dashboard
            </h1>
            <p className="mt-1 text-[13px] text-[var(--v3-text-secondary)]">
              {SITE_NAME} &middot; {month}
            </p>
            <p className="mt-0.5 text-[9px] text-[var(--v3-text-muted)] italic">
              Illustrative data &middot; Simulated {month}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => downloadOperationsReport(`${GM_QA.name} — GM-QA`)}
              className="cursor-pointer rounded-md border border-[var(--v3-border-strong)] px-4 py-1.5 text-[11px] font-semibold text-[var(--v3-text-secondary)] transition-colors duration-[120ms] hover:text-[var(--v3-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--v3-accent)] focus-visible:outline-none"
            >
              Download Operations Report <span aria-hidden="true">&darr;</span>
            </button>

            {/* The queue is this role's job; the rest of the page is the
                context it is done in. So this button, and only this one,
                carries the accent. */}
            <button
              type="button"
              onClick={() => router.push("/legacy/authorise")}
              className="cursor-pointer rounded-md border border-[var(--v3-accent-border)] bg-[var(--v3-accent-bg)] px-4 py-1.5 text-[11px] font-semibold text-[var(--v3-accent)] transition-colors duration-[120ms] hover:bg-[rgba(77,158,255,0.20)] focus-visible:ring-2 focus-visible:ring-[var(--v3-accent)] focus-visible:outline-none"
            >
              Go to QA Authorisation Queue{" "}
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </div>

        {/* Row 1 — where every sample in the building currently sits ------ */}
        <div className="mb-6 grid grid-cols-6 gap-3">
          <V3KpiCard
            dense
            label="Total Active Samples"
            value={valueOf("Total Active Samples")}
            sub="Across the pipeline"
          />
          <V3KpiCard
            dense
            label="Under Analysis"
            value={valueOf("Under Analysis")}
            sub="In lab processing"
          />
          <V3KpiCard
            dense
            label="Under QC Review"
            value={valueOf("Under QC Review")}
            sub="Awaiting QC sign-off"
          />
          <V3KpiCard
            dense
            accent={V3_TONE.advisory}
            label="Pending QA Review"
            value={valueOf("Pending QA Review")}
            sub="Awaiting QA review"
            subColour={V3_TONE.advisory}
          />
          <V3KpiCard
            dense
            accent={V3_TONE.advisory}
            label="Pending Manager Approval"
            value={valueOf("Pending Manager Approval")}
            sub={`${AWAITING_AUTHORISATION_COUNT} awaiting your signature`}
            subColour={V3_TONE.advisory}
          />
          <V3KpiCard
            dense
            accent={V3_TONE.compliant}
            label="Released This Month"
            value={valueOf("Released This Month")}
            sub={month}
            subColour={V3_TONE.compliant}
          />
        </div>

        {/* Row 2 — samples already past their pull date ------------------- */}
        <section className="mb-6 rounded-[12px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-[15px] font-semibold text-[var(--v3-text-primary)]">
              {STABILITY_WINDOW_STATUS.title}
            </h2>
            <V3Badge tone={escalated > 0 ? "blocking" : "advisory"}>
              {STABILITY_OUT_OF_WINDOW.length} out of window &middot;{" "}
              {escalated} to escalate
            </V3Badge>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                {[
                  "AR Number",
                  "Product",
                  "Stage",
                  "Scheduled",
                  "Window",
                  "Action",
                ].map((head) => (
                  <th
                    key={head}
                    className="border-b border-[var(--v3-border-default)] bg-[var(--v3-bg-surface)] px-3 py-2 text-[9px] font-medium tracking-[0.08em] whitespace-nowrap text-[var(--v3-text-secondary)] uppercase"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STABILITY_OUT_OF_WINDOW.map((row) => {
                const escalate =
                  row.daysOverdue > STABILITY_WINDOW_STATUS.escalationDays;

                return (
                  <tr
                    key={row.arNumber}
                    className="border-b border-[var(--v3-border-subtle)] last:border-b-0"
                  >
                    <td className="px-3 py-2.5 font-mono text-[11px] text-[var(--v3-accent)]">
                      {row.arNumber}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-[var(--v3-text-primary)]">
                      {row.product}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-[var(--v3-text-secondary)]">
                      {row.stage}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-[var(--v3-text-mono)]">
                      {row.scheduled}
                    </td>
                    <td
                      className="px-3 py-2.5 text-[12px] whitespace-nowrap"
                      style={{
                        color: escalate ? V3_TONE.blocking : V3_TONE.advisory,
                        fontWeight: escalate ? 700 : 400,
                      }}
                    >
                      {row.daysOverdue} days overdue
                    </td>
                    <td className="px-3 py-2.5">
                      <V3Badge tone={escalate ? "blocking" : "advisory"}>
                        {row.action}
                      </V3Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="mt-2.5 text-[10px] text-[var(--v3-text-muted)] italic">
            {STABILITY_WINDOW_STATUS.subheading} &middot; over{" "}
            {STABILITY_WINDOW_STATUS.escalationDays} days late is escalated
            rather than rescheduled.
          </p>
        </section>

        {/* Row 3 — why samples are sitting rather than moving ------------- */}
        <div className="mb-6">
          <V3ExceptionBars
            points={PENDING_BY_REASON.map((row) => ({
              category: row.reason,
              count: row.samples,
            }))}
            selected={drilldown}
            onSelect={(reason) =>
              setDrilldown((current) => (current === reason ? null : reason))
            }
            title="Samples Pending Analysis — By Reason"
            subtitle="Click any bar to see the samples behind it"
          />
        </div>

        {/* The samples behind whichever bar is open ----------------------- */}
        {drilldown && held ? (
          <section className="mb-6 rounded-[12px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-[13px] font-semibold text-[var(--v3-text-primary)]">
                {drilldown} &middot; {held.total} samples held &middot; oldest{" "}
                {held.samples.length} shown
              </h2>
              <button
                type="button"
                onClick={() => setDrilldown(null)}
                className="cursor-pointer text-[10px] text-[var(--v3-text-secondary)] hover:text-[var(--v3-text-primary)]"
              >
                Close
              </button>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--v3-border-default)] text-left">
                  {[
                    "AR Number",
                    "Product",
                    "Domain",
                    "Held Since",
                    "Days",
                    "Why",
                  ].map((head) => (
                    <th
                      key={head}
                      className="py-1.5 text-[9px] font-medium tracking-[0.08em] whitespace-nowrap text-[var(--v3-text-secondary)] uppercase"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...held.samples]
                  .sort((a, b) => b.daysPending - a.daysPending)
                  .map((sample) => (
                    <tr
                      key={sample.arNumber}
                      className="border-b border-[var(--v3-border-subtle)] last:border-b-0"
                    >
                      <td className="py-2 font-mono text-[11px] text-[var(--v3-accent)]">
                        {sample.arNumber}
                      </td>
                      <td className="py-2 text-[12px] text-[var(--v3-text-primary)]">
                        {sample.product}
                      </td>
                      <td className="py-2 text-[11px] text-[var(--v3-text-secondary)]">
                        {sample.domain}
                      </td>
                      <td className="py-2 font-mono text-[11px] text-[var(--v3-text-mono)]">
                        {sample.pendingSince}
                      </td>
                      <td className="py-2">
                        <V3Badge tone={heldTone(sample.daysPending)}>
                          {sample.daysPending} days
                        </V3Badge>
                      </td>
                      <td className="py-2 text-[12px] text-[var(--v3-text-primary)]">
                        {sample.note}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {/* Row 4 — how far each domain has got through the month ---------- */}
        <section className="rounded-[12px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-[var(--v3-text-primary)]">
            Domain Release Progress &mdash; {month}
          </h2>

          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="border-b border-[var(--v3-border-default)] bg-[var(--v3-bg-surface)] px-3 py-2 text-[9px] font-medium tracking-[0.08em] whitespace-nowrap text-[var(--v3-text-secondary)] uppercase">
                  Domain
                </th>
                {[
                  "Samples In",
                  "Completed",
                  "Pending",
                  "% Complete",
                  "Avg Days",
                ].map((head) => (
                  <th
                    key={head}
                    className="border-b border-[var(--v3-border-default)] bg-[var(--v3-bg-surface)] px-3 py-2 text-center text-[9px] font-medium tracking-[0.08em] whitespace-nowrap text-[var(--v3-text-secondary)] uppercase"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DOMAIN_RELEASE_PROGRESS.map((row, index) => (
                <tr
                  key={row.domain}
                  className={
                    index % 2 === 1 ? "bg-[var(--v3-bg-base)]" : undefined
                  }
                >
                  <td className="px-3 py-2.5 text-[12px] text-[var(--v3-text-primary)]">
                    {row.domain}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-[12px] text-[var(--v3-text-secondary)] tabular-nums">
                    {row.samplesIn}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-[12px] text-[var(--v3-text-secondary)] tabular-nums">
                    {row.completed}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-[12px] text-[var(--v3-text-secondary)] tabular-nums">
                    {row.pending}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <V3Badge
                      tone={
                        row.percentComplete >= 90 ? "compliant" : "advisory"
                      }
                    >
                      {row.percentComplete}%
                    </V3Badge>
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-[12px] text-[var(--v3-text-mono)] tabular-nums">
                    {row.avgDays}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
