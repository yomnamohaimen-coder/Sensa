"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createReportFromUpload } from "@/app/actions/create-report-from-upload";

export function StartAnalysisUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  function handleStartClick() {
    setIsExpanded(true);
    setError(null);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError(null);

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
    if (!selectedFile) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    const result = await createReportFromUpload(formData);

    if ("error" in result) {
      setError(result.error);
      setIsAnalyzing(false);
      return;
    }

    router.push(`/reports?report=${result.reportId}`);
    router.refresh();
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
          <label
            htmlFor="analysis-csv-upload"
            className="mb-1.5 block text-sm font-medium text-zinc-700"
          >
            Upload event data (.csv)
          </label>
          <p className="mb-3 text-xs text-zinc-500">
            Required columns: session_id, event_type, timestamp, page, device,
            metadata
          </p>

          <input
            ref={inputRef}
            id="analysis-csv-upload"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            disabled={isAnalyzing}
            className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
          />

          {selectedFile && (
            <p className="mt-2 text-sm text-zinc-600">
              Selected: {selectedFile.name}
            </p>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!selectedFile || isAnalyzing}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAnalyzing ? "Analyzing data..." : "Analyze data"}
          </button>
        </div>
      )}
    </div>
  );
}
