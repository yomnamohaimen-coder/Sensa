"use client";

import { ListingPageHeatmap } from "@/components/heatmap/listing-page-heatmap";
import type { ReportDisplay } from "@/lib/reports/build-report-display";
import { buildHeatmapClickSummary } from "@/lib/reports/heatmap-summary";

export function ReportHeatmapPanel({
  report,
  trackingId = null,
  page = "/listing/42",
}: {
  report: ReportDisplay;
  trackingId?: string | null;
  page?: string;
}) {
  const heatmapSummary = buildHeatmapClickSummary(report.heatmapStats);

  if (report.heatmapStats.totalClicks === 0) {
    return (
      <p className="text-sm text-zinc-500">Not enough click data yet</p>
    );
  }

  return (
    <div className="space-y-4">
      <ListingPageHeatmap
        reportId={report.id}
        trackingId={trackingId}
        page={page}
      />

      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
        <p className="text-sm font-medium text-zinc-900">
          {report.heatmapStats.totalClicks.toLocaleString()} clicks
        </p>
        {report.heatmapStats.topElements.length > 0 && (
          <div className="mt-3">
            {heatmapSummary && (
              <p className="mb-3 text-sm leading-6 text-zinc-600">
                {heatmapSummary}
              </p>
            )}
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Top clicked elements
            </p>
            <div className="mt-2 inline-grid grid-cols-2 gap-x-8">
              <ol className="w-max max-w-full space-y-1.5">
                {report.heatmapStats.topElements.slice(0, 3).map((item, index) => (
                  <li
                    key={item.label}
                    className="flex w-max max-w-full items-center gap-3 text-sm text-zinc-700"
                  >
                    <span>
                      <span className="mr-2 text-zinc-400">{index + 1}.</span>
                      <code className="rounded bg-white px-1.5 py-0.5 text-xs text-zinc-800">
                        {item.label}
                      </code>
                    </span>
                    <span className="tabular-nums text-zinc-500">
                      {item.count.toLocaleString()} ({item.percent}%)
                    </span>
                  </li>
                ))}
              </ol>
              <ol className="w-max max-w-full space-y-1.5" start={4}>
                {report.heatmapStats.topElements.slice(3, 5).map((item, index) => (
                  <li
                    key={item.label}
                    className="flex w-max max-w-full items-center gap-3 text-sm text-zinc-700"
                  >
                    <span>
                      <span className="mr-2 text-zinc-400">{index + 4}.</span>
                      <code className="rounded bg-white px-1.5 py-0.5 text-xs text-zinc-800">
                        {item.label}
                      </code>
                    </span>
                    <span className="tabular-nums text-zinc-500">
                      {item.count.toLocaleString()} ({item.percent}%)
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
