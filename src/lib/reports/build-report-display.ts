import { calculateReportMetrics } from "@/lib/analytics/calculate-report-metrics";
import type { CalculatedReportMetrics } from "@/lib/analytics/calculate-report-metrics";
import type { DbReport } from "@/lib/events/schema";
import { MOCK_REPORTS } from "@/lib/mock-data";
import { getReportEvents } from "@/lib/reports/get-report-events";

const PLACEHOLDER_HEATMAP = MOCK_REPORTS[0].heatmapDescription;

export type ReportAiInsights = {
  summary: string;
  anomaly: string | null;
  recommendation: string;
};

export type ReportDisplay = {
  id: string;
  label: string;
  date: string;
  dateISO: string;
  metrics: CalculatedReportMetrics | null;
  heatmapDescription: string;
  aiInsights: ReportAiInsights | null;
};

function formatReportDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatReportLabel(isoDate: string): string {
  return `Analysis — ${new Date(isoDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  })}`;
}

function buildStoredAiInsights(report: DbReport): ReportAiInsights | null {
  if (!report.ai_summary || !report.ai_recommendation) {
    return null;
  }

  return {
    summary: report.ai_summary,
    anomaly: report.ai_anomaly,
    recommendation: report.ai_recommendation,
  };
}

export async function buildReportDisplay(report: DbReport): Promise<ReportDisplay> {
  const events = await getReportEvents(report.id);
  const metrics = calculateReportMetrics(events);

  return {
    id: report.id,
    label: formatReportLabel(report.created_at),
    date: formatReportDate(report.created_at),
    dateISO: report.created_at.slice(0, 10),
    metrics,
    heatmapDescription: PLACEHOLDER_HEATMAP,
    aiInsights: buildStoredAiInsights(report),
  };
}

export async function buildReportDisplays(
  reports: DbReport[],
): Promise<ReportDisplay[]> {
  return Promise.all(reports.map(buildReportDisplay));
}
