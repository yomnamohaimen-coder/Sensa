"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  useHeatmapData,
  type CaptureEvent,
  type GradientMap,
} from "react-clickmap";
import {
  LISTING_WIREFRAME_WIDTH,
  ListingPageWireframe,
} from "@/components/heatmap/listing-page-wireframe";
import { createSensaHeatmapAdapter } from "@/lib/heatmap/create-sensa-heatmap-adapter";
import {
  getPageSnapshot,
  type PageSnapshot,
} from "@/lib/heatmap/get-page-snapshot";

type ListingPageHeatmapProps = {
  reportId: string;
  trackingId?: string | null;
  /** Pathname filter; defaults to the harbor-homes listing page under test. */
  page?: string;
};

const DEFAULT_RADIUS = 55;
const DEFAULT_OPACITY = 0.8;

/** Classic full-spectrum heatmap scale (Amplitude/Hotjar-style). */
const HEATMAP_GRADIENT: GradientMap = {
  0: "#3b82f6", // blue (low density)
  0.25: "#22d3ee", // cyan/teal
  0.5: "#4ade80", // green
  0.7: "#fde047", // yellow
  0.85: "#fb923c", // orange
  1: "#dc2626", // red (highest density)
};

function documentPoint(event: CaptureEvent): { x: number; y: number } | null {
  if (event.type !== "click" && event.type !== "rage-click" && event.type !== "dead-click") {
    return null;
  }

  const x =
    typeof event.docX === "number"
      ? event.docX
      : typeof event.x === "number"
        ? event.x
        : null;
  const y =
    typeof event.docY === "number"
      ? event.docY
      : typeof event.y === "number"
        ? event.y
        : null;

  if (x === null || y === null) {
    return null;
  }

  return { x, y };
}

function buildGradientPalette(gradient: GradientMap): Uint8ClampedArray {
  if (typeof document === "undefined") {
    return new Uint8ClampedArray(256 * 4);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) {
    return new Uint8ClampedArray(256 * 4);
  }

  const colorGradient = context.createLinearGradient(0, 0, 256, 0);
  for (const [stop, color] of Object.entries(gradient)) {
    const value = Number(stop);
    if (Number.isFinite(value) && value >= 0 && value <= 1) {
      colorGradient.addColorStop(value, color);
    }
  }
  context.fillStyle = colorGradient;
  context.fillRect(0, 0, 256, 1);
  return context.getImageData(0, 0, 256, 1).data;
}

/**
 * Contained heatmap overlay sized to the wireframe.
 *
 * react-clickmap's <Heatmap coordinateSpace="document"> still sizes its canvas
 * to document.documentElement, so it cannot stay inside this box. We load via
 * the same adapter + useHeatmapData, then draw document-space (docX/docY)
 * points onto a canvas that is position:absolute within the wireframe.
 */
function ContainedDocumentHeatmap({
  events,
  width,
  height,
  radius = DEFAULT_RADIUS,
  opacity = DEFAULT_OPACITY,
}: {
  events: CaptureEvent[];
  width: number;
  height: number;
  radius?: number;
  opacity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) {
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const shadow = document.createElement("canvas");
    shadow.width = width;
    shadow.height = height;
    const shadowContext = shadow.getContext("2d");
    if (!shadowContext) {
      return;
    }

    shadowContext.clearRect(0, 0, width, height);

    for (const event of events) {
      const point = documentPoint(event);
      if (!point) {
        continue;
      }

      const pixelX = (point.x / 100) * width;
      const pixelY = (point.y / 100) * height;
      const gradient = shadowContext.createRadialGradient(
        pixelX,
        pixelY,
        0,
        pixelX,
        pixelY,
        radius,
      );
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.65)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      shadowContext.fillStyle = gradient;
      shadowContext.fillRect(pixelX - radius, pixelY - radius, radius * 2, radius * 2);
    }

    const colorized = shadowContext.getImageData(0, 0, width, height);
    const palette = buildGradientPalette(HEATMAP_GRADIENT);

    for (let index = 0; index < colorized.data.length; index += 4) {
      const alpha = colorized.data[index + 3] ?? 0;
      if (alpha === 0) {
        continue;
      }

      const paletteIndex = Math.min(255, alpha) * 4;
      colorized.data[index] = palette[paletteIndex] ?? 0;
      colorized.data[index + 1] = palette[paletteIndex + 1] ?? 0;
      colorized.data[index + 2] = palette[paletteIndex + 2] ?? 0;
      colorized.data[index + 3] = Math.min(
        255,
        Math.floor(alpha * opacity),
      );
    }

    context.clearRect(0, 0, width, height);
    context.putImageData(colorized, 0, 0);
  }, [events, width, height, radius, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[5]"
      width={width}
      height={height}
      aria-hidden="true"
    />
  );
}

