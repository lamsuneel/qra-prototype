"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ChamberReading } from "@/types";

/**
 * Stability chamber trace. The excursion between Day 88 and Day 92 is the
 * point of the chart — the reference line makes it read at a glance.
 */
export function ChamberConditionsChart({
  readings,
  limits,
}: {
  readings: ChamberReading[];
  limits?: { temperature: string; humidity: string };
}) {
  return (
    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-5">
      <div className="text-[13px] font-semibold text-slate-900">
        Chamber Conditions
      </div>
      <div className="mt-1 mb-4 text-[11px] text-slate-400">
        {limits
          ? `${limits.temperature} · ${limits.humidity}`
          : "Accelerated condition"}
        {" · Site Logbook / Manual LIMS Entry"}
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={readings}
            margin={{ top: 8, right: 12, bottom: 4, left: -18 }}
          >
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "#9E9E9E" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              domain={[36, 48]}
              tick={{ fontSize: 10, fill: "#9E9E9E" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 6,
                borderColor: "#E5E7EB",
              }}
              formatter={(value) => [`${Number(value)} C`, "Temperature"]}
            />
            <ReferenceLine
              y={42}
              stroke="#C00000"
              strokeDasharray="5 3"
              label={{
                value: "Upper limit 42 C",
                fontSize: 10,
                fill: "#C00000",
                position: "insideTopRight",
              }}
            />
            <ReferenceLine y={38} stroke="#C55A11" strokeDasharray="5 3" />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#1F3864"
              strokeWidth={2}
              dot={{ r: 3, fill: "#1F3864" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
