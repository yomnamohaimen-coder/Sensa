export type AnalyticsEvent = {
  session_id: string;
  event_type: string;
  timestamp: string;
  page: string;
};

export type FunnelStep = {
  step: string;
  count: number;
  dropOff: string;
};

export type CalculatedReportMetrics = {
  userBehavior: {
    sessions: number;
    uniqueUsers: number;
    avgSessionDuration: string;
  };
  funnel: FunnelStep[];
  engagement: {
    avgTimeOnPage: string;
    bounceRate: string;
    pagesPerSession: string;
  };
};

function formatDuration(ms: number): string {
  if (ms <= 0) {
    return "0s";
  }

  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function formatDropOff(previousCount: number, currentCount: number): string {
  if (previousCount === 0) {
    return "—";
  }

  const dropOff = ((previousCount - currentCount) / previousCount) * 100;
  return `${Math.round(dropOff)}%`;
}

function groupEventsBySession(
  events: AnalyticsEvent[],
): Map<string, AnalyticsEvent[]> {
  const sessions = new Map<string, AnalyticsEvent[]>();

  for (const event of events) {
    const sessionEvents = sessions.get(event.session_id) ?? [];
    sessionEvents.push(event);
    sessions.set(event.session_id, sessionEvents);
  }

  return sessions;
}

function calculateUserBehavior(sessions: Map<string, AnalyticsEvent[]>) {
  const sessionCount = sessions.size;
  const durations: number[] = [];

  for (const sessionEvents of sessions.values()) {
    const timestamps = sessionEvents.map((event) => Date.parse(event.timestamp));
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    durations.push(Math.max(0, max - min));
  }

  const avgDurationMs =
    durations.length > 0
      ? durations.reduce((sum, value) => sum + value, 0) / durations.length
      : 0;

  return {
    sessions: sessionCount,
    uniqueUsers: sessionCount,
    avgSessionDuration: formatDuration(avgDurationMs),
  };
}

function sessionReachedListing(sessionEvents: AnalyticsEvent[]): boolean {
  return sessionEvents.some(
    (event) =>
      event.event_type === "page_view" && event.page.includes("/listing/"),
  );
}

function calculateFunnel(sessions: Map<string, AnalyticsEvent[]>) {
  const stage1Sessions = [...sessions.entries()].filter(([, events]) =>
    events.some((event) => event.event_type === "search"),
  );
  const stage2Sessions = stage1Sessions.filter(([, events]) =>
    sessionReachedListing(events),
  );
  const stage3Sessions = stage2Sessions.filter(([, events]) =>
    events.some((event) => event.event_type === "contact_submitted"),
  );

  const steps = [
    { step: "Search", count: stage1Sessions.length },
    { step: "View listing", count: stage2Sessions.length },
    { step: "Contact submitted", count: stage3Sessions.length },
  ];

  return steps.map((step, index) => ({
    step: step.step,
    count: step.count,
    dropOff:
      index === 0
        ? "—"
        : formatDropOff(steps[index - 1].count, step.count),
  }));
}

function getSessionPageDurations(sessionEvents: AnalyticsEvent[]): Map<string, number> {
  const sorted = [...sessionEvents].sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
  );
  const durations = new Map<string, number>();

  for (let index = 0; index < sorted.length; index += 1) {
    const event = sorted[index];
    const start = Date.parse(event.timestamp);
    const end =
      index < sorted.length - 1
        ? Date.parse(sorted[index + 1].timestamp)
        : start;

    const delta = Math.max(0, end - start);
    durations.set(event.page, (durations.get(event.page) ?? 0) + delta);
  }

  return durations;
}

function calculateEngagement(sessions: Map<string, AnalyticsEvent[]>) {
  const sessionCount = sessions.size;
  if (sessionCount === 0) {
    return {
      avgTimeOnPage: "0s",
      bounceRate: "0%",
      pagesPerSession: "0",
    };
  }

  let bounceSessions = 0;
  let totalDistinctPages = 0;
  const sessionAvgTimes: number[] = [];

  for (const sessionEvents of sessions.values()) {
    const pageViewCount = sessionEvents.filter(
      (event) => event.event_type === "page_view",
    ).length;

    if (pageViewCount === 1) {
      bounceSessions += 1;
    }

    const distinctPages = new Set(sessionEvents.map((event) => event.page));
    totalDistinctPages += distinctPages.size;

    const pageDurations = getSessionPageDurations(sessionEvents);
    if (pageDurations.size > 0) {
      const values = [...pageDurations.values()];
      const sessionAverage =
        values.reduce((sum, value) => sum + value, 0) / values.length;
      sessionAvgTimes.push(sessionAverage);
    }
  }

  const avgTimeOnPageMs =
    sessionAvgTimes.length > 0
      ? sessionAvgTimes.reduce((sum, value) => sum + value, 0) /
        sessionAvgTimes.length
      : 0;

  return {
    avgTimeOnPage: formatDuration(avgTimeOnPageMs),
    bounceRate: `${Math.round((bounceSessions / sessionCount) * 100)}%`,
    pagesPerSession: (totalDistinctPages / sessionCount).toFixed(1),
  };
}

export function calculateReportMetrics(
  events: AnalyticsEvent[],
): CalculatedReportMetrics | null {
  if (events.length === 0) {
    return null;
  }

  const sessions = groupEventsBySession(events);

  return {
    userBehavior: calculateUserBehavior(sessions),
    funnel: calculateFunnel(sessions),
    engagement: calculateEngagement(sessions),
  };
}
