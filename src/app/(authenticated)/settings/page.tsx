import { cookies } from "next/headers";
import { AnalysisIntervalForm } from "@/components/analysis-interval-form";
import { AppearanceForm } from "@/components/appearance-form";
import { ChangePasswordForm } from "@/components/change-password-form";
import { DeleteAccountForm } from "@/components/delete-account-form";
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
  const productName = profile?.product_name?.trim() ?? "";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10">
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Appearance
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Light or dark chrome for Sensa. Snapshots of your site stay as captured.
        </p>
        <div className="mt-4">
          <AppearanceForm />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Account
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          How you appear in Sensa and how you sign in.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <SettingsForm initialProductName={productName} />
          <ChangePasswordForm />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Analysis
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          How often Sensa turns new activity into a report.
        </p>
        <div className="mt-4">
          <AnalysisIntervalForm
            initialIntervalDays={intervalDays}
            initialManualOnly={manualOnly}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Danger zone
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Irreversible actions for this account.
        </p>
        <div className="mt-4">
          <DeleteAccountForm
            email={user?.email ?? ""}
            productName={productName}
          />
        </div>
      </section>
    </div>
  );
}
