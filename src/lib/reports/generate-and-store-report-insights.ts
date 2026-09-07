import { calculateReportMetrics } from "@/lib/analytics/calculate-report-metrics";
import type { AnalyticsEvent } from "@/lib/analytics/calculate-report-metrics";
import { generateReportInsights } from "@/lib/ai/generate-report-insights";
import { prepareReportInsightContext } from "@/lib/ai/prepare-report-insight-context";
import { createClient } from "@/utils/supabase/server";
import type { cookies } from "next/headers";

export async function generateAndStoreReportInsights(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  reportId: string,
  events: AnalyticsEvent[],
): Promise<void> {
  const metrics = calculateReportMetrics(events);

  if (!metrics) {
    return;
  }

  const context = prepareReportInsightContext(metrics);
  const insights = await generateReportInsights(context);
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from("reports")
    .update({
      ai_summary: insights.summary,
      ai_anomaly: insights.anomaly,
      ai_recommendation: insights.recommendation,
    })
    .eq("id", reportId);

  if (error) {
    throw new Error(error.message);
  }
}
