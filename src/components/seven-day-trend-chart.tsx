"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyChartPlaceholder } from "@/components/empty-states";

export type TrendPoint = {
  label: string;
  value: number;
};

const LINE_COLOR = "#059669"; // emerald-600
const FILL_COLOR = "rgba(5, 150, 105, 0.12)";

export function SevenDayTrendChart({
  data,
  isLoading = false,
}: {
  data: TrendPoint[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div
        className="flex h-36 w-full min-w-[200px] items-end gap-1.5 px-1 sm:w-64"
        aria-hidden="true"
      >
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="flex-1 animate-pulse rounded-sm bg-zinc-100"
            style={{ height: `${40 + ((index * 17) % 45)}%` }}
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full min-w-[200px] sm:w-64">
        <EmptyChartPlaceholder message="Not enough data yet for a trend" />
      </div>
    );
  }

  return (
    <div className="h-36 w-full min-w-[200px] sm:w-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#f4f4f5"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis hide domain={["dataMin - 4", "dataMax + 4"]} />
          <Tooltip
            cursor={{ stroke: "#d4d4d8", strokeWidth: 1 }}
            contentStyle={{
              border: "1px solid #e4e4e7",
              borderRadius: "6px",
              fontSize: "12px",
              color: "#18181b",
            }}
            formatter={(value) => [`${value}`, "Value"]}
            labelFormatter={(label) => String(label)}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={LINE_COLOR}
            strokeWidth={2}
            fill={FILL_COLOR}
            dot={false}
            activeDot={{ r: 3, fill: LINE_COLOR }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
