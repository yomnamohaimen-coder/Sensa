/**
 * Posts realistic harbor-homes funnel sessions through POST /api/track
 * (same path as real browser traffic). Does NOT insert into DB directly.
 *
 * Usage (dev server must be running):
 *   npx tsx scripts/generate-realistic-demo-sessions.ts
 *
 * Optional env:
 *   SENSA_TRACK_URL=http://localhost:3000/api/track
 *   DEMO_TRACKING_ID=<uuid>   # otherwise looks up profile by product_name/site_url ~ harbor
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(__dirname, "../.env.local"));

const SESSION_COUNT = 40;
const LOOKBACK_DAYS = 4;
const TRACK_URL =
  process.env.SENSA_TRACK_URL ?? "http://localhost:3000/api/track";

const LISTING_PAGES = ["/listing/17", "/listing/42"];
const SEARCH_QUERIES = [
  "2 bedroom downtown",
  "pet friendly condo",
  "house with garage",
  "waterfront apartment",
  "studio near transit",
  "family home backyard",
];
const DEVICES = ["desktop", "desktop", "desktop", "mobile", "tablet"] as const;

// Believable funnel: not everyone searches; fewer view; fewer contact.
const P_SEARCH = 0.72;
const P_VIEW_LISTING_GIVEN_SEARCH = 0.58;
const P_CONTACT_GIVEN_LISTING = 0.34;

type TrackEvent = {
  tracking_id: string;
  session_id: string;
  event_type: string;
  timestamp: string;
  page: string;
  device: string;
  metadata: Record<string, unknown>;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function baseMeta(extra: Record<string, unknown> = {}) {
  return {
    simulated: true,
    generator: "realistic-demo-sessions",
    ...extra,
  };
}

async function resolveTrackingId(): Promise<string> {
  if (process.env.DEMO_TRACKING_ID) {
    return process.env.DEMO_TRACKING_ID.trim();
  }

  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    secretKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("tracking_id, product_name, site_url")
    .or("product_name.ilike.%harbor%,site_url.ilike.%harbor%");

  if (error) throw new Error(`Profile lookup failed: ${error.message}`);
  const match = data?.[0];
  if (!match?.tracking_id) {
    throw new Error(
      "No harbor-homes profile found. Set DEMO_TRACKING_ID to your Connect tracking UUID.",
    );
  }
  console.log(
    `Resolved tracking_id via profile (${match.product_name ?? match.site_url})`,
  );
  return match.tracking_id as string;
}

async function postEvent(event: TrackEvent) {
  const res = await fetch(TRACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Track failed (${res.status}): ${body}`);
  }
}

function buildSession(
  trackingId: string,
  sessionStartMs: number,
): {
  events: TrackEvent[];
  stages: { searched: boolean; viewed: boolean; contacted: boolean };
} {
  const session_id = randomUUID();
  const device = pick(DEVICES);
  let t = sessionStartMs;
  const events: TrackEvent[] = [];

  const push = (
    event_type: string,
    page: string,
    metadata: Record<string, unknown>,
    delayMs: number,
  ) => {
    t += delayMs;
    events.push({
      tracking_id: trackingId,
      session_id,
      event_type,
      timestamp: new Date(t).toISOString(),
      page,
      device,
      metadata: baseMeta(metadata),
    });
  };

  // Home landing
  push("page_view", "/", { path: "/" }, 0);

  const searched = Math.random() < P_SEARCH;
  let viewed = false;
  let contacted = false;

  if (searched) {
    push(
      "page_view",
      "/search",
      { path: "/search" },
      randBetween(8_000, 45_000),
    );
    const query = pick(SEARCH_QUERIES);
    push(
      "search",
      "/search",
      { query, path: "/search" },
      randBetween(2_000, 12_000),
    );

    viewed = Math.random() < P_VIEW_LISTING_GIVEN_SEARCH;
    if (viewed) {
      const listing = pick(LISTING_PAGES);
      push(
        "page_view",
        listing,
        { path: listing },
        randBetween(10_000, 50_000),
      );
      const clicks = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < clicks; i++) {
        push(
          "click",
          listing,
          {
            path: listing,
            x: Math.round(randBetween(80, 1400)),
            y: Math.round(randBetween(120, 700)),
            viewportWidth: 1512,
            viewportHeight: 900,
          },
          randBetween(3_000, 20_000),
        );
      }

      contacted = Math.random() < P_CONTACT_GIVEN_LISTING;
      if (contacted) {
        push(
          "contact_submitted",
          listing,
          { path: listing, form: "contact-agent" },
          randBetween(15_000, 90_000),
        );
      }
    }
  }

  return { events, stages: { searched, viewed, contacted } };
}

async function main() {
  const trackingId = await resolveTrackingId();
  console.log(`POST → ${TRACK_URL}`);
  console.log(`tracking_id: ${trackingId}`);
  console.log(`sessions: ${SESSION_COUNT}\n`);

  const now = Date.now();
  const windowMs = LOOKBACK_DAYS * 24 * 60 * 60 * 1000;

  let searched = 0;
  let viewed = 0;
  let contacted = 0;
  let eventCount = 0;
  let failed = 0;

  for (let i = 0; i < SESSION_COUNT; i++) {
    const start =
      now - Math.floor(Math.random() * windowMs) - randBetween(0, 60_000);
    const { events, stages } = buildSession(trackingId, start);
    if (stages.searched) searched += 1;
    if (stages.viewed) viewed += 1;
    if (stages.contacted) contacted += 1;

    for (const event of events) {
      try {
        await postEvent(event);
        eventCount += 1;
      } catch (error) {
        failed += 1;
        console.error(error);
      }
      await new Promise((r) => setTimeout(r, 15));
    }
  }

  const conversion =
    searched > 0 ? Math.round((contacted / searched) * 100) : 0;

  console.log("--- summary ---");
  console.log(`Sessions total:     ${SESSION_COUNT}`);
  console.log(`Reached Search:     ${searched}`);
  console.log(`Viewed listing:     ${viewed}`);
  console.log(`Contact submitted:  ${contacted}`);
  console.log(`Implied conversion: ${conversion}% (contact ÷ search)`);
  console.log(`Events posted:      ${eventCount}`);
  console.log(`Failures:           ${failed}`);
  console.log(
    "Tagged metadata.simulated=true — pick up via recurring analysis / Start analysis.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
