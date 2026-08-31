"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AWAITING_AUTHORISATION_COUNT,
  DOMAIN_RELEASE_PROGRESS,
  MANAGEMENT_FOOTER_NOTE,
  PIPELINE_KPIS,
  QUALITY_EVENTS,
  STABILITY_OUT_OF_WINDOW,
  STABILITY_WINDOW_STATUS,
} from "@/data/dashboard";
import { SITE_NAME } from "@/data/profiles";
import { useReview } from "@/context/ReviewContext";
import { TopNav } from "@/components/layout/TopNav";
import { PageTitle } from "@/components/layout/PageTitle";
import { PendingReasonChart } from "@/components/dashboard/Charts";
import { PendingReasonDrilldown } from "@/components/dashboard/PendingReasonDrilldown";
import { downloadOperationsReport } from "@/lib/gm-qa-report";
import { cn } from "@/lib/utils";

/**
 * The GM-QA's own view.
 *
 * An operations screen, not a review one: how many samples are in the
 * building, where they are stuck, and what is going out of window while they
 * wait. The authorisation queue is a click away and stays where it was —
 * signing batches off is one of the jobs, not the whole of it.
 *
 * Nothing here measures an individual, which is the same rule the CQO view is
 * built on and the reason the footer says so out loud.
 */
