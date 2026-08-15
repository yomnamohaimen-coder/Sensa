import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const PAGE_SIZE = 1000;

export type SessionRecordingSummary = {
  sessionId: string;
  firstPage: string;
  eventCount: number;
  startedAt: string;
  endedAt: string;
};

type RecordingChunk = {
  session_id: string;
  page: string;
  created_at: string;
  rrweb_events: unknown;
};

function eventCount(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

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

export async function getUserSessionRecordings(): Promise<
  SessionRecordingSummary[]
> {
  const { supabase, trackingId } = await getSignedInTrackingId();
  console.log("[getUserSessionRecordings] trackingId:", trackingId);
  if (!trackingId) {
    console.log("[getUserSessionRecordings] no trackingId — returning []");
    return [];
  }

  const chunks: RecordingChunk[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("session_recordings")
      .select("session_id, page, created_at, rrweb_events")
      .eq("tracking_id", trackingId)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    console.log("[getUserSessionRecordings] supabase error:", error);
    console.log(
      "[getUserSessionRecordings] page rows:",
      data?.length ?? 0,
      "from:",
      from,
    );

    if (error) {
      console.error("Failed to list session recordings:", error);
      break;
    }

    if (!data || data.length === 0) {
      break;
    }

    chunks.push(...(data as RecordingChunk[]));
    if (data.length < PAGE_SIZE) {
      break;
    }
  }

  console.log(
    "[getUserSessionRecordings] raw chunk count before grouping:",
    chunks.length,
  );

  const bySession = new Map<
    string,
    {
      firstPage: string;
      eventCount: number;
      startedAt: string;
      endedAt: string;
    }
  >();

  for (const chunk of chunks) {
    const existing = bySession.get(chunk.session_id);
    if (!existing) {
      bySession.set(chunk.session_id, {
        firstPage: chunk.page,
        eventCount: eventCount(chunk.rrweb_events),
        startedAt: chunk.created_at,
        endedAt: chunk.created_at,
      });
      continue;
    }

    existing.eventCount += eventCount(chunk.rrweb_events);
    if (chunk.created_at < existing.startedAt) {
      existing.startedAt = chunk.created_at;
      existing.firstPage = chunk.page;
    }
    if (chunk.created_at > existing.endedAt) {
      existing.endedAt = chunk.created_at;
    }
  }

  const sessions = [...bySession.entries()]
    .map(([sessionId, value]) => ({ sessionId, ...value }))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  console.log(
    "[getUserSessionRecordings] sessions after grouping:",
    sessions.length,
  );

  return sessions;
}
