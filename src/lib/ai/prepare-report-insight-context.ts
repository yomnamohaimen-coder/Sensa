import type { CalculatedReportMetrics } from "@/lib/analytics/calculate-report-metrics";
import type {
  ReportInsightContext,
  ReportInsightEngagementContext,
  ReportInsightFunnelContext,
  ReportInsightHeatmapContext,
  ReportInsightUserBehaviorContext,
} from "@/lib/ai/types";

function parseDropOffPercent(dropOff: string): number | null {
  if (dropOff === "—") {
    return null;
  }

  const parsed = Number.parseInt(dropOff.replace("%", ""), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildFunnelContext(
  metrics: CalculatedReportMetrics,
): ReportInsightFunnelContext {
  return {
    stages: metrics.funnel.map((stage) => ({
      name: stage.step,
      sessionCount: stage.count,
      dropOffPercent: parseDropOffPercent(stage.dropOff),
    })),
  };
}

function buildEngagementContext(
  metrics: CalculatedReportMetrics,
): ReportInsightEngagementContext {
  return metrics.engagement;
}

type ReportInsightExtensions = {
  heatmap?: ReportInsightHeatmapContext;
  userBehavior?: ReportInsightUserBehaviorContext;
};

export function prepareReportInsightContext(
  metrics: CalculatedReportMetrics,
  extensions: ReportInsightExtensions = {},
): ReportInsightContext {
  return {
    funnel: buildFunnelContext(metrics),
    engagement: buildEngagementContext(metrics),
    ...extensions,
  };
}

export function serializeReportInsightContext(
  context: ReportInsightContext,
): string {
  const sections: string[] = [
    "FUNNEL (sessions reaching each stage):",
    ...context.funnel.stages.map((stage) => {
      const dropOff =
        stage.dropOffPercent === null
          ? "n/a (first stage)"
          : `${stage.dropOffPercent}% drop-off from previous stage`;
      return `- ${stage.name}: ${stage.sessionCount} sessions (${dropOff})`;
    }),
    "",
    "ENGAGEMENT:",
    `- Avg. time on page: ${context.engagement.avgTimeOnPage}`,
    `- Bounce rate: ${context.engagement.bounceRate}`,
    `- Pages per session: ${context.engagement.pagesPerSession}`,
  ];

  if (context.userBehavior) {
    sections.push(
      "",
      "USER BEHAVIOR:",
      `- Sessions: ${context.userBehavior.sessions}`,
      `- Unique users (by session): ${context.userBehavior.uniqueUsers}`,
      `- Avg. session duration: ${context.userBehavior.avgSessionDuration}`,
    );
  }

  if (context.heatmap) {
    sections.push(
      "",
      "HEATMAP:",
      `- ${context.heatmap.description}`,
    );

    if (context.heatmap.topClickAreas?.length) {
      sections.push(
        `- Top click areas: ${context.heatmap.topClickAreas.join(", ")}`,
      );
    }
  }

  return sections.join("\n");
}
