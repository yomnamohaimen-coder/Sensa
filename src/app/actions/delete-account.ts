"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

export type DeleteAccountResult = { ok: true } | { error: string };

function confirmationMatches(
  confirmation: string,
  email: string | undefined,
  productName: string | null,
): boolean {
  const typed = confirmation.trim().toLowerCase();
  if (!typed) {
    return false;
  }

  if (email && typed === email.trim().toLowerCase()) {
    return true;
  }

  const name = productName?.trim();
  return Boolean(name && typed === name.toLowerCase());
}

async function removePageSnapshotFiles(trackingId: string): Promise<string | null> {
  const service = createServiceClient();
  const bucket = service.storage.from("page-snapshots");

  const { data: files, error: listError } = await bucket.list(trackingId, {
    limit: 1000,
  });

  if (listError) {
    console.error("Failed to list page-snapshots for account deletion:", listError);
    return "Could not remove stored page screenshots.";
  }

  if (!files?.length) {
    return null;
  }

  const paths = files
    .map((file) => file.name)
    .filter((name) => Boolean(name) && !name.endsWith("/"))
    .map((name) => `${trackingId}/${name}`);

  if (paths.length === 0) {
    return null;
  }

  const { error: removeError } = await bucket.remove(paths);
  if (removeError) {
    console.error("Failed to remove page-snapshots for account deletion:", removeError);
    return "Could not remove stored page screenshots.";
  }

  return null;
}

export async function deleteAccount(
  confirmation: string,
): Promise<DeleteAccountResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to delete your account." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("product_name, tracking_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load profile for account deletion:", profileError);
    return { error: "Could not load your account. Please try again." };
  }

  if (
    !confirmationMatches(
      confirmation,
      user.email,
      profile?.product_name ?? null,
    )
  ) {
    return {
      error:
        "Confirmation does not match. Type your email or product name exactly.",
    };
  }

  if (profile?.tracking_id) {
    const storageError = await removePageSnapshotFiles(profile.tracking_id);
    if (storageError) {
      return { error: storageError };
    }
  }

  const service = createServiceClient();
  const { error: deleteError } = await service.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("Failed to delete auth user:", deleteError);
    return { error: "Could not delete your account. Please try again." };
  }

  return { ok: true };
}
