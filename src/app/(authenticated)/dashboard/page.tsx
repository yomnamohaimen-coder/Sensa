import { cookies } from "next/headers";
import { DashboardWithReports } from "@/components/dashboard-with-reports";
import { RecurringAnalysisChecker } from "@/components/recurring-analysis-checker";
import { buildReportDisplay } from "@/lib/reports/build-report-display";
import { getUserReports } from "@/lib/reports/get-reports";
import { createClient } from "@/utils/supabase/server";

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

  const dbReports = await getUserReports();
  const latestReport =
    dbReports[0] != null ? await buildReportDisplay(dbReports[0]) : null;
  const previousReport =
    dbReports[1] != null ? await buildReportDisplay(dbReports[1]) : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10">
      <header className="mb-8">
        <h1 className="break-words text-2xl font-semibold tracking-tight text-zinc-900">
          {welcomeMessage}
        </h1>
      </header>

      <RecurringAnalysisChecker />

      {latestReport ? (
        <DashboardWithReports
          latestReport={latestReport}
          previousMetrics={previousReport?.metrics ?? null}
        />
      ) : (
        <div className="mb-8">
          <p className="text-base text-zinc-600">
            No analysis yet — connect your site or upload a CSV to get started.
          </p>
        </div>
      )}
    </div>
  );
}
