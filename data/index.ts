import { FINISHED_PRODUCT_BATCHES } from "./batches";
import { IPFP_BATCHES } from "./ipfp";
import { PACKING_MATERIAL_BATCHES } from "./packing";
import { RAW_MATERIAL_BATCHES } from "./rawmaterial";
import { STABILITY_BATCHES } from "./stability";
import {
  DOMAINS,
  type Batch,
  type SourceSystem,
  type Domain,
  type DomainSummary,
  type Section,
  type SlaStatus,
} from "@/types";

/**
 * Section ids are written per test parameter, so two batches carrying the same
 * parameter would otherwise share them — marking Assay Chemicals reviewed on
 * one batch would mark it on every other. Scoping by AR number keeps each
 * batch's review state its own.
 */
const scopeSectionIds = (batch: Batch): Batch => ({
  ...batch,
  sections: batch.sections.map((section) => ({
    ...section,
    id: `${batch.arNumber}::${section.id}`,
  })),
});

/** Every batch across every domain. Hardcoded — no database, no API. */
export const ALL_BATCHES: Batch[] = [
  ...FINISHED_PRODUCT_BATCHES,
  ...RAW_MATERIAL_BATCHES,
  ...PACKING_MATERIAL_BATCHES,
  ...IPFP_BATCHES,
  ...STABILITY_BATCHES,
].map(scopeSectionIds);

/**
 * The systems this batch was actually read from, in the order the review
 * meets them. Derived rather than declared so the panel can never name a
 * system the review does not use, or miss one it does.
 */
export const sourcesUsedIn = (batch: Batch): SourceSystem[] => {
  const seen: SourceSystem[] = [];

  for (const section of orderedSections(batch)) {
    if (section.standaloneInstrument) {
      const source = section.standaloneInstrument.source;
      if (!seen.includes(source)) seen.push(source);
    }
    for (const item of section.items) {
      if (!seen.includes(item.source)) seen.push(item.source);
    }
  }

  return seen;
};

/** The URL segment for a section — the AR number already sits in the path. */
export const sectionSlug = (section: Section): string =>
  section.id.split("::").pop() as string;

export const getBatch = (id: string): Batch | undefined =>
  ALL_BATCHES.find((batch) => batch.arNumber.toUpperCase() === id.trim().toUpperCase());

export const batchesForDomain = (domain: Domain): Batch[] =>
  ALL_BATCHES.filter((batch) => batch.domain === domain);

export const flaggedItemsInBatch = (batch: Batch): number =>
  batch.sections.reduce(
    (total, section) =>
      total + section.items.filter((item) => item.result === "FLAGGED").length,
    0,
  );

/** Sections belonging to one test parameter, in display order. */
export const sectionsForParameter = (batch: Batch, parameterId: string): Section[] =>
  batch.sections
    .filter((section) => section.parameter === parameterId)
    .sort((a, b) => a.order - b.order);

/** Flat ordered walk of every section, used by Previous / Next navigation. */
export const orderedSections = (batch: Batch): Section[] =>
  batch.parameters.flatMap((parameter) => sectionsForParameter(batch, parameter.id));

/** The most severe SLA state present in a set of batches. */
const worstSla = (batches: Batch[]): SlaStatus => {
  if (batches.some((batch) => batch.slaStatus === "red")) return "red";
  if (batches.some((batch) => batch.slaStatus === "amber")) return "amber";
  return "green";
};

export const domainSummaries = (): DomainSummary[] =>
  DOMAINS.map((meta) => {
    const batches = batchesForDomain(meta.id);
    const sla = worstSla(batches);
    const breached = batches.filter((batch) => batch.slaStatus === "red").length;
    const approaching = batches.filter((batch) => batch.slaStatus === "amber").length;

    const slaNote =
      sla === "red"
        ? `${breached} SLA breached`
        : sla === "amber"
          ? `${approaching} approaching`
          : `${batches.length} within SLA`;

    return {
      domain: meta.id,
      batchCount: batches.length,
      flaggedCount: batches.reduce((total, batch) => total + flaggedItemsInBatch(batch), 0),
      needsReviewCount: batches.filter((batch) => batch.status === "NEEDS_REVIEW").length,
      slaStatus: sla,
      slaNote,
    };
  });

export { FINISHED_PRODUCT_BATCHES, RAW_MATERIAL_BATCHES, PACKING_MATERIAL_BATCHES, IPFP_BATCHES, STABILITY_BATCHES };
