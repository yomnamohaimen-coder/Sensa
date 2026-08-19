"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SessionPlayer } from "@/components/session-recordings/session-player";
import { getOrCreateSessionSummary } from "@/lib/session-recordings/build-session-summary";
import { getSessionRrwebEvents } from "@/lib/session-recordings/get-session-events";
import type { SessionRecordingSummary } from "@/lib/session-recordings/get-sessions";

function formatSessionTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(startedAt: string, endedAt: string) {
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(ms) || ms < 1000) {
    return "<1s";
  }

  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

export function SessionRecordingsPageContent({
  sessions,
}: {
  sessions: SessionRecordingSummary[];
}) {
  const selectedItemRef = useRef<HTMLLIElement>(null);
  const [selectedSessionId, setSelectedSessionId] = useState(
    sessions[0]?.sessionId ?? "",
  );
  const [events, setEvents] = useState<unknown[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pageQuery, setPageQuery] = useState("");

  const selected = sessions.find(
    (session) => session.sessionId === selectedSessionId,
  );

  const dateRangeInvalid = Boolean(
    startDate && endDate && endDate < startDate,
  );

  const filteredSessions = useMemo(() => {
    if (dateRangeInvalid) {
      return [];
    }

    const pageNeedle = pageQuery.trim().toLowerCase();

    return sessions.filter((session) => {
      const startedDate = session.startedAt.slice(0, 10);

      if (startDate && startedDate < startDate) {
        return false;
      }
      if (endDate && startedDate > endDate) {
        return false;
      }
      if (
        pageNeedle &&
        !session.firstPage.toLowerCase().includes(pageNeedle)
      ) {
        return false;
      }

      return true;
    });
  }, [sessions, startDate, endDate, pageQuery, dateRangeInvalid]);

  const hasActiveFilters = Boolean(startDate || endDate || pageQuery.trim());

  useEffect(() => {
    if (!selectedSessionId) {
      setEvents([]);
      setIsLoadingEvents(false);
      setAiSummary(null);
      setIsLoadingSummary(false);
      return;
    }

    let cancelled = false;
    setIsLoadingEvents(true);
    setEvents([]);
    setIsLoadingSummary(true);
    setAiSummary(null);

    getSessionRrwebEvents(selectedSessionId)
      .then((nextEvents) => {
        if (!cancelled) {
          setEvents(nextEvents);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingEvents(false);
        }
      });

    getOrCreateSessionSummary(selectedSessionId)
      .then((summary) => {
        if (!cancelled) {
          setAiSummary(summary);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAiSummary("Could not generate a summary right now.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSummary(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSessionId]);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedSessionId]);

  const isMostRecent = sessions[0]?.sessionId === selected?.sessionId;

  return (
    <div className="flex min-h-full flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <header className="shrink-0 px-6 pt-10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Session Recordings
        </h1>
        <p className="mt-2 max-w-prose text-sm text-ink-muted">
          Watch real user sessions
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:overflow-hidden">
        <aside
          aria-label="Recording history"
          className="flex min-h-0 flex-col border-hairline px-6 pb-6 lg:border-r lg:px-5 lg:pb-6"
        >
          <div>
            <h2 className="text-base font-semibold text-ink">
              Recordings
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Filter by date or page and open a session
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div className="min-w-0">
              <label
                htmlFor="session-start-date"
                className="mb-1.5 block text-xs font-medium text-ink-secondary"
              >
                From
              </label>
              <input
                id="session-start-date"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
                aria-invalid={dateRangeInvalid}
                aria-describedby={
                  dateRangeInvalid ? "session-date-range-error" : undefined
                }
                className="w-full rounded-md border border-stroke px-3 py-2 text-sm text-ink outline-none focus:border-ink-muted focus:ring-1 focus:ring-ink-muted"
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor="session-end-date"
                className="mb-1.5 block text-xs font-medium text-ink-secondary"
              >
                To
              </label>
              <input
                id="session-end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                aria-invalid={dateRangeInvalid}
                aria-describedby={
                  dateRangeInvalid ? "session-date-range-error" : undefined
                }
                className="w-full rounded-md border border-stroke px-3 py-2 text-sm text-ink outline-none focus:border-ink-muted focus:ring-1 focus:ring-ink-muted"
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor="session-page-filter"
                className="mb-1.5 block text-xs font-medium text-ink-secondary"
              >
                Page
              </label>
              <input
                id="session-page-filter"
                type="text"
                value={pageQuery}
                onChange={(event) => setPageQuery(event.target.value)}
                placeholder="e.g. /listing"
                className="w-full rounded-md border border-stroke px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-ink-muted focus:ring-1 focus:ring-ink-muted"
              />
            </div>

            {dateRangeInvalid ? (
              <p
                id="session-date-range-error"
                role="alert"
                className="text-sm text-red-600"
              >
                From must be on or before To.
              </p>
            ) : null}

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setPageQuery("");
                }}
                className="w-fit rounded-md px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-canvas hover:text-ink"
              >
                Clear filters
              </button>
            ) : null}
          </div>

          <ul className="mt-4 max-h-72 divide-y divide-hairline overflow-y-auto rounded-lg border border-hairline bg-surface shadow-sm lg:max-h-none lg:min-h-0 lg:flex-1">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session) => {
                const isSelected = session.sessionId === selectedSessionId;

                return (
                  <li
                    key={session.sessionId}
                    ref={isSelected ? selectedItemRef : undefined}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedSessionId(session.sessionId)}
                      aria-current={isSelected ? "true" : undefined}
                      className={`flex w-full min-h-11 min-w-0 flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors ${
                        isSelected ? "bg-raised" : "hover:bg-canvas"
                      }`}
                    >
                      <span className="w-full min-w-0 truncate text-sm font-medium text-ink">
                        {formatSessionTime(session.startedAt)}
                      </span>
                      <span className="w-full min-w-0 truncate text-xs text-ink-muted">
                        {session.firstPage}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {session.eventCount.toLocaleString()} events ·{" "}
                        {formatDuration(session.startedAt, session.endedAt)}
                      </span>
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-8 text-center text-sm text-ink-muted">
                {sessions.length === 0
                  ? "No recordings yet."
                  : dateRangeInvalid
                    ? "Choose a valid date range to see matching recordings."
                    : "No recordings match these filters."}
              </li>
            )}
          </ul>
        </aside>

        <section
          aria-label="Selected recording"
          className="min-w-0 border-t border-hairline px-6 pt-8 pb-10 lg:overflow-y-auto lg:border-t-0 lg:px-8 lg:pt-0 lg:pb-10"
        >
          {selected ? (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="min-w-0 break-words text-lg font-semibold text-ink">
                  {formatSessionTime(selected.startedAt)}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {isMostRecent ? "Most recent · " : ""}
                  {selected.firstPage} ·{" "}
                  {formatDuration(selected.startedAt, selected.endedAt)}
                </p>
              </div>

              <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
                <h3 className="text-base font-semibold text-ink">
                  Session summary
                </h3>
                {isLoadingSummary ? (
                  <p
                    role="status"
                    className="mt-3 text-sm text-ink-secondary"
                  >
                    Writing a summary…
                  </p>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-ink-secondary">
                    {aiSummary}
                  </p>
                )}
              </div>

              <SessionPlayer events={events} isLoading={isLoadingEvents} />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-hairline bg-surface px-6 py-10 text-center">
              <p className="text-sm text-ink-secondary">No recordings yet</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
