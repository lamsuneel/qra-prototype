"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { domainSummaries } from "@/data";
import { RECENT_ACTIVITY } from "@/data/dashboard";
import { SITE_NAME } from "@/data/profiles";
import { useReview } from "@/context/ReviewContext";
import { TopNav } from "@/components/layout/TopNav";
import { BatchSearch } from "@/components/layout/BatchSearch";
import { PageTitle } from "@/components/layout/PageTitle";
import { DomainCard } from "@/components/dashboard/DomainCard";
import { ComingSoonCard } from "@/components/dashboard/ComingSoonCard";

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useReview();

  useEffect(() => {
    if (!profile) router.replace("/");
  }, [profile, router]);

  if (!profile) return null;

  const summaries = domainSummaries();

  return (
    <div className="flex min-h-dvh flex-col bg-app-bg">
      <PageTitle title="QA Review Dashboard" />
      <TopNav />

      <main className="flex-1 px-6 py-8 lg:px-10">
        <header className="mb-7">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            QA Review Dashboard
          </h1>
          <p className="mt-1 text-[13px] text-source-text">{SITE_NAME}</p>

          <div className="mt-4">
            <BatchSearch
              variant="page"
              placeholder="Search any batch — AR number, product or batch number..."
            />
          </div>
        </header>

        <div className="mb-8 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary) => (
            <DomainCard key={summary.domain} summary={summary} />
          ))}

          {/*
            The review modules QRA does not cover yet. Display only — no
            route, no queue, and deliberately not Domains, so none of them
            reaches the batch lists, the search index or the management
            breakdown as an empty shell.
          */}
          <ComingSoonCard
            name="Microbiology"
            abbreviation="MB"
            note="Parameters reviewed under FP and Stability AR numbers"
          />
          <ComingSoonCard name="Hold Study" abbreviation="HS" />
          <ComingSoonCard name="Semi-Finished Product" abbreviation="SFP" />
          <ComingSoonCard name="Protocol for RA Submission" abbreviation="RA" />
        </div>

        <section className="border-t border-slate-200 pt-5">
          <h2 className="mb-3.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Recent Activity
          </h2>
          <ul className="flex flex-col gap-2.5">
            {RECENT_ACTIVITY.map((entry) => (
              <li key={entry.description} className="flex items-baseline gap-3.5 text-xs">
                <span className="min-w-[72px] shrink-0 text-slate-400">{entry.at}</span>
                <span className="text-slate-700">{entry.description}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
