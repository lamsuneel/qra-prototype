import { documentNumber, documentUrl } from "@/data/config";
import { cn } from "@/lib/utils";

/**
 * A cited document, opened rather than looked up.
 *
 * Every automated check names the document it came from, which is what makes
 * it checkable — but naming SOP-STD-002 §6.2 and leaving the reviewer to go
 * and find it is most of the work still to do. Where the site has published
 * the document, the citation opens it.
 *
 * In a new tab, always: the reviewer is mid-review with unsaved observations
 * on the page, and navigating away from that to read a clause would cost them
 * the work.
 *
 * Where no URL is configured the reference renders as plain text. A citation
 * that opens nothing is worse than one that was never a link, because it
 * teaches reviewers that the links do not work.
 */
export function DocumentLink({
  reference,
  className,
  tooltip = false,
}: {
  reference: string;
  className?: string;
  /** The review workspace explains the click; the config tables do not need to. */
  tooltip?: boolean;
}) {
  const url = documentUrl(reference);
  if (!url) return <>{reference}</>;

  const hint = `Open ${documentNumber(reference)} — opens in new tab`;

  const link = (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={tooltip ? undefined : hint}
      className={cn(
        "cursor-pointer underline decoration-dotted underline-offset-2 transition-colors duration-150 hover:text-navy-accent",
        className,
      )}
    >
      {reference}
    </a>
  );

  if (!tooltip) return link;

  return (
    <span className="group relative inline-block">
      {link}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-[11px] font-normal whitespace-nowrap text-white shadow-lg group-hover:block"
      >
        {hint}
      </span>
    </span>
  );
}
