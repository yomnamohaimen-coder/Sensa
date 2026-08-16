import type { FunnelStep } from "@/lib/analytics/calculate-report-metrics";
import { EmptyChartPlaceholder } from "@/components/empty-states";

/** Dark teal — first-stage (full) ring; matches emerald/teal accent family used in charts. */
const RING_TRACK = "#0f766e"; // teal-700
/** Lighter accent teal — completed (last-stage) arc. */
const RING_FILL = "#5eead4"; // teal-300
const RING_BG = "#e4e4e7"; // zinc-200 — underlay for contrast

const SIZE = 112;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MiniConversionDonut({ steps }: { steps: FunnelStep[] }) {
  const first = steps[0];
  const last = steps[steps.length - 1];

  if (!first || !last || steps.length < 2 || first.count <= 0) {
    return (
      <EmptyChartPlaceholder
        compact
        message="Not enough funnel data yet"
      />
    );
  }

  const ratio = Math.min(last.count / first.count, 1);
  const percent = Math.round(ratio * 100);
  const completedLength = CIRCUMFERENCE * ratio;
  const remainingLength = CIRCUMFERENCE - completedLength;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={RING_BG}
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={RING_TRACK}
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
          {ratio > 0 ? (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={RING_FILL}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${completedLength} ${remainingLength}`}
            />
          ) : null}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold tabular-nums tracking-tight text-zinc-900">
            {percent}%
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            converted
          </span>
        </div>
      </div>

      <ul className="flex w-full flex-col items-center gap-1.5 text-xs text-zinc-600">
        <li className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: RING_TRACK }}
            aria-hidden="true"
          />
          <span>
            {first.step}{" "}
            <span className="tabular-nums text-zinc-400">
              ({first.count.toLocaleString()})
            </span>
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: RING_FILL }}
            aria-hidden="true"
          />
          <span>
            {last.step}{" "}
            <span className="tabular-nums text-zinc-400">
              ({last.count.toLocaleString()})
            </span>
          </span>
        </li>
      </ul>
    </div>
  );
}
