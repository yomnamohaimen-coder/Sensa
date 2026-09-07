import { createServiceClient } from "@/utils/supabase/service";

const VIEWPORT_WIDTH = 1512;
const VIEWPORT_HEIGHT = 900;
const NAV_TIMEOUT_MS = 30_000;
const JPEG_QUALITY = 80;

export type CapturePageSnapshotInput = {
  userId: string;
  trackingId: string;
  page: string;
  baseUrl: string;
};

export type CapturePageSnapshotResult =
  | { ok: true; url: string; image_url: string }
  | { ok: false; error: string };

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

export function resolveCaptureUrl(page: string, baseUrlRaw: string) {
  const baseUrl = baseUrlRaw.trim();
  if (!baseUrl) {
    return {
      error:
        "No site URL configured. Pass base_url, set profiles.site_url, or set SENSA_CAPTURE_BASE_URL.",
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

export async function capturePageSnapshot(
  input: CapturePageSnapshotInput,
): Promise<CapturePageSnapshotResult> {
  const resolved = resolveCaptureUrl(input.page, input.baseUrl);
  if ("error" in resolved) {
    return { ok: false, error: resolved.error ?? "Invalid capture URL." };
  }

  let service;
  try {
    service = createServiceClient();
  } catch (error) {
    console.error("Capture snapshot misconfigured:", error);
    return { ok: false, error: "Capture is not configured." };
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
      return {
        ok: false,
        error: `Page could not be loaded (HTTP ${status || "unknown"}).`,
      };
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
    const objectPath = `${input.trackingId}/${slugifyPage(input.page)}.jpg`;

    const { error: uploadError } = await service.storage
      .from("page-snapshots")
      .upload(objectPath, bytes, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload captured snapshot:", uploadError);
      return { ok: false, error: "Could not store snapshot image." };
    }

    const {
      data: { publicUrl },
    } = service.storage.from("page-snapshots").getPublicUrl(objectPath);

    const { error: upsertError } = await service.from("page_snapshots").upsert(
      {
        user_id: input.userId,
        tracking_id: input.trackingId,
        page: input.page,
        image_url: publicUrl,
        width,
        height,
        created_at: new Date().toISOString(),
      },
      { onConflict: "tracking_id,page" },
    );

    if (upsertError) {
      console.error("Failed to upsert page_snapshots row:", upsertError);
      return { ok: false, error: "Could not store snapshot." };
    }

    return { ok: true, url: resolved.url, image_url: publicUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || /timeout/i.test(message));

    console.error("Capture snapshot failed:", error);
    return {
      ok: false,
      error: timedOut
        ? "Timed out waiting for the page to load."
        : `Could not capture snapshot: ${message}`,
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

export async function captureMissingSnapshotsForReport(params: {
  userId: string;
  trackingId: string;
  siteUrl: string | null | undefined;
  pages: string[];
}): Promise<void> {
  const siteUrl = params.siteUrl?.trim();
  if (!siteUrl) {
    console.info("Skipping snapshot capture: profiles.site_url is not set.");
    return;
  }

  const distinctPages = [
    ...new Set(params.pages.map((page) => page.trim()).filter(Boolean)),
  ];
  if (distinctPages.length === 0) {
    return;
  }

  let service;
  try {
    service = createServiceClient();
  } catch (error) {
    console.error("Skipping snapshot capture: service client unavailable.", error);
    return;
  }

  const { data: existing, error: existingError } = await service
    .from("page_snapshots")
    .select("page")
    .eq("tracking_id", params.trackingId)
    .in("page", distinctPages);

  if (existingError) {
    console.error("Could not list existing page snapshots:", existingError);
    return;
  }

  const have = new Set((existing ?? []).map((row) => row.page));
  const missing = distinctPages.filter((page) => !have.has(page));

  for (const page of missing) {
    try {
      const result = await capturePageSnapshot({
        userId: params.userId,
        trackingId: params.trackingId,
        page,
        baseUrl: siteUrl,
      });
      if (!result.ok) {
        console.error(`Snapshot capture skipped for ${page}:`, result.error);
      }
    } catch (error) {
      console.error(`Snapshot capture failed for ${page}:`, error);
    }
  }
}
