export type MockReport = {
  id: string;
  label: string;
  date: string;
  dateISO: string;
  userBehavior: {
    sessions: string;
    uniqueUsers: string;
    avgSessionDuration: string;
  };
  funnel: {
    step: string;
    count: number;
    dropOff: string;
  }[];
  engagement: {
    label: string;
    value: string;
  }[];
  heatmapDescription: string;
  aiInsights: {
    summary: string;
    anomaly: string;
    recommendation: string;
  };
};

export const MOCK_REPORTS: MockReport[] = [
  {
    id: "1",
    label: "Analysis — July 24",
    date: "July 24, 2025",
    dateISO: "2025-07-24",
    userBehavior: {
      sessions: "4,280",
      uniqueUsers: "1,940",
      avgSessionDuration: "3m 42s",
    },
    funnel: [
      { step: "Search", count: 1940, dropOff: "—" },
      { step: "View listing", count: 1210, dropOff: "38%" },
      { step: "Contact agent", count: 410, dropOff: "66%" },
    ],
    engagement: [
      { label: "Avg. time on page", value: "2m 18s" },
      { label: "Bounce rate", value: "34%" },
      { label: "Pages per session", value: "4.2" },
    ],
    heatmapDescription: "Highest click activity on listing cards and the contact button.",
    aiInsights: {
      summary:
        "Users are browsing listings actively, but fewer than expected reach the contact step.",
      anomaly: "Contact-agent drop-off is 12% higher than the previous period.",
      recommendation:
        "Test a shorter contact form on listing pages to reduce friction.",
    },
  },
  {
    id: "2",
    label: "Analysis — July 17",
    date: "July 17, 2025",
    dateISO: "2025-07-17",
    userBehavior: {
      sessions: "3,860",
      uniqueUsers: "1,720",
      avgSessionDuration: "3m 10s",
    },
    funnel: [
      { step: "Search", count: 1720, dropOff: "—" },
      { step: "View listing", count: 1080, dropOff: "37%" },
      { step: "Contact agent", count: 390, dropOff: "64%" },
    ],
    engagement: [
      { label: "Avg. time on page", value: "2m 05s" },
      { label: "Bounce rate", value: "36%" },
      { label: "Pages per session", value: "3.9" },
    ],
    heatmapDescription: "Scroll depth peaks on listing photos and price sections.",
    aiInsights: {
      summary:
        "Engagement held steady while search-to-listing conversion improved slightly.",
      anomaly: "Mobile bounce rate spiked on the search results page.",
      recommendation:
        "Review mobile layout for search filters and result loading speed.",
    },
  },
  {
    id: "3",
    label: "Analysis — July 10",
    date: "July 10, 2025",
    dateISO: "2025-07-10",
    userBehavior: {
      sessions: "3,540",
      uniqueUsers: "1,580",
      avgSessionDuration: "2m 58s",
    },
    funnel: [
      { step: "Search", count: 1580, dropOff: "—" },
      { step: "View listing", count: 960, dropOff: "39%" },
      { step: "Contact agent", count: 340, dropOff: "65%" },
    ],
    engagement: [
      { label: "Avg. time on page", value: "1m 54s" },
      { label: "Bounce rate", value: "38%" },
      { label: "Pages per session", value: "3.7" },
    ],
    heatmapDescription: "Clicks cluster around map pins and filter controls.",
    aiInsights: {
      summary:
        "Traffic was lower this week, with similar funnel patterns to prior reports.",
      anomaly: "No significant anomalies detected.",
      recommendation:
        "Continue monitoring contact-step conversion after upcoming UI changes.",
    },
  },
  {
    id: "4",
    label: "Analysis — July 3",
    date: "July 3, 2025",
    dateISO: "2025-07-03",
    userBehavior: {
      sessions: "3,210",
      uniqueUsers: "1,430",
      avgSessionDuration: "2m 46s",
    },
    funnel: [
      { step: "Search", count: 1430, dropOff: "—" },
      { step: "View listing", count: 870, dropOff: "39%" },
      { step: "Contact agent", count: 300, dropOff: "66%" },
    ],
    engagement: [
      { label: "Avg. time on page", value: "1m 48s" },
      { label: "Bounce rate", value: "39%" },
      { label: "Pages per session", value: "3.5" },
    ],
    heatmapDescription: "Early baseline heatmap with activity centered on homepage hero.",
    aiInsights: {
      summary:
        "Baseline report established core journey metrics for future comparisons.",
      anomaly: "Listing page exits increased after the first scroll.",
      recommendation:
        "Add clearer CTAs below the fold on listing detail pages.",
    },
  },
];

// Temporary flag — toggle to preview dashboard with mock report data.
export const HAS_REPORTS = true;

export const MOCK_LAST_ANALYSIS = {
  updatedAt: "July 30",
  summary: "Engagement increased 12% compared to last week.",
  trend: "up" as const,
  trendValue: "+12%",
};

export type TrendDirection = "up" | "down" | "flat";

export type MockQuickStat = {
  label: string;
  value: string;
  trend: TrendDirection;
  change: string;
};

export const MOCK_DASHBOARD_STATS: MockQuickStat[] = [
  { label: "Sessions", value: "1,240", trend: "up", change: "+8%" },
  { label: "Conversion rate", value: "18%", trend: "up", change: "+2%" },
  { label: "Avg. session time", value: "3m 42s", trend: "flat", change: "0%" },
  { label: "Drop-off rate", value: "42%", trend: "down", change: "-5%" },
];

export const MOCK_SPARKLINE = [42, 48, 45, 52, 58, 55, 62];

export const MOCK_KEY_INSIGHT =
  "Drop-off increased 15% on the checkout page — investigate the new form field.";
