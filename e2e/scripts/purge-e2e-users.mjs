import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const E2E_ENV_PATH = path.join(ROOT, ".env.e2e.local");
const E2E_EMAIL_PATTERN =
  /^e2e-test-\d+-[a-f0-9]+@sensa-test\.local$/;

function loadE2eEnv() {
  if (!fs.existsSync(E2E_ENV_PATH)) {
    throw new Error(`Missing ${E2E_ENV_PATH}`);
  }

  for (const line of fs.readFileSync(E2E_ENV_PATH, "utf8").split("\n")) {
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
    process.env[key] = value;
  }
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required E2E env var: ${name}`);
  }
  return value;
}

function createAdminClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY.");
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function purgeStaleE2eUsers(maxAgeHours) {
  const admin = createAdminClient();
  const cutoffMs = Date.now() - maxAgeHours * 60 * 60 * 1000;
  let deleted = 0;
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      throw error;
    }

    for (const user of data.users) {
      if (!user.email || !E2E_EMAIL_PATTERN.test(user.email)) {
        continue;
      }

      const createdAtMs = user.created_at
        ? new Date(user.created_at).getTime()
        : 0;

      if (createdAtMs >= cutoffMs) {
        continue;
      }

      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        throw deleteError;
      }

      deleted += 1;
    }

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return deleted;
}

const maxAgeHours = Number.parseInt(
  process.argv[2] ?? process.env.E2E_PURGE_MAX_AGE_HOURS ?? "3",
  10,
);

loadE2eEnv();

if (!Number.isFinite(maxAgeHours) || maxAgeHours < 1) {
  console.error("Max age hours must be a positive integer.");
  process.exit(1);
}

purgeStaleE2eUsers(maxAgeHours)
  .then((deleted) => {
    console.log(
      deleted > 0
        ? `Purged ${deleted} stale E2E user(s) older than ${maxAgeHours} hour(s).`
        : `No stale E2E users older than ${maxAgeHours} hour(s) to purge.`,
    );
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
