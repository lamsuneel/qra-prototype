import type { Batch } from "@/types";

/**
 * What the approver signs against.
 *
 * The exception list answers "what went wrong". It cannot answer "and what
 * about everything else", which is the question an authorisation actually
 * settles — a signature covers every parameter on the certificate, not only
 * the ones that raised a flag. So the COA summary states the whole result
 * set: the number, the limit it was judged against, and where a reviewer had
 * to write something down.
 *
 * A COA is broader than a NeuraTrace review. It carries parameters that were tested
 * and released elsewhere (description, microbiology) alongside the ones NeuraTrace
 * walked section by section, which is why these rows are stated here rather
 * than derived from the batch's review sections.
 */

export type CoaStatus = "MEETING" | "EXCEPTION" | "NOT_MEETING";

export const COA_STATUS_LABEL: Record<CoaStatus, string> = {
  MEETING: "Meeting specification",
  EXCEPTION: "Exception noted",
  NOT_MEETING: "Not meeting specification",
};

export interface CoaRow {
  parameter: string;
  result: string;
  specification: string;
  status: CoaStatus;
  reviewedBy: string;
  /** The reviewer's own words, where the row needed them. */
  note?: string;
}

export interface CoaSummary {
  rows: CoaRow[];
  stpReferences: string[];
  source: string;
}

/**
 * The finished-product STPs, as recorded on the test parameters themselves.
 * Kept in one place so the certificate footer and the review workspace header
 * cannot end up quoting different numbers for the same method.
 */
const FP_STP_REFERENCES = [
  "STP-AMX-ASSAY-003",
  "STP-AMX-RS-001",
  "STP-AMX-DISSO-002",
  "STP-AMX-KF-001",
  "STP-AMX-LCMS-001",
];

const COA_SUMMARIES: Record<string, CoaSummary> = {
  /* Ciprofloxacin 500mg Tablet — the batch already sitting with the GM-QA. */
  "07-FP-26-0121": {
    source: "Caliber LIMS",
    stpReferences: FP_STP_REFERENCES,
    rows: [
      {
        parameter: "Assay",
        result: "98.7%",
        specification: "95.0–105.0%",
        status: "MEETING",
        reviewedBy: "Arjun Mehta",
      },
      {
        parameter: "Related Substances — Total",
        result: "0.12%",
        specification: "NMT 0.20%",
        status: "MEETING",
        reviewedBy: "Arjun Mehta",
      },
      {
        parameter: "Related Substances — Known Impurity A",
        result: "0.08%",
        specification: "NMT 0.10%",
        status: "MEETING",
        reviewedBy: "Arjun Mehta",
      },
      {
        parameter: "Dissolution (Q)",
        result: "87%",
        specification: "NLT 80% (Q)",
        status: "MEETING",
        reviewedBy: "Arjun Mehta",
      },
      {
        parameter: "Water Content (KF)",
        result: "0.38% w/w",
        specification: "NMT 0.50%",
        status: "MEETING",
        reviewedBy: "Arjun Mehta",
      },
      {
        parameter: "Microbiological — TAMC",
        result: "<10 CFU/g",
        specification: "NMT 1000 CFU/g",
        status: "MEETING",
        reviewedBy: "Arjun Mehta",
      },
      {
        parameter: "Description",
        result: "White to off-white tablet",
        specification: "Complies",
        status: "MEETING",
        reviewedBy: "Arjun Mehta",
      },
      /* The one row the exception list above is about, stated again here in
         its place among the results — a late log entry is a documentation
         finding, not a failing result, and the row has to say both. */
      {
        parameter: "Instruments — Daily Verification",
        result: "Entered after first use (SON-2024-002)",
        specification: "Before first use per SOP-INST-004 §5.2",
        status: "EXCEPTION",
        reviewedBy: "Arjun Mehta",
        note: "Analyst confirmed verification was performed at 07:55 before use; the LIMS entry was made late. Documentation practice deviation DEV-2026-0217 raised. Result is unaffected.",
      },
    ],
  },

  /* Amoxicillin 250mg — reachable once the reviewer submits it. */
  "07-FP-26-0122": {
    source: "Caliber LIMS",
    stpReferences: FP_STP_REFERENCES,
    rows: [
      {
        parameter: "Assay",
        result: "99.31%",
        specification: "95.0–105.0%",
        status: "MEETING",
        reviewedBy: "Priya Sharma",
      },
      {
        parameter: "Related Substances — Total",
        result: "0.19%",
        specification: "NMT 0.20%",
        status: "MEETING",
        reviewedBy: "Priya Sharma",
        note: "Result sits inside the border-limit margin of NMT 0.20%. Confirmed against the raw chromatography during review.",
      },
      {
        parameter: "Dissolution (Q)",
        result: "85%",
        specification: "NLT 80% (Q)",
        status: "MEETING",
        reviewedBy: "Priya Sharma",
      },
      {
        parameter: "Water Content (KF)",
        result: "0.41% w/w",
        specification: "NMT 0.50% w/w",
        status: "MEETING",
        reviewedBy: "Priya Sharma",
      },
      {
        parameter: "Genotoxic Impurity (LCMS)",
        result: "0.08 ppm",
        specification: "NMT 0.05 ppm",
        status: "NOT_MEETING",
        reviewedBy: "Priya Sharma",
        note: "Result exceeds the ICH M7 limit. OOS-2026-0089 raised; the batch cannot be released while the investigation is open.",
      },
    ],
  },
};

export const coaSummaryFor = (batch: Batch): CoaSummary | null =>
  COA_SUMMARIES[batch.arNumber] ?? null;
