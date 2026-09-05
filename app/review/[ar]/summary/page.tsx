"use client";

import { use, useMemo } from "react";
import { notFound, useRouter } from "next/navigation";
import { Inter, JetBrains_Mono } from "next/font/google";

import {
  getBatch,
  isException,
  reviewableSections,
  sourcesUsedIn,
} from "@/data";
import { DEMO_TODAY } from "@/data/clock";
import { PROFILES } from "@/data/profiles";
import { useReview } from "@/context/ReviewContext";
import {
  resultFor,
  type Batch,
  type CheckItem,
  type ItemResult,
  type Section,
} from "@/types";
import { PageTitle } from "@/components/layout/PageTitle";
import { DarkTopbar } from "@/components/dark/DarkTopbar";
import { V3Badge } from "@/components/dark/Badge";
import { AiraGlyph } from "@/components/dark/Icons";
import { V3_THEME_CSS, type V3Tone } from "@/components/dark/theme";

/* The two faces this design uses, scoped to the v3 subtree. */
const inter = Inter({ subsets: ["latin"], variable: "--v3-font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--v3-font-mono" });

const ADVISORY_RESULTS = new Set<ItemResult>([
  "NEEDS_VERIFICATION",
  "CONDITIONAL_PASS",
]);

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** The site date format, "02-Aug-2026". */
const siteDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, "0")}-${MONTHS[date.getMonth()]}-${date.getFullYear()}`;

/**
 * Everything the reviewer has to answer for, worst first.
 *
 * Blocking and advisory entries are listed together because the record is
 * read as one list of what NeuraTrace could not settle on its own — the tone on each
 * row says which kind it is.
 */
const findingsIn = (sections: Section[]) => {
  const rank = (item: CheckItem) => (isException(item) ? 0 : 1);

  return sections
    .flatMap((section) =>
      section.items
        .filter(
          (item) => isException(item) || ADVISORY_RESULTS.has(resultFor(item)),
        )
        .map((item) => ({ section, item })),
    )
    .sort((a, b) => rank(a.item) - rank(b.item));
};

const toneFor = (item: CheckItem): V3Tone =>
  isException(item) ? "blocking" : "advisory";

/* -------------------------------------------------------------------------- */

export default function V3SummaryPage({
  params,
}: {
  params: Promise<{ ar: string }>;
}) {
  const { ar } = use(params);
  const batch = getBatch(decodeURIComponent(ar));

  if (!batch) notFound();

  return <Summary batch={batch} />;
}

function Summary({ batch }: { batch: Batch }) {
  const router = useRouter();
  const {
    profile,
    noteFor,
    reviewedCount,
    totalSections,
    allSectionsReviewed,
    batchStatus,
    submitForAuthorisation,
  } = useReview();

  const sections = useMemo(() => reviewableSections(batch), [batch]);
  const items = useMemo(
    () => sections.flatMap((section) => section.items),
    [sections],
  );
  const findings = useMemo(() => findingsIn(sections), [sections]);

  const compliant = items.filter(
    (item) => resultFor(item) === "COMPLIANT",
  ).length;

  const sources = sourcesUsedIn(batch);
  const reviewer = profile ?? PROFILES[0];

  const done = reviewedCount(batch.arNumber);
  const total = totalSections(batch.arNumber);
  const ready = allSectionsReviewed(batch.arNumber);

  const status = batchStatus(batch.arNumber);
  /* A batch can be submitted while it has not been submitted yet — which
     includes one that went back to the lab and has come again. */
  const submittable =
    status === "NEEDS_REVIEW" || status === "RETURNED_FOR_CORRECTION";
  const authorised = status === "REVIEW_AUTHORISED";

  return (
    <div
      className={`v3-root ${inter.variable} ${mono.variable} flex min-h-dvh flex-col bg-[var(--v3-bg-base)] text-[var(--v3-text-primary)]`}
    >
      <style dangerouslySetInnerHTML={{ __html: V3_THEME_CSS }} />
      <PageTitle title={`${batch.arNumber} — Review Summary`} />

      <DarkTopbar />

      <main className="mx-auto w-full max-w-[820px] flex-1 px-6 pt-8 pb-12">
        <button
          type="button"
          onClick={() => router.push(`/review/${batch.arNumber}`)}
          className="cursor-pointer text-[12px] text-[var(--v3-accent)] transition-opacity duration-[120ms] hover:opacity-80"
        >
          &larr; Back to Review
        </button>

        <h1 className="mt-5 text-[22px] font-semibold text-[var(--v3-text-primary)]">
          Review Summary
        </h1>
        <p className="mt-1.5 mb-7 text-[12px] text-[var(--v3-text-secondary)]">
          {batch.arNumber} · {batch.product} · {batch.limsStatus}
        </p>

        {/* 1 — What I reviewed ------------------------------------------- */}
        <Card label="What I reviewed">
          <Row label="AR Number">
            <span className="font-mono text-[var(--v3-accent)]">
              {batch.arNumber}
            </span>
          </Row>
          <Row label="Product">{batch.product}</Row>
          <Row label="Batch No.">
            <span className="font-mono">{batch.batchNumber}</span>
          </Row>
          <Row label="Scope">
            <span className="font-mono">
              {batch.parameters.length}{" "}
              {batch.parameters.length === 1 ? "parameter" : "parameters"} ·{" "}
              {sections.length} {sections.length === 1 ? "section" : "sections"}{" "}
              · {items.length} checks
            </span>
          </Row>
          <Row label="Specification">
            <span className="font-mono">{batch.specVersion}</span>
            <V3Badge tone={batch.specCurrent ? "compliant" : "blocking"}>
              {batch.specCurrent ? "Current" : "Superseded"}
            </V3Badge>
          </Row>
          <Row label="Review Type">QA Batch Release Review</Row>
          <Row label="Analyst">{batch.analyst}</Row>
          <Row label="Data Sources">
            <div className="flex flex-wrap justify-end gap-1.5">
              {sources.map((source) => (
                <span
                  key={source}
                  className="rounded-[4px] border border-[var(--v3-border-strong)] bg-[var(--v3-bg-surface)] px-2 py-[2px] text-[10px] whitespace-nowrap text-[var(--v3-text-secondary)]"
                >
                  {source}
                </span>
              ))}
            </div>
          </Row>
        </Card>

        {/* 2 — What I found ---------------------------------------------- */}
        <section className="mb-4 rounded-[12px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] p-6">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] font-semibold tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
              What I found
            </span>
            <div className="flex items-center gap-2">
              <V3Badge tone="compliant">{compliant} compliant</V3Badge>
              <V3Badge tone={findings.length > 0 ? "blocking" : "muted"}>
                {findings.length}{" "}
                {findings.length === 1 ? "exception" : "exceptions"}
              </V3Badge>
            </div>
          </div>

          <div className="mt-1 mb-3 text-right font-mono text-[11px] text-[var(--v3-text-muted)] tabular-nums">
            {done} / {total} sections marked reviewed
          </div>

          <div className="mb-1 h-px bg-[var(--v3-border-default)]" />

          {findings.length === 0 ? (
            <p className="py-3 text-[12px] text-[var(--v3-text-secondary)]">
              No exceptions were raised across the reviewed sections.
            </p>
          ) : (
            <ol>
              {findings.map(({ section, item }, index) => {
                const note = noteFor(item.id);
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 border-b border-[var(--v3-border-subtle)] py-2.5 last:border-b-0"
                  >
                    <span
                      className="w-6 shrink-0 pt-px font-mono text-[11px] font-bold tabular-nums"
                      style={{
                        color:
                          toneFor(item) === "blocking"
                            ? "var(--v3-blocking)"
                            : "var(--v3-advisory)",
                      }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="w-40 shrink-0 pt-px text-[10px] leading-[1.4] tracking-[0.04em] text-[var(--v3-text-secondary)] uppercase">
                      {section.parameter} · {section.name}
                    </span>
                    <span className="min-w-0 flex-1 text-[12px] leading-[1.5] text-[var(--v3-text-primary)]">
                      {item.flagReason ?? item.comparison ?? item.label}
                    </span>
                    <span className="max-w-[200px] shrink-0 text-right text-[10px] leading-[1.4] text-[var(--v3-text-muted)] italic">
                      {note
                        ? `"${note}"`
                        : (item.flagAction ??
                          "No reviewer observation recorded yet.")}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* 3 — What happens next ------------------------------------------ */}
        <section className="mb-4 rounded-[12px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] p-6">
          <span className="mb-4 block text-[11px] font-semibold tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
            What happens next
          </span>

          <Row label="Evidence Record ID">
            <span className="font-mono text-[var(--v3-accent)]">
              NT-{batch.arNumber.replace(/\D/g, "")}-001
            </span>
          </Row>
          <Row label="Created">
            <span className="font-mono">{siteDate(DEMO_TODAY)}</span>
          </Row>
          <Row label="Reviewer">
            {reviewer.name} · {reviewer.roleLabel}
          </Row>
          <Row label="Audit Retrievability">
            <V3Badge tone="compliant">Available on demand</V3Badge>
          </Row>
          <Row label="Next Step">
            <span className="text-[var(--v3-advisory)]">
              GM-QA authorisation required before release
            </span>
          </Row>

          <div className="my-4 h-px bg-[var(--v3-border-default)]" />

          <div className="mb-5 rounded-[8px] border border-[var(--v3-aira-border)] bg-[var(--v3-aira-bg)] p-4">
            <span className="mb-2 flex items-center gap-1.5 text-[9px] font-bold tracking-[0.08em] text-[var(--v3-aira)] uppercase">
              <AiraGlyph size={11} />
              AIRA review summary
            </span>
            <p className="text-[11px] leading-[1.6] text-[var(--v3-aira-text)]">
              I read <span className="font-mono">{items.length} checks</span>{" "}
              across {sources.length}{" "}
              {sources.length === 1 ? "system" : "systems"} —{" "}
              {sources.join(", ")}.{" "}
              {findings.length > 0
                ? `${findings.length} ${findings.length === 1 ? "exception was" : "exceptions were"} identified and documented. `
                : "No exceptions were identified. "}
              {findings.length > 0
                ? findings.every(({ item }) => noteFor(item.id))
                  ? "Every exception carries a reviewer observation. "
                  : `${findings.filter(({ item }) => !noteFor(item.id)).length} still need a reviewer observation. `
                : ""}
              {ready
                ? "The evidence record is complete and ready for GM-QA authorisation."
                : `${total - done} of ${total} sections are still to be marked reviewed before this record is complete.`}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={!authorised}
              title={
                authorised
                  ? undefined
                  : "Available once the review is authorised"
              }
              className={`rounded-[6px] border px-4 py-2 text-[11px] font-semibold transition-colors duration-[120ms] ${
                authorised
                  ? "cursor-pointer border-[var(--v3-border-strong)] text-[var(--v3-text-secondary)] hover:text-[var(--v3-text-primary)]"
                  : "cursor-not-allowed border-[var(--v3-border-default)] text-[var(--v3-text-muted)] opacity-60"
              }`}
            >
              Export review record &darr;
            </button>
            <button
              type="button"
              disabled={!ready || !submittable}
              onClick={() => {
                submitForAuthorisation(batch.arNumber);
                router.push("/dashboard");
              }}
              className={`rounded-[6px] border px-4 py-2 text-[11px] font-semibold transition-colors duration-[120ms] ${
                ready && submittable
                  ? "cursor-pointer border-[var(--v3-accent-border)] bg-[var(--v3-accent-bg)] text-[var(--v3-accent)] hover:bg-[rgba(77,158,255,0.20)]"
                  : "cursor-not-allowed border-[var(--v3-border-default)] bg-[var(--v3-bg-surface)] text-[var(--v3-text-muted)] opacity-60"
              }`}
            >
              {submittable
                ? "Submit for GM-QA authorisation →"
                : "Submitted for authorisation"}
            </button>
          </div>

          {submittable && !ready ? (
            <p className="mt-2.5 text-right text-[10px] text-[var(--v3-text-muted)]">
              Every section must be marked as reviewed before the review can be
              submitted.
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Card({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 rounded-[12px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] p-6">
      <span className="mb-4 block text-[11px] font-semibold tracking-[0.08em] text-[var(--v3-text-secondary)] uppercase">
        {label}
      </span>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-[var(--v3-border-subtle)] py-2 last:border-b-0">
      <span className="min-w-[140px] shrink-0 text-[10px] text-[var(--v3-text-muted)]">
        {label}
      </span>
      <span className="flex flex-wrap items-center justify-end gap-2 text-right text-[12px] text-[var(--v3-text-primary)]">
        {children}
      </span>
    </div>
  );
}
