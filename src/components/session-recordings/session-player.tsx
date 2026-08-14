"use client";

import { useEffect, useRef } from "react";
import rrwebPlayer from "rrweb-player";
import "rrweb-player/dist/style.css";

type RrwebEvent = {
  type: number;
  data: unknown;
  timestamp: number;
};

type SessionPlayerProps = {
  events: unknown[];
  isLoading: boolean;
};

export function SessionPlayer({ events, isLoading }: SessionPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = containerRef.current;
    if (!target || isLoading || events.length === 0) {
      return;
    }

    const width = Math.max(target.clientWidth, 320);
    const height = Math.round((width * 9) / 16);

    const player = new rrwebPlayer({
      target,
      props: {
        events: events as RrwebEvent[],
        width,
        height,
        maxScale: 0,
        autoPlay: false,
        showController: true,
        skipInactive: true,
      },
    });

    return () => {
      player.$destroy();
      target.replaceChildren();
    };
  }, [events, isLoading]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
        <p className="text-sm text-zinc-600">Loading recording…</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
        <p className="text-sm text-zinc-600">No events to replay</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
