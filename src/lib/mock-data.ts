// Temporary flag — toggle to preview dashboard with mock report data.
export const HAS_REPORTS = false;

export const MOCK_LAST_ANALYSIS = {
  updatedAt: "July 30",
  summary: "Engagement increased 12% compared to last week.",
  trend: "up" as const,
  trendValue: "+12%",
};

export const MOCK_REPORTS = [
  { id: "1", date: "July 24", label: "Analysis — July 24" },
  { id: "2", date: "July 17", label: "Analysis — July 17" },
  { id: "3", date: "July 10", label: "Analysis — July 10" },
  { id: "4", date: "July 3", label: "Analysis — July 3" },
];
