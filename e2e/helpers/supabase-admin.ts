import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isE2eTestEmail } from "./test-user";
import { requireE2eEnv } from "./env";

const DEFAULT_MAX_AGE_HOURS = 3;

export function createE2eAdminClient(): SupabaseClient {
  const url = requireE2eEnv("NEXT_PUBLIC_SUPABASE_URL");
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function findUserIdByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const match = data.users.find((user) => user.email === email);
    if (match) {
      return match.id;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

export async function deleteUserByEmail(email: string): Promise<boolean> {
  if (!isE2eTestEmail(email)) {
    throw new Error(`Refusing to delete non-E2E email: ${email}`);
  }

  const admin = createE2eAdminClient();
  const userId = await findUserIdByEmail(admin, email);
  if (!userId) {
    return false;
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    throw error;
  }

  return true;
}

export async function purgeStaleE2eUsers(
  maxAgeHours = DEFAULT_MAX_AGE_HOURS,
): Promise<number> {
  const admin = createE2eAdminClient();
  const cutoffMs = Date.now() - maxAgeHours * 60 * 60 * 1000;
  let deleted = 0;
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    for (const user of data.users) {
      if (!isE2eTestEmail(user.email)) {
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

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return deleted;
}
