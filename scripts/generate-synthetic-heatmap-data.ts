/**
 * SAFETY: Inserts ONLY source = 'synthetic_test' event rows, plus one new reports row
 * marked source = 'synthetic_test'. Does not update profiles or existing reports.
 *
 * Prerequisite: events.source check must allow 'synthetic_test'.
 * Run: npx tsx scripts/generate-synthetic-heatmap-data.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
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

const VIEWPORT_WIDTH = 1512;
const VIEWPORT_HEIGHT = 769;
const TOTAL_CLICKS = 300;
const SESSION_COUNT = 18;

type Cluster = {
  weight: number;
  meanX: number;
  meanY: number;
  sigmaX: number;
  sigmaY: number;
  tag: string;
};

// Approximate listing-page-wireframe.tsx layout at 1512×769
const CLUSTERS: Cluster[] = [
  // ~45% contact form (right column)
  { weight: 0.45, meanX: 1100, meanY: 520, sigmaX: 90, sigmaY: 110, tag: "form" },
  // ~30% amenities (left column, lower)
  { weight: 0.3, meanX: 450, meanY: 620, sigmaX: 140, sigmaY: 70, tag: "amenities" },
  // ~15% hero
  { weight: 0.15, meanX: 756, meanY: 180, sigmaX: 280, sigmaY: 80, tag: "hero" },
  // ~10% scatter (wide sigma ≈ soft background)
  { weight: 0.1, meanX: 756, meanY: 400, sigmaX: 420, sigmaY: 220, tag: "scatter" },
];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in environment / .env.local`);
  }
  return value;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Standard normal via Box-Muller */
function randomNormal(): number {
  const u = 1 - Math.random();
  const v = 1 - Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function pickCluster(): Cluster {
  const r = Math.random();
  let acc = 0;
  for (const cluster of CLUSTERS) {
    acc += cluster.weight;
    if (r <= acc) return cluster;
  }
  return CLUSTERS[CLUSTERS.length - 1]!;
}

function samplePoint(cluster: Cluster) {
  const x = clamp(
    Math.round(cluster.meanX + randomNormal() * cluster.sigmaX),
    0,
    VIEWPORT_WIDTH - 1,
  );
  const y = clamp(
    Math.round(cluster.meanY + randomNormal() * cluster.sigmaY),
    0,
    VIEWPORT_HEIGHT - 1,
  );
  return { x, y, tag: cluster.tag };
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (profileError || !profile?.id) {
    throw new Error(
      `Could not find a profiles.id to own the test report: ${profileError?.message ?? "none"}`,
    );
  }

  const userId = profile.id as string;
  console.log(`Using user_id (read-only lookup): ${userId}`);

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .insert({
      user_id: userId,
      status: "completed",
      source: "synthetic_test",
      source_filename: "synthetic_heatmap_test",
    })
    .select("id")
    .single();

  if (reportError || !report) {
    throw new Error(
      `Failed to create synthetic report: ${reportError?.message ?? "unknown"}`,
    );
  }

  const reportId = report.id as string;
  console.log(`Created synthetic report_id: ${reportId}`);

  const sessionIds = Array.from({ length: SESSION_COUNT }, (_, i) => {
    return `synthetic_sess_${String(i + 1).padStart(2, "0")}`;
  });

  const now = Date.now();
  const rows = Array.from({ length: TOTAL_CLICKS }, (_, index) => {
    const cluster = pickCluster();
    const point = samplePoint(cluster);
    const session_id =
      sessionIds[Math.floor(Math.random() * sessionIds.length)]!;

    return {
      report_id: reportId,
      user_id: userId,
      session_id,
      event_type: "click",
      timestamp: new Date(now - (TOTAL_CLICKS - index) * 1000).toISOString(),
      page: "/listing/42",
      device: "desktop",
      // CRITICAL: every synthetic row is tagged for safe cleanup
      source: "synthetic_test",
      metadata: {
        x: point.x,
        y: point.y,
        viewportWidth: VIEWPORT_WIDTH,
        viewportHeight: VIEWPORT_HEIGHT,
        tag: point.tag,
        id: null,
        text: null,
      },
    };
  });

  const { error: insertError } = await supabase.from("events").insert(rows);
  if (insertError) {
    // Best-effort: remove the empty synthetic report if event insert failed
    await supabase
      .from("reports")
      .delete()
      .eq("id", reportId)
      .eq("source", "synthetic_test");
    throw new Error(`Failed to insert synthetic events: ${insertError.message}`);
  }

  const { count, error: countError } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("source", "synthetic_test")
    .eq("report_id", reportId);

  if (countError) {
    console.warn(`Inserted, but count failed: ${countError.message}`);
  }

  console.log("---");
  console.log(`report_id: ${reportId}`);
  console.log(`synthetic events for this report: ${count ?? rows.length}`);
  console.log(`Heatmap test URL: /heatmap-test (set TEST_REPORT_ID to this id)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
