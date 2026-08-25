"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CONFIG_CALLOUT,
  CONFIGURED_RULES,
  CONFIGURED_RULES_TITLE,
  PRODUCT_SPECIFICATIONS,
  REGULATORY_STANDARDS,
  SOPS,
  STPS,
} from "@/data/config";
import { useReview } from "@/context/ReviewContext";
import { TopNav } from "@/components/layout/TopNav";

/** Read only. No buttons that change anything, no forms, no edit affordances. */
export default function ConfigPage() {
  const router = useRouter();
  const { profile } = useReview();
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    if (!profile) router.replace("/");
  }, [profile, router]);

  if (!profile) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-app-bg">
      <TopNav />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-7">
        <div className="mb-5 flex flex-wrap items-center gap-3.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Site Configuration
          </h1>
          <span className="rounded bg-source-bg px-2.5 py-[3px] text-[11px] font-semibold text-source-text">
            Read Only
          </span>
        </div>

        <p className="mb-6 rounded-[7px] border border-blue-200 bg-blue-50 px-[18px] py-3.5 text-[13px] leading-relaxed text-navy">
          {CONFIG_CALLOUT}
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <ConfigTable
            title="Product Specifications"
            headings={["Product", "Specification", "Version", "Status"]}
            rows={PRODUCT_SPECIFICATIONS.map((row) => [
              row.product,
              row.specification,
              row.version,
              row.status,
            ])}
            monoColumn={2}
          />

          <ConfigTable
            title="SOPs Configured"
            headings={["SOP Reference", "Description", "Applies To", "Status"]}
            rows={SOPS.map((row) => [
              row.reference,
              row.description,
              row.appliesTo,
              row.status,
            ])}
            monoColumn={0}
          />

          <ConfigTable
            title="STPs Configured"
            headings={["STP Reference", "Method Name", "Domain", "Status"]}
            rows={STPS.map((row) => [row.reference, row.method, row.domain, row.status])}
            monoColumn={0}
          />

          <ConfigTable
            title="Regulatory Standards Applied"
            headings={["Standard", "Scope", "Applies To", "Type"]}
            rows={REGULATORY_STANDARDS.map((row) => [
              row.standard,
              row.scope,
              row.appliesTo,
              row.type,
            ])}
          />
        </div>

        <section className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setRulesOpen((value) => !value)}
            className="flex w-full items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-700"
          >
            {CONFIGURED_RULES_TITLE}
            <span className="text-[11px] font-normal text-source-text">
              {rulesOpen ? "Hide" : "Show"}
            </span>
          </button>

          {rulesOpen ? (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400">
                  <th className="px-4 py-2 font-medium">Automated Check</th>
                  <th className="px-4 py-2 font-medium">Source Document</th>
                  <th className="px-4 py-2 font-medium">What QRA Compares</th>
                </tr>
              </thead>
              <tbody>
                {CONFIGURED_RULES.map((rule) => (
                  <tr key={rule.check} className="border-b border-slate-50">
                    <td className="px-4 py-2 text-slate-700">{rule.check}</td>
                    <td className="px-4 py-2 font-mono text-[11px] text-navy-mid">
                      {rule.sourceDocument}
                    </td>
                    <td className="px-4 py-2 text-source-text">{rule.comparison}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function ConfigTable({
  title,
  headings,
  rows,
  monoColumn,
}: {
  title: string;
  headings: string[];
  rows: string[][];
  monoColumn?: number;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <h2 className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700">
        {title}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-400">
              {headings.map((heading) => (
                <th key={heading} className="px-4 py-2 font-medium whitespace-nowrap">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("|")} className="border-b border-slate-50">
                {row.map((cell, index) => (
                  <td
                    key={index}
                    className={
                      index === monoColumn
                        ? "px-4 py-2 font-mono text-[11px] whitespace-nowrap text-navy-mid"
                        : "px-4 py-2 text-slate-700"
                    }
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
