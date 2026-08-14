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

      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-5 py-4">
        <p className="text-sm font-medium text-zinc-900">
          {report.heatmapStats.totalClicks.toLocaleString()} clicks
        </p>

        {report.heatmapStats.topElements.length > 0 && (
          <div className="mt-4">
            {heatmapSummary && (
              <p className="text-sm leading-6 text-zinc-600">
                {heatmapSummary}
              </p>
            )}

            <div
              className={
                heatmapSummary
                  ? "mt-4 border-t border-zinc-200 pt-4"
                  : ""
              }
            >
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Top clicked elements
              </p>

              <ol className="mt-2 divide-y divide-zinc-200">
                {report.heatmapStats.topElements.slice(0, 5).map((item, index) => (
                  <li key={item.label} className="py-1.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <span className="w-5 shrink-0 text-sm tabular-nums text-zinc-400">
                        {index + 1}.
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-zinc-500">
                        {item.count.toLocaleString()} ({item.percent}%)
                      </span>
                    </div>
                    <code className="mt-0.5 block max-w-full whitespace-normal break-words rounded bg-white px-1.5 py-0.5 text-xs leading-5 text-zinc-800">
                      {item.label}
                    </code>
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
