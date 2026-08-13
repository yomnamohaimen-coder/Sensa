"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReportHeatmapPanel } from "@/components/report-heatmap-panel";
import type { ReportDisplay } from "@/lib/reports/build-report-display";

type HeatmapPageContentProps = {
  reports: ReportDisplay[];
  initialSelectedReportId?: string;
};

export function HeatmapPageContent({
  reports,
  initialSelectedReportId,
}: HeatmapPageContentProps) {
  const router = useRouter();
  const [selectedReportId, setSelectedReportId] = useState(
    initialSelectedReportId ?? reports[0]?.id ?? "",
  );

  const selectedReport = reports.find((report) => report.id === selectedReportId);

  function handleSelectReport(reportId: string) {
    setSelectedReportId(reportId);
    router.replace(`/heatmap?report=${reportId}`, { scroll: false });
  }

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
            <ReportHeatmapPanel report={selectedReport} />
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

        <ul className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white shadow-sm">
          {reports.length > 0 ? (
            reports.map((report) => {
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
              No reports yet.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
