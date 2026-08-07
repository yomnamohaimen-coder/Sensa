export const EVENT_COLUMNS = [
  "session_id",
  "event_type",
  "timestamp",
  "page",
  "device",
  "metadata",
] as const;

export type EventColumn = (typeof EVENT_COLUMNS)[number];

export type ParsedEventRow = {
  session_id: string;
  event_type: string;
  timestamp: string;
  page: string;
  device: string;
  metadata: Record<string, unknown> | null;
};

export type ReportSource = "manual_upload" | "tracking_script";

export type ReportStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type DbReport = {
  id: string;
  user_id: string;
  created_at: string;
  status: ReportStatus;
  source: ReportSource;
  source_filename: string | null;
  ai_summary: string | null;
  ai_anomaly: string | null;
  ai_recommendation: string | null;
};

export type DbEvent = ParsedEventRow & {
  id: string;
  report_id: string;
  user_id: string;
  created_at: string;
};
