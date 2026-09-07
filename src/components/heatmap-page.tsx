"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ReportHeatmapPanel } from "@/components/report-heatmap-panel";
import type { ReportDisplay } from "@/lib/reports/build-report-display";

type HeatmapPageContentProps = {
  reports: ReportDisplay[];
  initialSelectedReportId?: string;
  trackingId: string | null;
};

export function HeatmapPageContent({
  reports,
  initialSelectedReportId,
  trackingId,
}: HeatmapPageContentProps) {
  const router = useRouter();
  const selectedItemRef = useRef<HTMLLIElement>(null);
  const [requestedReportId, setRequestedReportId] = useState(
    initialSelectedReportId ?? reports[0]?.id ?? "",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const selectedReport =
    reports.find((report) => report.id === requestedReportId) ??
    reports[0];
  // An unknown id in the URL falls back to the newest report.
  const selectedReportId = selectedReport?.id ?? "";

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
    setRequestedReportId(reportId);
    router.replace(`/heatmap?report=${reportId}`, { scroll: false });
  }

  useEffect(() => {
    if (!selectedReportId || selectedReportId === requestedReportId) {
      return;
    }

    router.replace(`/heatmap?report=${selectedReportId}`, { scroll: false });
  }, [selectedReportId, requestedReportId, router]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    selectedItemRef.current?.scrollIntoView({
      block: "nearest",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [selectedReportId]);

  const isMostRecent = reports[0]?.id === selectedReport?.id;

  return (
    <div className="flex w-full flex-col">
      <header className="shrink-0 px-6 pt-10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Heatmap
        </h1>
        <p className="mt-2 max-w-prose text-sm text-ink-muted">
          See where people clicked, by report
        </p>
      </header>

      <div className="flex flex-col lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <aside
          aria-label="Past reports"
          className="flex flex-col border-hairline px-6 pb-6 lg:border-r lg:px-5 lg:pb-6"
        >
          <div>
            <h2 className="text-base font-semibold text-ink">
              Past reports
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Filter by date and open any heatmap
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div className="min-w-0">
              <label
                htmlFor="heatmap-start-date"
                className="mb-1.5 block text-xs font-medium text-ink-secondary"
              >
                From
              </label>
              <input
                id="heatmap-start-date"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
                aria-invalid={dateRangeInvalid}
                aria-describedby={
                  dateRangeInvalid ? "heatmap-date-range-error" : undefined
                }
                className="w-full rounded-md border border-stroke px-3 py-2 text-sm text-ink outline-none focus:border-ink-muted focus:ring-1 focus:ring-ink-muted"
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor="heatmap-end-date"
                className="mb-1.5 block text-xs font-medium text-ink-secondary"
              >
                To
              </label>
              <input
                id="heatmap-end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                aria-invalid={dateRangeInvalid}
                aria-describedby={
                  dateRangeInvalid ? "heatmap-date-range-error" : undefined
                }
                className="w-full rounded-md border border-stroke px-3 py-2 text-sm text-ink outline-none focus:border-ink-muted focus:ring-1 focus:ring-ink-muted"
              />
            </div>

            {dateRangeInvalid ? (
              <p
                id="heatmap-date-range-error"
                role="alert"
                className="text-sm text-red-600"
              >
                From must be on or before To.
              </p>
            ) : null}
          </div>

          <ul className="mt-4 max-h-72 divide-y divide-hairline overflow-y-auto rounded-lg border border-hairline bg-surface shadow-sm lg:max-h-[min(32rem,70vh)]">
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
                        isSelected ? "bg-raised" : "hover:bg-canvas"
                      }`}
                    >
                      <span className="w-full min-w-0 truncate text-sm font-medium text-ink">
                        {report.label}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {report.date}
                      </span>
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-8 text-center text-sm text-ink-muted">
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
          aria-label="Selected heatmap"
          className="min-w-0 border-t border-hairline px-6 pt-8 pb-10 lg:border-t-0 lg:px-8 lg:pt-0 lg:pb-10"
        >
          {selectedReport ? (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="min-w-0 break-words text-lg font-semibold text-ink">
                  {selectedReport.label}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {isMostRecent
                    ? `Most recent · ${selectedReport.date}`
                    : selectedReport.date}
                </p>
              </div>

              <ReportHeatmapPanel
                report={selectedReport}
                trackingId={trackingId}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-hairline bg-surface px-6 py-10 text-center">
              <p className="text-sm text-ink-secondary">
                No reports yet. Upload a CSV or wait for a tracking report to see
                a heatmap.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
