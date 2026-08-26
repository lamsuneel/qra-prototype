"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  DOMAIN_BREAKDOWN,
  KPIS,
  MANAGEMENT_ALERTS,
  MANAGEMENT_FOOTER_NOTE,
} from "@/data/dashboard";
import { SITE_NAME } from "@/data/profiles";
import { useReview } from "@/context/ReviewContext";
import { TopNav } from "@/components/layout/TopNav";
import { PageTitle } from "@/components/layout/PageTitle";
import { CycleTimeChart, ExceptionChart } from "@/components/dashboard/Charts";

/**
 * Role-gated: Approver and CQO only.
 * Process metrics only — nothing here measures an individual reviewer.
 */
export default function ManagementPage() {
  const router = useRouter();
  const { profile } = useReview();

  useEffect(() => {
    if (!profile) router.replace("/");
    else if (profile.role === "REVIEWER") router.replace("/dashboard");
  }, [profile, router]);

  if (!profile || profile.role === "REVIEWER") return null;

  return (
    <div className="flex min-h-dvh flex-col bg-app-bg">
      <PageTitle title="Batch Review Performance" />
      <TopNav />

      <main className="flex-1 px-6 py-7 lg:px-10">
        <header className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Batch Review Performance
          </h1>
          <p className="mt-1 text-[13px] text-source-text">{SITE_NAME} · August 2026</p>
        </header>

        <div className="mb-5 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((kpi) => (
            <div
              key={kpi.title}
              className="rounded-lg border border-slate-200 bg-white px-5 py-4.5"
            >
              <div className="mb-2 text-[11px] font-medium tracking-wide text-source-text uppercase">
                {kpi.title}
              </div>
              <div className="mb-1.5 text-[28px] leading-none font-bold text-navy tabular-nums">
                {kpi.value}
              </div>
              <div
                className={`text-xs font-medium ${
                  kpi.trendGood ? "text-compliant-text" : "text-source-text"
                }`}
              >
                {kpi.trend}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-5 grid gap-3.5 lg:grid-cols-2">
          <CycleTimeChart />
          <ExceptionChart />
        </div>

        <div className="grid gap-3.5 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3.5 text-[13px] font-semibold text-slate-900">
              Review Type Breakdown
            </h2>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400">
                  <th className="py-1.5 font-medium">Domain</th>
                  <th className="py-1.5 text-right font-medium">Completed</th>
                  <th className="py-1.5 text-right font-medium">Avg Days</th>
                  <th className="py-1.5 text-right font-medium">Exceptions</th>
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
                        className={`rounded-full px-1.5 py-[1px] text-[10px] font-semibold ${
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
            <h2 className="mb-3.5 text-[13px] font-semibold text-slate-900">
              Open Alerts
            </h2>
            <div className="flex flex-col gap-2.5">
              {MANAGEMENT_ALERTS.map((alert) => (
                <div
                  key={alert.title}
                  className={`rounded-md border px-3 py-2.5 text-xs ${
                    alert.severity === "high"
                      ? "border-flagged-text/30 bg-flagged-bg/40"
                      : "border-warn-text/30 bg-warn-bg/50"
                  }`}
                >
                  <div className="mb-0.5 font-semibold text-slate-700">{alert.title}</div>
                  <div className="text-source-text">{alert.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-slate-400">
          {MANAGEMENT_FOOTER_NOTE}
        </p>
      </main>
    </div>
  );
}
