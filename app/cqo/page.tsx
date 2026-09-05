"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inter, JetBrains_Mono } from "next/font/google";

import { ALL_BATCHES } from "@/data";
import {
  CYCLE_TIME_TREND,
  EXCEPTIONS_BY_PARAMETER,
  EXCEPTION_DRILLDOWN,
  KPIS,
  MANAGEMENT_ALERTS,
  MANAGEMENT_FOOTER_NOTE,
  RECURRING_ISSUES,
  RECURRING_ISSUES_INSIGHT,
  SLA_TARGET_DAYS,
  STABILITY_OUT_OF_WINDOW,
  STABILITY_WINDOW_STATUS,
} from "@/data/dashboard";
import { SITE_NAME } from "@/data/profiles";
import { DEMO_TODAY } from "@/data/clock";
import { downloadAuditReport } from "@/lib/audit-report";
import { PageTitle } from "@/components/layout/PageTitle";
import { DarkTopbar } from "@/components/dark/DarkTopbar";
import { V3KpiCard } from "@/components/dark/KpiCard";
import { V3CycleTimeChart } from "@/components/dark/CycleTimeChart";
import { V3ExceptionBars } from "@/components/dark/ExceptionBars";
import { V3AiraHeading, V3InsightCard } from "@/components/dark/InsightCard";
import { V3AiraAgent } from "@/components/dark/AiraAgent";
import type { AiraTopic } from "@/components/dark/AiraAgent";
import { V3AlertRow } from "@/components/dark/AlertRow";
import {
  AlertCircleIcon,
  ClockIcon,
  LayersIcon,
  TargetIcon,
} from "@/components/dark/Icons";
import { V3_THEME_CSS, V3_TONE } from "@/components/dark/theme";

/* The design's two faces, scoped to the v3 subtree. */
const inter = Inter({ subsets: ["latin"], variable: "--v3-font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--v3-font-mono" });

/**
 * Whose desk this screen sits on.
 *
 * Named here rather than read from the signed-in profile: the page speaks for
 * one office, and it has to read the same whether or not anyone has picked a
 * profile on the way in.
 *
 * Deliberately not one of the reviewer profiles. The quality function cannot
 * be headed by the analyst who ran the test it is reviewing, and this screen's
 * own top alert points at a batch a named reviewer worked on.
 */
