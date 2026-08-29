"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AR_NUMBER_EXAMPLE,
  looksLikeMalformedAr,
  searchBatches,
  type SearchResult,
} from "@/data/search";
import { cn } from "@/lib/utils";

/**
 * Batch search.
 *
 * A reviewer knows the AR number and types the last few digits, so the query
 * matches anywhere in the entry rather than only at the start. Opening a
 * result lands on the first section carrying an exception, and tells the
 * workspace to draw the eye to where the work is.
 */
export function BatchSearch({
  variant = "nav",
  placeholder = `Search AR number (e.g. ${AR_NUMBER_EXAMPLE})`,
}: {
  variant?: "nav" | "page";
  placeholder?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const results = query.trim() ? searchBatches(query) : [];
  const showing = open && results.length > 0;
  /* Advisory only — the query still runs. */
  const malformed = looksLikeMalformedAr(query);

  const openResult = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(`${result.href}?from=search`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!showing) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const chosen = results[active] ?? results[0];
      if (chosen) openResult(chosen);
    }
  };

  const nav = variant === "nav";

  return (
    <div className={cn("relative", nav ? "w-[260px] shrink-0" : "w-full max-w-md")}>
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showing}
        aria-controls="batch-search-results"
        aria-label="Search batches by AR number, product or batch number"
        value={query}
        placeholder={placeholder}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        /* Delayed so a click on a result is not cancelled by the blur. */
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        className={cn(
          "w-full rounded-md border px-3 py-1.5 text-[13px] outline-none transition-colors duration-150",
          nav
            ? "border-white/15 bg-white/10 text-white placeholder:text-slate-400 focus:border-navy-accent focus:bg-white/15"
            : "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-navy-accent focus:ring-3 focus:ring-navy-accent/10",
        )}
      />

      {showing ? (
        <ul
          id="batch-search-results"
          role="listbox"
          className="absolute top-full right-0 left-0 z-50 mt-1.5 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
        >
          {results.map((result, index) => (
            <li key={result.arNumber} role="option" aria-selected={index === active}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => openResult(result)}
                className={cn(
                  "flex w-full cursor-pointer flex-col gap-0.5 border-b border-slate-100 px-3.5 py-2.5 text-left last:border-b-0 transition-colors duration-150",
                  index === active ? "bg-blue-50" : "bg-white hover:bg-blue-50",
                )}
              >
                <span className="text-[13px] font-semibold text-navy-mid">
                  {result.arNumber}
                </span>
                <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-source-text">
                  <span className="text-slate-700">{result.product}</span>
                  <span className="text-slate-300">·</span>
                  <span>{result.domainName}</span>
                  <span className="text-slate-300">·</span>
                  {result.exceptions > 0 ? (
                    <span className="font-medium text-flagged-text">
                      <span aria-hidden="true">&#9888;</span> {result.exceptions}{" "}
                      {result.exceptions === 1 ? "exception" : "exceptions"}
                    </span>
                  ) : (
                    <span className="text-compliant-text">No exceptions</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {malformed ? (
        <div
          className={cn(
            "absolute top-full left-0 z-40 mt-1 text-[11px]",
            nav ? "text-slate-300" : "text-source-text",
          )}
        >
          Format: {AR_NUMBER_EXAMPLE}
        </div>
      ) : null}

      {open && query.trim() && results.length === 0 ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-[12px] text-source-text shadow-lg">
          No batch matches &ldquo;{query.trim()}&rdquo;.
        </div>
      ) : null}
    </div>
  );
}
