"use client";

import { useEffect, useState } from "react";
import { EmptyChartPlaceholder } from "@/components/empty-states";
import type { FunnelStep } from "@/lib/analytics/calculate-report-metrics";

function parseDropOffPercent(dropOff: string): number | null {
  if (dropOff === "—") {
    return null;
  }

  const parsed = Number.parseInt(dropOff.replace("%", ""), 10);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : null;
}

/**
 * Maps drop-off severity onto Signal Green → Warning Amber (Meaning-Only Color).
 * First stage (null) stays zinc-neutral.
 */
function barFill(dropOffPercent: number | null): string {
  if (dropOffPercent === null) {
    return "linear-gradient(90deg, var(--ink) 0%, var(--ink-secondary) 100%)";
  }

  const t = Math.round(dropOffPercent);
  const severity = `color-mix(in srgb, var(--warning) ${t}%, var(--signal))`;
  return `linear-gradient(90deg, ${severity} 0%, color-mix(in srgb, ${severity} 72%, var(--surface)) 100%)`;
}

export function FunnelChart({
  steps,
  compact = false,
}: {
  steps: FunnelStep[];
  compact?: boolean;
}) {
  const firstCount = steps[0]?.count ?? 0;
  const hasData = steps.some((step) => step.count > 0);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (!hasData) {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      setAnimateIn(true);
      return;
    }

    const frame = requestAnimationFrame(() => {
      setAnimateIn(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [hasData, steps]);

  if (!hasData) {
    return (
      <EmptyChartPlaceholder
        compact={compact}
        message="Not enough funnel data yet"
      />
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-2.5"}>
      {steps.map((step) => {
        const dropOffPercent = parseDropOffPercent(step.dropOff);
        const ratio = firstCount > 0 ? Math.min(step.count / firstCount, 1) : 0;
        const widthPercent =
          step.count <= 0 || firstCount <= 0 ? 0 : ratio * 100;
        const fill = barFill(dropOffPercent);

        return (
          <div
            key={step.step}
            className="rounded-md px-2 py-2 transition-colors hover:bg-raised/80"
          >
            <div
              className={`mb-1.5 flex items-center justify-between gap-3 ${
                compact ? "text-xs" : "text-sm"
              }`}
            >
              <span
                className={
                  compact
                    ? "min-w-0 truncate text-ink-secondary"
                    : "min-w-0 truncate font-medium text-ink"
                }
              >
                {step.step}
              </span>
              <span className="shrink-0 tabular-nums text-ink-muted">
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
              className={`overflow-hidden rounded-full bg-raised ${
                compact ? "h-2" : "h-2.5"
              }`}
            >
              <div
                className={`rounded-full ${compact ? "h-2" : "h-2.5"} ${
                  animateIn
                    ? "transition-[width] duration-500 ease-out motion-reduce:transition-none"
                    : ""
                }`}
                style={{
                  width: animateIn ? `${widthPercent}%` : "0%",
                  backgroundImage: fill,
                  minWidth:
                    animateIn && step.count > 0 && widthPercent < 2
                      ? "4px"
                      : undefined,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
