"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  DOMAIN_BREAKDOWN,
  KPIS,
  MANAGEMENT_ALERTS,
  MANAGEMENT_FOOTER_NOTE,
  RECURRING_ISSUES,
  RECURRING_ISSUES_INSIGHT,
} from "@/data/dashboard";
import { SITE_NAME } from "@/data/profiles";
import { useReview } from "@/context/ReviewContext";
import { TopNav } from "@/components/layout/TopNav";
import { PageTitle } from "@/components/layout/PageTitle";
import { CycleTimeChart, ExceptionChart } from "@/components/dashboard/Charts";
import { ExceptionDrilldown } from "@/components/dashboard/ExceptionDrilldown";
import { downloadAuditReport } from "@/lib/audit-report";

/**
 * Role-gated: Approver and CQO only.
 * Process metrics only — nothing here measures an individual reviewer.
 */
export default function ManagementPage() {
  const router = useRouter();
  const { profile } = useReview();

  /* One bar open at a time. Clicking the open one closes it. */
  const [drilldown, setDrilldown] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) router.replace("/legacy");
    else if (profile.role === "REVIEWER") router.replace("/legacy/dashboard");
  }, [profile, router]);

  if (!profile || profile.role === "REVIEWER") return null;

  return (
    <div className="flex min-h-dvh flex-col bg-app-bg">
      <PageTitle title="Batch Review Performance" />
      <TopNav />

      <main className="flex-1 px-6 py-7 lg:px-10">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] leading-tight font-bold tracking-tight text-slate-900">
              Batch Review Performance
            </h1>
            <p className="mt-1 text-sm text-source-text">
              {SITE_NAME} · August 2026
            </p>
          </div>

          <button
            type="button"
            onClick={() => downloadAuditReport(profile.name)}
            className="shrink-0 cursor-pointer rounded-md border border-navy-accent px-4 py-2 text-sm font-medium text-navy-accent transition-colors duration-150 hover:bg-navy-accent hover:text-white focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Download Audit Report <span aria-hidden="true">&darr;</span>
          </button>
        </header>

        <div className="mb-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {KPIS.map((kpi) => (
            <div
              key={kpi.title}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="mb-2 text-xs font-medium tracking-[0.05em] text-source-text uppercase">
                {kpi.title}
              </div>
              <div className="mb-1.5 text-4xl leading-none font-bold text-navy tabular-nums">
                {kpi.value}
              </div>
              <div
                className={`text-[13px] font-medium ${
                  kpi.trendGood ? "text-compliant-text" : "text-source-text"
                }`}
              >
                {kpi.trend}
              </div>
              {kpi.target ? (
                <div className="mt-1 text-[13px] text-slate-400">
                  {kpi.target}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mb-5">
          <div className="grid gap-3.5 lg:grid-cols-2">
            <CycleTimeChart />
            <ExceptionChart
              selected={drilldown}
              onSelect={(category) =>
                setDrilldown((current) =>
                  current === category ? null : category,
                )
              }
            />
          </div>

          {drilldown ? (
            <ExceptionDrilldown
              category={drilldown}
              onClose={() => setDrilldown(null)}
            />
          ) : null}
        </div>

        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">
            Recurring Review Issues — August 2026
          </h2>
          <p className="mt-1 mb-3 text-[13px] text-slate-400">
            Most frequent exception types this month
          </p>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 text-xs font-semibold tracking-[0.05em] uppercase">
                  Issue
                </th>
                <th className="py-2 text-right text-xs font-semibold tracking-[0.05em] uppercase">
                  Occurrences
                </th>
                <th className="py-2 text-right text-xs font-semibold tracking-[0.05em] uppercase">
                  % of all exceptions
                </th>
              </tr>
            </thead>
            <tbody>
              {RECURRING_ISSUES.map((row) => (
                <tr key={row.issue} className="border-b border-slate-50">
                  <td className="py-2 text-slate-700">{row.issue}</td>
                  <td className="py-2 text-right font-medium text-slate-700 tabular-nums">
                    {row.occurrences}
                  </td>
                  <td className="py-2 text-right text-slate-700 tabular-nums">
                    {row.share}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-3 rounded-[5px] border-l-[3px] border-navy-accent bg-blue-50 px-3.5 py-2.5 text-sm text-navy italic">
            {RECURRING_ISSUES_INSIGHT}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-base font-semibold text-slate-900">
              Review Type Breakdown
            </h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 text-xs font-semibold tracking-[0.05em] uppercase">
                    Domain
                  </th>
                  <th className="py-2 text-right text-xs font-semibold tracking-[0.05em] uppercase">
                    Completed
                  </th>
                  <th className="py-2 text-right text-xs font-semibold tracking-[0.05em] uppercase">
                    Avg Days
                  </th>
                  <th className="py-2 text-right text-xs font-semibold tracking-[0.05em] uppercase">
                    Exceptions
                  </th>
                </tr>
              </thead>
              <tbody>
                {DOMAIN_BREAKDOWN.map((row) => (
                  <tr key={row.domain} className="border-b border-slate-50">
                    <td className="py-2 text-slate-700">{row.domain}</td>
                    <td className="py-2 text-right font-medium text-slate-700 tabular-nums">
                      {row.completed}
                    </td>
                    <td className="py-2 text-right text-slate-700 tabular-nums">
                      {row.avgDays}
                    </td>
                    <td className="py-2 text-right">
                      <span
                        className={`rounded-full px-2 py-[2px] text-xs font-semibold ${
                          row.exceptions > 0
                            ? "bg-flagged-bg text-flagged-text"
                            : "bg-source-bg text-source-text"
                        }`}
                      >
                        {row.exceptions}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-base font-semibold text-slate-900">
              Open Alerts
            </h2>
            <div className="flex flex-col gap-2.5">
              {/*
                Red for the batch that is actually overdue, amber for the rest.
                Two alerts can share a title, so the detail line — which names
                the batch — is what makes each one distinct.
              */}
              {MANAGEMENT_ALERTS.map((alert) => {
                const breached = alert.severity === "high";

                return (
                  <div
                    key={alert.detail}
                    className={`rounded-md border border-l-4 px-3.5 py-3 text-sm ${
                      breached
                        ? "border-flagged-text/30 border-l-[#C00000] bg-[#FEF2F2]"
                        : "border-warn-text/25 border-l-[#C55A11] bg-[#FFF8F0]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 font-semibold text-slate-700">
                          {alert.title}
                        </div>
                        <div className="text-source-text">{alert.detail}</div>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold tracking-[0.05em] uppercase ${
                          breached ? "text-[#C00000]" : "text-[#C55A11]"
                        }`}
                      >
                        {alert.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-[13px] text-slate-400">
          {MANAGEMENT_FOOTER_NOTE}
        </p>
      </main>
    </div>
  );
}
