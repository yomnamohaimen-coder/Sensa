#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRef = "cqephmhlaigonxaczbrc";

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(__dirname, "../.env.local"));

const migrationFile = process.argv[2];
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!migrationFile) {
  console.error("Usage: node scripts/apply-migration.mjs <migration-file>");
  process.exit(1);
}

if (!accessToken) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN.\n" +
      "Add it to .env.local from https://supabase.com/dashboard/account/tokens",
  );
  process.exit(1);
}

const migrationPath = resolve(__dirname, "..", migrationFile);
const query = readFileSync(migrationPath, "utf8");

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  },
);

const body = await response.text();

if (!response.ok) {
  console.error(`Migration failed (${response.status}):`, body);
  process.exit(1);
}

console.log("Migration applied successfully.");
if (body.trim()) {
  console.log(body);
}
