"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  CYCLE_TIME_TREND,
  EXCEPTIONS_BY_PARAMETER,
  PENDING_BY_REASON,
  SLA_TARGET_DAYS,
} from "@/data/dashboard";

const OVER_SLA = "#C55A11";
const UNDER_SLA = "#375623";

/** Amber above the SLA target, green at or below it. */
export function CycleTimeChart() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="text-base font-semibold text-slate-900">
        Cycle Time Trend
      </div>
      <div className="mt-1 mb-4 text-[11px] text-slate-400">
        Days from review opened to authorisation · {SLA_TARGET_DAYS.toFixed(1)}
        -day SLA
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={CYCLE_TIME_TREND}
            margin={{ top: 16, right: 8, bottom: 4, left: -22 }}
          >
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#9E9E9E" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              domain={[0, 4]}
              tick={{ fontSize: 12, fill: "#9E9E9E" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "#F8FAFF" }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 6,
                borderColor: "#E5E7EB",
              }}
              formatter={(value) => [
                `${Number(value).toFixed(1)} days`,
                "Cycle time",
              ]}
            />
            <ReferenceLine
              y={SLA_TARGET_DAYS}
              stroke="#C00000"
              strokeDasharray="5 3"
              label={{
                value: "2d SLA",
                fontSize: 10,
                fill: "#C00000",
                position: "insideTopLeft",
              }}
            />
            <Bar dataKey="days" radius={[3, 3, 0, 0]} maxBarSize={44}>
              <LabelList
                dataKey="days"
                position="top"
                offset={8}
                fontSize={10}
                fill="#374151"
                formatter={(value) => Number(value).toFixed(1)}
              />
              {CYCLE_TIME_TREND.map((point) => (
                /* Solid fill: at 22% opacity the amber read as washed-out
                   peach and the improvement did not carry at a glance. */
                <Cell
                  key={point.month}
                  fill={point.days > SLA_TARGET_DAYS ? OVER_SLA : UNDER_SLA}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Exceptions by test parameter, and a way into them.
 *
 * A count says how often something happened. It does not say whether that is
 * one product misbehaving or six unrelated ones, which is the question that
 * decides whether anything needs doing — so the bars open.
 */
export function ExceptionChart({
  selected,
  onSelect,
}: {
  selected?: string | null;
  onSelect?: (category: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="text-base font-semibold text-slate-900">
        Exceptions by Test Parameter
      </div>
      <div className="mt-1 mb-3 text-[13px] text-slate-400">
        This month across all domains
        {onSelect ? " · select a bar for the batches behind it" : null}
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={EXCEPTIONS_BY_PARAMETER}
            layout="vertical"
            margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
          >
            <CartesianGrid stroke="#F3F4F6" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "#9E9E9E" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              type="category"
              dataKey="category"
              /* Wide enough that the labels the Recurring Issues table uses
                 read on one line here too. */
              width={232}
              tick={{ fontSize: 12, fill: "#595959" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "#F8FAFF" }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 6,
                borderColor: "#E5E7EB",
              }}
              formatter={(value) => [`${Number(value)}`, "Exceptions"]}
            />
            <Bar
              dataKey="count"
              radius={[0, 3, 3, 0]}
              maxBarSize={18}
              onClick={
                onSelect
                  ? (entry) => {
                      /* recharts hands back the rectangle, with the row it
                         was drawn from on its payload. */
                      const category = (
                        entry as unknown as { payload?: { category?: string } }
                      )?.payload?.category;
                      if (category) onSelect(category);
                    }
                  : undefined
              }
              className={onSelect ? "cursor-pointer" : undefined}
            >
              {EXCEPTIONS_BY_PARAMETER.map((point) => (
                <Cell
                  key={point.category}
                  /* The selected bar darkens and takes an outline, so the
                     panel below is never ambiguous about which one it is. */
                  fill={point.category === selected ? "#1F3864" : "#4472C4"}
                  stroke={point.category === selected ? "#1F3864" : undefined}
                  strokeWidth={point.category === selected ? 2 : 0}
                />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                fontSize={12}
                fill="#374151"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Why samples are sitting rather than moving.
 *
 * Read alongside the pipeline counts above it: the counts say how much work
 * is queued, this says what is holding it — which is the part a GM-QA can
 * actually do something about.
 */
export function PendingReasonChart({
  selected,
  onSelect,
}: {
  selected?: string | null;
  onSelect?: (reason: string) => void;
} = {}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="text-base font-semibold text-slate-900">
        Pending Analysis — Reason Breakdown
      </div>
      <div className="mt-1 mb-3 text-[13px] text-slate-400">
        Samples not yet analysed, by what is holding them
        {onSelect ? " · select a bar for the samples behind it" : null}
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={PENDING_BY_REASON}
            layout="vertical"
            margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
          >
            <CartesianGrid stroke="#F3F4F6" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "#9E9E9E" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              type="category"
              dataKey="reason"
              width={232}
              tick={{ fontSize: 12, fill: "#595959" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "#F8FAFF" }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 6,
                borderColor: "#E5E7EB",
              }}
              formatter={(value) => [`${Number(value)}`, "Samples"]}
            />
            <Bar
              dataKey="samples"
              radius={[0, 3, 3, 0]}
              maxBarSize={18}
              onClick={
                onSelect
                  ? (entry) => {
                      /* recharts hands back the rectangle, with the row it
                         was drawn from on its payload. */
                      const reason = (
                        entry as unknown as { payload?: { reason?: string } }
                      )?.payload?.reason;
                      if (reason) onSelect(reason);
                    }
                  : undefined
              }
              className={onSelect ? "cursor-pointer" : undefined}
            >
              {PENDING_BY_REASON.map((point) => (
                <Cell
                  key={point.reason}
                  /* The selected bar darkens and takes an outline, so the
                     panel below is never ambiguous about which one it is. */
                  fill={point.reason === selected ? "#1F3864" : "#4472C4"}
                  stroke={point.reason === selected ? "#1F3864" : undefined}
                  strokeWidth={point.reason === selected ? 2 : 0}
                />
              ))}
              <LabelList
                dataKey="samples"
                position="right"
                fontSize={12}
                fill="#374151"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
