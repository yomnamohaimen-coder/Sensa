import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { LISTING_WIREFRAME_WIDTH } from "@/components/heatmap/listing-page-wireframe";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 60;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VIEWPORT_WIDTH = LISTING_WIREFRAME_WIDTH;
const VIEWPORT_HEIGHT = 900;
const NAV_TIMEOUT_MS = 30_000;
const JPEG_QUALITY = 80;

function jsonResponse(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function slugifyPage(page: string): string {
  const slug = page
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || "root";
}

/** Read pixel size from a JPEG buffer (SOF0/SOF2). */
function readJpegSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      if (width > 0 && height > 0) {
        return { width, height };
      }
      return null;
    }

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    const size = buffer.readUInt16BE(offset + 2);
    if (size < 2) {
      break;
    }
    offset += 2 + size;
  }

  return null;
}

function resolveCaptureUrl(page: string, baseUrlRaw: string | undefined) {
  const baseUrl = (baseUrlRaw ?? process.env.SENSA_CAPTURE_BASE_URL ?? "").trim();
  if (!baseUrl) {
    return {
      error:
        "No site URL configured. Pass base_url in the request body, or set SENSA_CAPTURE_BASE_URL. We do not yet store a connected site URL on the profile.",
    };
  }

  let origin: URL;
  try {
    origin = new URL(baseUrl);
  } catch {
    return {
      error: "base_url must be a valid absolute URL (e.g. http://localhost:5173).",
    };
  }

  if (origin.protocol !== "http:" && origin.protocol !== "https:") {
    return { error: "base_url must use http or https." };
  }

  const path = page.startsWith("/") ? page : `/${page}`;
  const target = new URL(path, origin);

  if (target.origin !== origin.origin) {
    return { error: "page must stay on the same origin as base_url." };
  }

  return { url: target.toString() };
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
  const resolved = resolveCaptureUrl(
    page,
    isNonEmptyString(json.base_url) ? json.base_url.trim() : undefined,
  );
  if ("error" in resolved) {
    return jsonResponse({ error: resolved.error }, 400);
  }

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
    .select("id, tracking_id")
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

  let browser: Awaited<
    ReturnType<(typeof import("puppeteer"))["default"]["launch"]>
  > | null = null;

  try {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const browserPage = await browser.newPage();
    await browserPage.setViewport({
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
      deviceScaleFactor: 1,
    });

    const response = await browserPage.goto(resolved.url, {
      waitUntil: "networkidle2",
      timeout: NAV_TIMEOUT_MS,
    });

    if (!response || !response.ok()) {
      const status = response?.status() ?? 0;
      return jsonResponse(
        { error: `Page could not be loaded (HTTP ${status || "unknown"}).` },
        502,
      );
    }

    const screenshot = await browserPage.screenshot({
      type: "jpeg",
      quality: JPEG_QUALITY,
      fullPage: true,
    });

    const bytes = Buffer.from(screenshot);
    const jpegSize = readJpegSize(bytes);
    const width = jpegSize?.width ?? VIEWPORT_WIDTH;
    const height = jpegSize?.height ?? 1;
    const objectPath = `${tracking_id}/${slugifyPage(page)}.jpg`;

    const { error: uploadError } = await service.storage
      .from("page-snapshots")
      .upload(objectPath, bytes, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload captured snapshot:", uploadError);
      return jsonResponse({ error: "Could not store snapshot image." }, 500);
    }

    const {
      data: { publicUrl },
    } = service.storage.from("page-snapshots").getPublicUrl(objectPath);

    const { error: upsertError } = await service.from("page_snapshots").upsert(
      {
        user_id: profile.id,
        tracking_id,
        page,
        image_url: publicUrl,
        width,
        height,
        created_at: new Date().toISOString(),
      },
      { onConflict: "tracking_id,page" },
    );

    if (upsertError) {
      console.error("Failed to upsert page_snapshots row:", upsertError);
      return jsonResponse({ error: "Could not store snapshot." }, 500);
    }

    return jsonResponse({ ok: true, url: resolved.url, image_url: publicUrl }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || /timeout/i.test(message));

    console.error("Capture snapshot failed:", error);
    return jsonResponse(
      {
        error: timedOut
          ? "Timed out waiting for the page to load."
          : `Could not capture snapshot: ${message}`,
      },
      timedOut ? 504 : 500,
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
