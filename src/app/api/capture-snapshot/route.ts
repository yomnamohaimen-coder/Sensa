import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  capturePageSnapshot,
  resolveCaptureUrl,
} from "@/lib/heatmap/capture-page-snapshot";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 60;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  let json: { tracking_id?: unknown; page?: unknown; base_url?: unknown };

  try {
    json = (await request.json()) as typeof json;
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  if (!isNonEmptyString(json.tracking_id) || !UUID_RE.test(json.tracking_id)) {
    return jsonResponse({ error: "tracking_id must be a valid UUID." }, 400);
  }

  if (!isNonEmptyString(json.page)) {
    return jsonResponse({ error: "page is required." }, 400);
  }

  const tracking_id = json.tracking_id.trim();
  const page = json.page.trim();

  const cookieStore = await cookies();
  const authClient = createClient(cookieStore);
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return jsonResponse({ error: "You must be signed in to capture a snapshot." }, 401);
  }

  let service;
  try {
    service = createServiceClient();
  } catch (error) {
    console.error("Capture snapshot misconfigured:", error);
    return jsonResponse({ error: "Capture endpoint is not configured." }, 500);
  }

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("id, tracking_id, site_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to look up profile:", profileError);
    return jsonResponse({ error: "Could not validate account." }, 500);
  }

  if (!profile || profile.tracking_id !== tracking_id) {
    return jsonResponse(
      { error: "tracking_id does not belong to the signed-in account." },
      403,
    );
  }

  const baseUrl =
    (isNonEmptyString(json.base_url) ? json.base_url.trim() : "") ||
    (typeof profile.site_url === "string" ? profile.site_url.trim() : "") ||
    (process.env.SENSA_CAPTURE_BASE_URL ?? "").trim();

  const resolved = resolveCaptureUrl(page, baseUrl);
  if ("error" in resolved) {
    return jsonResponse({ error: resolved.error }, 400);
  }

  const result = await capturePageSnapshot({
    userId: profile.id,
    trackingId: tracking_id,
    page,
    baseUrl,
  });

  if (!result.ok) {
    const timedOut = /timed out/i.test(result.error);
    return jsonResponse({ error: result.error }, timedOut ? 504 : 500);
  }

  return jsonResponse(
    { ok: true, url: result.url, image_url: result.image_url },
    201,
  );
}
