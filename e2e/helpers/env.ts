import fs from "node:fs";
import path from "node:path";

const E2E_ENV_PATH = path.resolve(process.cwd(), ".env.e2e.local");

export function loadE2eEnv(): Record<string, string> {
  if (!fs.existsSync(E2E_ENV_PATH)) {
    throw new Error(
      `Missing ${E2E_ENV_PATH}. Copy .env.e2e.example and fill in your E2E Supabase project credentials.`,
    );
  }

  const loaded: Record<string, string> = {};
  const content = fs.readFileSync(E2E_ENV_PATH, "utf8");

  for (const line of content.split("\n")) {
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
    loaded[key] = value;
    process.env[key] = value;
  }

  return loaded;
}

export function requireE2eEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required E2E env var: ${name}`);
  }
  return value;
}
