import fs from "node:fs";
import path from "node:path";
import type { FullConfig } from "@playwright/test";
import { loadE2eEnv } from "./helpers/env";
import {
  deleteUserByEmail,
  purgeStaleE2eUsers,
} from "./helpers/supabase-admin";
import { isE2eTestEmail } from "./helpers/test-user";

const AUTH_DIR = path.resolve(process.cwd(), "e2e/.auth");
const USER_META_PATH = path.join(AUTH_DIR, "user-meta.json");
const RUN_USERS_PATH = path.join(AUTH_DIR, "run-users.json");

type UserMeta = {
  email: string;
};

async function globalTeardown(_config: FullConfig) {
  loadE2eEnv();

  const emails = new Set<string>();

  if (fs.existsSync(USER_META_PATH)) {
    const setupMeta = JSON.parse(
      fs.readFileSync(USER_META_PATH, "utf8"),
    ) as UserMeta;
    if (isE2eTestEmail(setupMeta.email)) {
      emails.add(setupMeta.email);
    }
  }

  if (fs.existsSync(RUN_USERS_PATH)) {
    const runUsers = JSON.parse(
      fs.readFileSync(RUN_USERS_PATH, "utf8"),
    ) as string[];
    for (const email of runUsers) {
      if (isE2eTestEmail(email)) {
        emails.add(email);
      }
    }
  }

  for (const email of emails) {
    const deleted = await deleteUserByEmail(email);
    console.log(
      deleted
        ? `Deleted E2E user ${email}.`
        : `E2E user ${email} was already removed.`,
    );
  }

  const purged = await purgeStaleE2eUsers();
  if (purged > 0) {
    console.log(`Purged ${purged} additional stale E2E user(s).`);
  }
}

export default globalTeardown;
