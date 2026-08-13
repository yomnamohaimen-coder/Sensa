import { ListingPageHeatmap } from "@/components/heatmap/listing-page-heatmap";
import type { ReportDisplay } from "@/lib/reports/build-report-display";
import { buildHeatmapClickSummary } from "@/lib/reports/heatmap-summary";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function NoDataMessage() {
  return <p className="text-sm text-zinc-500">No data available</p>;
}

export function ReportView({ report }: { report: ReportDisplay }) {
  const metrics = report.metrics;
  const maxFunnelCount = metrics
    ? Math.max(...metrics.funnel.map((step) => step.count), 1)
    : 1;
  const heatmapSummary = buildHeatmapClickSummary(report.heatmapStats);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{report.label}</h2>
        <p className="mt-1 text-sm text-zinc-500">{report.date}</p>
      </div>

      <Section title="User behavior tracking">
        {metrics ? (
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-zinc-500">Sessions</dt>
              <dd className="mt-1 text-lg font-medium text-zinc-900">
                {metrics.userBehavior.sessions.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">
                Unique users
                <span className="mt-0.5 block font-normal text-zinc-400">
                  (by session)
                </span>
              </dt>
              <dd className="mt-1 text-lg font-medium text-zinc-900">
                {metrics.userBehavior.uniqueUsers.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Avg. session duration</dt>
              <dd className="mt-1 text-lg font-medium text-zinc-900">
                {metrics.userBehavior.avgSessionDuration}
              </dd>
            </div>
          </dl>
        ) : (
          <NoDataMessage />
        )}
      </Section>

      <Section title="Usage funnel">
        {metrics ? (
          <div className="space-y-3">
            {metrics.funnel.map((step) => (
              <div key={step.step}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-800">{step.step}</span>
                  <span className="text-zinc-500">
                    {step.count.toLocaleString()} sessions
                    {step.dropOff !== "—" && ` · ${step.dropOff} drop-off`}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100">
                  <div
                    className="h-2 rounded-full bg-zinc-700"
                    style={{
                      width: `${(step.count / maxFunnelCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <NoDataMessage />
        )}
      </Section>

      <Section title="Engagement metrics">
        {metrics ? (
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-zinc-500">Avg. time on page</dt>
              <dd className="mt-1 text-lg font-medium text-zinc-900">
                {metrics.engagement.avgTimeOnPage}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Bounce rate</dt>
              <dd className="mt-1 text-lg font-medium text-zinc-900">
                {metrics.engagement.bounceRate}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Pages per session</dt>
              <dd className="mt-1 text-lg font-medium text-zinc-900">
                {metrics.engagement.pagesPerSession}
              </dd>
            </div>
          </dl>
        ) : (
          <NoDataMessage />
        )}
      </Section>

      <Section title="Heatmap">
        {report.heatmapStats.totalClicks === 0 ? (
          <p className="text-sm text-zinc-500">Not enough click data yet</p>
        ) : (
          <div className="space-y-4">
            <ListingPageHeatmap reportId={report.id} />

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
        )}
      </Section>

      <Section title="AI insights">
        {report.aiInsights ? (
          <div className="space-y-4 text-sm">
            <p className="leading-6 text-zinc-700">
              {report.aiInsights.summary}
            </p>
            {report.aiInsights.anomaly && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                <span className="font-medium">Anomaly:</span>{" "}
                {report.aiInsights.anomaly}
              </div>
            )}
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-700">
              <span className="font-medium text-zinc-900">Recommendation:</span>{" "}
              {report.aiInsights.recommendation}
            </div>
          </div>
        ) : (
          <NoDataMessage />
        )}
      </Section>
    </div>
  );
}
