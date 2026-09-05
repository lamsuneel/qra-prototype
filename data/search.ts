import {
  ALL_BATCHES,
  firstUnresolvedSection,
  flaggedItemsInBatch,
  sectionSlug,
} from "./index";
import { DOMAIN_META, type Batch, type Domain } from "@/types";

/**
 * Search index over every batch in every domain.
 *
 * Reviewers know a batch by its AR number and quote it from memory, so the
 * index is built once from the data already loaded — there is no service to
 * call and nothing to keep in sync.
 */

/**
 * The site AR number format: unit, review type, year, sequence.
 *
 *   07-FP-26-0001
 *
 * Validation is advisory only. The search matches on product, batch number
 * and analyst too, so a query that is not an AR number is perfectly valid —
 * the hint exists for someone who is clearly typing one and has it wrong.
 */
export const AR_TYPE_CODES = [
  "FP",
  "RM",
  "PM",
  "IPFP",
  "ST",
  "HS",
  "SFP",
  "PRS",
] as const;

export const AR_NUMBER_PATTERN =
  /^\d{2}-(FP|RM|PM|IPFP|ST|HS|SFP|PRS)-\d{2}-\d{4}$/i;

export const AR_NUMBER_EXAMPLE = "07-FP-26-0001";

/**
 * True where the query reads as an attempt at an AR number — it carries a
 * hyphen and a digit — but does not match the format. A plain product name
 * or a bare sequence number is not an attempt, and gets no hint.
 */
export const looksLikeMalformedAr = (query: string): boolean => {
  const trimmed = query.trim();
  if (trimmed.length < 3) return false;
  if (!trimmed.includes("-") || !/\d/.test(trimmed)) return false;

  return !AR_NUMBER_PATTERN.test(trimmed);
};

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

/** Where opening a search result should land. */
const hrefFor = (batch: Batch): string => {
  const target = firstUnresolvedSection(batch);
  if (!target) return `/legacy/batches/${batch.arNumber}/summary`;

  return `/legacy/batches/${batch.arNumber}/review/${target.parameter}/${sectionSlug(target)}`;
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
      /* Opening a result lands where the work is — the same rule the
         sidebar uses when a parameter is clicked. */
      href: hrefFor(batch),
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

  return (
    SEARCH_INDEX.filter((entry) =>
      terms.every((term) => entry.haystack.includes(term)),
    )
      /* Exceptions first — a reviewer searching for a batch usually wants the
       one with something to answer for. */
      .sort(
        (a, b) =>
          b.exceptions - a.exceptions || a.arNumber.localeCompare(b.arNumber),
      )
      .slice(0, limit)
  );
};
