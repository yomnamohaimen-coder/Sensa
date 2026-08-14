"use client";

import { useEffect, useState } from "react";
import { SessionPlayer } from "@/components/session-recordings/session-player";
import {
  getSessionRrwebEvents,
  type SessionRecordingSummary,
} from "@/lib/session-recordings/get-sessions";

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

  const selected = sessions.find(
    (session) => session.sessionId === selectedSessionId,
  );

  useEffect(() => {
    if (!selectedSessionId) {
      setEvents([]);
      setIsLoadingEvents(false);
      return;
    }

    let cancelled = false;
    setIsLoadingEvents(true);
    setEvents([]);

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
          Open a session to watch it back
        </p>

        <ul className="mt-6 max-h-[400px] divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
          {sessions.length > 0 ? (
            sessions.map((session) => {
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
              No recordings yet.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
