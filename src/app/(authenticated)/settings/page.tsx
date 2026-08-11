import { cookies } from "next/headers";
import { SettingsForm } from "@/components/settings-form";
import { createClient } from "@/utils/supabase/server";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("product_name")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Settings
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Update basic details for your Sensa account.
        </p>
      </header>

      <SettingsForm initialProductName={profile?.product_name?.trim() ?? ""} />
    </div>
  );
}
