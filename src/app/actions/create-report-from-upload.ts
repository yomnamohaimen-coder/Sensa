"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { parseEventsCsv } from "@/lib/csv/parse-events-csv";
import type { ParsedEventRow } from "@/lib/events/schema";
import { generateAndStoreReportInsights } from "@/lib/reports/generate-and-store-report-insights";
import { createClient } from "@/utils/supabase/server";

const INSERT_BATCH_SIZE = 500;

type UploadResult =
  | { reportId: string }
  | { error: string };

async function insertEventsInBatches(
  supabase: ReturnType<typeof createClient>,
  reportId: string,
  userId: string,
  events: ParsedEventRow[],
) {
  for (let index = 0; index < events.length; index += INSERT_BATCH_SIZE) {
    const batch = events.slice(index, index + INSERT_BATCH_SIZE).map((event) => ({
      report_id: reportId,
      user_id: userId,
      session_id: event.session_id,
      event_type: event.event_type,
      timestamp: event.timestamp,
      page: event.page,
      device: event.device,
      metadata: event.metadata,
    }));

    const { error } = await supabase.from("events").insert(batch);
    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function createReportFromUpload(
  formData: FormData,
): Promise<UploadResult> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { error: "Please select a CSV file to analyze." };
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { error: "Only .csv files are supported." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to upload data." };
  }

  const csvText = await file.text();
  const parsed = parseEventsCsv(csvText);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      status: "completed",
      source: "manual_upload",
      source_filename: file.name,
    })
    .select("id")
    .single();

  if (reportError || !report) {
    return {
      error: reportError?.message ?? "Could not create a report record.",
    };
  }

  try {
    await insertEventsInBatches(
      supabase,
      report.id,
      user.id,
      parsed.events,
    );
  } catch (error) {
    await supabase.from("reports").delete().eq("id", report.id);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not save event data. Please try again.",
    };
  }

  const analyticsEvents = parsed.events.map((event) => ({
    session_id: event.session_id,
    event_type: event.event_type,
    timestamp: event.timestamp,
    page: event.page,
  }));

  try {
    await generateAndStoreReportInsights(
      cookieStore,
      report.id,
      analyticsEvents,
    );
  } catch (error) {
    console.error("Failed to generate AI insights for report:", error);
  }

  revalidatePath("/reports");
  revalidatePath("/dashboard");

  return { reportId: report.id };
}
