import {
  EVENT_COLUMNS,
  type EventColumn,
  type ParsedEventRow,
} from "@/lib/events/schema";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseMetadata(value: string): Record<string, unknown> | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { value: parsed };
  } catch {
    return { raw: trimmed };
  }
}

function parseTimestamp(value: string, rowNumber: number):
  | { ok: true; value: string }
  | { ok: false; error: string } {
  const trimmed = value.trim();
  const parsed = Date.parse(trimmed);

  if (Number.isNaN(parsed)) {
    return {
      ok: false,
      error: `Row ${rowNumber}: timestamp "${trimmed}" is not a valid date.`,
    };
  }

  return { ok: true, value: new Date(parsed).toISOString() };
}

export function parseEventsCsv(
  text: string,
): { events: ParsedEventRow[] } | { error: string } {
  const normalized = text.replace(/^\uFEFF/, "").trim();
  if (!normalized) {
    return { error: "The CSV file is empty." };
  }

  const lines = normalized.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return {
      error: "The CSV must include a header row and at least one data row.",
    };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const missingColumns = EVENT_COLUMNS.filter(
    (column) => !headers.includes(column),
  );

  if (missingColumns.length > 0) {
    return {
      error: `Missing required columns: ${missingColumns.join(", ")}.`,
    };
  }

  const columnIndexes = Object.fromEntries(
    EVENT_COLUMNS.map((column) => [column, headers.indexOf(column)]),
  ) as Record<EventColumn, number>;

  const events: ParsedEventRow[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const rowNumber = lineIndex + 1;
    const values = parseCsvLine(lines[lineIndex]);

    if (values.every((value) => !value.trim())) {
      continue;
    }

    if (values.length < headers.length) {
      return {
        error: `Row ${rowNumber}: expected ${headers.length} columns but found ${values.length}.`,
      };
    }

    const timestampResult = parseTimestamp(
      values[columnIndexes.timestamp],
      rowNumber,
    );
    if (!timestampResult.ok) {
      return { error: timestampResult.error };
    }

    const sessionId = values[columnIndexes.session_id].trim();
    const eventType = values[columnIndexes.event_type].trim();
    const page = values[columnIndexes.page].trim();
    const device = values[columnIndexes.device].trim();

    if (!sessionId || !eventType || !page || !device) {
      return {
        error: `Row ${rowNumber}: session_id, event_type, page, and device are required.`,
      };
    }

    events.push({
      session_id: sessionId,
      event_type: eventType,
      timestamp: timestampResult.value,
      page,
      device,
      metadata: parseMetadata(values[columnIndexes.metadata]),
    });
  }

  if (events.length === 0) {
    return { error: "The CSV file does not contain any event rows." };
  }

  return { events };
}
