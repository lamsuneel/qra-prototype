import type {
  ConfiguredRule,
  RegulatoryRow,
  SopRow,
  SpecRow,
  StpRow,
} from "@/types";

/**
 * Site configuration — read only in the prototype and in the product.
 * Every automated check traces back to one of the documents named here.
 *
 * LEVEL C — confirm with site QA before pilot. Open action: C-01
 * The document references below are representative. The real set comes from
 * the site document control system during implementation.
 */

export const CONFIG_CALLOUT =
  "QRA is configured to this site SOPs, STPs, and product specifications. Every automated check in QRA traces back to a named document shown here. Configuration is managed by the QRA implementation team.";

export const PRODUCT_SPECIFICATIONS: SpecRow[] = [
  {
    product: "Amoxicillin 250mg Tablet",
    specification: "FP Specification",
    version: "v3.2",
    status: "Active",
  },
  {
    product: "Amoxicillin Trihydrate API",
    specification: "API Specification",
    version: "v2.1",
    status: "Active",
  },
  {
    product: "HDPE Bottle 60ml",
    specification: "PM Specification",
    version: "v1.4",
    status: "Active",
  },
];

export const SOPS: SopRow[] = [
  {
    reference: "SOP-HPLC-001",
    url: "/docs/SOP-HPLC-001.pdf",
    description: "HPLC System Suitability and Operation",
    appliesTo: "All HPLC tests",
    status: "Active",
  },
  {
    reference: "SOP-CHEM-003",
    url: "/docs/SOP-CHEM-003.pdf",
    description: "Chemical Usage and Documentation",
    appliesTo: "All tests",
    status: "Active",
  },
  {
    reference: "SOP-STD-002",
    url: "/docs/SOP-STD-002.pdf",
    description: "Working and Reference Standards Management",
    appliesTo: "All tests",
    status: "Active",
  },
  {
    reference: "SOP-INST-004",
    url: "/docs/SOP-INST-004.pdf",
    description: "Instrument Calibration Management",
    appliesTo: "All instruments",
    status: "Active",
  },
  {
    reference: "SOP-PM-QC-004",
    url: "/docs/SOP-PM-QC-004.pdf",
    description: "Packing Material Quality Control",
    appliesTo: "PM review",
    status: "Active",
  },
  {
    reference: "SOP-RM-QC-001",
    url: "/docs/SOP-RM-QC-001.pdf",
    description: "Raw Material Testing and Disposition",
    appliesTo: "RM review",
    status: "Active",
  },
  {
    reference: "SOP-STB-001",
    url: "/docs/SOP-STB-001.pdf",
    description: "Stability Chamber Management and Excursions",
    appliesTo: "Stability review",
    status: "Active",
  },
];

export const STPS: StpRow[] = [
  {
    reference: "STP-AMX-ASSAY-003",
    url: "/docs/STP-AMX-ASSAY-003.pdf",
    method: "Amoxicillin Assay by HPLC",
    domain: "Finished Product",
    status: "Active",
  },
  {
    reference: "STP-AMX-RS-001",
    url: "/docs/STP-AMX-RS-001.pdf",
    method: "Amoxicillin Related Substances by HPLC",
    domain: "Finished Product",
    status: "Active",
  },
  {
    reference: "STP-AMX-DISSO-002",
    url: "/docs/STP-AMX-DISSO-002.pdf",
    method: "Amoxicillin Dissolution (UV)",
    domain: "Finished Product",
    status: "Active",
  },
  {
    reference: "STP-AMX-KF-001",
    url: "/docs/STP-AMX-KF-001.pdf",
    method: "Amoxicillin Water Content by KF",
    domain: "Finished Product",
    status: "Active",
  },
  {
    reference: "STP-AMX-LCMS-001",
    url: "/docs/STP-AMX-LCMS-001.pdf",
    method: "Amoxicillin Genotoxic Impurity by LCMS",
    domain: "Finished Product",
    status: "Active",
  },
  {
    reference: "STP-RM-FTIR-001",
    url: "/docs/STP-RM-FTIR-001.pdf",
    method: "Raw Material Identity by FTIR",
    domain: "Raw Material",
    status: "Active",
  },
  {
    reference: "STP-PM-BAR-001",
    url: "/docs/STP-PM-BAR-001.pdf",
    method: "Packing Material Barcode Verification",
    domain: "Packing Material",
    status: "Active",
  },
  {
    reference: "STP-IPFP-BU-002",
    url: "/docs/STP-IPFP-BU-002.pdf",
    method: "Blend Uniformity by HPLC",
    domain: "IPFP",
    status: "Active",
  },
  {
    reference: "STP-STB-RS-001",
    url: "/docs/STP-STB-RS-001.pdf",
    method: "Stability Related Substances by HPLC",
    domain: "Stability",
    status: "Active",
  },
];

