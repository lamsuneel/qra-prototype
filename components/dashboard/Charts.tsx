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

import { CYCLE_TIME_TREND, EXCEPTIONS_BY_PARAMETER, SLA_TARGET_DAYS } from "@/data/dashboard";

const OVER_SLA = "#C55A11";
const UNDER_SLA = "#375623";

/** Amber above the SLA target, green at or below it. */
export function CycleTimeChart() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="text-[13px] font-semibold text-slate-900">Cycle Time Trend</div>
      <div className="mt-1 mb-4 text-[11px] text-slate-400">
        Days from review opened to authorisation · {SLA_TARGET_DAYS.toFixed(1)}-day SLA
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={CYCLE_TIME_TREND} margin={{ top: 16, right: 8, bottom: 4, left: -22 }}>
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#9E9E9E" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              domain={[0, 4]}
              tick={{ fontSize: 11, fill: "#9E9E9E" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "#F8FAFF" }}
              contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: "#E5E7EB" }}
              formatter={(value) => [`${Number(value).toFixed(1)} days`, "Cycle time"]}
            />
            <ReferenceLine
              y={SLA_TARGET_DAYS}
              stroke="#C00000"
              strokeDasharray="5 3"
              label={{ value: "2d SLA", fontSize: 10, fill: "#C00000", position: "insideTopLeft" }}
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

export function ExceptionChart() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="text-[13px] font-semibold text-slate-900">
        Exceptions by Test Parameter
      </div>
      <div className="mt-1 mb-4 text-[11px] text-slate-400">
        This month across all domains
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
              tick={{ fontSize: 11, fill: "#9E9E9E" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              type="category"
              dataKey="category"
              /* Wide enough that the labels the Recurring Issues table uses
                 read on one line here too. */
              width={232}
              tick={{ fontSize: 10, fill: "#595959" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "#F8FAFF" }}
              contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: "#E5E7EB" }}
              formatter={(value) => [`${Number(value)}`, "Exceptions"]}
            />
            <Bar dataKey="count" fill="#4472C4" radius={[0, 3, 3, 0]} maxBarSize={18}>
              <LabelList dataKey="count" position="right" fontSize={10} fill="#374151" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
