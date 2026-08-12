/**
 * SAFETY: Only targets source = 'synthetic_test'.
 * Default is dry-run (counts only). Pass --confirm to delete.
 *
 * Run dry-run:  npx tsx scripts/cleanup-synthetic-heatmap-data.ts
 * Run delete:   npx tsx scripts/cleanup-synthetic-heatmap-data.ts --confirm
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

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in environment / .env.local`);
  }
  return value;
}

async function main() {
  const confirm = process.argv.includes("--confirm");

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

  // --- Dry-run counts (always) ---
  const { count: eventCount, error: eventCountError } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("source", "synthetic_test");

  if (eventCountError) {
    throw new Error(`Failed counting synthetic events: ${eventCountError.message}`);
  }

  const { count: reportCount, error: reportCountError } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("source", "synthetic_test");

  if (reportCountError) {
    throw new Error(
      `Failed counting synthetic reports: ${reportCountError.message}`,
    );
  }

  console.log("SAFETY FILTER: source = 'synthetic_test' only");
  console.log(`events with source = 'synthetic_test': ${eventCount ?? 0}`);
  console.log(`reports with source = 'synthetic_test': ${reportCount ?? 0}`);

  if (!confirm) {
    console.log(
      "Dry-run only. Re-run with --confirm to delete these synthetic_test rows.",
    );
    return;
  }

  console.log("--confirm provided. Deleting synthetic_test data…");

  // Explicit delete — ONLY source = 'synthetic_test'
  const { data: deletedEvents, error: deleteEventsError } = await supabase
    .from("events")
    .delete()
    .eq("source", "synthetic_test")
    .select("id");

  if (deleteEventsError) {
    throw new Error(
      `Failed deleting synthetic events: ${deleteEventsError.message}`,
    );
  }

  // Explicit delete — ONLY reports created by the generator (source = 'synthetic_test')
  const { data: deletedReports, error: deleteReportsError } = await supabase
    .from("reports")
    .delete()
    .eq("source", "synthetic_test")
    .select("id");

  if (deleteReportsError) {
    throw new Error(
      `Failed deleting synthetic reports: ${deleteReportsError.message}`,
    );
  }

  console.log(`Deleted events: ${deletedEvents?.length ?? 0}`);
  console.log(`Deleted reports: ${deletedReports?.length ?? 0}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