/**
 * The checklist a domain is reviewed to. Raw and packing material run on the
 * corporate material checklist rather than the site's own analytical review
 * formats, so the difference is stated rather than left to be discovered.
 */
export interface ChecklistFormatRow {
  domain: string;
  format: string;
}

export const CHECKLIST_FORMATS: ChecklistFormatRow[] = [
  {
    domain: "Raw Material",
    format:
      "CQA-CP-GEN-042 — Material Release/Reject Review Checklist (Corporate)",
  },
  {
    domain: "Packing Material",
    format:
      "CQA-CP-GEN-042 — Material Release/Reject Review Checklist (Corporate)",
  },
  {
    domain: "Finished Product",
    format: "FU7-QA-GEN-080 — Analytical data review, Format 1",
  },
  {
    domain: "In-Process Finished Product",
    format: "FU7-QA-GEN-080 — Analytical data review, Format 1",
  },
  {
    domain: "Stability",
    format: "FU7-QA-GEN-080 — Analytical data review, Format 1",
  },
];

export const REGULATORY_STANDARDS: RegulatoryRow[] = [
  {
    standard: "ICH Q3C",
    scope: "Residual Solvent Limits",
    appliesTo: "All products",
    type: "Built-in default",
  },
  {
    standard: "ICH M7",
    scope: "Genotoxic Impurity Permitted Limits",
    appliesTo: "All products",
    type: "Built-in default",
  },
  {
    standard: "USP <905>",
    scope: "Content Uniformity",
    appliesTo: "Solid oral products",
    type: "Built-in default",
  },
  {
    standard: "21 CFR 211.180",
    scope: "Record Retention — 7 years",
    appliesTo: "All review types",
    type: "Built-in default",
  },
  {
    standard: "EU GMP Annex 11",
    scope: "Electronic Records",
    appliesTo: "All review types",
    type: "Built-in default",
  },
];

/** Expandable detail: what each automated check actually compares. */
export const CONFIGURED_RULES_TITLE = "Configured Rules — Amoxicillin 250mg";

export const CONFIGURED_RULES: ConfiguredRule[] = [
  {
    check: "Chemical entry status",
    sourceDocument: "SOP-CHEM-003",
    comparison:
      "Every chemical used is an active entry in the LIMS audit trail",
  },
  {
    check: "Working standard validity",
    sourceDocument: "SOP-STD-002",
    comparison: "Standard lot expiry date is on or after the analysis date",
  },
  {
    check: "Hygroscopic standard window",
    sourceDocument: "SOP-STD-002 §6.2",
    comparison: "Hygroscopic standard used within 24 hours of first opening",
  },
  {
    check: "Instrument calibration",
    sourceDocument: "SOP-INST-004",
    comparison: "Calibration due date is after the date of use",
  },
  {
    check: "System suitability",
    sourceDocument: "SOP-HPLC-001",
    comparison:
      "Tailing, plate count and resolution meet the STP method limits",
  },
  {
    check: "Column injection life",
    sourceDocument: "SOP-HPLC-001 §8",
    comparison: "Cumulative injections remain at or below the qualified limit",
  },
  {
    check: "KF determination count",
    sourceDocument: "STP-AMX-KF-001",
    comparison: "One determination unless an instrument error is documented",
  },
  {
    check: "Genotoxic impurity limit",
    sourceDocument: "ICH M7",
    comparison: "Result is at or below the permitted daily exposure limit",
  },
];

/* -------------------------------------------------------------------------- */
/* Document links                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The review checklist formats, which are controlled documents like any
 * other. They are cited in the review workspace as regulatory sources, so
 * they resolve here even though they are not SOPs or STPs.
 */
const CHECKLIST_DOCUMENT_URLS: Record<string, string> = {
  "FU7-QA-GEN-080": "/docs/FU7-QA-GEN-080.pdf",
  "CQA-CP-GEN-042": "/docs/CQA-CP-GEN-042.pdf",
};

const DOCUMENT_URLS: Record<string, string> = [...SOPS, ...STPS].reduce(
  (map, row) => (row.url ? { ...map, [row.reference]: row.url } : map),
  { ...CHECKLIST_DOCUMENT_URLS },
);

/**
 * The document number inside a citation.
 *
 * References are cited with the clause that applies — "SOP-STD-002 §6.2",
 * "FU7-QA-GEN-080 §4.5.5.3" — because the clause is what makes the citation
 * checkable. The document is the same document either way, so the clause is
 * dropped before the lookup rather than requiring an entry per clause.
 */
export const documentNumber = (reference: string): string =>
  reference.split("§")[0].trim();

/**
 * Where a cited document can be read, if the site has published it.
 *
 * Returns undefined until the implementation team wires the site document
 * control system in — and callers render plain text when it does. A citation
 * that opens nothing is worse than one that was never a link, because it
 * teaches reviewers that the links do not work.
 */
export const documentUrl = (reference: string): string | undefined =>
  DOCUMENT_URLS[documentNumber(reference)];
