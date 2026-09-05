"use client";

import { useEffect } from "react";

export const TITLE_SUFFIX = "NeuraTrace — Quality Review Assistant";

/**
 * Sets the browser tab title for one screen.
 *
 * Every page in this app is a client component, so none of them can export
 * Next's `metadata`. This applies the same template the root layout declares —
 * "<short title> | NeuraTrace — Quality Review Assistant" — so the product name
 * the tab wherever the reviewer is.
 */
export function PageTitle({ title }: { title?: string }) {
  useEffect(() => {
    document.title = title ? `${title} | ${TITLE_SUFFIX}` : TITLE_SUFFIX;
  }, [title]);

  return null;
}
