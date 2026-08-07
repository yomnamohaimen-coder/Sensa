export type ReportInsightFunnelStage = {
  name: string;
  sessionCount: number;
  dropOffPercent: number | null;
};

export type ReportInsightFunnelContext = {
  stages: ReportInsightFunnelStage[];
};

export type ReportInsightEngagementContext = {
  avgTimeOnPage: string;
  bounceRate: string;
  pagesPerSession: string;
};

/** Reserved for future heatmap click/scroll coordinate summaries. */
export type ReportInsightHeatmapContext = {
  description: string;
  topClickAreas?: string[];
};

/** Reserved for additional behavioral signals beyond funnel and engagement. */
export type ReportInsightUserBehaviorContext = {
  sessions: number;
  uniqueUsers: number;
  avgSessionDuration: string;
};

/**
 * Extensible input for AI insight generation. Add optional sections as new
 * data sources become available without changing the core prompt contract.
 */
export type ReportInsightContext = {
  funnel: ReportInsightFunnelContext;
  engagement: ReportInsightEngagementContext;
  heatmap?: ReportInsightHeatmapContext;
  userBehavior?: ReportInsightUserBehaviorContext;
};

export type GeneratedReportInsights = {
  summary: string;
  anomaly: string | null;
  recommendation: string;
};
