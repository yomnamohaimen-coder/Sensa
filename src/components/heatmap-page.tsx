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
  const [selectedReportId, setSelectedReportId] = useState(
    initialSelectedReportId ?? reports[0]?.id ?? "",
  );

  const selectedReport = reports.find((report) => report.id === selectedReportId);

  const reportDates = useMemo(() => {
    const seen = new Set<string>();
    const dates: { dateISO: string; date: string }[] = [];

    for (const report of reports) {
      if (seen.has(report.dateISO)) {
        continue;
      }
      seen.add(report.dateISO);
      dates.push({ dateISO: report.dateISO, date: report.date });
    }

    return dates;
  }, [reports]);

  function handleSelectReport(reportId: string) {
    setSelectedReportId(reportId);
    router.replace(`/heatmap?report=${reportId}`, { scroll: false });
  }

  function handleSelectDate(dateISO: string) {
    const match = reports.find((report) => report.dateISO === dateISO);
    if (match) {
      handleSelectReport(match.id);
    }
  }

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedReportId]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Heatmap
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          See where people clicked, by report
        </p>
      </header>

      <div className="mb-12">
        {selectedReport ? (
          <>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Heatmap — {selectedReport.date}
            </h2>
            <ReportHeatmapPanel
              report={selectedReport}
              trackingId={trackingId}
            />
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
            <p className="text-sm text-zinc-600">
              No reports yet. Upload a CSV or wait for a tracking report to see
              a heatmap.
            </p>
          </div>
        )}
      </div>

      <section className="border-t border-zinc-200 pt-10">
        <h2 className="text-base font-semibold text-zinc-900">
          Heatmap history
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Open the heatmap for any previous report
        </p>

        {reportDates.length > 0 && (
          <div className="mt-4">
            <label
              htmlFor="heatmap-date"
              className="mb-1.5 block text-xs font-medium text-zinc-600"
            >
              Date
            </label>
            <select
              id="heatmap-date"
              value={selectedReport?.dateISO ?? ""}
              onChange={(event) => handleSelectDate(event.target.value)}
              className="w-full max-w-xs rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            >
              {reportDates.map((item) => (
                <option key={item.dateISO} value={item.dateISO}>
                  {item.date}
                </option>
              ))}
            </select>
          </div>
        )}

        <ul className="mt-6 max-h-[400px] divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
          {reports.length > 0 ? (
            reports.map((report) => {
              const isSelected = report.id === selectedReportId;

              return (
                <li
                  key={report.id}
                  ref={isSelected ? selectedItemRef : undefined}
                >
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
              No reports yet.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
