"use server";

import { cookies } from "next/headers";
import { generateSessionSummaryFromTimeline } from "@/lib/ai/generate-session-summary";
import { createClient } from "@/utils/supabase/server";

const PAGE_SIZE = 1000;
const MIN_EVENTS = 2;
const MAX_TIMELINE_STEPS = 40;

const NOT_ENOUGH =
  "Not enough activity in this session to summarize yet.";
const FAILED = "Could not generate a summary right now.";

type SessionEvent = {
  event_type: string;
  timestamp: string;
  page: string;
  metadata: Record<string, unknown> | null;
};

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function clickPhrase(metadata: Record<string, unknown> | null): string {
  if (!metadata) {
    return "Clicked an element";
  }

  const tag =
    typeof metadata.tag === "string" ? metadata.tag.trim().toLowerCase() : "";
  const text =
    typeof metadata.text === "string" ? metadata.text.trim() : "";
  const alt =
    typeof metadata.alt === "string" ? metadata.alt.trim() : "";

  if (tag === "a") {
    return text ? `Clicked “${text}” link` : "Clicked a link";
  }
  if (tag === "img") {
    return alt ? `Clicked image “${alt}”` : "Clicked an image";
  }
  if (text) {
    return `Clicked “${text}”`;
  }
  return "Clicked an element";
}

function describeEvent(event: SessionEvent): string {
  const time = formatClock(event.timestamp);
  const page = event.page || "/";
  const metadata = event.metadata;

  if (event.event_type === "page_view") {
    return `Visited ${page} at ${time}.`;
  }

  if (event.event_type === "click") {
    return `${clickPhrase(metadata)} on ${page} at ${time}.`;
  }

  if (event.event_type === "search") {
    const query =
      metadata && typeof metadata.query === "string"
        ? metadata.query.trim()
        : metadata && typeof metadata.text === "string"
          ? metadata.text.trim()
          : "";
    return query
      ? `Searched for “${query}” at ${time}.`
      : `Searched at ${time}.`;
  }

  if (event.event_type === "contact_submitted") {
    return `Submitted a contact form at ${time}.`;
  }

  return `${event.event_type} on ${page} at ${time}.`;
}

function buildTimeline(events: SessionEvent[]): string {
  const lines: string[] = [];
  let lastPageView: string | null = null;

  for (const event of events) {
    if (event.event_type === "page_view") {
      if (event.page === lastPageView) {
        continue;
      }
      lastPageView = event.page;
    }
    lines.push(describeEvent(event));
    if (lines.length >= MAX_TIMELINE_STEPS) {
      break;
    }
  }

  return lines.join(" ");
}

export async function getOrCreateSessionSummary(
  sessionId: string,
): Promise<string> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !sessionId.trim()) {
    return NOT_ENOUGH;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, tracking_id")
    .eq("id", user.id)
    .maybeSingle();

  const trackingId =
    typeof profile?.tracking_id === "string" ? profile.tracking_id : null;

  if (!trackingId) {
    return NOT_ENOUGH;
  }

  const rows: SessionEvent[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("events")
      .select("event_type, timestamp, page, metadata")
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .eq("source", "tracking_script")
      .order("timestamp", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error || !data || data.length === 0) {
      break;
    }

    rows.push(...(data as SessionEvent[]));
    if (data.length < PAGE_SIZE) {
      break;
    }
  }

  if (rows.length < MIN_EVENTS) {
    return NOT_ENOUGH;
  }

  const { data: cached } = await supabase
    .from("session_recording_summaries")
    .select("summary, source_event_count")
    .eq("tracking_id", trackingId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (cached && cached.source_event_count === rows.length) {
    return cached.summary;
  }

  try {
    const timeline = buildTimeline(rows);
    const summary = await generateSessionSummaryFromTimeline(timeline);
    const now = new Date().toISOString();

    const { error: upsertError } = await supabase
      .from("session_recording_summaries")
      .upsert(
        {
          user_id: user.id,
          tracking_id: trackingId,
          session_id: sessionId,
          summary,
          source_event_count: rows.length,
          updated_at: now,
        },
        { onConflict: "tracking_id,session_id" },
      );

    if (upsertError) {
      console.error("Failed to cache session summary:", upsertError);
    }

    return summary;
  } catch (error) {
    console.error("Failed to generate session summary:", error);
    return cached?.summary ?? FAILED;
  }
}
