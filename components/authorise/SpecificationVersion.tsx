/**
 * Which specification the analysis was judged against.
 *
 * A result only means something next to the limit it was compared with, and
 * specifications get revised. If the batch was analysed against a superseded
 * version then every "meets specification" above it is answering the wrong
 * question — so the approver is told which version was in force before they
 * sign, rather than being left to assume it.
 */
export function SpecificationVersion({
  version,
  current,
  source,
}: {
  version: string;
  current: boolean;
  source: string;
}) {
  return (
    <div
      className={
        current
          ? "flex flex-wrap items-start gap-3 rounded-lg border border-[#86EFAC] bg-[#F0FDF4] px-4 py-3"
          : "flex flex-wrap items-start gap-3 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3"
      }
    >
      <span
        aria-hidden="true"
        className={`text-sm leading-5 ${
          current ? "text-compliant-text" : "text-flagged-text"
        }`}
      >
        {current ? "✓" : "⚠"}
      </span>

      <p
        className={`flex-1 text-[13px] leading-relaxed ${
          current ? "text-compliant-text" : "text-flagged-text"
        }`}
      >
        {current ? (
          <>
            <strong className="font-semibold">Specification {version}</strong> —
            Current version confirmed. Analysis performed against the version in
            effect at time of review.
          </>
        ) : (
          <>
            <strong className="font-semibold">
              Specification version mismatch
            </strong>{" "}
            — analysis performed against {version}, current version is{" "}
            {CURRENT_SPEC_VERSION}. Do not authorise until reviewed.
          </>
        )}
      </p>

      <span className="shrink-0 rounded bg-white/70 px-2 py-[2px] text-[10px] font-semibold tracking-[0.04em] text-source-text uppercase">
        {source}
      </span>
    </div>
  );
}

/**
 * The version in force. Stated once here because the mismatch message has to
 * name what the batch should have been analysed against, not what it was.
 */
const CURRENT_SPEC_VERSION = "v3.2";
