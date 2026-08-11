export type AnalysisIntervalUnit = "days" | "weeks";

export function normalizeAnalysisIntervalDays(
  amount: number,
  unit: AnalysisIntervalUnit,
): number {
  const safeAmount = Math.max(1, Math.floor(amount));
  return unit === "weeks" ? safeAmount * 7 : safeAmount;
}

export function splitAnalysisIntervalDays(totalDays: number | null): {
  amount: number;
  unit: AnalysisIntervalUnit;
} {
  if (totalDays === null || totalDays < 1) {
    return { amount: 3, unit: "days" };
  }

  if (totalDays % 7 === 0) {
    return {
      amount: totalDays / 7,
      unit: "weeks",
    };
  }

  return {
    amount: totalDays,
    unit: "days",
  };
}

export function isAutoReportDue(
  manualOnly: boolean,
  intervalDays: number | null,
  lastAutoReportAt: string | null,
  now: Date = new Date(),
): boolean {
  if (manualOnly || intervalDays === null || intervalDays < 1) {
    return false;
  }

  if (!lastAutoReportAt) {
    return true;
  }

  const lastMs = Date.parse(lastAutoReportAt);
  if (Number.isNaN(lastMs)) {
    return true;
  }

  const elapsedMs = now.getTime() - lastMs;
  return elapsedMs >= intervalDays * 24 * 60 * 60 * 1000;
}