const CQO = {
  name: "Dr. Sunita Rao",
  roleLabel: "Chief Quality Officer",
  initials: "SR",
  avatarColour: V3_TONE.blocking,
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

const AR_SHAPE = /^\d{2}-[A-Z]+-\d{2}-\d+$/;

/**
 * An alert's detail line, split into the batch it is about and the rest.
 *
 * The AR number is written into the middle of some detail lines and the front
 * of others, so it is found by its shape rather than by its position — the
 * alternative is storing the same batch twice and letting the two drift.
 */
const readAlert = (detail: string) => {
  const parts = detail.split(" · ").map((part) => part.trim());
  const arNumber = parts.find((part) => AR_SHAPE.test(part)) ?? null;

  return {
    arNumber,
    description: parts.filter((part) => part !== arNumber).join(" · "),
  };
};

const valueOf = (title: string) =>
  KPIS.find((kpi) => kpi.title === title)?.value ?? "";

const trendOf = (title: string) =>
  KPIS.find((kpi) => kpi.title === title)?.trend ?? "";

/* -------------------------------------------------------------------------- */

export default function V3CqoPage() {
  const router = useRouter();

  /* One bar open at a time; clicking the open one closes it. The insight
     cards reach the same state, so a signal and its evidence are one click
     apart rather than one screen apart. */
  const [drilldown, setDrilldown] = useState<string | null>(null);
  const open = (category: string) =>
    setDrilldown((current) => (current === category ? null : category));

  const breached = ALL_BATCHES.find((batch) => batch.slaStatus === "red");
  const rows = drilldown ? (EXCEPTION_DRILLDOWN[drilldown] ?? []) : [];

  /* The three insights, each counted from the same tables the panels below
     are drawn from — so a card can never claim a number the evidence under
     it does not show. */
  const rsBatches = EXCEPTION_DRILLDOWN["Related Substances"] ?? [];
  const kfBatches = EXCEPTION_DRILLDOWN["KF — determination count"] ?? [];
  const kfDomains = new Set(kfBatches.map((row) => row.domain)).size;
  const worstStability = [...STABILITY_OUT_OF_WINDOW].sort(
    (a, b) => b.daysOverdue - a.daysOverdue,
  )[0];

  const exceptionTotal = EXCEPTIONS_BY_PARAMETER.reduce(
    (total, row) => total + row.count,
    0,
  );
  /* Sorted rather than taken at [0]: the fixture happens to be in order,
     and an agent that says "leads with" must not depend on that. */
  const topException = [...EXCEPTIONS_BY_PARAMETER].sort(
    (a, b) => b.count - a.count,
  )[0];
  const cycle = KPIS.find((kpi) => kpi.title === "Avg Cycle Time");
  const rft = KPIS.find((kpi) => kpi.title === "Right First Time");
  const openOos = MANAGEMENT_ALERTS.filter(
    (alert) => alert.label === "OOS Open",
  ).length;

  /* What AIRA can be asked here. The three insight cards state what it found;
     these are the questions this office asks back, answered from the same
     tables so the two can never disagree. */
  const topics: AiraTopic[] = [
    {
      id: "exceptions",
      question: "What drives the exceptions?",
      keywords: [
        "exception",
        "drive",
        "cause",
        "most",
        "parameter",
        "recurring",
        "pattern",
      ],
      answer: `${exceptionTotal} exceptions were raised this month across ${EXCEPTIONS_BY_PARAMETER.length} parameters. ${topException.category} leads with ${topException.count}, on ${rsBatches.length} ${
        rsBatches.length === 1 ? "batch" : "batches"
      }. That is one parameter accounting for ${Math.round(
        (topException.count / exceptionTotal) * 100,
      )}% of everything raised.`,
      action: {
        label: `View ${topException.category}`,
        onClick: () => open(topException.category),
      },
    },
    {
      id: "oos",
      question: "What is still open?",
      keywords: ["open", "oos", "close", "outstanding", "unresolved", "alert"],
      answer: `${MANAGEMENT_ALERTS.length} alerts stand this month, ${openOos} of them OOS investigations awaiting close-out. ${
        breached
          ? `${breached.arNumber} (${breached.product}) is the one batch past its SLA.`
          : "No batch is past its SLA."
      }`,
    },
    {
      id: "stability",
      question: "Are we exposed on stability?",
      keywords: [
        "stability",
        "expos",
        "risk",
        "window",
        "overdue",
        "escalat",
        "oot",
      ],
      answer: worstStability
        ? `${STABILITY_OUT_OF_WINDOW.length} stability samples are outside their testing window. ${worstStability.arNumber} (${worstStability.product}) is ${worstStability.daysOverdue} days overdue, past the ${STABILITY_WINDOW_STATUS.escalationDays}-day escalation threshold. Out-of-window pulls are a data-integrity exposure before they are a scheduling one — the result cannot be attributed to the timepoint on the protocol.`
        : "Every stability sample is inside its configured testing window.",
      action: {
        label: "View stability tracker",
        onClick: () => router.push("/legacy/management/gm-qa"),
      },
    },
    {
      id: "performance",
      question: "How is the function performing?",
      keywords: [
        "perform",
        "cycle",
        "time",
        "rft",
        "right first",
        "trend",
        "kpi",
        "doing",
      ],
      answer: `Cycle time is ${cycle?.value ?? "unreported"} against a ${SLA_TARGET_DAYS}-day target (${cycle?.trend ?? "no trend on record"}). Right First Time is ${rft?.value ?? "unreported"}, ${rft?.trend ?? "with no comparison on record"}. The headline is improving while ${exceptionTotal} exceptions still cluster on ${topException.category.toLowerCase()} — speed is not the constraint here.`,
    },
  ];

  return (
    <div
      className={`v3-root ${inter.variable} ${mono.variable} min-h-dvh bg-[var(--v3-bg-base)] text-[var(--v3-text-primary)]`}
    >
      <style dangerouslySetInnerHTML={{ __html: V3_THEME_CSS }} />
      <PageTitle title="Batch Review Performance" />

      <DarkTopbar user={CQO} search={false} />

      <main className="p-7">
        {/* Page header --------------------------------------------------- */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold text-[var(--v3-text-primary)]">
              Batch Review Performance
            </h1>
            <p className="mt-1 text-[13px] text-[var(--v3-text-secondary)]">
              {SITE_NAME} &middot; {MONTHS[DEMO_TODAY.getMonth()]}{" "}
              {DEMO_TODAY.getFullYear()}
            </p>
            <p className="mt-0.5 text-[9px] text-[var(--v3-text-muted)] italic">
              Illustrative data &middot; Simulated{" "}
              {MONTHS[DEMO_TODAY.getMonth()]} {DEMO_TODAY.getFullYear()}
            </p>
          </div>

          <button
            type="button"
            onClick={() => downloadAuditReport(CQO.name)}
            className="shrink-0 cursor-pointer rounded-md border border-[var(--v3-border-strong)] px-4 py-1.5 text-[11px] font-semibold text-[var(--v3-text-secondary)] transition-colors duration-[120ms] hover:text-[var(--v3-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--v3-accent)] focus-visible:outline-none"
          >
            Download Audit Report <span aria-hidden="true">&darr;</span>
          </button>
        </div>

        {/* Row 1 — the four headline figures ----------------------------- */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          <V3KpiCard
            icon={<ClockIcon />}
            iconColour={V3_TONE.advisory}
            accent={V3_TONE.compliant}
            label="Avg Cycle Time"
            value={valueOf("Avg Cycle Time").replace(" days", "")}
            unit="days"
            sub={trendOf("Avg Cycle Time")}
            subColour={V3_TONE.compliant}
          />

          <V3KpiCard
            icon={<TargetIcon />}
            iconColour={V3_TONE.advisory}
            accent={V3_TONE.advisory}
            label="Right First Time"
            value={valueOf("Right First Time")}
            sub={trendOf("Right First Time")}
            subColour={V3_TONE.advisory}
          />

          <V3KpiCard
            icon={<AlertCircleIcon />}
            iconColour="var(--v3-accent)"
            accent={V3_TONE.advisory}
            label="SLA Compliance"
            value={valueOf("SLA Compliance")}
            sub={trendOf("SLA Compliance")}
            subColour={V3_TONE.advisory}
            action={
              breached
                ? {
                    label: "View breach",
                    colour: V3_TONE.blocking,
                    onClick: () =>
                      router.push(`/legacy/batches/${breached.arNumber}`),
                  }
                : undefined
            }
          />

          <V3KpiCard
            icon={<LayersIcon />}
            label="Batches Reviewed"
            value={valueOf("Batches Reviewed")}
            sub={trendOf("Batches Reviewed")}
          />
        </div>

        {/* Row 2 — the two charts ---------------------------------------- */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <V3CycleTimeChart
            points={CYCLE_TIME_TREND}
            target={SLA_TARGET_DAYS}
            title="Cycle Time Trend (days)"
            subtitle={`${CYCLE_TIME_TREND[0]?.month ?? ""} — ${
              CYCLE_TIME_TREND[CYCLE_TIME_TREND.length - 1]?.month ?? ""
            } ${DEMO_TODAY.getFullYear()}`}
          />

          <V3ExceptionBars
            points={EXCEPTIONS_BY_PARAMETER}
            selected={drilldown}
            onSelect={open}
            title="Exceptions by Test Parameter"
            subtitle={`${MONTHS[DEMO_TODAY.getMonth()]} ${DEMO_TODAY.getFullYear()} · Click any bar to drill down`}
          />
        </div>

        {/* The evidence behind whichever bar is open --------------------- */}
        {drilldown ? (
          <section className="mb-6 rounded-[12px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-[13px] font-semibold text-[var(--v3-text-primary)]">
                {drilldown} &middot; {rows.length}{" "}
                {rows.length === 1 ? "batch" : "batches"}
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
                    "Exception",
                    "Status",
                  ].map((head) => (
                    <th
                      key={head}
                      className="py-1.5 text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={`${row.arNumber}-${row.detail}`}
                    className="border-b border-[var(--v3-border-subtle)] last:border-b-0"
                  >
                    <td className="py-2 font-mono text-[11px] text-[var(--v3-accent)]">
                      {row.arNumber}
                    </td>
                    <td className="py-2 text-[12px] text-[var(--v3-text-primary)]">
                      {row.product}
                    </td>
                    <td className="py-2 text-[11px] text-[var(--v3-text-secondary)]">
                      {row.domain}
                    </td>
                    <td className="py-2 text-[12px] text-[var(--v3-text-primary)]">
                      {row.detail}
                      <span className="mt-0.5 block text-[10px] text-[var(--v3-text-muted)] italic">
                        {row.reviewerNote}
                      </span>
                    </td>
                    <td className="py-2 text-[11px]">
                      <span
                        style={{
                          color:
                            row.status === "Open"
                              ? V3_TONE.advisory
                              : V3_TONE.compliant,
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {/* Row 3 — what AIRA noticed ------------------------------------- */}
        <V3AiraHeading
          title="&#10022; AIRA Insights"
          subtitle="Evidence-backed signals requiring attention"
        />

        <div className="mb-6 grid grid-cols-3 gap-3">
          <V3InsightCard
            tag="Pattern detected"
            title="Related Substances leads every exception type"
            body={RECURRING_ISSUES_INSIGHT}
            action={{
              label: `View ${rsBatches.length} affected ${
                rsBatches.length === 1 ? "batch" : "batches"
              }`,
              onClick: () => open("Related Substances"),
            }}
          />

          <V3InsightCard
            tag="Recurring flag"
            title={`KF determination count — ${kfBatches.length} batches`}
            body={`Determination-count exceptions were raised on ${kfBatches.length} batches across ${kfDomains} domains this month. One was recorded as invalid rather than out of limit and has a PNC against it.`}
            action={{
              label: "View affected batches",
              onClick: () => open("KF — determination count"),
            }}
          />

          <V3InsightCard
            tag="Potential concern"
            title={`${STABILITY_OUT_OF_WINDOW.length} stability samples out of window`}
            body={
              worstStability
                ? `${STABILITY_OUT_OF_WINDOW.length} stability samples are outside their configured testing window. ${worstStability.arNumber} is ${worstStability.daysOverdue} days overdue — past the ${STABILITY_WINDOW_STATUS.escalationDays}-day escalation threshold.`
                : "All stability samples are inside their configured testing window."
            }
            action={{
              label: "View stability tracker",
              onClick: () => router.push("/legacy/management/gm-qa"),
            }}
          />
        </div>

        {/* Row 4 — the two tables ---------------------------------------- */}
        <div className="grid grid-cols-2 gap-4">
          <section className="rounded-[12px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] p-5">
            <h2 className="mb-3.5 text-[13px] font-semibold text-[var(--v3-text-primary)]">
              Recurring Review Issues
            </h2>

            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--v3-border-default)] text-left">
                  <th className="py-1.5 text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
                    Issue
                  </th>
                  <th className="py-1.5 text-center text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
                    Flags
                  </th>
                  <th className="py-1.5 text-center text-[9px] font-medium tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
                    % of exceptions
                  </th>
                </tr>
              </thead>
              <tbody>
                {RECURRING_ISSUES.map((row) => (
                  <tr
                    key={row.issue}
                    className="border-b border-[var(--v3-border-subtle)] last:border-b-0"
                  >
                    <td className="py-2 text-[12px] text-[var(--v3-text-primary)]">
                      {row.issue}
                    </td>
                    <td className="py-2 text-center font-mono text-[12px] text-[var(--v3-text-mono)] tabular-nums">
                      {row.occurrences}
                    </td>
                    <td className="py-2 text-center font-mono text-[12px] text-[var(--v3-text-muted)] tabular-nums">
                      {row.share}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-[12px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] p-5">
            <h2 className="mb-1.5 text-[13px] font-semibold text-[var(--v3-text-primary)]">
              Open Alerts
            </h2>

            {MANAGEMENT_ALERTS.map((alert) => {
              const { arNumber, description } = readAlert(alert.detail);

              return (
                <V3AlertRow
                  key={alert.detail}
                  tone={alert.severity === "high" ? "blocking" : "advisory"}
                  label={alert.label}
                  arNumber={arNumber}
                  description={description}
                  onOpen={
                    arNumber
                      ? () => router.push(`/legacy/batches/${arNumber}`)
                      : undefined
                  }
                />
              );
            })}
          </section>
        </div>

        <p className="mt-6 text-center text-[10px] text-[var(--v3-text-muted)]">
          {MANAGEMENT_FOOTER_NOTE}
        </p>
      </main>

      <V3AiraAgent
        scope={`the quality function for ${MONTHS[DEMO_TODAY.getMonth()]} ${DEMO_TODAY.getFullYear()}`}
        greeting={`I have read this month across ${ALL_BATCHES.length} batches. ${exceptionTotal} exceptions were raised and ${MANAGEMENT_ALERTS.length} alerts stand. Ask me what is behind them.`}
        topics={topics}
      />
    </div>
  );
}
