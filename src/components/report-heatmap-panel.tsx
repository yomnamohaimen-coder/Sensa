"use client";

import { ListingPageHeatmap } from "@/components/heatmap/listing-page-heatmap";
import { EmptyChartPlaceholder } from "@/components/empty-states";
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
  const clickCount = report.heatmapStats.totalClicks;
  const heatmapLabel = heatmapSummary
    ? `Click heatmap for ${report.label}. ${heatmapSummary}`
    : `Click heatmap for ${report.label}. ${clickCount.toLocaleString()} clicks recorded.`;

  if (clickCount === 0) {
    return <EmptyChartPlaceholder message="Not enough click data yet" />;
  }

  return (
    <div className="flex h-auto w-full flex-col gap-4">
      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-5 py-4">
        <p className="text-sm font-medium text-zinc-900">
          {clickCount.toLocaleString()} clicks
        </p>

        {report.heatmapStats.topElements.length > 0 && (
          <div className="mt-4">
            {heatmapSummary ? (
              <p className="text-sm leading-6 text-zinc-600">{heatmapSummary}</p>
            ) : null}

            <div className={heatmapSummary ? "mt-4 border-t border-zinc-200 pt-4" : ""}>
              <h3 className="text-sm font-semibold text-zinc-900">
                Top clicked elements
              </h3>

              <ol className="mt-2 divide-y divide-zinc-200">
                {report.heatmapStats.topElements
                  .slice(0, 5)
                  .map((item, index) => (
                    <li
                      key={`${item.label}-${index}`}
                      className="flex min-w-0 items-start gap-3 py-2 first:pt-0 last:pb-0"
                    >
                      <span className="w-5 shrink-0 text-sm tabular-nums text-zinc-500">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 break-words text-sm text-zinc-800">
                        {item.label}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-zinc-500">
                        {item.count.toLocaleString()} ({item.percent}%)
                      </span>
                    </li>
                  ))}
              </ol>
            </div>
          </div>
        )}
      </div>

      <ListingPageHeatmap
        reportId={report.id}
        trackingId={trackingId}
        page={page}
        accessibleName={heatmapLabel}
      />
    </div>
  );
}
