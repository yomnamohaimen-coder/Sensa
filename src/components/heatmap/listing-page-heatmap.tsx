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
  accessibleName?: string;
};

/** Snapshot tagged with the `trackingId|page` request that produced it. */
type LoadedSnapshot = {
  key: string;
  snapshot: PageSnapshot | null;
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
      className="pointer-events-none absolute inset-0 z-[5] block h-full w-full bg-transparent"
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
  accessibleName = "Click heatmap",
}: ListingPageHeatmapProps) {
  const fitRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [loadedSnapshot, setLoadedSnapshot] = useState<LoadedSnapshot | null>(
    null,
  );
  const [scale, setScale] = useState(1);
  const [nativeWidth, setNativeWidth] = useState(LISTING_WIREFRAME_WIDTH);
  const [nativeHeight, setNativeHeight] = useState(0);
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });

  const adapter = useMemo(
    () => createSensaHeatmapAdapter(reportId),
    [reportId],
  );

  const query = useMemo(
    () => ({
      page,
      device: "desktop" as const,
      types: ["click" as const],
      coordinateSpace: "document" as const,
    }),
    [page],
  );

  const { data, isLoading, error } = useHeatmapData(adapter, query);
  const hasEvents = data.length > 0;

  // Without a tracking id there is nothing to fetch, so the wireframe is ready
  // immediately; otherwise only a snapshot matching this request counts.
  const snapshotKey = trackingId ? `${trackingId}|${page}` : null;
  const snapshotReady =
    snapshotKey === null || loadedSnapshot?.key === snapshotKey;
  const snapshot =
    loadedSnapshot?.key === snapshotKey ? loadedSnapshot.snapshot : null;
  const usingSnapshot = snapshotReady && snapshot !== null;
  const isMeasured = nativeHeight > 0 && nativeWidth > 0;

  useEffect(() => {
    if (!trackingId || !snapshotKey) {
      return;
    }

    let cancelled = false;

    getPageSnapshot(trackingId, page)
      .then((row) => {
        if (cancelled) {
          return;
        }
        setLoadedSnapshot({ key: snapshotKey, snapshot: row });
        if (row) {
          setNativeWidth(row.width);
          setNativeHeight(row.height);
        } else {
          setNativeWidth(LISTING_WIREFRAME_WIDTH);
          setNativeHeight(0);
        }
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setLoadedSnapshot({ key: snapshotKey, snapshot: null });
        setNativeWidth(LISTING_WIREFRAME_WIDTH);
        setNativeHeight(0);
      });

    return () => {
      cancelled = true;
    };
  }, [trackingId, page, snapshotKey]);

  useLayoutEffect(() => {
    const image = imageRef.current;
    if (!image || !usingSnapshot) {
      return;
    }

    const update = () => {
      setOverlaySize({
        width: image.clientWidth,
        height: image.clientHeight,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(image);
    return () => observer.disconnect();
  }, [usingSnapshot, snapshot]);

  useLayoutEffect(() => {
    const fit = fitRef.current;
    if (!fit || usingSnapshot) {
      return;
    }

    let rafId = 0;
    const measure = measureRef.current;

    const update = () => {
      const availableWidth = fit.clientWidth;
      const nextScale =
        availableWidth > 0
          ? Math.min(1, availableWidth / LISTING_WIREFRAME_WIDTH)
          : 1;
      setScale(nextScale);

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
    if (height === 0) {
      rafId = requestAnimationFrame(() => {
        update();
      });
    }

    const observer = new ResizeObserver(() => {
      update();
    });
    observer.observe(fit);
    if (measure) {
      observer.observe(measure);
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [usingSnapshot, nativeWidth, nativeHeight]);

  const overlayWidth = usingSnapshot ? overlaySize.width : nativeWidth;
  const overlayHeight = usingSnapshot ? overlaySize.height : nativeHeight;
  const canDrawHeatmap =
    !isLoading &&
    !error &&
    hasEvents &&
    overlayWidth > 0 &&
    overlayHeight > 0 &&
    (usingSnapshot || isMeasured);

  const statusOverlay =
    isLoading || error || (!isLoading && !error && !hasEvents) ? (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/70 px-6">
        {isLoading ? (
          <p role="status" className="text-sm text-ink-secondary">
            Loading heatmap…
          </p>
        ) : error ? (
          <p role="alert" className="text-center text-sm text-red-600">
            Could not load heatmap data. Please try again.
          </p>
        ) : (
          <p role="status" className="text-center text-sm text-ink-secondary">
            Not enough click data yet
          </p>
        )}
      </div>
    ) : null;

  return (
    <figure className="m-0 block h-auto w-full min-w-0 leading-none" style={{ colorScheme: "light" }}>
      {usingSnapshot && snapshot ? (
        <div className="relative block h-auto w-full overflow-hidden rounded-lg border border-hairline bg-canvas leading-none">
          <img
            ref={imageRef}
            src={snapshot.image_url}
            alt=""
            className="relative z-0 block h-auto w-full"
            onLoad={(event) => {
              const img = event.currentTarget;
              setOverlaySize({
                width: img.clientWidth,
                height: img.clientHeight,
              });
            }}
            onError={() => {
              if (snapshotKey) {
                setLoadedSnapshot({ key: snapshotKey, snapshot: null });
              }
              setNativeWidth(LISTING_WIREFRAME_WIDTH);
              setNativeHeight(0);
              setOverlaySize({ width: 0, height: 0 });
            }}
          />
          {canDrawHeatmap ? (
            <ContainedDocumentHeatmap
              events={data}
              width={overlayWidth}
              height={overlayHeight}
              radius={DEFAULT_RADIUS}
              opacity={DEFAULT_OPACITY}
            />
          ) : null}
          {statusOverlay}
        </div>
      ) : (
        <div
          ref={fitRef}
          className="relative block h-auto w-full overflow-hidden rounded-lg border border-hairline bg-canvas leading-none"
        >
          <div
            className="relative"
            style={{
              width: LISTING_WIREFRAME_WIDTH,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              marginBottom: isMeasured ? nativeHeight * (scale - 1) : 0,
            }}
          >
            <div ref={measureRef}>
              <ListingPageWireframe />
            </div>
            {canDrawHeatmap ? (
              <ContainedDocumentHeatmap
                events={data}
                width={overlayWidth}
                height={overlayHeight}
                radius={DEFAULT_RADIUS}
                opacity={DEFAULT_OPACITY}
              />
            ) : null}
            {statusOverlay}
          </div>
        </div>
      )}
      <figcaption className="sr-only">{accessibleName}</figcaption>
    </figure>
  );
}
