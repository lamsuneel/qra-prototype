"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getBatch, reviewableSections, sectionSlug } from "@/data";
import { DOMAIN_META, resultFor } from "@/types";
import { useReview } from "@/context/ReviewContext";
import { TopNav } from "@/components/layout/TopNav";
import { PageTitle } from "@/components/layout/PageTitle";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SourceBadge, SpecVersionBadge } from "@/components/review/Badges";

/**
 * What the summary is showing.
 *
 * The same page answers two different questions depending on who is asking
 * it. A reviewer walking back through their own work wants the exceptions
 * and nothing else; someone confirming the batch was reviewed in full wants
 * the compliant count. Both are already on the page — the filter just stops
 * one from being read past to reach the other.
 */
type FindingFilter = "all" | "exceptions" | "compliant";

const FILTERS: { id: FindingFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "exceptions", label: "Exceptions only" },
  { id: "compliant", label: "Compliant only" },
];

export default function SummaryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const {
    profile,
    noteFor,
    reviewedCount,
    totalSections,
    allSectionsReviewed,
    batchStatus,
    submitForAuthorisation,
  } = useReview();

  /* Deliberately not persisted: a filter that outlives the visit would
     have a later reader open the page with exceptions already hidden. */
  const [filter, setFilter] = useState<FindingFilter>("all");

  const batch = getBatch(params.id);

  useEffect(() => {
    if (!profile) router.replace("/legacy");
  }, [profile, router]);

  useEffect(() => {
    if (!batch) router.replace("/legacy/dashboard");
  }, [batch, router]);

  if (!profile || !batch) return null;

  const sections = reviewableSections(batch);
  const exceptions = sections.flatMap((section) =>
    section.items
      .filter((item) => resultFor(item) === "FLAGGED")
      .map((item) => ({ section, item })),
  );
  const compliantSections =
    sections.length - new Set(exceptions.map((entry) => entry.section.id)).size;

  const status = batchStatus(batch.arNumber);
  const ready = allSectionsReviewed(batch.arNumber);

  /* A batch is submittable when it has not been submitted yet — which
     includes one that went back to the lab and has come again. */
  const submittable =
    status === "NEEDS_REVIEW" || status === "RETURNED_FOR_CORRECTION";
  const authorised = status === "REVIEW_AUTHORISED";

  const submit = () => {
    submitForAuthorisation(batch.arNumber);
    router.push("/legacy/dashboard");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-app-bg">
      <PageTitle title={`${batch.arNumber} — Review Summary`} />
      <TopNav batch={batch} />
      <Breadcrumbs
        crumbs={[
          { label: "QA Dashboard", href: "/dashboard" },
          {
            label: DOMAIN_META[batch.domain].name,
            href: `/batches/${DOMAIN_META[batch.domain].slug}`,
          },
          { label: `${batch.arNumber} ${batch.product}` },
          { label: "Review Summary" },
        ]}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <button
          type="button"
          onClick={() => {
            /* Back to where the reviewer left off — the last section. */
            const last = sections[sections.length - 1];
            if (last) {
              router.push(
                `/batches/${batch.arNumber}/review/${last.parameter}/${sectionSlug(last)}`,
              );
            }
          }}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-source-text transition-colors duration-150 hover:text-navy hover:underline"
        >
          <span aria-hidden="true">&larr;</span> Back to Review
        </button>
        <h1 className="mt-2 mb-7 text-xl font-bold tracking-tight text-slate-900">
          Review Summary
        </h1>

        {/* 1 — What I Reviewed */}
        <section className="mb-3.5 rounded-lg border border-slate-200 bg-white px-6 py-5">
          <h2 className="mb-3.5 text-[11px] font-bold tracking-widest text-navy uppercase">
            What I Reviewed
          </h2>
          <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
            <Field label="AR Number" value={batch.arNumber} />
            <Field label="Product" value={batch.product} />
            <Field
              label="Test Parameters"
              value={`${batch.parameters.length} parameters · ${sections.length} sections`}
            />
            <div>
              <dt className="text-slate-400">Specification</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-slate-900">
                {batch.specVersion}
                <SpecVersionBadge
                  version={batch.specVersion}
                  current={batch.specCurrent}
                />
              </dd>
            </div>
          </dl>
          <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5 text-xs text-source-text">
            Data sources:
            {batch.dataSources.map((source) => (
              <SourceBadge key={source} source={source} />
            ))}
          </div>
        </section>

        {/* 2 — What I Found */}
        <section className="mb-3.5 rounded-lg border border-slate-200 bg-white px-6 py-5">
          <h2 className="mb-3 text-[11px] font-bold tracking-widest text-navy uppercase">
            What I Found
          </h2>

          <div
            role="group"
            aria-label="Filter what is shown"
            className="mb-3.5 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-[3px]"
          >
            {FILTERS.map((option) => {
              const active = filter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(option.id)}
                  className={`cursor-pointer rounded-full px-3 py-[3px] text-[11px] font-semibold transition-colors duration-150 ${
                    active
                      ? "bg-navy text-white"
                      : "text-source-text hover:text-navy"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-slate-100 pb-4 text-[13px]">
            {/* Each count is shown only while what it counts is in view, so
                the compliant total is not repeated beside its own summary. */}
            {filter === "all" ? (
              <span className="rounded-[5px] bg-compliant-bg px-3 py-1 font-semibold text-compliant-text">
                {compliantSections} sections compliant
              </span>
            ) : null}
            {filter !== "compliant" ? (
              <span
                className={`rounded-[5px] px-3 py-1 font-semibold ${
                  exceptions.length > 0
                    ? "bg-flagged-bg text-flagged-text"
                    : "bg-source-bg text-source-text"
                }`}
              >
                {exceptions.length}{" "}
                {exceptions.length === 1 ? "exception" : "exceptions"}
              </span>
            ) : null}
            <span className="ml-auto text-xs text-slate-400 tabular-nums">
              {reviewedCount(batch.arNumber)} / {totalSections(batch.arNumber)}{" "}
              sections reviewed
            </span>
          </div>

          {filter === "compliant" ? (
            <p className="rounded-[7px] border border-compliant-text/25 bg-compliant-bg px-4 py-3 text-[13px] font-medium text-compliant-text">
              <span aria-hidden="true">&#10003;</span> {compliantSections}{" "}
              {compliantSections === 1 ? "section" : "sections"} reviewed and
              found compliant.
            </p>
          ) : exceptions.length === 0 ? (
            <p className="text-[13px] text-source-text">
              No exceptions were raised across the reviewed sections.
            </p>
          ) : (
            <ol className="flex flex-col gap-3.5">
              {exceptions.map(({ section, item }, index) => (
                <li
                  key={item.id}
                  className="border-l-[3px] border-flagged-text pl-3.5"
                >
                  <div className="mb-1 text-xs font-semibold text-flagged-text">
                    Exception {index + 1} — {section.parameter.toUpperCase()} ·{" "}
                    {section.name}
                  </div>
                  <p className="mb-1.5 text-[13px] text-slate-700">
                    {item.flagReason}
                  </p>
                  <p className="text-xs text-source-text italic">
                    {noteFor(item.id)
                      ? `"${noteFor(item.id)}"`
                      : "No reviewer note recorded yet."}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* 3 — What Happens Next */}
        <section className="mb-6 rounded-lg border border-slate-200 bg-white px-6 py-5">
          <h2 className="mb-3.5 text-[11px] font-bold tracking-widest text-navy uppercase">
            What Happens Next
          </h2>
          <dl className="mb-5 grid gap-3 text-[13px] sm:grid-cols-3">
            <div>
              <dt className="text-[11px] text-slate-400">Evidence Record ID</dt>
              <dd className="mt-0.5 font-mono text-xs font-semibold text-navy">
                QRA-{batch.arNumber.replace(/\D/g, "")}-001
              </dd>
            </div>
            <Field label="Created" value="30-Jul-2026 · 09:45 AM" />
            <div>
              <dt className="text-[11px] text-slate-400">
                Audit Retrievability
              </dt>
              <dd className="mt-0.5">
                <span className="rounded bg-compliant-bg px-[7px] py-[2px] text-[10px] font-medium text-compliant-text">
                  Available on demand
                </span>
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!ready || !submittable}
              onClick={submit}
              className={`rounded-md px-6 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                ready && submittable
                  ? "cursor-pointer bg-navy text-white hover:bg-navy-mid"
                  : "cursor-not-allowed bg-slate-200 text-slate-400 opacity-40"
              }`}
            >
              Submit for Authorisation
            </button>
            <button
              type="button"
              disabled={!authorised}
              title={
                authorised
                  ? undefined
                  : "Available once the review is authorised"
              }
              className={`rounded-md border px-4 py-2.5 text-[13px] transition-colors duration-150 ${
                authorised
                  ? "cursor-pointer border-navy-accent text-navy-accent hover:bg-navy-accent hover:text-white"
                  : "cursor-not-allowed border-slate-200 text-slate-400 opacity-40"
              }`}
            >
              Export Review Record
            </button>
          </div>

          {!ready ? (
            <p className="mt-2.5 text-xs text-source-text">
              Every section must be marked as reviewed before the review can be
              submitted.
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
