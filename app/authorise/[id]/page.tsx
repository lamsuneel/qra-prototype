"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getBatch, reviewableSections } from "@/data";
import { coaSummaryFor } from "@/data/coa";
import { resultFor } from "@/types";
import { useReview } from "@/context/ReviewContext";
import { TopNav } from "@/components/layout/TopNav";
import { PageTitle } from "@/components/layout/PageTitle";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { BatchStatusBadge } from "@/components/review/Badges";
import { SpecificationVersion } from "@/components/authorise/SpecificationVersion";
import { CoaSummaryTable } from "@/components/authorise/CoaSummary";

/**
 * The approver sees exceptions only — never the full section checklists.
 * The decision panel stays pinned while the exceptions scroll beneath it.
 */
export default function AuthoriseDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { profile, noteFor, batchStatus, authoriseReview, returnToReviewer } =
    useReview();

  const [confirming, setConfirming] = useState(false);
  const [returnMode, setReturnMode] = useState(false);
  const [reason, setReason] = useState("");

  const batch = getBatch(params.id);

  useEffect(() => {
    if (!profile) router.replace("/");
    else if (profile.role === "REVIEWER") router.replace("/dashboard");
  }, [profile, router]);

  useEffect(() => {
    if (!batch) router.replace("/authorise");
  }, [batch, router]);

  if (!profile || profile.role === "REVIEWER" || !batch) return null;

  const status = batchStatus(batch.arNumber);
  const decided = status !== "AWAITING_AUTHORISATION";

  const exceptions = reviewableSections(batch).flatMap((section) =>
    section.items
      .filter((item) => resultFor(item) === "FLAGGED")
      .map((item) => ({ section, item })),
  );

  const coa = coaSummaryFor(batch);

  const confirmAuthorise = () => {
    authoriseReview(batch.arNumber);
    setConfirming(false);
  };

  const confirmReturn = () => {
    if (!reason.trim()) return;
    returnToReviewer(batch.arNumber, reason.trim());
    setReturnMode(false);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-app-bg">
      <PageTitle title={`${batch.arNumber} — Authorisation`} />
      <TopNav batch={batch} />
      <Breadcrumbs
        crumbs={[
          { label: "Authorisation Queue", href: "/authorise" },
          { label: `${batch.arNumber} ${batch.product}` },
        ]}
      />

      <main className="flex-1 px-6 py-7 lg:px-10">
        <button
          type="button"
          onClick={() => router.push("/authorise")}
          className="mb-3 inline-flex cursor-pointer items-center gap-1.5 text-xs text-source-text transition-colors duration-150 hover:text-navy hover:underline"
        >
          <span aria-hidden="true">&larr;</span> Back to list
        </button>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b-2 border-slate-200 bg-slate-50 px-6 py-4">
            <div>
              <div className="mb-1 text-xs text-slate-400">
                Reviewing submission
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-base font-bold text-navy">
                  {batch.arNumber}
                </span>
                <span className="text-[13px] text-source-text">
                  {batch.product}
                </span>
                <BatchStatusBadge status={status} />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2.5">
              <button
                type="button"
                disabled={decided}
                onClick={() => setReturnMode((value) => !value)}
                className={`rounded-md border px-4 py-2 text-[13px] transition-colors duration-150 ${
                  decided
                    ? "cursor-not-allowed border-slate-200 text-slate-400 opacity-40"
                    : "cursor-pointer border-slate-200 text-source-text hover:bg-navy hover:text-white"
                }`}
              >
                Request Recheck
              </button>
              <button
                type="button"
                disabled={decided}
                onClick={() => setConfirming(true)}
                className={`rounded-md px-5 py-2 text-[13px] font-semibold transition-colors duration-150 ${
                  decided
                    ? "cursor-not-allowed bg-slate-200 text-slate-400 opacity-40"
                    : "cursor-pointer bg-navy text-white hover:bg-navy-mid"
                }`}
              >
                Authorise Review
              </button>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="mb-4 text-xs font-bold tracking-wider text-flagged-text uppercase">
              {exceptions.length}{" "}
              {exceptions.length === 1 ? "exception" : "exceptions"} requiring
              attention
            </div>

            <div className="flex flex-col gap-4">
              {exceptions.map(({ section, item }, index) => (
                <article
                  key={item.id}
                  className="rounded-[7px] border border-slate-200 px-[18px] py-4"
                >
                  <div className="mb-2.5 flex flex-wrap items-baseline gap-2.5">
                    <span className="rounded bg-flagged-bg px-2 py-[2px] text-[10px] font-semibold whitespace-nowrap text-flagged-text">
                      Exception {index + 1}
                    </span>
                    <span className="text-[13px] font-semibold text-slate-900">
                      {section.parameter.toUpperCase()} — {section.name}
                    </span>
                  </div>
                  <p className="mb-2 text-[13px] text-slate-700">
                    {item.flagReason}
                  </p>
                  <p className="rounded-[5px] border-l-[3px] border-slate-300 bg-slate-50 px-3 py-2 text-xs text-source-text italic">
                    {noteFor(item.id)
                      ? `"${noteFor(item.id)}"`
                      : "No reviewer note was recorded for this exception."}
                  </p>
                </article>
              ))}
            </div>

            {returnMode ? (
              <div className="mt-4 rounded-[7px] border border-warn-text/40 bg-warn-bg/50 p-4">
                <label
                  htmlFor="return-reason"
                  className="mb-2 block text-xs font-semibold text-slate-700"
                >
                  Reason for recheck (required){" "}
                  <span className="text-flagged-text">*</span>
                </label>
                <textarea
                  id="return-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Say what has to be corrected before this comes back..."
                  className="h-20 w-full resize-none rounded-[5px] border border-slate-200 p-2.5 text-[13px] outline-none focus:border-navy-accent"
                />
                <div className="mt-2.5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnMode(false)}
                    className="cursor-pointer rounded-[5px] border border-slate-200 px-3.5 py-1.5 text-[13px] text-source-text transition-colors duration-150 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!reason.trim()}
                    onClick={confirmReturn}
                    className={`rounded-[5px] px-4 py-1.5 text-[13px] transition-opacity duration-150 ${
                      reason.trim()
                        ? "cursor-pointer bg-flagged-text text-white hover:opacity-90"
                        : "cursor-not-allowed bg-slate-200 text-slate-400 opacity-40"
                    }`}
                  >
                    Submit Recheck Request
                  </button>
                </div>
              </div>
            ) : null}

            {/*
              Below the exceptions, and deliberately not above them: the
              approver's attention belongs on what went wrong first. These
              answer the two questions that follow — was it judged against the
              right specification, and what about everything that did not flag.
            */}
            <section className="mt-7">
              <div className="mb-2.5 text-xs font-bold tracking-wider text-flagged-text uppercase">
                Specification version
              </div>
              <SpecificationVersion
                version={batch.specVersion}
                current={batch.specCurrent}
                source="Caliber LIMS"
              />
            </section>

            {coa ? (
              <section className="mt-7">
                <div className="mb-1 text-xs font-bold tracking-wider text-flagged-text uppercase">
                  COA summary — all test parameters
                </div>
                <p className="mb-3 text-xs text-source-text">
                  Results vs specification at time of review. Authorisation
                  constitutes confirmation that all parameters have been
                  reviewed.
                </p>
                <CoaSummaryTable
                  summary={coa}
                  specification={`FP Specification ${batch.specVersion}`}
                />
              </section>
            ) : null}
          </div>
        </div>
      </main>

      {confirming ? (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-7 shadow-2xl">
            <h2 className="mb-2 text-base font-bold text-slate-900">
              Authorise Review — {batch.arNumber}
            </h2>
            <p className="mb-2.5 text-[13px] leading-relaxed text-source-text">
              You are authorising the analytical batch review for{" "}
              <strong className="text-slate-700">{batch.product}</strong>. This
              constitutes confirmation that:
            </p>
            {/*
              Spelled out rather than summarised: a signature that says "I
              confirm" without saying what is being confirmed is the thing
              audits pull apart.
            */}
            <ul className="mb-3 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-source-text">
              <li>
                All test parameters meet the specification or exceptions have
                been reviewed and noted
              </li>
              <li>
                The analysis was performed against the current specification
                version ({batch.specVersion})
              </li>
              <li>The evidence record is complete and retrievable</li>
            </ul>
            <p className="mb-5 text-xs font-semibold text-flagged-text">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-[13px] text-source-text transition-colors duration-150 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAuthorise}
                className="cursor-pointer rounded-md bg-navy px-5 py-2 text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-navy-mid"
              >
                Authorise Review
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
