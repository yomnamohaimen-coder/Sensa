import { TrendIndicator } from "@/components/dashboard-metrics";
import type { CalculatedReportMetrics } from "@/lib/analytics/calculate-report-metrics";
import {
  parseDurationMs,
  parsePercent,
  percentChange,
  type TrendChange,
} from "@/lib/analytics/percent-change";
import type { ReportDisplay } from "@/lib/reports/build-report-display";

const HIGH_DURATION_MS = 60 * 60 * 1000;
const TRACKING_ISSUE = "Unusually high — may indicate a tracking issue";

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

function MetricWarning({ label }: { label: string }) {
  return (
    <span className="inline-flex align-middle" title={label}>
      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
        Check tracking
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function MetricValue({
  display,
  warning,
  trend,
  invertColors,
}: {
  display: string;
  warning?: string | null;
  trend?: TrendChange | null;
  invertColors?: boolean;
}) {
  return (
    <dd className="mt-1 text-lg font-medium text-zinc-900">
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        {display}
        {warning ? <MetricWarning label={warning} /> : null}
        {trend ? (
          <TrendIndicator
            trend={trend.trend}
            value={trend.value}
            className="text-xs"
            invertColors={invertColors}
          />
        ) : null}
      </span>
    </dd>
  );
}

export function ReportView({
  report,
  previousMetrics = null,
}: {
  report: ReportDisplay;
  previousMetrics?: CalculatedReportMetrics | null;
}) {
  const metrics = report.metrics;
  const prev = previousMetrics;

  const durationMs = metrics
    ? parseDurationMs(metrics.userBehavior.avgSessionDuration)
    : null;
  const timeOnPageMs = metrics
    ? parseDurationMs(metrics.engagement.avgTimeOnPage)
    : null;
  const bounce = metrics ? parsePercent(metrics.engagement.bounceRate) : null;
  const pages = metrics ? Number(metrics.engagement.pagesPerSession) : null;

  const durationWarning =
    durationMs != null && durationMs >= HIGH_DURATION_MS ? TRACKING_ISSUE : null;
  const timeOnPageWarning =
    timeOnPageMs != null && timeOnPageMs >= HIGH_DURATION_MS
      ? TRACKING_ISSUE
      : null;
  const bounceWarning =
    bounce != null && (bounce < 0 || bounce > 100)
      ? "Value is outside 0–100% — may indicate a tracking issue"
      : null;
  const sessionsWarning =
    metrics && metrics.userBehavior.sessions < 0
      ? "Negative count — may indicate a tracking issue"
      : null;
  const usersWarning =
    metrics && metrics.userBehavior.uniqueUsers < 0
      ? "Negative count — may indicate a tracking issue"
      : null;
  const pagesWarning =
    pages != null && pages < 0
      ? "Negative count — may indicate a tracking issue"
      : null;

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
              <MetricValue
                display={metrics.userBehavior.sessions.toLocaleString()}
                warning={sessionsWarning}
                trend={
                  prev
                    ? percentChange(
                        metrics.userBehavior.sessions,
                        prev.userBehavior.sessions,
                      )
                    : null
                }
              />
            </div>
            <div>
              <dt className="text-xs text-zinc-500">
                Unique users
                <span className="mt-0.5 block font-normal text-zinc-400">
                  (by session)
                </span>
              </dt>
              <MetricValue
                display={metrics.userBehavior.uniqueUsers.toLocaleString()}
                warning={usersWarning}
                trend={
                  prev
                    ? percentChange(
                        metrics.userBehavior.uniqueUsers,
                        prev.userBehavior.uniqueUsers,
                      )
                    : null
                }
              />
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Avg. session duration</dt>
              <MetricValue
                display={metrics.userBehavior.avgSessionDuration}
                warning={durationWarning}
                trend={
                  durationMs != null && prev
                    ? percentChange(
                        durationMs,
                        parseDurationMs(prev.userBehavior.avgSessionDuration) ??
                          NaN,
                      )
                    : null
                }
              />
            </div>
          </dl>
        ) : (
          <NoDataMessage />
        )}
      </Section>

      <Section title="Usage funnel">
        {metrics ? (
          <div className="space-y-3">
            {metrics.funnel.map((step, index) => {
              const firstCount = metrics.funnel[0]?.count ?? 0;
              const ratio =
                firstCount > 0 ? Math.min(step.count / firstCount, 1) : 0;
              const widthPercent =
                step.count <= 0 || firstCount <= 0 ? 0 : ratio * 100;
              const barColors = ["bg-zinc-800", "bg-zinc-600", "bg-zinc-400"];

              return (
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
                      className={`h-2 rounded-full ${barColors[index] ?? "bg-zinc-400"}`}
                      style={{
                        width: `${widthPercent}%`,
                        minWidth:
                          step.count <= 0 || firstCount <= 0 ? "4px" : undefined,
                      }}
                    />
                  </div>
                </div>
              );
            })}
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
              <MetricValue
                display={metrics.engagement.avgTimeOnPage}
                warning={timeOnPageWarning}
                trend={
                  timeOnPageMs != null && prev
                    ? percentChange(
                        timeOnPageMs,
                        parseDurationMs(prev.engagement.avgTimeOnPage) ?? NaN,
                      )
                    : null
                }
              />
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Bounce rate</dt>
              <MetricValue
                display={metrics.engagement.bounceRate}
                warning={bounceWarning}
                invertColors
                trend={
                  bounce != null && prev
                    ? percentChange(
                        bounce,
                        parsePercent(prev.engagement.bounceRate) ?? NaN,
                      )
                    : null
                }
              />
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Pages per session</dt>
              <MetricValue
                display={metrics.engagement.pagesPerSession}
                warning={pagesWarning}
                trend={
                  pages != null && prev
                    ? percentChange(
                        pages,
                        Number(prev.engagement.pagesPerSession),
                      )
                    : null
                }
              />
            </div>
          </dl>
        ) : (
          <NoDataMessage />
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