export default function GmQaDashboardPage() {
  const router = useRouter();
  const { profile } = useReview();

  /* One reason open at a time. Clicking the open one closes it. */
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) router.replace("/");
    else if (profile.role === "REVIEWER") router.replace("/dashboard");
    /* The CQO has a view of their own; this one is the approver's. */ else if (
      profile.role === "CQO"
    ) {
      router.replace("/management");
    }
  }, [profile, router]);

  if (!profile || profile.role !== "APPROVER") return null;

  return (
    <div className="flex min-h-dvh flex-col bg-app-bg">
      <PageTitle title="QA Operations Dashboard" />
      <TopNav />

      <main className="flex-1 px-6 py-7 lg:px-10">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] leading-tight font-bold tracking-tight text-slate-900">
              QA Operations Dashboard
            </h1>
            <p className="mt-1 text-sm text-source-text">
              {SITE_NAME} · August 2026
            </p>
          </div>

          <div className="shrink-0 sm:text-right">
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              {/*
                Outlined, and to the left: taking the month away as a file is
                something this role does once, and the queue is what they came
                for. Weight follows that.
              */}
              <button
                type="button"
                onClick={() =>
                  downloadOperationsReport(`${profile.name} — GM-QA`)
                }
                className="cursor-pointer rounded-md border border-navy-accent px-4 py-2 text-sm font-medium text-navy-accent transition-colors duration-150 hover:bg-navy-accent hover:text-white focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Download Operations Report{" "}
                <span aria-hidden="true">&darr;</span>
              </button>

              {/*
                Solid rather than outlined: for this role the queue is the job,
                and the rest of the page is the context it is done in.
              */}
              <button
                type="button"
                onClick={() => router.push("/authorise")}
                className="cursor-pointer rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-navy-mid focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Go to Authorisation Queue <span aria-hidden="true">&rarr;</span>
              </button>
            </div>

            <p className="mt-1.5 text-[13px] text-source-text">
              {AWAITING_AUTHORISATION_COUNT} batches awaiting your authorisation
            </p>
          </div>
        </header>

        {/* Row 1 — where every sample in the building currently sits. */}
        <div className="mb-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {PIPELINE_KPIS.map((kpi) => (
            <div
              key={kpi.title}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="mb-2 text-xs font-medium tracking-[0.05em] text-source-text uppercase">
                {kpi.title}
              </div>
              <div className="text-4xl leading-none font-bold text-navy tabular-nums">
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Row 2 — samples already past their pull date. */}
        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">
            {STABILITY_WINDOW_STATUS.title}
          </h2>
          <div className="mt-1 mb-3 text-[13px] text-slate-400">
            {STABILITY_WINDOW_STATUS.subheading}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 text-xs font-semibold tracking-[0.05em] uppercase">
                    AR Number
                  </th>
                  <th className="py-2 text-xs font-semibold tracking-[0.05em] uppercase">
                    Product
                  </th>
                  <th className="py-2 text-xs font-semibold tracking-[0.05em] uppercase">
                    Stage
                  </th>
                  <th className="py-2 text-xs font-semibold tracking-[0.05em] uppercase">
                    Scheduled Date
                  </th>
                  <th className="py-2 text-right text-xs font-semibold tracking-[0.05em] uppercase">
                    Days Overdue
                  </th>
                  <th className="py-2 text-xs font-semibold tracking-[0.05em] uppercase">
                    Action Required
                  </th>
                </tr>
              </thead>
              <tbody>
                {STABILITY_OUT_OF_WINDOW.map((row) => {
                  /* Over a week late stops being a scheduling slip. */
                  const escalate =
                    row.daysOverdue > STABILITY_WINDOW_STATUS.escalationDays;

                  return (
                    <tr key={row.arNumber} className="border-b border-slate-50">
                      <td className="py-2 font-semibold text-navy-mid">
                        {row.arNumber}
                      </td>
                      <td className="py-2 text-slate-700">{row.product}</td>
                      <td className="py-2 text-slate-700">{row.stage}</td>
                      <td className="py-2 text-slate-700">{row.scheduled}</td>
                      <td className="py-2 text-right">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-[2px] text-xs font-semibold tabular-nums",
                            escalate
                              ? "bg-flagged-bg text-flagged-text"
                              : "bg-warn-bg text-warn-text",
                          )}
                        >
                          {row.daysOverdue}{" "}
                          {row.daysOverdue === 1 ? "day" : "days"}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "py-2",
                          escalate
                            ? "font-medium text-flagged-text"
                            : "text-source-text",
                        )}
                      >
                        {row.action}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 3 — what is holding the queued work, and which samples. */}
        <div className="mb-5">
          <PendingReasonChart
            selected={pending}
            onSelect={(reason) =>
              setPending((current) => (current === reason ? null : reason))
            }
          />

          {pending ? (
            <PendingReasonDrilldown
              reason={pending}
              onClose={() => setPending(null)}
            />
          ) : null}
        </div>

        {/* Row 4 — investigations open against the site. */}
        <div className="mb-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {QUALITY_EVENTS.map((event) => (
            <div
              key={event.title}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="mb-2 text-xs font-medium tracking-[0.05em] text-source-text uppercase">
                {event.title}
              </div>
              <div className="mb-1.5 text-4xl leading-none font-bold text-navy tabular-nums">
                {event.value}
              </div>
              <div className="text-[13px] text-source-text">{event.detail}</div>
            </div>
          ))}
        </div>

        {/* Row 5 — how far the month's work has got, domain by domain. */}
        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            Domain Release Progress — August 2026
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 text-xs font-semibold tracking-[0.05em] uppercase">
                    Domain
                  </th>
                  <th className="py-2 text-right text-xs font-semibold tracking-[0.05em] uppercase">
                    Samples In
                  </th>
                  <th className="py-2 text-right text-xs font-semibold tracking-[0.05em] uppercase">
                    Completed
                  </th>
                  <th className="py-2 text-right text-xs font-semibold tracking-[0.05em] uppercase">
                    Pending
                  </th>
                  <th className="py-2 text-right text-xs font-semibold tracking-[0.05em] uppercase">
                    % Complete
                  </th>
                  <th className="py-2 text-right text-xs font-semibold tracking-[0.05em] uppercase">
                    Avg Days
                  </th>
                </tr>
              </thead>
              <tbody>
                {DOMAIN_RELEASE_PROGRESS.map((row) => {
                  const tone =
                    row.percentComplete >= 90
                      ? "bg-compliant-bg text-compliant-text"
                      : row.percentComplete >= 75
                        ? "bg-warn-bg text-warn-text"
                        : "bg-flagged-bg text-flagged-text";

                  return (
                    <tr key={row.domain} className="border-b border-slate-50">
                      <td className="py-2 text-slate-700">{row.domain}</td>
                      <td className="py-2 text-right text-slate-700 tabular-nums">
                        {row.samplesIn}
                      </td>
                      <td className="py-2 text-right font-medium text-slate-700 tabular-nums">
                        {row.completed}
                      </td>
                      <td className="py-2 text-right text-slate-700 tabular-nums">
                        {row.pending}
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-[2px] text-xs font-semibold tabular-nums",
                            tone,
                          )}
                        >
                          {row.percentComplete}%
                        </span>
                      </td>
                      <td className="py-2 text-right text-slate-700 tabular-nums">
                        {row.avgDays}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-5 text-center text-[13px] text-slate-400">
          {MANAGEMENT_FOOTER_NOTE}
        </p>
      </main>
    </div>
  );
}
