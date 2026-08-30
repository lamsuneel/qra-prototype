import { FINISHED_PRODUCT_BATCHES } from "./batches";
import { IPFP_BATCHES } from "./ipfp";
import { PACKING_MATERIAL_BATCHES } from "./packing";
import { RAW_MATERIAL_BATCHES } from "./rawmaterial";
import { STABILITY_BATCHES } from "./stability";
import {
  DOMAINS,
  type Batch,
  type CheckItem,
  type SourceSystem,
  resultFor,
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
  ALL_BATCHES.find(
    (batch) => batch.arNumber.toUpperCase() === id.trim().toUpperCase(),
  );

export const batchesForDomain = (domain: Domain): Batch[] =>
  ALL_BATCHES.filter((batch) => batch.domain === domain);

/** Flagged, or worse. An unusable result counts as an exception too. */
export const isException = (item: CheckItem): boolean => {
  const result = resultFor(item);
  return result === "FLAGGED" || result === "HARD_INVALID";
};

export const flaggedItemsInBatch = (batch: Batch): number =>
  batch.sections.reduce(
    (total, section) => total + section.items.filter(isException).length,
    0,
  );

/**
 * Every entry behind a parameter's exception count, named with the section it
 * sits in. The badge is a number; this is what the number is made of, so a
 * count can be read back against the entries rather than taken on trust.
 *
 * Only FLAGGED entries count. An entry needing verification is outstanding
 * work, not an exception, and a compliant one is neither.
 */
export const exceptionContributors = (
  batch: Batch,
  parameterId: string,
): { section: string; item: string }[] =>
  sectionsForParameter(batch, parameterId).flatMap((section) =>
    section.items
      .filter(isException)
      .map((item) => ({ section: section.name, item: item.label })),
  );

/** Sections belonging to one test parameter, in display order. */
export const sectionsForParameter = (
  batch: Batch,
  parameterId: string,
): Section[] =>
  batch.sections
    .filter((section) => section.parameter === parameterId)
    .sort((a, b) => a.order - b.order);

/** Flat ordered walk of every section the batch carries. */
export const orderedSections = (batch: Batch): Section[] =>
  batch.parameters.flatMap((parameter) =>
    sectionsForParameter(batch, parameter.id),
  );

/**
 * The sections a reviewer can actually work on.
 *
 * In-process review runs test by test: a parameter the lab has not released
 * has sections in the data, but nothing behind them yet and no way in. They
 * are not work outstanding — they are work that has not arrived — so the
 * progress count and Previous/Next both leave them out. Counting them would
 * mean an in-process batch could never be submitted however much of it was
 * finished.
 */
export const reviewableSections = (batch: Batch): Section[] =>
  batch.parameters
    .filter((parameter) => parameter.readiness !== "IN_PROGRESS")
    .flatMap((parameter) => sectionsForParameter(batch, parameter.id));

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
    const breached = batches.filter(
      (batch) => batch.slaStatus === "red",
    ).length;
    const approaching = batches.filter(
      (batch) => batch.slaStatus === "amber",
    ).length;

    const slaNote =
      sla === "red"
        ? `${breached} SLA breached`
        : sla === "amber"
          ? `${approaching} approaching`
          : `${batches.length} within SLA`;

    return {
      domain: meta.id,
      batchCount: batches.length,
      flaggedCount: batches.reduce(
        (total, batch) => total + flaggedItemsInBatch(batch),
        0,
      ),
      needsReviewCount: batches.filter(
        (batch) => batch.status === "NEEDS_REVIEW",
      ).length,
      slaStatus: sla,
      slaNote,
    };
  });

export {
  FINISHED_PRODUCT_BATCHES,
  RAW_MATERIAL_BATCHES,
  PACKING_MATERIAL_BATCHES,
  IPFP_BATCHES,
  STABILITY_BATCHES,
};
