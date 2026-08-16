import Link from "next/link";
import { TrendIndicator } from "@/components/dashboard-metrics";
import { EmptyStatValue } from "@/components/empty-states";
import { MiniConversionDonut } from "@/components/mini-conversion-donut";
import type { CalculatedReportMetrics } from "@/lib/analytics/calculate-report-metrics";
import {
  parseDurationMs,
  percentChange,
  type TrendChange,
} from "@/lib/analytics/percent-change";
import type { ReportDisplay } from "@/lib/reports/build-report-display";

type StatCard = {
  label: string;
  value: string | null;
  trend: TrendChange | null;
  invertColors?: boolean;
  hero?: boolean;
};

function formatShortDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

function funnelConversionPercent(
  metrics: CalculatedReportMetrics,
): number | null {
  const first = metrics.funnel[0]?.count ?? 0;
  const last = metrics.funnel[metrics.funnel.length - 1]?.count ?? 0;
  if (first <= 0) {
    return null;
  }
  return Math.round((last / first) * 100);
}

function maxFunnelDropOffPercent(
  metrics: CalculatedReportMetrics,
): number | null {
  let max: number | null = null;
  for (const step of metrics.funnel) {
    if (step.dropOff === "—") {
      continue;
    }
    const parsed = Number.parseInt(step.dropOff.replace("%", ""), 10);
    if (!Number.isFinite(parsed)) {
      continue;
    }
    if (max === null || parsed > max) {
      max = parsed;
    }
  }
  return max;
}

function buildStatCards(
  latest: CalculatedReportMetrics | null,
  previous: CalculatedReportMetrics | null,
): StatCard[] {
  if (!latest) {
    return [
      { label: "Conversion rate", value: null, trend: null, hero: true },
      { label: "Sessions", value: null, trend: null },
      { label: "Avg. session time", value: null, trend: null },
      {
        label: "Drop-off rate",
        value: null,
        trend: null,
        invertColors: true,
      },
    ];
  }

  const conversion = funnelConversionPercent(latest);
  const prevConversion = previous ? funnelConversionPercent(previous) : null;
  const dropOff = maxFunnelDropOffPercent(latest);
  const prevDropOff = previous ? maxFunnelDropOffPercent(previous) : null;
  const durationMs = parseDurationMs(latest.userBehavior.avgSessionDuration);
  const prevDurationMs = previous
    ? parseDurationMs(previous.userBehavior.avgSessionDuration)
    : null;

  return [
    {
      label: "Conversion rate",
      value: conversion == null ? null : `${conversion}%`,
      trend:
        conversion != null && prevConversion != null
          ? percentChange(conversion, prevConversion)
          : null,
      hero: true,
    },
    {
      label: "Sessions",
      value: latest.userBehavior.sessions.toLocaleString(),
      trend: previous
        ? percentChange(
            latest.userBehavior.sessions,
            previous.userBehavior.sessions,
          )
        : null,
    },
    {
      label: "Avg. session time",
      value: latest.userBehavior.avgSessionDuration,
      trend:
        durationMs != null && prevDurationMs != null
          ? percentChange(durationMs, prevDurationMs)
          : null,
    },
    {
      label: "Drop-off rate",
      value: dropOff == null ? null : `${dropOff}%`,
      trend:
        dropOff != null && prevDropOff != null
          ? percentChange(dropOff, prevDropOff)
          : null,
      invertColors: true,
    },
  ];
}

function engagementComparisonMessage(
  latest: CalculatedReportMetrics,
  previous: CalculatedReportMetrics,
): { message: string; trend: "up" | "down" | "flat"; value: string } | null {
  const currentMs = parseDurationMs(latest.engagement.avgTimeOnPage);
  const previousMs = parseDurationMs(previous.engagement.avgTimeOnPage);
  if (currentMs == null || previousMs == null) {
    return null;
  }

  const change = percentChange(currentMs, previousMs);
  if (!change) {
    return null;
  }

  const message =
    change.trend === "flat"
      ? "Engagement was unchanged compared to previous report."
      : `Engagement ${change.trend === "up" ? "increased" : "decreased"} ${change.value.replace(/^[+-]/, "")} compared to previous report.`;

  return {
    message,
    trend: change.trend,
    value: change.value,
  };
}

function keyInsightText(report: ReportDisplay): string {
  const insights = report.aiInsights;
  if (!insights) {
    return "No AI insight for this report yet.";
  }
  return insights.anomaly?.trim() || insights.summary;
}

function StatCardView({
  stat,
}: {
  stat: StatCard;
}) {
  const isHero = Boolean(stat.hero);

  return (
    <div
      className={
        isHero
          ? "rounded-lg border border-zinc-300 bg-white px-5 py-5 shadow-sm sm:col-span-2 lg:col-span-1"
          : "rounded-lg border border-zinc-200 bg-white px-4 py-4 shadow-sm"
      }
    >
      <p
        className={
          isHero
            ? "text-xs font-medium text-zinc-500"
            : "text-xs text-zinc-500"
        }
      >
        {stat.label}
      </p>
      {stat.value != null ? (
        <p
          className={
            isHero
              ? "mt-2 text-4xl font-semibold tracking-tight text-zinc-900"
              : "mt-1 text-xl font-semibold text-zinc-900"
          }
        >
          {stat.value}
        </p>
      ) : (
        <EmptyStatValue hero={isHero} />
      )}
      {stat.trend ? (
        <div className={isHero ? "mt-3" : "mt-2"}>
          <TrendIndicator
            trend={stat.trend.trend}
            value={stat.trend.value}
            className={isHero ? "text-sm" : "text-xs"}
            invertColors={stat.invertColors}
          />
        </div>
      ) : null}
    </div>
  );
}

export function DashboardWithReports({
  latestReport,
  previousMetrics,
}: {
  latestReport: ReportDisplay;
  previousMetrics: CalculatedReportMetrics | null;
}) {
  const stats = buildStatCards(latestReport.metrics, previousMetrics);
  const heroStat = stats.find((stat) => stat.hero) ?? stats[0];
  const secondaryStats = stats.filter((stat) => !stat.hero);

  const comparison =
    latestReport.metrics && previousMetrics
      ? engagementComparisonMessage(latestReport.metrics, previousMetrics)
      : null;

  return (
    <div className="mb-8 space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardView stat={heroStat} />
        {secondaryStats.map((stat) => (
          <StatCardView key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row">
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-900">Last analysis</p>
            <p className="mt-1 text-sm text-zinc-500">
              Last updated: {formatShortDate(latestReport.dateISO)}
            </p>
            {comparison ? (
              <>
                <p className="mt-3 text-base text-zinc-800">
                  {comparison.message}
                </p>
                <div className="mt-4">
                  <TrendIndicator
                    trend={comparison.trend}
                    value={comparison.value}
                  />
                </div>
              </>
            ) : (
              <p className="mt-3 text-base text-zinc-800">
                First report — no comparison yet
              </p>
            )}
          </div>
          <div className="w-full shrink-0 sm:w-56 sm:pt-1">
            <MiniConversionDonut
              steps={latestReport.metrics?.funnel ?? []}
            />
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
            {keyInsightText(latestReport)}
          </p>
        </div>
      </div>

      <Link
        href={`/reports?report=${latestReport.id}`}
        className="inline-flex text-sm font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900"
      >
        View full report
      </Link>
    </div>
  );
}
