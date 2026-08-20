import { TrendIndicator } from "@/components/dashboard-metrics";
import { EmptyChartPlaceholder } from "@/components/empty-states";
import { FunnelChart } from "@/components/funnel-chart";
import { InsightCards } from "@/components/insight-cards";
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
    <section className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function NoDataMessage() {
  return <EmptyChartPlaceholder message="No data available" />;
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function InsightExplainability({
  metrics,
}: {
  metrics: CalculatedReportMetrics | null;
}) {
  return (
    <details className="mt-3 group rounded-md border border-hairline bg-canvas">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium text-ink-secondary outline-none marker:content-none [&::-webkit-details-marker]:hidden focus-visible:ring-1 focus-visible:ring-ink-muted">
        <ChevronIcon className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180" />
        Data the AI was given for these insights
      </summary>
      <div className="border-t border-hairline px-3 py-2">
        {metrics ? (
          <dl className="space-y-1.5 text-xs text-ink-muted">
            <div>
              <dt className="font-medium text-ink-secondary">Funnel</dt>
              <dd className="mt-0.5">
                <ul className="list-none space-y-0.5">
                  {metrics.funnel.map((stage) => (
                    <li key={stage.step}>
                      {stage.step}: {stage.count.toLocaleString()} sessions
                      {stage.dropOff === "—"
                        ? " (first stage)"
                        : ` (${stage.dropOff} drop-off from previous stage)`}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink-secondary">Engagement</dt>
              <dd className="mt-0.5">
                <ul className="list-none space-y-0.5">
                  <li>Avg. time on page: {metrics.engagement.avgTimeOnPage}</li>
                  <li>Bounce rate: {metrics.engagement.bounceRate}</li>
                  <li>
                    Pages per session: {metrics.engagement.pagesPerSession}
                  </li>
                </ul>
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-xs text-ink-muted">
            Metrics for this report are not available, so the numbers behind
            these insights cannot be shown.
          </p>
        )}
      </div>
    </details>
  );
}

function MetricWarning({ label }: { label: string }) {
  return (
    <span className="inline-flex align-middle" title={label}>
      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
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
    <dd className="mt-1 text-lg font-medium text-ink">
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
  contextLabel,
}: {
  report: ReportDisplay;
  previousMetrics?: CalculatedReportMetrics | null;
  contextLabel?: string;
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
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="min-w-0 break-words text-lg font-semibold text-ink">
          {report.label}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {contextLabel ? `${contextLabel} · ${report.date}` : report.date}
        </p>
      </div>

      <Section title="AI insights">
        {report.aiInsights ? (
          <div className="flex flex-col gap-3">
            <InsightCards
              summary={report.aiInsights.summary}
              anomaly={report.aiInsights.anomaly}
              recommendation={report.aiInsights.recommendation}
            />
            <InsightExplainability metrics={metrics} />
          </div>
        ) : (
          <NoDataMessage />
        )}
      </Section>

      <Section title="Usage funnel">
        {metrics ? (
          <FunnelChart steps={metrics.funnel} />
        ) : (
          <NoDataMessage />
        )}
      </Section>

      <Section title="User behavior tracking">
        {metrics ? (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-xs text-ink-muted">Sessions</dt>
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
            <div className="min-w-0">
              <dt className="text-xs text-ink-muted">
                Unique users
                <span className="mt-0.5 block font-normal text-ink-muted">
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
            <div className="min-w-0">
              <dt className="text-xs text-ink-muted">Avg. session duration</dt>
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

      <Section title="Engagement metrics">
        {metrics ? (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-xs text-ink-muted">Avg. time on page</dt>
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
            <div className="min-w-0">
              <dt className="text-xs text-ink-muted">Bounce rate</dt>
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
            <div className="min-w-0">
              <dt className="text-xs text-ink-muted">Pages per session</dt>
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
    </div>
  );
}