export function ListingPageHeatmap({
  reportId,
  trackingId = null,
  page = "/listing/42",
}: ListingPageHeatmapProps) {
  const fitRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<PageSnapshot | null>(null);
  const [snapshotReady, setSnapshotReady] = useState(!trackingId);
  const [scale, setScale] = useState(1);
  const [nativeWidth, setNativeWidth] = useState(LISTING_WIREFRAME_WIDTH);
  const [nativeHeight, setNativeHeight] = useState(0);

  const adapter = useMemo(
    () => createSensaHeatmapAdapter(reportId),
    [reportId],
  );

  const query = useMemo(
    () => ({
      page,
      device: "desktop" as const,
      types: ["click" as const],
      // Prefer document-space events from our adapter (docX/docY).
      coordinateSpace: "document" as const,
    }),
    [page],
  );

  const { data, isLoading, error } = useHeatmapData(adapter, query);
  const hasEvents = data.length > 0;
  const usingSnapshot = snapshotReady && snapshot !== null;
  const isMeasured = nativeHeight > 0 && nativeWidth > 0;

  useEffect(() => {
    if (!trackingId) {
      setSnapshot(null);
      setSnapshotReady(true);
      return;
    }

    let cancelled = false;
    setSnapshotReady(false);

    getPageSnapshot(trackingId, page).then((row) => {
      if (cancelled) {
        return;
      }
      setSnapshot(row);
      if (row) {
        setNativeWidth(row.width);
        setNativeHeight(row.height);
      } else {
        setNativeWidth(LISTING_WIREFRAME_WIDTH);
        setNativeHeight(0);
      }
      setSnapshotReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [trackingId, page]);

  useLayoutEffect(() => {
    const fit = fitRef.current;
    if (!fit) {
      return;
    }

    let rafId = 0;
    const measure = measureRef.current;

    const update = () => {
      const availableWidth = fit.clientWidth;
      const widthForScale = usingSnapshot
        ? nativeWidth
        : LISTING_WIREFRAME_WIDTH;
      const nextScale =
        availableWidth > 0 ? Math.min(1, availableWidth / widthForScale) : 1;
      setScale(nextScale);

      if (usingSnapshot) {
        return nativeHeight;
      }

      if (!measure) {
        return 0;
      }

      const nextHeight = Math.max(measure.scrollHeight, measure.offsetHeight);
      if (nextHeight > 0) {
        setNativeHeight(nextHeight);
      }
      return nextHeight;
    };

    const height = update();
    if (!usingSnapshot && height === 0) {
      rafId = requestAnimationFrame(() => {
        update();
      });
    }

    const observer = new ResizeObserver(() => {
      update();
    });
    observer.observe(fit);
    if (measure && !usingSnapshot) {
      observer.observe(measure);
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [usingSnapshot, nativeWidth, nativeHeight]);

  const scaledHeight = isMeasured
    ? Math.ceil(nativeHeight * scale)
    : undefined;

  return (
    <div
      ref={fitRef}
      className="w-full overflow-x-hidden rounded-lg border border-zinc-200 bg-zinc-50"
    >
      <div
        className="w-full"
        style={{
          position: "relative",
          height: scaledHeight,
          maxHeight: "none",
          overflow: "visible",
        }}
      >
        {/*
          Until the first non-zero measure, keep the stage in normal flow so
          content can contribute real height. Absolute + empty spacer collapses
          the measure target and sticks nativeHeight at 0.
        */}
        <div
          className={isMeasured ? "absolute top-0 left-0" : "relative"}
          style={{
            width: usingSnapshot ? nativeWidth : LISTING_WIREFRAME_WIDTH,
            height: isMeasured ? nativeHeight : undefined,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <div ref={measureRef}>
            {usingSnapshot && snapshot ? (
              <img
                src={snapshot.image_url}
                alt=""
                width={snapshot.width}
                height={snapshot.height}
                className="block max-w-none"
                style={{ width: nativeWidth, height: nativeHeight }}
                onLoad={(event) => {
                  const img = event.currentTarget;
                  if (img.naturalWidth > 0) {
                    setNativeWidth(img.naturalWidth);
                  }
                  if (img.naturalHeight > 0) {
                    setNativeHeight(img.naturalHeight);
                  }
                }}
              />
            ) : (
              <ListingPageWireframe />
            )}
          </div>

          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
              <p className="text-sm text-zinc-600">Loading heatmap…</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 px-6">
              <p className="text-center text-sm text-red-600">
                Could not load heatmap data. Please try again.
              </p>
            </div>
          )}

          {!isLoading && !error && !hasEvents && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 px-6">
              <p className="text-center text-sm text-zinc-600">
                Not enough click data yet
              </p>
            </div>
          )}

          {!isLoading && !error && hasEvents && isMeasured && (
            <ContainedDocumentHeatmap
              events={data}
              width={nativeWidth}
              height={nativeHeight}
              radius={DEFAULT_RADIUS}
              opacity={DEFAULT_OPACITY}
            />
          )}
        </div>
      </div>
    </div>
  );
}
