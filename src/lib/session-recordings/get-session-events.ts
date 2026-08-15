"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const PAGE_SIZE = 1000;

async function getSignedInTrackingId() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, trackingId: null as string | null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tracking_id")
    .eq("id", user.id)
    .maybeSingle();

  const trackingId =
    typeof profile?.tracking_id === "string" ? profile.tracking_id : null;

  return { supabase, trackingId };
}

export async function getSessionRrwebEvents(
  sessionId: string,
): Promise<unknown[]> {
  const { supabase, trackingId } = await getSignedInTrackingId();
  if (!trackingId || !sessionId.trim()) {
    return [];
  }

  const events: unknown[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("session_recordings")
      .select("rrweb_events, created_at")
      .eq("tracking_id", trackingId)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("Failed to load session recording events:", error);
      break;
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const row of data) {
      if (Array.isArray(row.rrweb_events)) {
        events.push(...row.rrweb_events);
      }
    }

    if (data.length < PAGE_SIZE) {
      break;
    }
  }

  return events;
}
