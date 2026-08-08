"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createReportFromUpload } from "@/app/actions/create-report-from-upload";

const SUCCESS_MESSAGE_DURATION_MS = 1500;

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function StartAnalysisUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  function clearCollapseTimeout() {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
  }

  function resetToInitialState() {
    clearCollapseTimeout();
    setIsExpanded(false);
    setSelectedFile(null);
    setError(null);
    setShowSuccess(false);
    setIsAnalyzing(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  useEffect(() => {
    return () => {
      clearCollapseTimeout();
    };
  }, []);

  function handleStartClick() {
    clearCollapseTimeout();
    setIsExpanded(true);
    setError(null);
    setShowSuccess(false);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError(null);
    setShowSuccess(false);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setSelectedFile(null);
      setError("Only .csv files are supported.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  async function handleAnalyze() {
    if (!selectedFile || isAnalyzing || showSuccess) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setShowSuccess(false);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const result = await createReportFromUpload(formData);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setShowSuccess(true);
      router.push(`/reports?report=${result.reportId}`);
      router.refresh();

      clearCollapseTimeout();
      collapseTimeoutRef.current = setTimeout(() => {
        resetToInitialState();
      }, SUCCESS_MESSAGE_DURATION_MS);
    } catch {
      setError("Something went wrong during analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleStartClick}
        className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Start new analysis
      </button>

      {isExpanded && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="mb-1.5 text-sm font-medium text-zinc-700">
            Upload event data (.csv)
          </p>
          <p className="mb-3 text-xs text-zinc-500">
            Required columns: session_id, event_type, timestamp, page, device,
            metadata
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label
              htmlFor="analysis-csv-upload"
              className={`inline-flex w-fit cursor-pointer items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 ${
                isAnalyzing || showSuccess
                  ? "pointer-events-none opacity-60"
                  : ""
              }`}
            >
              Choose file
            </label>
            <input
              ref={inputRef}
              id="analysis-csv-upload"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              disabled={isAnalyzing || showSuccess}
              className="sr-only"
            />
            {selectedFile ? (
              <div className="flex min-w-0 items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2">
                <span
                  className="shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700"
                  aria-hidden="true"
                >
                  CSV
                </span>
                <p className="truncate text-sm font-medium text-green-800">
                  {selectedFile.name}
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No file chosen</p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {showSuccess ? (
            <p
              role="status"
              className="mt-4 text-sm font-medium text-green-700"
            >
              ✓ Analysis complete
            </p>
          ) : (
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!selectedFile || isAnalyzing}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyzing && <Spinner />}
              {isAnalyzing ? "Analyzing..." : "Analyze data"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
