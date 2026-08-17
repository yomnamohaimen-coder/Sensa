"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { maybeGenerateRecurringReport } from "@/app/actions/maybe-generate-recurring-report";

const LOADING_INDICATOR_DELAY_MS = 300;

export function RecurringAnalysisChecker() {
  const router = useRouter();
  const startedRef = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    let cancelled = false;
    let loadingTimer: ReturnType<typeof setTimeout> | null = null;

    async function run() {
      loadingTimer = setTimeout(() => {
        if (!cancelled) {
          setIsGenerating(true);
        }
      }, LOADING_INDICATOR_DELAY_MS);

      try {
        const result = await maybeGenerateRecurringReport();
        if (cancelled) {
          return;
        }

        if (result.status === "created") {
          router.refresh();
        }
      } catch (error) {
        console.error("Recurring analysis check failed:", error);
      } finally {
        if (loadingTimer) {
          clearTimeout(loadingTimer);
        }
        if (!cancelled) {
          setIsGenerating(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
    };
  }, [router]);

  if (!isGenerating) {
    return null;
  }

  return (
    <div
      className="mb-6 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm"
      role="status"
      aria-live="polite"
    >
      Generating a new analysis from recent tracking data…
    </div>
  );
}
