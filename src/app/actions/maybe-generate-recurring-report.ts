"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { captureMissingSnapshotsForReport } from "@/lib/heatmap/capture-page-snapshot";
import { isAutoReportDue } from "@/lib/reports/analysis-interval";
import { generateAndStoreReportInsights } from "@/lib/reports/generate-and-store-report-insights";
import { createClient } from "@/utils/supabase/server";

export type RecurringReportResult =
  | { status: "skipped" }
  | { status: "created"; reportId: string }
  | { status: "error"; error: string };

const EVENT_PAGE_SIZE = 1000;

export async function maybeGenerateRecurringReport(): Promise<RecurringReportResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "skipped" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "analysis_interval_days, analysis_manual_only, last_auto_report_at, tracking_id, site_url",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { status: "skipped" };
  }

  const intervalDays =
    typeof profile.analysis_interval_days === "number"
      ? profile.analysis_interval_days
      : null;
  const manualOnly = profile.analysis_manual_only !== false;

  if (!isAutoReportDue(manualOnly, intervalDays, profile.last_auto_report_at)) {
    return { status: "skipped" };
  }

  const { count: pendingCount, error: countError } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("source", "tracking_script")
    .is("report_id", null);

  if (countError || !pendingCount || pendingCount === 0) {
    return { status: "skipped" };
  }

  // Claim this interval slot so concurrent dashboard loads don't double-generate.
  const claimedAt = new Date().toISOString();
  let claimQuery = supabase
    .from("profiles")
    .update({
      last_auto_report_at: claimedAt,
      updated_at: claimedAt,
    })
    .eq("id", user.id)
    .eq("analysis_interval_days", intervalDays)
    .eq("analysis_manual_only", false);

  if (profile.last_auto_report_at) {
    claimQuery = claimQuery.eq("last_auto_report_at", profile.last_auto_report_at);
  } else {
    claimQuery = claimQuery.is("last_auto_report_at", null);
  }

  const { data: claimed, error: claimError } = await claimQuery
    .select("id")
    .maybeSingle();

  if (claimError || !claimed) {
    return { status: "skipped" };
  }

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      status: "processing",
      source: "tracking_script",
      source_filename: null,
    })
    .select("id")
    .single();

  if (reportError || !report) {
    return {
      status: "error",
      error: reportError?.message ?? "Could not create an automatic report.",
    };
  }

  const { error: attachError } = await supabase
    .from("events")
    .update({ report_id: report.id })
    .eq("user_id", user.id)
    .eq("source", "tracking_script")
    .is("report_id", null);

  if (attachError) {
    await supabase.from("reports").delete().eq("id", report.id);
    return {
      status: "error",
      error: attachError.message,
    };
  }

  const analyticsEvents: {
    session_id: string;
    event_type: string;
    timestamp: string;
    page: string;
  }[] = [];

  for (let from = 0; ; from += EVENT_PAGE_SIZE) {
    const { data: page, error: eventsError } = await supabase
      .from("events")
      .select("session_id, event_type, timestamp, page")
      .eq("report_id", report.id)
      .order("timestamp", { ascending: true })
      .range(from, from + EVENT_PAGE_SIZE - 1);

    if (eventsError) {
      await supabase
        .from("reports")
        .update({ status: "failed" })
        .eq("id", report.id);
      return { status: "error", error: eventsError.message };
    }

    if (!page || page.length === 0) {
      break;
    }

    analyticsEvents.push(...page);

    if (page.length < EVENT_PAGE_SIZE) {
      break;
    }
  }

  if (analyticsEvents.length === 0) {
    await supabase.from("reports").delete().eq("id", report.id);
    return { status: "skipped" };
  }

  try {
    await generateAndStoreReportInsights(
      cookieStore,
      report.id,
      analyticsEvents,
    );
  } catch (error) {
    console.error("Failed to generate AI insights for auto report:", error);
  }

  const { error: completeError } = await supabase
    .from("reports")
    .update({ status: "completed" })
    .eq("id", report.id);

  if (completeError) {
    return { status: "error", error: completeError.message };
  }

  revalidatePath("/reports");
  revalidatePath("/dashboard");
  revalidatePath("/heatmap");

  const trackingId =
    typeof profile.tracking_id === "string" ? profile.tracking_id : null;
  const clickPages = analyticsEvents
    .filter((event) => event.event_type === "click")
    .map((event) => event.page);

  try {
    if (trackingId) {
      await captureMissingSnapshotsForReport({
        userId: user.id,
        trackingId,
        siteUrl: profile.site_url,
        pages: clickPages,
      });
    }
  } catch (error) {
    console.error(
      "Non-fatal: snapshot capture after auto report failed:",
      error,
    );
  }

  return { status: "created", reportId: report.id };
}
