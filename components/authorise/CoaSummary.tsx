import { COA_STATUS_LABEL, type CoaStatus, type CoaSummary } from "@/data/coa";

const STATUS_TONE: Record<CoaStatus, string> = {
  MEETING: "text-compliant-text",
  EXCEPTION: "text-warn-text",
  NOT_MEETING: "text-flagged-text",
};

/**
 * Every parameter on the certificate, not only the ones that flagged.
 *
 * Colour without a fill: these are results being read down a column, and a
 * block of green backgrounds would make the one amber row harder to find
 * rather than easier. The word carries the meaning, the colour confirms it.
 */
export function CoaSummaryTable({
  summary,
  specification,
}: {
  summary: CoaSummary;
  specification: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              {[
                "Test Parameter",
                "Result",
                "Specification",
                "Status",
                "Reviewed By",
                "Authorisation Note",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-3 py-2.5 text-[10px] font-semibold tracking-[0.05em] whitespace-nowrap text-source-text uppercase"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((row) => (
              <tr
                key={row.parameter}
                className="border-b border-slate-100 align-top last:border-b-0"
              >
                <td className="px-3 py-2.5 font-medium text-slate-900">
                  {row.parameter}
                </td>
                <td className="px-3 py-2.5 text-slate-700">{row.result}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                  {row.specification}
                </td>
                <td
                  className={`px-3 py-2.5 font-medium ${STATUS_TONE[row.status]}`}
                >
                  {COA_STATUS_LABEL[row.status]}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                  {row.reviewedBy}
                </td>
                <td className="max-w-[320px] px-3 py-2.5 text-source-text">
                  {row.note ? (
                    <span className="italic">&ldquo;{row.note}&rdquo;</span>
                  ) : (
                    <span aria-hidden="true">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="border-t border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] text-source-text">
        Specification: {specification} · STP references:{" "}
        {summary.stpReferences.join(", ")} · All results sourced from{" "}
        {summary.source}
      </p>
    </div>
  );
}
