import { ALL_BATCHES, flaggedItemsInBatch, orderedSections, sectionSlug } from "./index";
import { DOMAIN_META, resultFor, type Batch, type Domain } from "@/types";

/**
 * Search index over every batch in every domain.
 *
 * Reviewers know a batch by its AR number and quote it from memory, so the
 * index is built once from the data already loaded — there is no service to
 * call and nothing to keep in sync.
 */

export interface SearchResult {
  arNumber: string;
  product: string;
  batchNumber: string;
  domain: Domain;
  domainName: string;
  exceptions: number;
  analyst: string;
  /** Where opening this result should land the reviewer. */
  href: string;
  /** Lowercased haystack the query is matched against. */
  haystack: string;
}

/**
 * The section a reviewer should land on: the first one carrying an exception,
 * or the first section of the batch when nothing is flagged.
 */
export const entryPointFor = (batch: Batch): string => {
  const sections = orderedSections(batch);
  const target =
    sections.find((section) => section.items.some((item) => resultFor(item) === "FLAGGED")) ??
    sections[0];

  if (!target) return `/batches/${batch.arNumber}/summary`;

  return `/batches/${batch.arNumber}/review/${target.parameter}/${sectionSlug(target)}`;
};

const build = (): SearchResult[] =>
  ALL_BATCHES.map((batch) => {
    const meta = DOMAIN_META[batch.domain];

    return {
      arNumber: batch.arNumber,
      product: batch.product,
      batchNumber: batch.batchNumber,
      domain: batch.domain,
      domainName: meta.name,
      exceptions: flaggedItemsInBatch(batch),
      analyst: batch.analyst,
      href: entryPointFor(batch),
      haystack: [
        batch.arNumber,
        batch.product,
        batch.batchNumber,
        meta.name,
        meta.abbreviation,
        batch.analyst,
        ...batch.parameters.map((parameter) => parameter.name),
      ]
        .join(" ")
        .toLowerCase(),
    };
  });

export const SEARCH_INDEX: SearchResult[] = build();

/**
 * Matches every whitespace-separated term against the entry. A bare number
 * such as "000122" finds the AR number it is part of, which is how reviewers
 * actually quote a batch.
 */
export const searchBatches = (query: string, limit = 6): SearchResult[] => {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return SEARCH_INDEX.filter((entry) =>
    terms.every((term) => entry.haystack.includes(term)),
  )
    /* Exceptions first — a reviewer searching for a batch usually wants the
       one with something to answer for. */
    .sort((a, b) => b.exceptions - a.exceptions || a.arNumber.localeCompare(b.arNumber))
    .slice(0, limit);
};
