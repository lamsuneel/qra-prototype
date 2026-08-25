"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { batchesForDomain, flaggedItemsInBatch, orderedSections } from "@/data";
import { useReview } from "@/context/ReviewContext";
import { DOMAIN_BY_SLUG, type Batch } from "@/types";
import { TopNav } from "@/components/layout/TopNav";
import {
  BatchStatusBadge,
  ExceptionCountPill,
  SLABadge,
} from "@/components/review/Badges";
import { cn } from "@/lib/utils";

type Tab = "attention" | "sla" | "all";

const TABS: { id: Tab; label: string }[] = [
  { id: "attention", label: "Needs Attention" },
  { id: "sla", label: "Approaching SLA" },
  { id: "all", label: "All" },
];

export default function BatchListPage() {
  const router = useRouter();
  const params = useParams<{ domain: string }>();
  const { profile, batchStatus } = useReview();
  const [tab, setTab] = useState<Tab>("attention");

  const meta = DOMAIN_BY_SLUG[params.domain];

  useEffect(() => {
    if (!profile) router.replace("/");
  }, [profile, router]);

  useEffect(() => {
    if (!meta) router.replace("/dashboard");
  }, [meta, router]);

  if (!profile || !meta) return null;

  const all = batchesForDomain(meta.id);

  /* Exceptions first, then the tightest SLA. */
  const rank = { red: 0, amber: 1, green: 2 } as const;
  const sorted = [...all].sort(
    (a, b) =>
      flaggedItemsInBatch(b) - flaggedItemsInBatch(a) ||
      rank[a.slaStatus] - rank[b.slaStatus],
  );

  const visible = sorted.filter((batch) => {
    if (tab === "all") return true;
    if (tab === "sla") return batch.slaStatus !== "green";
    return flaggedItemsInBatch(batch) > 0 || batch.assignedTo === profile.id;
  });

  const openBatch = (batch: Batch) => {
    const first = orderedSections(batch)[0];
    if (first) {
      router.push(`/batches/${batch.arNumber}/review/${first.parameter}/${first.id}`);
    }
  };

  const totalFlagged = all.reduce((sum, batch) => sum + flaggedItemsInBatch(batch), 0);

  return (
    <div className="flex min-h-dvh flex-col bg-app-bg">
      <TopNav />

      <main className="flex-1 px-6 py-7 lg:px-10">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-1.5 text-xs text-source-text transition-colors hover:text-navy"
        >
          Dashboard
        </button>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {meta.name} — Review Queue
          </h1>
          <span className="text-xs text-slate-400">
            {all.length} {all.length === 1 ? "batch" : "batches"} · {totalFlagged} flagged
          </span>
        </div>

        <div className="mb-5 flex border-b-2 border-slate-200">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={cn(
                "-mb-0.5 px-4 py-[7px] text-[13px]",
                tab === entry.id
                  ? "border-b-2 border-navy font-semibold text-navy"
                  : "text-source-text hover:text-navy",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                {["AR Number", "Product", "Batch No.", "SLA", "Exceptions", "Status", "Last Activity", ""].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-4 py-2.5 text-[11px] font-semibold tracking-wide text-source-text uppercase"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {visible.map((batch) => {
                const mine = batch.assignedTo === profile.id;
                return (
                  <tr key={batch.arNumber} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-[13px] font-semibold text-navy-mid">
                      {batch.arNumber}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-900">{batch.product}</td>
                    <td className="px-4 py-3 font-mono text-xs text-source-text">
                      {batch.batchNumber}
                    </td>
                    <td className="px-4 py-3">
                      <SLABadge status={batch.slaStatus} label={batch.slaLabel} />
                    </td>
                    <td className="px-4 py-3">
                      <ExceptionCountPill count={flaggedItemsInBatch(batch)} />
                    </td>
                    <td className="px-4 py-3">
                      <BatchStatusBadge status={batchStatus(batch.arNumber)} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{batch.lastActivity}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openBatch(batch)}
                        className={cn(
                          "rounded-[5px] px-3.5 py-1.5 text-xs whitespace-nowrap",
                          mine
                            ? "bg-navy font-medium text-white"
                            : "border border-navy-accent text-navy-accent hover:bg-blue-50",
                        )}
                      >
                        {mine ? "Begin Review" : "View"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[13px] text-slate-400">
                    No batches in this view.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
