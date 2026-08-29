"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getBatch, sectionSlug, sectionsForParameter } from "@/data";
import { DOMAIN_META, resultFor } from "@/types";
import { useReview } from "@/context/ReviewContext";
import { TopNav } from "@/components/layout/TopNav";
import { PageTitle } from "@/components/layout/PageTitle";
import { ReviewSidebar } from "@/components/layout/ReviewSidebar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { RightPanel } from "@/components/layout/RightPanel";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { CompliantRow } from "@/components/review/CompliantRow";
import { FlaggedCard } from "@/components/review/FlaggedCard";
import {
  PaperLogbookSection,
  PDFMockViewer,
  StandaloneInstrumentHeader,
  usePdfViewer,
} from "@/components/review/StandaloneInstrumentSection";
import { ChamberConditionsChart } from "@/components/dashboard/ChamberConditionsChart";
import { SpecVersionBadge } from "@/components/review/Badges";

const headingFor = (parameterName: string, sectionName: string): string => {
  const section = sectionName.replace(/ — Logbook$/, "");

  return section === parameterName || section.startsWith(`${parameterName} `)
    ? section
    : `${parameterName} — ${section}`;
};

export default function ReviewWorkspacePage() {
  const router = useRouter();
  const params = useParams<{ id: string; param: string; section: string }>();
  const { profile, sectionStatus } = useReview();
  const pdf = usePdfViewer();

  /**
   * One entry expanded at a time, per section. Flagged entries open by
   * default because the reviewer has to act on them; the default is derived
   * rather than set in an effect, so switching section resets it for free.
   */
  const [opened, setOpened] = useState<{ section: string; item: string | null } | null>(
    null,
  );

  const batch = getBatch(params.id);

  useEffect(() => {
    if (!profile) router.replace("/");
  }, [profile, router]);

  useEffect(() => {
    if (!batch) router.replace("/dashboard");
  }, [batch, router]);

  if (!profile || !batch) return null;

  const sections = sectionsForParameter(batch, params.param);
  const section =
    sections.find((entry) => sectionSlug(entry) === params.section) ?? sections[0];
  const parameter = batch.parameters.find((entry) => entry.id === params.param);

  if (!section || !parameter) return null;

  /* Action first: flagged, then anything QRA could not conclude, then the
     entries that need nothing from the reviewer. */
  const flagged = section.items.filter((item) => resultFor(item) === "FLAGGED");
  const unverified = section.items.filter(
    (item) => resultFor(item) === "NEEDS_VERIFICATION",
  );
  const compliant = section.items.filter((item) => resultFor(item) === "COMPLIANT");
  const reviewed = sectionStatus(section.id) === "REVIEWED";

  /* Derived rather than set per section, so the note appears wherever a
     two-module standard record does and cannot fall out of step with it. */
  const twoModuleStandards = section.items.some(
    (item) => item.usageSource && item.potencySource,
  );

  /* Derived like the standards note: it appears wherever a manually posted
     value does, and cannot fall out of step with one. */
  const manualEntry = section.items.some(
    (item) => item.source === "Caliber LIMS — Manual Entry",
  );

  const openId =
    opened && opened.section === section.id ? opened.item : (flagged[0]?.id ?? null);

  const toggle = (id: string) =>
    setOpened({ section: section.id, item: openId === id ? null : id });

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-app-bg">
      <PageTitle title={`${batch.arNumber} — ${parameter.name}`} />
      <TopNav batch={batch} />
      <Breadcrumbs
        crumbs={[
          { label: "QA Dashboard", href: "/dashboard" },
          {
            label: DOMAIN_META[batch.domain].name,
            href: `/batches/${DOMAIN_META[batch.domain].slug}`,
          },
          {
            label: `${batch.arNumber} ${batch.product}`,
            href: `/batches/${batch.arNumber}/summary`,
          },
          { label: `${parameter.name} — ${section.name}` },
        ]}
      />

      <div className="flex flex-1 overflow-hidden">
        <ReviewSidebar batch={batch} parameterId={parameter.id} sectionId={section.id} />

        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
            <div>
              <div className="mb-0.5 text-xs text-slate-400">
                Specification {batch.specVersion} · {parameter.stpReference}
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-sm font-bold text-slate-900">
                  {/*
                    One dash. A section that already opens with its parameter's
                    name does not print it twice, and the "— Logbook" suffix is
                    dropped here because the paper record banner immediately
                    below names the logbook and its page.
                  */}
                  {headingFor(parameter.name, section.name)}
                </span>
                <SpecVersionBadge
                  version={batch.specVersion}
                  current={batch.specCurrent}
                />
                {reviewed ? (
                  <span className="rounded bg-compliant-bg px-2 py-[2px] text-[10px] font-medium text-compliant-text">
                    Reviewed
                  </span>
                ) : null}
              </div>
            </div>
            <span className="ml-auto text-xs text-source-text">{batch.arNumber}</span>
          </div>

          <div className="px-6 py-5">
            {section.standaloneInstrument ? (
              <StandaloneInstrumentHeader
                instrument={section.standaloneInstrument}
                onOpenPdf={pdf.openPdf}
              />
            ) : null}

            {manualEntry ? (
              <div className="mb-4 rounded-md border border-navy-accent/30 bg-blue-50 px-4 py-2.5 text-xs leading-relaxed text-navy">
                SST values entered manually into Caliber LIMS by analyst. Source: LIMS
                worksheet.
              </div>
            ) : null}

            {twoModuleStandards ? (
              <div className="mb-4 rounded-md border border-navy-accent/30 bg-blue-50 px-4 py-2.5 text-xs leading-relaxed text-navy">
                Reference standard data is sourced from two Caliber LIMS modules.
                Both are required for a complete review.
              </div>
            ) : null}

            {section.paperLogbook ? (
              <PaperLogbookSection logbook={section.paperLogbook} />
            ) : null}

            {section.chamberReadings ? (
              <ChamberConditionsChart
                readings={section.chamberReadings}
                limits={section.chamberLimits}
              />
            ) : null}

            {flagged.map((item) => (
              <FlaggedCard
                key={item.id}
                item={item}
                expanded={openId === item.id}
                onToggle={() => toggle(item.id)}
              />
            ))}

            {unverified.length > 0 ? (
              <>
                <div className="mb-2 border-b border-warn-text/25 pb-1.5 text-[10px] font-semibold tracking-wider text-warn-text uppercase">
                  {unverified.length}{" "}
                  {unverified.length === 1 ? "entry needs" : "entries need"} verification
                  against the worksheet
                </div>
                <div className="mb-5 flex flex-col">
                  {unverified.map((item) => (
                    <CompliantRow
                      key={item.id}
                      item={item}
                      expanded={openId === item.id}
                      onToggle={() => toggle(item.id)}
                    />
                  ))}
                </div>
              </>
            ) : null}

            {compliant.length > 0 ? (
              <>
                <div className="mb-2 border-b border-slate-100 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  {section.name} — {compliant.length}{" "}
                  {compliant.length === 1 ? "compliant entry" : "compliant entries"}
                </div>
                <div className="flex flex-col">
                  {compliant.map((item) => (
                    <CompliantRow
                      key={item.id}
                      item={item}
                      expanded={openId === item.id}
                      onToggle={() => toggle(item.id)}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <RightPanel batch={batch} />
      </div>

      <BottomNavBar batch={batch} section={section} />

      {pdf.open && section.standaloneInstrument ? (
        <PDFMockViewer
          instrument={section.standaloneInstrument}
          onClose={pdf.closePdf}
        />
      ) : null}
    </div>
  );
}
