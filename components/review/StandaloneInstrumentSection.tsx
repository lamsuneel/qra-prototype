"use client";

import { useState } from "react";

import type { PaperLogbook, StandaloneInstrument } from "@/types";
import { SourceBadge } from "./Badges";

/**
 * Header block for a section whose data comes from an instrument that keeps
 * its own audit trail outside LIMS — the analyst session, and the exported
 * PDF the reviewer opens today.
 */
export function StandaloneInstrumentHeader({
  instrument,
  onOpenPdf,
}: {
  instrument: StandaloneInstrument;
  onOpenPdf: () => void;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 sm:grid-cols-2">
        <div className="text-xs">
          <span className="mr-2 text-slate-400">Analyst Login</span>
          <span className="font-medium text-slate-700">{instrument.analyst}</span>
          <span className="ml-2 text-slate-400">{instrument.loginAt}</span>
        </div>
        <div className="text-xs">
          <span className="mr-2 text-slate-400">Analyst Logout</span>
          <span className="font-medium text-slate-700">{instrument.analyst}</span>
          <span className="ml-2 text-slate-400">{instrument.logoutAt}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3.5">
        <div className="flex-1">
          <div className="text-xs font-medium text-slate-700">Audit Trail PDF</div>
          <div className="mt-0.5 font-mono text-[11px] text-slate-400">
            {instrument.pdfFilename}
          </div>
        </div>
        <SourceBadge source={instrument.source} />
        <button
          type="button"
          onClick={onOpenPdf}
          className="rounded-[5px] bg-navy px-3.5 py-1.5 text-xs text-white"
        >
          View
        </button>
      </div>
    </div>
  );
}

/**
 * A record that is still on paper at this site. Shown as a gap in the
 * electronic trail, not hidden: there is no PDF to open and no system to read
 * from, so the reviewer has to go to the book.
 */
export function PaperLogbookSection({ logbook }: { logbook: PaperLogbook }) {
  return (
    <div className="mb-4 rounded-md border border-warn-text/40 bg-warn-bg px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="rounded bg-warn-text/15 px-2 py-[2px] text-[10px] font-bold tracking-wider text-warn-text uppercase">
          Paper Record
        </span>
        <span className="text-[13px] font-medium text-slate-700">
          {logbook.description}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-source-text">
        <span>{logbook.reference}</span>
        <span>{logbook.page}</span>
      </div>

      <p className="mt-2.5 border-t border-warn-text/25 pt-2.5 text-xs leading-relaxed text-slate-600">
        Reviewer must verify this entry physically in the logbook before marking as
        Reviewed. {logbook.note}
      </p>
    </div>
  );
}

/** Monospaced viewer for the instrument audit trail export. */
export function PDFMockViewer({
  instrument,
  onClose,
}: {
  instrument: StandaloneInstrument;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 p-4">
      <div className="flex max-h-[78vh] w-full max-w-[660px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <div className="font-mono text-[13px] font-semibold text-slate-900">
              {instrument.pdfFilename}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              Instrument Audit Trail · {instrument.name} {instrument.version}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close audit trail"
            className="text-xl leading-none text-slate-400 transition-colors hover:text-slate-700"
          >
            ×
          </button>
        </div>
        <pre className="flex-1 overflow-auto bg-slate-50 px-6 py-5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-slate-700">
          {instrument.auditTrail}
        </pre>
      </div>
    </div>
  );
}

/** Small hook so a section can own its own modal state. */
export function usePdfViewer() {
  const [open, setOpen] = useState(false);
  return { open, openPdf: () => setOpen(true), closePdf: () => setOpen(false) };
}
