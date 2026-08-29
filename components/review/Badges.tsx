import { daysUntil } from "@/data/clock";
import type { BatchStatus, SlaStatus, SourceSystem } from "@/types";
import { BATCH_STATUS_LABELS } from "@/types";
import { cn } from "@/lib/utils";

/** Grey pill naming the system a value was read from. */
export function SourceBadge({ source }: { source: SourceSystem }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded bg-source-bg px-[7px] py-[2px] text-[10px] text-source-text">
      {source}
    </span>
  );
}

/**
 * Whether a chemical's removal from service was authorised. The wording is
 * the site's own term for the LIMS inactivation workflow — it describes that
 * record, never the disposition of a review.
 */
export function InactivationBadge({
  status,
}: {
  status: "Approved" | "Pending Approval";
}) {
  const authorised = status === "Approved";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded px-2 py-[2px] text-[11px] font-medium",
        authorised
          ? "bg-compliant-bg text-compliant-text"
          : "bg-warn-bg text-warn-text",
      )}
    >
      Inactivation: {status}
    </span>
  );
}

export function CompliantBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded bg-compliant-bg px-2 py-[2px] text-[11px] font-medium text-compliant-text">
      <span aria-hidden="true">&#10003;</span> Compliant
    </span>
  );
}

export function FlaggedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded bg-flagged-bg px-2 py-[2px] text-[11px] font-medium text-flagged-text">
      Flagged
    </span>
  );
}

const SLA_STYLES: Record<SlaStatus, string> = {
  green: "bg-compliant-bg text-compliant-text",
  amber: "bg-warn-bg text-warn-text",
  red: "bg-flagged-bg text-flagged-text",
};

const SLA_DOTS: Record<SlaStatus, string> = {
  green: "bg-compliant-text",
  amber: "bg-warn-text",
  red: "bg-flagged-text",
};

export function SLABadge({ status, label }: { status: SlaStatus; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-[9px] py-[2px] text-[11px] font-medium",
        SLA_STYLES[status],
      )}
    >
      <span className={cn("size-1.5 rounded-full", SLA_DOTS[status])} />
      {label}
    </span>
  );
}

/** Green, amber or red by how much calibration life remains. */
/**
 * Calibration state read from the due date: red once the date is behind us,
 * amber inside 30 days, green beyond that. The number of days is on the badge
 * so the reviewer does not have to work it out from the date.
 */
export function CalibrationBadge({ due }: { due: string }) {
  const days = daysUntil(due);

  if (days === null) {
    return (
      <span className="inline-flex shrink-0 items-center rounded bg-source-bg px-2 py-[2px] text-[11px] text-source-text">
        Cal. due {due}
      </span>
    );
  }

  const tone =
    days < 0
      ? "bg-flagged-bg text-flagged-text"
      : days <= 30
        ? "bg-warn-bg text-warn-text"
        : "bg-compliant-bg text-compliant-text";

  const label =
    days < 0
      ? `Calibration overdue ${Math.abs(days)}d`
      : days <= 30
        ? `Cal. due in ${days}d`
        : `Cal. due ${due} · ${days}d`;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded px-2 py-[2px] text-[11px] font-medium",
        tone,
      )}
    >
      {label}
    </span>
  );
}

export function SpecVersionBadge({
  version,
  current,
}: {
  version: string;
  current: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded px-[7px] py-[2px] text-[10px] font-medium",
        current ? "bg-compliant-bg text-compliant-text" : "bg-warn-bg text-warn-text",
      )}
    >
      {version} {current ? "Current" : "Superseded"}
    </span>
  );
}

export function ExceptionCountPill({ count }: { count: number }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-[9px] py-[2px] text-xs",
        count > 0
          ? "bg-flagged-bg font-bold text-flagged-text"
          : "bg-source-bg font-medium text-source-text",
      )}
    >
      {count}
    </span>
  );
}

const STATUS_TONES: Record<BatchStatus, string> = {
  NEEDS_REVIEW: "bg-source-bg text-source-text",
  IN_REVIEW: "bg-navy-accent/15 text-navy",
  AWAITING_AUTHORISATION: "bg-warn-bg text-warn-text",
  REVIEW_AUTHORISED: "bg-compliant-bg text-compliant-text",
  RETURNED_TO_REVIEWER: "bg-flagged-bg text-flagged-text",
};

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded px-2 py-[2px] text-[11px] font-medium",
        STATUS_TONES[status],
      )}
    >
      {BATCH_STATUS_LABELS[status]}
    </span>
  );
}
