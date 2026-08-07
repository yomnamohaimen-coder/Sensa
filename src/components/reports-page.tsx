"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReportView } from "@/components/report-view";
import { StartAnalysisUpload } from "@/components/start-analysis-upload";
import type { ReportDisplay } from "@/lib/reports/build-report-display";

type ReportsPageContentProps = {
  reports: ReportDisplay[];
  initialSelectedReportId?: string;
};

export function ReportsPageContent({
  reports,
  initialSelectedReportId,
}: ReportsPageContentProps) {
  const router = useRouter();
  const [selectedReportId, setSelectedReportId] = useState(
    initialSelectedReportId ?? reports[0]?.id ?? "",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const selectedReport = reports.find((report) => report.id === selectedReportId);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (startDate && report.dateISO < startDate) {
        return false;
      }
      if (endDate && report.dateISO > endDate) {
        return false;
      }
      return true;
    });
  }, [reports, startDate, endDate]);

  function handleSelectReport(reportId: string) {
    setSelectedReportId(reportId);
    router.replace(`/reports?report=${reportId}`, { scroll: false });
  }

  const isMostRecent = reports[0]?.id === selectedReport?.id;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Reports
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          View analysis results and browse past reports
        </p>
        <div className="mt-6">
          <StartAnalysisUpload />
        </div>
      </header>

      <div className="mb-12">
        {selectedReport ? (
          <>
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-400">
              {isMostRecent ? "Most recent report" : "Selected report"}
            </p>
            <ReportView report={selectedReport} />
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
            <p className="text-sm text-zinc-600">
              No reports yet. Upload a CSV to generate your first analysis.
            </p>
          </div>
        )}
      </div>

      <section className="border-t border-zinc-200 pt-10">
        <h2 className="text-base font-semibold text-zinc-900">
          Find a past report
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Filter by date range and open any previous analysis
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="start-date"
              className="mb-1.5 block text-xs font-medium text-zinc-600"
            >
              From
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="end-date"
              className="mb-1.5 block text-xs font-medium text-zinc-600"
            >
              To
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </div>
        </div>

        <ul className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white shadow-sm">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => {
              const isSelected = report.id === selectedReportId;

              return (
                <li key={report.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectReport(report.id)}
                    className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
                      isSelected ? "bg-zinc-100" : "hover:bg-zinc-50"
                    }`}
                  >
                    <span className="text-sm font-medium text-zinc-900">
                      {report.label}
                    </span>
                    <span className="text-sm text-zinc-500">{report.date}</span>
                  </button>
                </li>
              );
            })
          ) : (
            <li className="px-5 py-8 text-center text-sm text-zinc-500">
              {reports.length === 0
                ? "No reports yet."
                : "No reports match this date range."}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
