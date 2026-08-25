"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { getBatch, sectionSlug, sectionsForParameter } from "@/data";
import { useReview } from "@/context/ReviewContext";
import { TopNav } from "@/components/layout/TopNav";
import { ReviewSidebar } from "@/components/layout/ReviewSidebar";
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

export default function ReviewWorkspacePage() {
  const router = useRouter();
  const params = useParams<{ id: string; param: string; section: string }>();
  const { profile, sectionStatus } = useReview();
  const pdf = usePdfViewer();

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

  /* Flagged always renders above compliant. */
  const flagged = section.items.filter((item) => item.result === "FLAGGED");
  const compliant = section.items.filter((item) => item.result === "COMPLIANT");
  const reviewed = sectionStatus(section.id) === "REVIEWED";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-app-bg">
      <TopNav batch={batch} />

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
                  {parameter.name} — {section.name}
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

            {section.chamberReadings ? (
              <ChamberConditionsChart
                readings={section.chamberReadings}
                limits={section.chamberLimits}
              />
            ) : null}

            {flagged.map((item) => (
              <FlaggedCard key={item.id} item={item} />
            ))}

            {compliant.length > 0 ? (
              <>
                <div className="mb-2 border-b border-slate-100 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  {section.name} — {compliant.length}{" "}
                  {compliant.length === 1 ? "compliant entry" : "compliant entries"}
                </div>
                <div className="flex flex-col">
                  {compliant.map((item) => (
                    <CompliantRow key={item.id} item={item} />
                  ))}
                </div>
              </>
            ) : null}

            {section.paperLogbook ? (
              <PaperLogbookSection logbook={section.paperLogbook} />
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
