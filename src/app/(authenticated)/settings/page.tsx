import { cookies } from "next/headers";
import { AnalysisIntervalForm } from "@/components/analysis-interval-form";
import { ChangePasswordForm } from "@/components/change-password-form";
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
    .select("product_name, analysis_interval_days, analysis_manual_only")
    .eq("id", user!.id)
    .maybeSingle();

  const intervalDays =
    typeof profile?.analysis_interval_days === "number" &&
    profile.analysis_interval_days >= 1
      ? profile.analysis_interval_days
      : null;
  const manualOnly = profile?.analysis_manual_only !== false;

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

      <div className="flex flex-col gap-6">
        <SettingsForm initialProductName={profile?.product_name?.trim() ?? ""} />
        <AnalysisIntervalForm
          initialIntervalDays={intervalDays}
          initialManualOnly={manualOnly}
        />
        <ChangePasswordForm />
      </div>
    </div>
  );
}
