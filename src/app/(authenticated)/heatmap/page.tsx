import { cookies } from "next/headers";
import { HeatmapPageContent } from "@/components/heatmap-page";
import { buildReportDisplays } from "@/lib/reports/build-report-display";
import { getUserReports } from "@/lib/reports/get-reports";
import { createClient } from "@/utils/supabase/server";

type HeatmapPageProps = {
  searchParams: Promise<{ report?: string }>;
};

export default async function HeatmapPage({ searchParams }: HeatmapPageProps) {
  const { report: selectedReportId } = await searchParams;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("tracking_id")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const dbReports = await getUserReports();
  const reports = await buildReportDisplays(dbReports);

  return (
    <HeatmapPageContent
      reports={reports}
      initialSelectedReportId={selectedReportId}
      trackingId={profile?.tracking_id ?? null}
    />
  );
}
