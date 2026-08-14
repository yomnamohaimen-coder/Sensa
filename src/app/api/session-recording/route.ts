import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

type SessionRecordingBody = {
  tracking_id?: unknown;
  session_id?: unknown;
  page?: unknown;
  rrweb_events?: unknown;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseBody(body: SessionRecordingBody) {
  if (!isNonEmptyString(body.tracking_id) || !UUID_RE.test(body.tracking_id)) {
    return { error: "tracking_id must be a valid UUID." };
  }

  if (!isNonEmptyString(body.session_id)) {
    return { error: "session_id is required." };
  }

  if (!isNonEmptyString(body.page)) {
    return { error: "page is required." };
  }

  if (!Array.isArray(body.rrweb_events) || body.rrweb_events.length === 0) {
    return { error: "rrweb_events must be a non-empty array." };
  }

  return {
    tracking_id: body.tracking_id.trim(),
    session_id: body.session_id.trim(),
    page: body.page.trim(),
    rrweb_events: body.rrweb_events,
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  let json: SessionRecordingBody;

  try {
    json = (await request.json()) as SessionRecordingBody;
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const parsed = parseBody(json);
  if ("error" in parsed) {
    return jsonResponse({ error: parsed.error }, 400);
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (error) {
    console.error("Session recording endpoint misconfigured:", error);
    return jsonResponse(
      { error: "Session recording endpoint is not configured." },
      500,
    );
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("tracking_id", parsed.tracking_id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to look up tracking_id:", profileError);
      return jsonResponse({ error: "Could not validate tracking ID." }, 500);
    }

    if (!profile) {
      return jsonResponse({ error: "Invalid tracking ID." }, 401);
    }

    const { data: recording, error: insertError } = await supabase
      .from("session_recordings")
      .insert({
        user_id: profile.id,
        tracking_id: parsed.tracking_id,
        session_id: parsed.session_id,
        page: parsed.page,
        rrweb_events: parsed.rrweb_events,
      })
      .select("id")
      .single();

    if (insertError || !recording) {
      console.error("Failed to insert session recording:", insertError);
      return jsonResponse({ error: "Could not store recording." }, 500);
    }

    return jsonResponse({ ok: true, recording_id: recording.id }, 201);
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    console.error("Session recording endpoint failed:", error);
    return jsonResponse(
      {
        error: timedOut
          ? "Database request timed out."
          : "Could not store recording.",
      },
      timedOut ? 504 : 500,
    );
  }
}
