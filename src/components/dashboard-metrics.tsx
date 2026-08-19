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
    up: "text-signal",
    down: "text-red-600",
    flat: "text-ink-muted",
  };

  const arrows = {
    up: "↑",
    down: "↓",
    flat: "→",
  };

  const directionWord =
    trend === "up" ? "up" : trend === "down" ? "down" : "unchanged";

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${styles[colorTrend]} ${className}`}
      aria-label={`${directionWord} ${value}`}
    >
      <span aria-hidden="true">{arrows[trend]}</span>
      <span aria-hidden="true">{value}</span>
    </span>
  );
}
