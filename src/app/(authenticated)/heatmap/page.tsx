import { HeatmapPageContent } from "@/components/heatmap-page";
import { buildReportDisplays } from "@/lib/reports/build-report-display";
import { getUserReports } from "@/lib/reports/get-reports";

type HeatmapPageProps = {
  searchParams: Promise<{ report?: string }>;
};

export default async function HeatmapPage({ searchParams }: HeatmapPageProps) {
  const { report: selectedReportId } = await searchParams;
  const dbReports = await getUserReports();
  const reports = await buildReportDisplays(dbReports);

  return (
    <HeatmapPageContent
      reports={reports}
      initialSelectedReportId={selectedReportId}
    />
  );
}
