"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  batchesForDomain,
  flaggedItemsInBatch,
  orderedSections,
  sectionSlug,
} from "@/data";
import { useReview } from "@/context/ReviewContext";
import { DOMAIN_BY_SLUG, type Batch } from "@/types";
import { TopNav } from "@/components/layout/TopNav";
import { BatchSearch } from "@/components/layout/BatchSearch";
import { PageTitle } from "@/components/layout/PageTitle";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  BatchStatusBadge,
  ExceptionCountPill,
  LimsStatusBadge,
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
  // One slug name per path segment: this segment is a domain slug here and an
  // AR number under /batches/[id]/review. They never collide.
  const params = useParams<{ id: string }>();
  const { profile, batchStatus } = useReview();
  const [tab, setTab] = useState<Tab>("attention");

  const meta = DOMAIN_BY_SLUG[params.id];

  useEffect(() => {
    if (!profile) router.replace("/legacy");
  }, [profile, router]);

  useEffect(() => {
    if (!meta) router.replace("/legacy/dashboard");
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
      router.push(
        `/legacy/batches/${batch.arNumber}/review/${first.parameter}/${sectionSlug(first)}`,
      );
    }
  };

  const totalFlagged = all.reduce(
    (sum, batch) => sum + flaggedItemsInBatch(batch),
    0,
  );

  return (
    <div className="flex min-h-dvh flex-col bg-app-bg">
      <PageTitle title={meta.name} />
      <TopNav />
      <Breadcrumbs
        crumbs={[
          { label: "QA Dashboard", href: "/dashboard" },
          { label: meta.name },
        ]}
      />

      <main className="flex-1 px-6 py-7 lg:px-10">
        <button
          type="button"
          onClick={() => router.push("/legacy/dashboard")}
          className="mb-3 inline-flex cursor-pointer items-center gap-1.5 text-xs text-source-text transition-colors duration-150 hover:text-navy hover:underline"
        >
          <span aria-hidden="true">&larr;</span> Back to Dashboard
        </button>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {meta.name} — Review Queue
          </h1>
          <span className="text-xs text-slate-400">
            {all.length} {all.length === 1 ? "batch" : "batches"} ·{" "}
            {totalFlagged} flagged
          </span>
        </div>

        <div className="mb-4">
          <BatchSearch variant="page" />
        </div>

        <div className="mb-5 flex border-b-2 border-slate-200">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={cn(
                "-mb-0.5 cursor-pointer px-4 py-[7px] text-[13px] transition-colors duration-150",
                tab === entry.id
                  ? "border-b-2 border-navy font-semibold text-navy hover:bg-blue-50"
                  : "text-source-text hover:bg-blue-50 hover:text-navy",
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
                {[
                  "AR Number",
                  "Product",
                  "Batch No.",
                  "SLA",
                  "Exceptions",
                  "Status",
                  "Last Activity",
                  "",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-2.5 text-[11px] font-semibold tracking-wide text-source-text uppercase"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((batch) => {
                const mine = batch.assignedTo === profile.id;
                return (
                  <tr
                    key={batch.arNumber}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open review for ${batch.arNumber}, ${batch.product}`}
                    onClick={() => openBatch(batch)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openBatch(batch);
                      }
                    }}
                    className={cn(
                      "cursor-pointer border-b border-slate-100 transition-colors duration-150 hover:bg-blue-50 " +
                        "focus-visible:ring-2 focus-visible:ring-navy focus-visible:-outline-offset-2 focus-visible:outline-none",
                      /* A breached SLA has to be legible from the row, not
                         only from the badge. */
                      batch.slaStatus === "red" &&
                        "border-l-[3px] border-l-flagged-text bg-flagged-bg/25",
                    )}
                  >
                    <td className="px-4 py-3 text-[13px] font-semibold text-navy-mid">
                      {batch.arNumber}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-900">
                      {batch.product}
                      {/* Where LIMS has got to, which is not the same question
                          as how far NeuraTrace's own review has got. */}
                      <div className="mt-1">
                        <LimsStatusBadge
                          status={batch.limsStatus}
                          prints={batch.limsPrints}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-source-text">
                      {batch.batchNumber}
                    </td>
                    <td className="px-4 py-3">
                      <SLABadge
                        status={batch.slaStatus}
                        label={batch.slaLabel}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ExceptionCountPill count={flaggedItemsInBatch(batch)} />
                    </td>
                    <td className="px-4 py-3">
                      <BatchStatusBadge status={batchStatus(batch.arNumber)} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {batch.lastActivity}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          /* The row already opens the batch. */
                          event.stopPropagation();
                          openBatch(batch);
                        }}
                        className={cn(
                          "cursor-pointer rounded-[5px] px-3.5 py-1.5 text-xs whitespace-nowrap transition-colors duration-150",
                          mine
                            ? "bg-navy font-medium text-white hover:bg-navy-mid"
                            : "border border-navy-accent text-navy-accent hover:bg-navy-accent hover:text-white",
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
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-[13px] text-slate-400"
                  >
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
