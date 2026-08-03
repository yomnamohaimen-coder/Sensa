type TrendDirection = "up" | "down" | "flat";

export function TrendIndicator({
  trend,
  value,
  className = "text-sm",
  invertColors = false,
}: {
  trend: TrendDirection;
  value: string;
  className?: string;
  invertColors?: boolean;
}) {
  const colorTrend: TrendDirection =
    invertColors && trend !== "flat"
      ? trend === "up"
        ? "down"
        : "up"
      : trend;

  const styles = {
    up: "text-emerald-600",
    down: "text-red-600",
    flat: "text-zinc-500",
  };

  const arrows = {
    up: "↑",
    down: "↓",
    flat: "→",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${styles[colorTrend]} ${className}`}
    >
      <span aria-hidden="true">{arrows[trend]}</span>
      {value}
    </span>
  );
}

export function Sparkline({ data }: { data: number[] }) {
  const width = 120;
  const height = 36;
  const padding = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x =
        padding + (index / (data.length - 1)) * (width - padding * 2);
      const y =
        padding +
        (1 - (value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-9 w-28"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-zinc-700"
        points={points}
      />
    </svg>
  );
}
