import type { ReportHeatmapStats } from "@/lib/reports/get-report-heatmap-stats";

function describeHeatmapElementArea(label: string): string {
  const lower = label.toLowerCase();

  if (lower.includes("form")) {
    if (lower.includes("contact")) {
      return "in the contact form area";
    }
    return "in a form area";
  }

  if (lower === "link" || lower.endsWith(" link")) {
    return lower === "link" ? "on a link" : `on the ${label}`;
  }

  if (lower === "text element") {
    return "on a text element";
  }

  if (lower === "button" || lower === "input") {
    return `on a ${lower}`;
  }

  if (lower === "unknown element") {
    return "on an unlabeled element";
  }

  return `on “${label}”`;
}

/** Plain-language summary for the heatmap stats panel (template, not AI). */
export function buildHeatmapClickSummary(
  stats: ReportHeatmapStats,
): string | null {
  const top = stats.topElements[0];
  if (!top || stats.totalClicks <= 0) {
    return null;
  }

  let summary = `Most clicks (${top.percent}%) happened ${describeHeatmapElementArea(top.label)}.`;

  if (stats.totalClicks < 100) {
    summary += ` With only ${stats.totalClicks.toLocaleString()} clicks recorded, this pattern is too small a sample to draw firm conclusions from.`;
  }

  return summary;
}
