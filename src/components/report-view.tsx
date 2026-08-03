import type { MockReport } from "@/lib/mock-data";

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

export function ReportView({ report }: { report: MockReport }) {
  const maxFunnelCount = Math.max(...report.funnel.map((step) => step.count));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{report.label}</h2>
        <p className="mt-1 text-sm text-zinc-500">{report.date}</p>
      </div>

      <Section title="User behavior tracking">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-zinc-500">Sessions</dt>
            <dd className="mt-1 text-lg font-medium text-zinc-900">
              {report.userBehavior.sessions}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Unique users</dt>
            <dd className="mt-1 text-lg font-medium text-zinc-900">
              {report.userBehavior.uniqueUsers}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Avg. session duration</dt>
            <dd className="mt-1 text-lg font-medium text-zinc-900">
              {report.userBehavior.avgSessionDuration}
            </dd>
          </div>
        </dl>
      </Section>

      <Section title="Usage funnel">
        <div className="space-y-3">
          {report.funnel.map((step) => (
            <div key={step.step}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-800">{step.step}</span>
                <span className="text-zinc-500">
                  {step.count.toLocaleString()} users
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
      </Section>

      <Section title="Engagement metrics">
        <dl className="grid gap-4 sm:grid-cols-3">
          {report.engagement.map((metric) => (
            <div key={metric.label}>
              <dt className="text-xs text-zinc-500">{metric.label}</dt>
              <dd className="mt-1 text-lg font-medium text-zinc-900">
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Heatmap">
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-zinc-200 bg-zinc-50">
          <p className="max-w-sm px-4 text-center text-sm text-zinc-500">
            {report.heatmapDescription}
          </p>
        </div>
      </Section>

      <Section title="AI insights">
        <div className="space-y-4 text-sm">
          <p className="leading-6 text-zinc-700">{report.aiInsights.summary}</p>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
            <span className="font-medium">Anomaly:</span>{" "}
            {report.aiInsights.anomaly}
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-700">
            <span className="font-medium text-zinc-900">Recommendation:</span>{" "}
            {report.aiInsights.recommendation}
          </div>
        </div>
      </Section>
    </div>
  );
}
