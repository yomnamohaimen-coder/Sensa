import { cookies } from "next/headers";
import { DashboardWithReports } from "@/components/dashboard-with-reports";
import { StartAnalysisUpload } from "@/components/start-analysis-upload";
import { createClient } from "@/utils/supabase/server";
import { HAS_REPORTS } from "@/lib/mock-data";

export default async function DashboardPage() {
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

  const welcomeName = profile?.product_name?.trim();
  const welcomeMessage = welcomeName ? `Welcome, ${welcomeName}` : "Welcome";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {welcomeMessage}
        </h1>
      </header>

      {HAS_REPORTS ? (
        <DashboardWithReports />
      ) : (
        <div className="mb-8">
          <p className="text-base text-zinc-600">
            You haven&apos;t run an analysis yet — start with your first upload.
          </p>
        </div>
      )}

      <StartAnalysisUpload />

      <p className="mt-16 text-sm text-zinc-400">
        More insights and comparisons coming soon
      </p>
    </div>
  );
}
