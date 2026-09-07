import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { UNLABELED_HEATMAP_ELEMENT_LABEL } from "@/lib/reports/heatmap-element-labels";

export type HeatmapElementStat = {
  label: string;
  count: number;
  /** Share of totalClicks, 0–100, rounded. */
  percent: number;
};

export type ReportHeatmapStats = {
  totalClicks: number;
  topElements: HeatmapElementStat[];
};

type ClickMetadata = {
  tag?: unknown;
  id?: unknown;
  text?: unknown;
  alt?: unknown;
  viewportWidth?: unknown;
  viewportHeight?: unknown;
};

const GENERIC_TAGS = new Set([
  "span",
  "div",
  "p",
  "li",
  "ul",
  "ol",
  "section",
  "article",
  "main",
  "header",
  "footer",
  "nav",
  "strong",
  "em",
  "i",
  "b",
]);

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
  const text =
    typeof metadata.text === "string" && metadata.text.trim()
      ? metadata.text.trim()
      : null;

  if (tag === "a") {
    return text ? `${text} link` : "Link";
  }

  if (tag && GENERIC_TAGS.has(tag)) {
    return text ?? "Text element";
  }

  // Clear controls: prefer visible text when we have it
  if (
    tag === "button" ||
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    tag === "label"
  ) {
    if (text) return text;
    if (id) return `${tag}#${id}`;
    if (tag === "button") return "Button";
    if (tag === "input") return "Input";
    return tag;
  }

  if (tag === "form") {
    if (id?.toLowerCase().includes("contact")) return "Contact form";
    if (id) return `Form (${id})`;
    return "Form";
  }

  if (tag === "img") {
    const alt =
      typeof metadata.alt === "string" && metadata.alt.trim()
        ? metadata.alt.trim()
        : null;
    return alt ?? "Image";
  }

  if (text) return text;
  if (tag && id) return `${tag}#${id}`;
  if (tag) return tag;
  if (id) return `#${id}`;
  return UNLABELED_HEATMAP_ELEMENT_LABEL;
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
    const label = elementLabel(metadata!);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const topElements = [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percent: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 5);

  return { totalClicks, topElements };
}
