"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const selectedItemRef = useRef<HTMLLIElement>(null);
  const [selectedReportId, setSelectedReportId] = useState(
    initialSelectedReportId ?? reports[0]?.id ?? "",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const selectedReport = reports.find((report) => report.id === selectedReportId);
  const selectedIndex = reports.findIndex(
    (report) => report.id === selectedReportId,
  );
  const previousReport =
    selectedIndex >= 0 ? reports[selectedIndex + 1] : undefined;

  const dateRangeInvalid = Boolean(
    startDate && endDate && endDate < startDate,
  );

  const filteredReports = useMemo(() => {
    if (dateRangeInvalid) {
      return [];
    }

    return reports.filter((report) => {
      if (startDate && report.dateISO < startDate) {
        return false;
      }
      if (endDate && report.dateISO > endDate) {
        return false;
      }
      return true;
    });
  }, [reports, startDate, endDate, dateRangeInvalid]);

  function handleSelectReport(reportId: string) {
    setSelectedReportId(reportId);
    router.replace(`/reports?report=${reportId}`, { scroll: false });
  }

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedReportId]);

  const isMostRecent = reports[0]?.id === selectedReport?.id;

  return (
    <div className="flex min-h-full flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <header className="grid shrink-0 grid-cols-1 gap-4 px-6 pt-10 pb-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0 sm:col-start-1 sm:row-start-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Reports
          </h1>
          <p className="mt-2 max-w-prose text-sm text-zinc-500">
            View analysis results and browse past reports
          </p>
        </div>
        <StartAnalysisUpload />
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:overflow-hidden">
        <aside
          aria-label="Past reports"
          className="flex min-h-0 flex-col border-zinc-200 px-6 pb-6 lg:border-r lg:px-5 lg:pb-6"
        >
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Past reports
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Filter by date and open any analysis
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div className="min-w-0">
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
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
                aria-invalid={dateRangeInvalid}
                aria-describedby={
                  dateRangeInvalid ? "report-date-range-error" : undefined
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div className="min-w-0">
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
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                aria-invalid={dateRangeInvalid}
                aria-describedby={
                  dateRangeInvalid ? "report-date-range-error" : undefined
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            {dateRangeInvalid ? (
              <p
                id="report-date-range-error"
                role="alert"
                className="text-sm text-red-600"
              >
                From must be on or before To.
              </p>
            ) : null}
          </div>

          <ul className="mt-4 max-h-72 divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm lg:max-h-none lg:min-h-0 lg:flex-1">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => {
                const isSelected = report.id === selectedReportId;

                return (
                  <li
                    key={report.id}
                    ref={isSelected ? selectedItemRef : undefined}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectReport(report.id)}
                      aria-current={isSelected ? "true" : undefined}
                      className={`flex w-full min-h-11 min-w-0 flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors ${
                        isSelected ? "bg-zinc-100" : "hover:bg-zinc-50"
                      }`}
                    >
                      <span className="w-full min-w-0 truncate text-sm font-medium text-zinc-900">
                        {report.label}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {report.date}
                      </span>
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-8 text-center text-sm text-zinc-500">
                {reports.length === 0
                  ? "No reports yet."
                  : dateRangeInvalid
                    ? "Choose a valid date range to see matching reports."
                    : "No reports match this date range."}
              </li>
            )}
          </ul>
        </aside>

        <section
          aria-label="Selected report"
          className="min-w-0 border-t border-zinc-200 px-6 pt-8 pb-10 lg:overflow-y-auto lg:border-t-0 lg:px-8 lg:pt-0 lg:pb-10"
        >
          {selectedReport ? (
            <ReportView
              report={selectedReport}
              previousMetrics={previousReport?.metrics ?? null}
              contextLabel={isMostRecent ? "Most recent" : undefined}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
              <p className="text-sm text-zinc-600">
                No reports yet. Upload a CSV to generate your first analysis.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
