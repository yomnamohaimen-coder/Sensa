import {
  createAdapter,
  type CaptureEvent,
  type ClickmapAdapter,
  type DeviceType,
  type HeatmapQuery,
} from "react-clickmap";
import { createClient } from "@/utils/supabase/client";

type ClickMetadata = {
  x?: unknown;
  y?: unknown;
  viewportWidth?: unknown;
  viewportHeight?: unknown;
  tag?: unknown;
  id?: unknown;
  text?: unknown;
};

type ClickEventRow = {
  id: string;
  session_id: string;
  user_id: string;
  timestamp: string;
  page: string;
  device: string;
  metadata: ClickMetadata | null;
};

function isDeviceType(value: string): value is DeviceType {
  return value === "desktop" || value === "tablet" || value === "mobile";
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function buildSelector(metadata: ClickMetadata): string | undefined {
  const tag =
    typeof metadata.tag === "string" && metadata.tag.trim()
      ? metadata.tag.trim().toLowerCase()
      : null;
  const id =
    typeof metadata.id === "string" && metadata.id.trim()
      ? metadata.id.trim()
      : null;

  if (tag && id) {
    return `${tag}#${id}`;
  }
  if (tag) {
    return tag;
  }
  if (id) {
    return `#${id}`;
  }
  return undefined;
}

function toClickEvent(
  row: ClickEventRow,
  projectId: string,
): CaptureEvent | null {
  const metadata = row.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  // Older clicks (before viewport tracking) are excluded — do not guess dimensions.
  if (
    !isPositiveNumber(metadata.viewportWidth) ||
    !isPositiveNumber(metadata.viewportHeight)
  ) {
    return null;
  }

  if (!isFiniteNumber(metadata.x) || !isFiniteNumber(metadata.y)) {
    return null;
  }

  if (!isDeviceType(row.device)) {
    return null;
  }

  const timestampMs = Date.parse(row.timestamp);
  if (Number.isNaN(timestampMs)) {
    return null;
  }

  const xPercent = clampPercent(
    (metadata.x / metadata.viewportWidth) * 100,
  );
  const yPercent = clampPercent(
    (metadata.y / metadata.viewportHeight) * 100,
  );

  return {
    schemaVersion: 1,
    eventVersion: 1,
    eventId: row.id,
    projectId,
    sessionId: row.session_id,
    userId: row.user_id,
    timestamp: timestampMs,
    pathname: row.page,
    routeKey: row.page,
    deviceType: row.device,
    viewport: {
      width: metadata.viewportWidth,
      height: metadata.viewportHeight,
      scrollX: 0,
      scrollY: 0,
    },
    type: "click",
    x: xPercent,
    y: yPercent,
    // Document-space fields for contained overlays (position: absolute within wireframe).
    docX: xPercent,
    docY: yPercent,
    docWidth: metadata.viewportWidth,
    docHeight: metadata.viewportHeight,
    selector: buildSelector(metadata),
    pointerType: "mouse",
  };
}

export function createSensaHeatmapAdapter(reportId: string): ClickmapAdapter {
  const projectId = reportId;

  return createAdapter({
    async save() {
      // Capture is handled by track.js + /api/track — adapter is read-only.
    },

    async load(query: HeatmapQuery): Promise<CaptureEvent[]> {
      const supabase = createClient();

      let request = supabase
        .from("events")
        .select("id, session_id, user_id, timestamp, page, device, metadata")
        .eq("report_id", reportId)
        .eq("event_type", "click")
        .order("timestamp", { ascending: true });

      if (query.page) {
        request = request.eq("page", query.page);
      }

      if (query.device && query.device !== "all") {
        request = request.eq("device", query.device);
      }

      if (query.sessionId) {
        request = request.eq("session_id", query.sessionId);
      }

      if (query.userId) {
        request = request.eq("user_id", query.userId);
      }

      if (typeof query.from === "number") {
        request = request.gte("timestamp", new Date(query.from).toISOString());
      }

      if (typeof query.to === "number") {
        request = request.lte("timestamp", new Date(query.to).toISOString());
      }

      if (typeof query.limit === "number" && query.limit > 0) {
        request = request.limit(query.limit);
      }

      const { data, error } = await request;

      if (error || !data) {
        console.error("Failed to load heatmap events:", error);
        return [];
      }

      const events: CaptureEvent[] = [];

      for (const row of data as ClickEventRow[]) {
        // Skip rows missing viewportWidth / viewportHeight (or other required fields).
        const mapped = toClickEvent(row, projectId);
        if (mapped) {
          events.push(mapped);
        }
      }

      // HeatmapQuery.types is optional; when set, only return matching capture types.
      if (query.types && query.types.length > 0) {
        return events.filter((event) => query.types!.includes(event.type));
      }

      return events;
    },
  });
}
