"use client";

import { useEffect, useMemo, useState } from "react";
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

  const filteredSessions = useMemo(() => {
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
  }, [sessions, startDate, endDate, pageQuery]);

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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Session Recordings
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Watch real user sessions
        </p>
      </header>

      <div className="mb-12">
        {selected ? (
          <>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Session — {formatSessionTime(selected.startedAt)}
            </h2>
            <SessionPlayer events={events} isLoading={isLoadingEvents} />
            <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Session summary
              </p>
              {isLoadingSummary ? (
                <p className="mt-2 text-sm text-zinc-600">
                  Writing a summary…
                </p>
              ) : (
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  {aiSummary}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
            <p className="text-sm text-zinc-600">No recordings yet</p>
          </div>
        )}
      </div>

      <section className="border-t border-zinc-200 pt-10">
        <h2 className="text-base font-semibold text-zinc-900">
          Recording history
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Filter by date or page and open a session to watch it back
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="session-start-date"
              className="mb-1.5 block text-xs font-medium text-zinc-600"
            >
              From
            </label>
            <input
              id="session-start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="session-end-date"
              className="mb-1.5 block text-xs font-medium text-zinc-600"
            >
              To
            </label>
            <input
              id="session-end-date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="session-page-filter"
              className="mb-1.5 block text-xs font-medium text-zinc-600"
            >
              Page
            </label>
            <input
              id="session-page-filter"
              type="text"
              value={pageQuery}
              onChange={(event) => setPageQuery(event.target.value)}
              placeholder="Filter by page, e.g. /listing"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setPageQuery("");
              }}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              Clear
            </button>
          )}
        </div>

        <ul className="mt-6 max-h-[400px] divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => {
              const isSelected = session.sessionId === selectedSessionId;

              return (
                <li key={session.sessionId}>
                  <button
                    type="button"
                    onClick={() => setSelectedSessionId(session.sessionId)}
                    className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors ${
                      isSelected ? "bg-zinc-100" : "hover:bg-zinc-50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-zinc-900">
                        {formatSessionTime(session.startedAt)}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-zinc-500">
                        {session.firstPage}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-sm text-zinc-500">
                      {session.eventCount.toLocaleString()} events
                      <span className="mt-0.5 block">
                        {formatDuration(session.startedAt, session.endedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          ) : (
            <li className="px-5 py-8 text-center text-sm text-zinc-500">
              {sessions.length === 0
                ? "No recordings yet."
                : "No recordings match these filters."}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
