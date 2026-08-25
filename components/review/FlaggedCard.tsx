"use client";

import { useState } from "react";

import type { CheckItem } from "@/types";
import { useReview } from "@/context/ReviewContext";
import { CalibrationBadge, SourceBadge } from "./Badges";
import { EvidenceTable } from "./EvidenceTable";

/**
 * A flagged item. Collapsed it shows Expected, Actual and Action. Expanded it
 * shows all six fields plus the reviewer note, which is what unlocks Mark
 * Section Reviewed for the section it sits in.
 */
const CAL_DUE = /^Cal\. due (.+)$/;

export function FlaggedCard({ item }: { item: CheckItem }) {
  const calibration = item.reference?.match(CAL_DUE)?.[1];
  const { noteFor, setNote, isNoted } = useReview();
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(() => noteFor(item.id));

  const confirmed = isNoted(item.id);

  const confirm = () => {
    if (draft.trim()) setNote(item.id, draft.trim());
  };

  return (
    <div className="mb-4 rounded-[7px] border-[1.5px] border-flagged-text bg-flagged-bg/10 p-4 sm:px-[18px]">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-bold text-flagged-text">
          FLAGGED — Action Required
        </span>
        <span className="text-xs text-source-text">{item.label}</span>
        {calibration ? <CalibrationBadge due={calibration} /> : null}
      </div>

      {expanded ? (
        <dl className="grid grid-cols-[110px_1fr] text-[13px]">
          <Row label="Actual">
            <span className="flex flex-wrap items-center gap-2">
              {item.actual}
              <SourceBadge source={item.source} />
            </span>
          </Row>
          <Row label="Expected">
            {item.expected}
            {item.expectedSource ? (
              <span className="ml-2 text-[11px] text-source-text">
                {item.expectedSource}
              </span>
            ) : null}
          </Row>
          <Row label="Comparison">{item.comparison}</Row>
          <Row label="Result">
            <span className="inline-flex items-center rounded bg-flagged-bg px-2 py-[2px] text-[11px] font-medium text-flagged-text">
              Flagged — requires reviewer verification
            </span>
          </Row>
          <Row label="Action Required" last>
            {item.flagAction}
          </Row>
        </dl>
      ) : (
        <dl className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="py-[3px] font-medium text-source-text">Expected</dt>
          <dd className="py-[3px] text-slate-700">{item.expected}</dd>
          <dt className="py-[3px] font-medium text-source-text">Actual</dt>
          <dd className="flex flex-wrap items-center gap-2 py-[3px] text-flagged-text">
            {item.actual}
            <SourceBadge source={item.source} />
          </dd>
          <dt className="py-[3px] font-medium text-source-text">Action</dt>
          <dd className="py-[3px] text-slate-700">{item.flagAction}</dd>
        </dl>
      )}

      {item.table ? <EvidenceTable table={item.table} /> : null}

      {expanded ? (
        <div className="mt-4 border-t border-flagged-text/25 pt-4">
          <div className="mb-2.5 text-[11px] font-semibold tracking-wide text-source-text uppercase">
            Reviewer Note <span className="text-flagged-text">*</span>
          </div>

          {confirmed ? (
            <div className="flex flex-wrap items-center gap-2.5 rounded-[5px] border border-compliant-text/30 bg-compliant-bg/50 px-3.5 py-2.5">
              <span className="flex-1 text-[13px] text-slate-700 italic">
                &ldquo;{noteFor(item.id)}&rdquo;
              </span>
              <span className="rounded bg-compliant-bg px-2 py-[2px] text-[11px] font-medium text-compliant-text">
                Noted
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    confirm();
                  }
                }}
                placeholder="Enter verification note (required before marking reviewed)..."
                className="flex-1 rounded-[5px] border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-navy-accent focus:ring-3 focus:ring-navy-accent/10"
              />
              <button
                type="button"
                onClick={confirm}
                className="shrink-0 cursor-pointer rounded-[5px] bg-compliant-text px-3.5 py-2 text-xs font-medium text-white transition-opacity duration-150 hover:opacity-90"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-flagged-text/25 pt-3">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="cursor-pointer rounded border border-flagged-text px-2.5 py-1 text-[11px] text-flagged-text transition-colors duration-150 hover:bg-flagged-text hover:text-white"
          >
            View full details
          </button>
          <span className="text-[11px] text-slate-400">
            {confirmed
              ? "Reviewer note recorded"
              : "Reviewer note required before marking reviewed"}
          </span>
        </div>
      )}

      {expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-3 cursor-pointer text-[11px] text-source-text transition-colors duration-150 hover:text-navy hover:underline"
        >
          Collapse details
        </button>
      ) : null}
    </div>
  );
}

function Row({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  const border = last ? "" : "border-b border-flagged-text/15";
  return (
    <>
      <dt
        className={`py-[7px] text-[11px] font-semibold tracking-wide text-source-text uppercase ${border}`}
      >
        {label}
      </dt>
      <dd className={`py-[7px] pl-3 leading-relaxed text-slate-700 ${border}`}>
        {children}
      </dd>
    </>
  );
}
