import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

type TrackBody = {
  tracking_id?: unknown;
  session_id?: unknown;
  event_type?: unknown;
  timestamp?: unknown;
  page?: unknown;
  device?: unknown;
  metadata?: unknown;
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

function parseBody(body: TrackBody) {
  if (!isNonEmptyString(body.tracking_id) || !UUID_RE.test(body.tracking_id)) {
    return { error: "tracking_id must be a valid UUID." };
  }

  if (!isNonEmptyString(body.session_id)) {
    return { error: "session_id is required." };
  }

  if (!isNonEmptyString(body.event_type)) {
    return { error: "event_type is required." };
  }

  if (!isNonEmptyString(body.timestamp)) {
    return { error: "timestamp is required." };
  }

  const parsedTimestamp = Date.parse(body.timestamp);
  if (Number.isNaN(parsedTimestamp)) {
    return { error: "timestamp must be a valid ISO-8601 datetime." };
  }

  if (!isNonEmptyString(body.page)) {
    return { error: "page is required." };
  }

  if (!isNonEmptyString(body.device)) {
    return { error: "device is required." };
  }

  if (
    body.metadata !== undefined &&
    body.metadata !== null &&
    (typeof body.metadata !== "object" || Array.isArray(body.metadata))
  ) {
    return { error: "metadata must be a JSON object or null." };
  }

  return {
    tracking_id: body.tracking_id.trim(),
    session_id: body.session_id.trim(),
    event_type: body.event_type.trim(),
    timestamp: new Date(parsedTimestamp).toISOString(),
    page: body.page.trim(),
    device: body.device.trim(),
    metadata:
      body.metadata === undefined
        ? null
        : (body.metadata as Record<string, unknown> | null),
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  let json: TrackBody;

  try {
    json = (await request.json()) as TrackBody;
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
    console.error("Track endpoint misconfigured:", error);
    return jsonResponse({ error: "Tracking endpoint is not configured." }, 500);
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

    const { data: event, error: insertError } = await supabase
      .from("events")
      .insert({
        report_id: null,
        user_id: profile.id,
        session_id: parsed.session_id,
        event_type: parsed.event_type,
        timestamp: parsed.timestamp,
        page: parsed.page,
        device: parsed.device,
        metadata: parsed.metadata,
        source: "tracking_script",
      })
      .select("id")
      .single();

    if (insertError || !event) {
      console.error("Failed to insert tracked event:", insertError);
      return jsonResponse({ error: "Could not store event." }, 500);
    }

    return jsonResponse({ ok: true, event_id: event.id }, 201);
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    console.error("Track endpoint failed:", error);
    return jsonResponse(
      {
        error: timedOut
          ? "Database request timed out."
          : "Could not store event.",
      },
      timedOut ? 504 : 500,
    );
  }
}
