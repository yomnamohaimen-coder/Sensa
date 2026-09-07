import { cookies } from "next/headers";
import type { AnalyticsEvent } from "@/lib/analytics/calculate-report-metrics";
import { createClient } from "@/utils/supabase/server";

export async function getReportEvents(reportId: string): Promise<AnalyticsEvent[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("events")
    .select("session_id, event_type, timestamp, page")
    .eq("report_id", reportId)
    .order("timestamp", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as AnalyticsEvent[];
}
