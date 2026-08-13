import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type HeatmapElementStat = {
  label: string;
  count: number;
};

export type ReportHeatmapStats = {
  totalClicks: number;
  topElements: HeatmapElementStat[];
};

type ClickMetadata = {
  tag?: unknown;
  id?: unknown;
  viewportWidth?: unknown;
  viewportHeight?: unknown;
};

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/** Same gate as create-sensa-heatmap-adapter: skip clicks without viewport dims. */
function hasValidViewport(metadata: ClickMetadata | null): boolean {
  if (!metadata || typeof metadata !== "object") {
    return false;
  }
  return (
    isPositiveNumber(metadata.viewportWidth) &&
    isPositiveNumber(metadata.viewportHeight)
  );
}

function elementLabel(metadata: ClickMetadata): string {
  const tag =
    typeof metadata.tag === "string" && metadata.tag.trim()
      ? metadata.tag.trim().toLowerCase()
      : null;
  const id =
    typeof metadata.id === "string" && metadata.id.trim()
      ? metadata.id.trim()
      : null;

  if (tag && id) return `${tag}#${id}`;
  if (tag) return tag;
  if (id) return `#${id}`;
  return "(unknown)";
}

export async function getReportHeatmapStats(
  reportId: string,
): Promise<ReportHeatmapStats> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("events")
    .select("metadata")
    .eq("report_id", reportId)
    .eq("event_type", "click");

  if (error || !data || data.length === 0) {
    return { totalClicks: 0, topElements: [] };
  }

  const counts = new Map<string, number>();
  let totalClicks = 0;

  for (const row of data) {
    const metadata = row.metadata as ClickMetadata | null;
    if (!hasValidViewport(metadata)) {
      continue;
    }

    totalClicks += 1;
    const label = elementLabel(metadata);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const topElements = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 5);

  return { totalClicks, topElements };
}
