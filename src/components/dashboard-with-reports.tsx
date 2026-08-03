import Link from "next/link";
import { Sparkline, TrendIndicator } from "@/components/dashboard-metrics";
import {
  MOCK_DASHBOARD_STATS,
  MOCK_KEY_INSIGHT,
  MOCK_LAST_ANALYSIS,
  MOCK_SPARKLINE,
} from "@/lib/mock-data";

export function DashboardWithReports() {
  return (
    <div className="mb-8 space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_DASHBOARD_STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">
              {stat.value}
            </p>
            <div className="mt-2">
              <TrendIndicator
                trend={stat.trend}
                value={stat.change}
                className="text-xs"
                invertColors={stat.label === "Drop-off rate"}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-900">Last analysis</p>
            <p className="mt-1 text-sm text-zinc-500">
              Last updated: {MOCK_LAST_ANALYSIS.updatedAt}
            </p>
            <p className="mt-3 text-base text-zinc-800">
              {MOCK_LAST_ANALYSIS.summary}
            </p>
            <div className="mt-4">
              <TrendIndicator
                trend={MOCK_LAST_ANALYSIS.trend}
                value={MOCK_LAST_ANALYSIS.trendValue}
              />
            </div>
          </div>
          <div className="shrink-0 pt-1">
            <p className="mb-1 text-right text-xs text-zinc-400">7-day trend</p>
            <Sparkline data={MOCK_SPARKLINE} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200">
          <svg
            aria-hidden="true"
            className="h-4 w-4 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m4.5 0a12.05 12.05 0 003.478-.697.75.75 0 00-.845-1.24 10.502 10.502 0 01-10.332 0 .75.75 0 00-.845 1.24 12.05 12.05 0 003.478.697m0 0a12.06 12.06 0 01-4.5 0m4.5 0V9.75a3 3 0 00-3-3h-1.5a3 3 0 00-3 3v8.478"
            />
          </svg>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Key insight
          </p>
          <p className="mt-1 text-sm leading-6 text-zinc-800">
            {MOCK_KEY_INSIGHT}
          </p>
        </div>
      </div>

      <Link
        href="/reports"
        className="inline-flex text-sm font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900"
      >
        View full report
      </Link>
    </div>
  );
}
