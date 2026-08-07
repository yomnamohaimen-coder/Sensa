import { ReportsPageContent } from "@/components/reports-page";
import { buildReportDisplays } from "@/lib/reports/build-report-display";
import { getUserReports } from "@/lib/reports/get-reports";

type ReportsPageProps = {
  searchParams: Promise<{ report?: string }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { report: selectedReportId } = await searchParams;
  const dbReports = await getUserReports();
  const reports = await buildReportDisplays(dbReports);

  return (
    <ReportsPageContent
      reports={reports}
      initialSelectedReportId={selectedReportId}
    />
  );
}
