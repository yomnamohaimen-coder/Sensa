import fs from "node:fs";
import path from "node:path";
import { chromium, type FullConfig } from "@playwright/test";
import { completeOnboardingIfPresent, signupViaUI } from "./helpers/auth";
import { loadE2eEnv, requireE2eEnv } from "./helpers/env";
import { purgeStaleE2eUsers } from "./helpers/supabase-admin";
import { generateTestEmail } from "./helpers/test-user";

const AUTH_DIR = path.resolve(process.cwd(), "e2e/.auth");
const STORAGE_STATE_PATH = path.join(AUTH_DIR, "user.json");
const USER_META_PATH = path.join(AUTH_DIR, "user-meta.json");

async function globalSetup(config: FullConfig) {
  loadE2eEnv();
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const purged = await purgeStaleE2eUsers();
  if (purged > 0) {
    console.log(`Purged ${purged} stale E2E user(s) before setup.`);
  }

  const email = generateTestEmail();
  const password = requireE2eEnv("E2E_TEST_PASSWORD");
  const baseURL =
    config.projects[0]?.use?.baseURL ?? "http://127.0.0.1:3001";

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await signupViaUI(page, email, password);
  await completeOnboardingIfPresent(page);

  await context.storageState({ path: STORAGE_STATE_PATH });
  fs.writeFileSync(
    USER_META_PATH,
    JSON.stringify({ email, createdAt: new Date().toISOString() }, null, 2),
  );

  await browser.close();

  console.log(`E2E auth state saved for ${email} (${baseURL}).`);
}

export default globalSetup;
