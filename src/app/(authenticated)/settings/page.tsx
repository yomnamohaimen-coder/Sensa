import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AnalysisIntervalForm } from "@/components/analysis-interval-form";
import { AppearanceForm } from "@/components/appearance-form";
import { ChangePasswordForm } from "@/components/change-password-form";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { SettingsForm } from "@/components/settings-form";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Settings · Sensa",
};

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
    <div className="mx-auto flex w-full max-w-3xl flex-col py-10 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(2.5rem,calc(2.5rem+env(safe-area-inset-bottom)))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
      <header className="mb-8">
        <h1 className="break-words text-2xl font-semibold tracking-tight text-ink">
          Settings
        </h1>
        <p className="mt-2 max-w-prose text-sm text-ink-muted">
          How Sensa looks, how you sign in, and how analysis runs.
        </p>
      </header>

      <div className="flex flex-col gap-10">
        <section aria-labelledby="settings-appearance-heading">
          <h2
            id="settings-appearance-heading"
            className="text-lg font-semibold tracking-tight text-ink"
          >
            Appearance
          </h2>
          <p className="mt-1 max-w-prose text-sm text-ink-muted">
            Light or dark chrome for Sensa. Snapshots of your site stay as
            captured.
          </p>
          <div className="mt-4">
            <AppearanceForm />
          </div>
        </section>

        <section aria-labelledby="settings-account-heading">
          <h2
            id="settings-account-heading"
            className="text-lg font-semibold tracking-tight text-ink"
          >
            Account
          </h2>
          <p className="mt-1 max-w-prose text-sm text-ink-muted">
            How you appear in Sensa and how you sign in.
          </p>
          <div className="mt-4 flex flex-col gap-4">
            <SettingsForm initialProductName={productName} />
            <ChangePasswordForm />
          </div>
        </section>

        <section aria-labelledby="settings-analysis-heading">
          <h2
            id="settings-analysis-heading"
            className="text-lg font-semibold tracking-tight text-ink"
          >
            Analysis
          </h2>
          <p className="mt-1 max-w-prose text-sm text-ink-muted">
            How often Sensa turns new activity into a report.
          </p>
          <div className="mt-4">
            <AnalysisIntervalForm
              initialIntervalDays={intervalDays}
              initialManualOnly={manualOnly}
            />
          </div>
        </section>

        <section aria-labelledby="settings-danger-heading">
          <h2
            id="settings-danger-heading"
            className="text-lg font-semibold tracking-tight text-ink"
          >
            Danger zone
          </h2>
          <p className="mt-1 max-w-prose text-sm text-ink-muted">
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
    </div>
  );
}
