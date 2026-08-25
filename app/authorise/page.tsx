"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ALL_BATCHES, flaggedItemsInBatch } from "@/data";
import { useReview } from "@/context/ReviewContext";
import { TopNav } from "@/components/layout/TopNav";
import { BatchStatusBadge, ExceptionCountPill } from "@/components/review/Badges";

export default function AuthoriseListPage() {
  const router = useRouter();
  const { profile, batchStatus } = useReview();

  useEffect(() => {
    if (!profile) router.replace("/");
    else if (profile.role === "REVIEWER") router.replace("/dashboard");
  }, [profile, router]);

  if (!profile || profile.role === "REVIEWER") return null;

  const submitted = ALL_BATCHES.filter((batch) =>
    ["AWAITING_AUTHORISATION", "REVIEW_AUTHORISED", "RETURNED_TO_REVIEWER"].includes(
      batchStatus(batch.arNumber),
    ),
  );

  return (
    <div className="flex min-h-dvh flex-col bg-app-bg">
      <TopNav />

      <main className="flex-1 px-6 py-7 lg:px-10">
        <h1 className="mb-5 text-xl font-bold tracking-tight text-slate-900">
          Reviews Awaiting Authorisation
        </h1>

        {submitted.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-10 text-center text-[13px] text-source-text">
            No reviews are awaiting authorisation. A reviewer submits a completed review
            from the Review Summary screen.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  {["AR Number", "Product", "Analyst", "Status", "Exceptions", ""].map(
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
                {submitted.map((batch) => (
                  <tr
                    key={batch.arNumber}
                    onClick={() => router.push(`/authorise/${batch.arNumber}`)}
                    className="cursor-pointer border-b border-slate-100 transition-colors duration-150 hover:bg-blue-50"
                  >
                    <td className="px-4 py-3 text-[13px] font-semibold text-navy-mid">
                      {batch.arNumber}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-900">{batch.product}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-700">{batch.analyst}</td>
                    <td className="px-4 py-3">
                      <BatchStatusBadge status={batchStatus(batch.arNumber)} />
                    </td>
                    <td className="px-4 py-3">
                      <ExceptionCountPill count={flaggedItemsInBatch(batch)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          /* The row already opens the submission. */
                          event.stopPropagation();
                          router.push(`/authorise/${batch.arNumber}`);
                        }}
                        className="cursor-pointer rounded-[5px] bg-navy px-3.5 py-1.5 text-xs text-white transition-colors duration-150 hover:bg-navy-mid"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
