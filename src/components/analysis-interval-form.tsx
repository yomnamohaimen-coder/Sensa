"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  normalizeAnalysisIntervalDays,
  splitAnalysisIntervalDays,
  type AnalysisIntervalUnit,
} from "@/lib/reports/analysis-interval";

type AnalysisIntervalFormProps = {
  initialIntervalDays: number | null;
  initialManualOnly: boolean;
};

const inputClassName =
  "rounded-md border border-stroke bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-ink-muted focus:ring-1 focus:ring-ink-muted disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-faint";

export function AnalysisIntervalForm({
  initialIntervalDays,
  initialManualOnly,
}: AnalysisIntervalFormProps) {
  const router = useRouter();
  const initial = splitAnalysisIntervalDays(initialIntervalDays);
  const [manualOnly, setManualOnly] = useState(initialManualOnly);
  const [amount, setAmount] = useState(String(initial.amount));
  const [unit, setUnit] = useState<AnalysisIntervalUnit>(initial.unit);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      setError("Enter at least 1 day (or 1 week).");
      return;
    }

    const intervalDays = normalizeAnalysisIntervalDays(parsedAmount, unit);
    setAmount(String(Math.max(1, Math.floor(parsedAmount))));
    setIsSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { error: saveError } = await supabase
        .from("profiles")
        .update({
          analysis_interval_days: intervalDays,
          analysis_manual_only: manualOnly,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (saveError) {
        setError(saveError.message);
        return;
      }

      setSaved(true);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-hairline bg-surface p-5 shadow-sm"
      noValidate
    >
      <h2 className="text-base font-semibold text-ink">
        Automatic analysis
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Choose how often Sensa should turn new tracking data into a report.
      </p>

      <label className="mt-5 flex items-center gap-2 text-sm text-ink-secondary">
        <input
          type="checkbox"
          checked={manualOnly}
          onChange={(event) => {
            setManualOnly(event.target.checked);
            setSaved(false);
          }}
          className="h-4 w-4 rounded border-stroke text-ink focus:ring-ink-muted"
        />
        Manually only
      </label>

      <div className="mt-4">
        <p className="mb-1.5 text-sm font-medium text-ink-secondary">
          Generate new analysis every
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="analysis-interval-amount"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={amount}
            disabled={manualOnly}
            onChange={(event) => {
              setAmount(event.target.value);
              setSaved(false);
            }}
            onBlur={() => {
              const parsed = Number(amount);
              if (!Number.isFinite(parsed) || parsed < 1) {
                setAmount("1");
              } else {
                setAmount(String(Math.floor(parsed)));
              }
            }}
            className={`w-20 ${inputClassName}`}
            aria-label="Interval amount"
          />
          <select
            id="analysis-interval-unit"
            value={unit}
            disabled={manualOnly}
            onChange={(event) => {
              setUnit(event.target.value as AnalysisIntervalUnit);
              setSaved(false);
            }}
            className={`w-28 ${inputClassName}`}
            aria-label="Interval unit"
          >
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
          </select>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && !error && (
        <p className="mt-3 text-sm text-green-700">Saved</p>
      )}

      <div className="mt-5">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-on-ink transition-colors hover:bg-ink-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
