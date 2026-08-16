export type TrendChange = {
  trend: "up" | "down" | "flat";
  value: string;
};

export function parseDurationMs(value: string): number | null {
  const minutes = value.match(/(\d+)\s*m/);
  const seconds = value.match(/(\d+)\s*s/);
  if (!minutes && !seconds) {
    return null;
  }
  return (
    (minutes ? Number(minutes[1]) * 60_000 : 0) +
    (seconds ? Number(seconds[1]) * 1000 : 0)
  );
}

export function parsePercent(value: string): number | null {
  const match = value.trim().match(/^-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function percentChange(
  current: number,
  previous: number,
): TrendChange | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return null;
  }

  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.round(delta);
  if (rounded === 0) {
    return { trend: "flat", value: "0%" };
  }

  return {
    trend: rounded > 0 ? "up" : "down",
    value: `${rounded > 0 ? "+" : ""}${rounded}%`,
  };
}
