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
