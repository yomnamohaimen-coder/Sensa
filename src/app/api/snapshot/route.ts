import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // match bucket file_size_limit
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function jsonResponse(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** "/listing/42" → "listing-42"; "/" → "root" */
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

function extensionForMime(mime: string): "jpg" | "png" | "webp" {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

function parsePositiveInt(value: FormDataEntryValue | null, field: string) {
  if (typeof value !== "string" && typeof value !== "number") {
    return { error: `${field} is required.` };
  }

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { error: `${field} must be a positive integer.` };
  }

  return { value: parsed };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ error: "Request body must be multipart form data." }, 400);
  }

  const trackingIdRaw = formData.get("tracking_id");
  const pageRaw = formData.get("page");
  const imageRaw = formData.get("image");

  if (!isNonEmptyString(trackingIdRaw) || !UUID_RE.test(trackingIdRaw)) {
    return jsonResponse({ error: "tracking_id must be a valid UUID." }, 400);
  }

  if (!isNonEmptyString(pageRaw)) {
    return jsonResponse({ error: "page is required." }, 400);
  }

  if (!(imageRaw instanceof Blob) || imageRaw.size === 0) {
    return jsonResponse({ error: "image file is required." }, 400);
  }

  if (imageRaw.size > MAX_IMAGE_BYTES) {
    return jsonResponse({ error: "image must be 5MB or smaller." }, 400);
  }

  const mime = (imageRaw.type || "image/jpeg").toLowerCase();
  if (!ALLOWED_TYPES.has(mime)) {
    return jsonResponse(
      { error: "image must be JPEG, PNG, or WebP." },
      400,
    );
  }

  const widthParsed = parsePositiveInt(formData.get("width"), "width");
  if ("error" in widthParsed) {
    return jsonResponse({ error: widthParsed.error }, 400);
  }

  const heightParsed = parsePositiveInt(formData.get("height"), "height");
  if ("error" in heightParsed) {
    return jsonResponse({ error: heightParsed.error }, 400);
  }

  const tracking_id = trackingIdRaw.trim();
  const page = pageRaw.trim();
  const width = widthParsed.value;
  const height = heightParsed.value;
  const objectPath = `${tracking_id}/${slugifyPage(page)}.${extensionForMime(mime)}`;
  const contentType = mime === "image/jpg" ? "image/jpeg" : mime;

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (error) {
    console.error("Snapshot endpoint misconfigured:", error);
    return jsonResponse({ error: "Snapshot endpoint is not configured." }, 500);
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("tracking_id", tracking_id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to look up tracking_id:", profileError);
      return jsonResponse({ error: "Could not validate tracking ID." }, 500);
    }

    if (!profile) {
      return jsonResponse({ error: "Invalid tracking ID." }, 401);
    }

    const bytes = Buffer.from(await imageRaw.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("page-snapshots")
      .upload(objectPath, bytes, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload page snapshot:", uploadError);
      return jsonResponse({ error: "Could not store snapshot image." }, 500);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("page-snapshots").getPublicUrl(objectPath);

    const { error: upsertError } = await supabase.from("page_snapshots").upsert(
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

    return jsonResponse({ ok: true }, 201);
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    console.error("Snapshot endpoint failed:", error);
    return jsonResponse(
      {
        error: timedOut
          ? "Database request timed out."
          : "Could not store snapshot.",
      },
      timedOut ? 504 : 500,
    );
  }
}
