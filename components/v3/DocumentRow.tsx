import { documentNumber, documentUrl } from "@/data/config";
import { DocumentIcon } from "./Icons";

/**
 * One controlled document behind the finding.
 *
 * The link is offered only where the site has published a copy. A reference
 * with no URL stays as text — a dead link on a regulatory document is worse
 * than no link, because a reviewer who clicks it once stops trusting the rest.
 */
export function V3DocumentRow({
  reference,
  description,
  meta,
}: {
  reference: string;
  description: string;
  meta?: string;
}) {
  const url = documentUrl(reference);

  return (
    <div className="flex items-center gap-3 rounded-[6px] border border-[var(--v3-border-default)] bg-[var(--v3-bg-card)] px-3.5 py-2.5">
      <span className="shrink-0 text-[var(--v3-text-secondary)]">
        <DocumentIcon />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-[12px] text-[var(--v3-text-primary)]">
          {reference}
        </div>
        <div className="mt-0.5 text-[10px] text-[var(--v3-text-muted)]">
          {description}
          {meta ? ` · ${meta}` : ""}
        </div>
      </div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open ${documentNumber(reference)} — opens in new tab`}
          className="shrink-0 rounded-[4px] border border-[var(--v3-border-strong)] px-2.5 py-1 text-[10px] whitespace-nowrap text-[var(--v3-text-secondary)] transition-colors duration-[120ms] hover:text-[var(--v3-text-primary)]"
        >
          Open document &rarr;
        </a>
      ) : (
        <span className="shrink-0 text-[10px] whitespace-nowrap text-[var(--v3-text-muted)]">
          No controlled copy published
        </span>
      )}
    </div>
  );
}
