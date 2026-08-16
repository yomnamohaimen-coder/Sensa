import type { FunnelStep } from "@/lib/analytics/calculate-report-metrics";
import { EmptyChartPlaceholder } from "@/components/empty-states";

const BAR_COLORS = ["bg-zinc-800", "bg-zinc-600", "bg-zinc-400"];

export function FunnelChart({
  steps,
  compact = false,
}: {
  steps: FunnelStep[];
  compact?: boolean;
}) {
  const firstCount = steps[0]?.count ?? 0;
  const hasData = steps.some((step) => step.count > 0);

  if (!hasData) {
    return (
      <EmptyChartPlaceholder
        compact={compact}
        message="Not enough funnel data yet"
      />
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {steps.map((step, index) => {
        const ratio = firstCount > 0 ? Math.min(step.count / firstCount, 1) : 0;
        const widthPercent =
          step.count <= 0 || firstCount <= 0 ? 0 : ratio * 100;

        return (
          <div key={step.step}>
            <div
              className={`mb-1 flex items-center justify-between ${
                compact ? "text-xs" : "text-sm"
              }`}
            >
              <span
                className={
                  compact ? "text-zinc-600" : "font-medium text-zinc-800"
                }
              >
                {step.step}
              </span>
              <span className="text-zinc-500">
                {compact
                  ? step.count.toLocaleString()
                  : `${step.count.toLocaleString()} sessions${
                      step.dropOff !== "—"
                        ? ` · ${step.dropOff} drop-off`
                        : ""
                    }`}
              </span>
            </div>
            <div
              className={`rounded-full bg-zinc-100 ${compact ? "h-1.5" : "h-2"}`}
            >
              <div
                className={`rounded-full ${BAR_COLORS[index] ?? "bg-zinc-400"} ${
                  compact ? "h-1.5" : "h-2"
                }`}
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
  );
}
