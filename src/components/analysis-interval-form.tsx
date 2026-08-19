"use client";

import { useId, useRef, useState } from "react";
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

const MAX_INTERVAL_DAYS = 365;

const inputClassName =
  "min-h-11 rounded-md border border-stroke bg-surface px-3 py-2 text-base text-ink outline-none transition-colors focus:border-ink-muted focus:ring-1 focus:ring-ink-muted disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-muted aria-invalid:border-alert aria-invalid:caret-alert-text aria-invalid:focus:border-alert aria-invalid:focus:ring-alert sm:text-sm";

const primaryButtonClassName =
  "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-ink px-4 text-sm font-medium text-on-ink transition-colors hover:bg-ink-hover active:bg-ink-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-muted disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

export function AnalysisIntervalForm({
  initialIntervalDays,
  initialManualOnly,
}: AnalysisIntervalFormProps) {
  const router = useRouter();
  const errorId = useId();
  const statusId = useId();
  const amountRef = useRef<HTMLInputElement>(null);
  const initial = splitAnalysisIntervalDays(initialIntervalDays);
  const [manualOnly, setManualOnly] = useState(initialManualOnly);
  const [amount, setAmount] = useState(String(initial.amount));
  const [unit, setUnit] = useState<AnalysisIntervalUnit>(initial.unit);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) {
      return;
    }
    setError(null);
    setSaved(false);

    const parsedAmount = Number(amount);
    const amountIsValid = Number.isFinite(parsedAmount) && parsedAmount >= 1;

    if (!manualOnly && !amountIsValid) {
      setError("Enter at least 1 day (or 1 week).");
      amountRef.current?.focus();
      return;
    }

    const intervalDays = amountIsValid
      ? normalizeAnalysisIntervalDays(parsedAmount, unit)
      : (initialIntervalDays ?? 3);

    if (!manualOnly && intervalDays > MAX_INTERVAL_DAYS) {
      setError("Choose an interval of 365 days or less.");
      amountRef.current?.focus();
      return;
    }

    if (amountIsValid) {
      setAmount(String(Math.max(1, Math.floor(parsedAmount))));
    }
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
        setError(
          saveError.message ||
            "Could not save analysis settings. Please try again.",
        );
        if (!manualOnly) {
          amountRef.current?.focus();
        }
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError(
        "Could not save analysis settings. Check your connection and try again.",
      );
      if (!manualOnly) {
        amountRef.current?.focus();
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="min-w-0 rounded-lg border border-hairline bg-surface p-5 shadow-sm"
      noValidate
      aria-busy={isSaving || undefined}
    >
      <h3 className="text-base font-semibold text-ink">Automatic analysis</h3>

      <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink-secondary">
        <input
          type="checkbox"
          checked={manualOnly}
          onChange={(event) => {
            setManualOnly(event.target.checked);
            setSaved(false);
            setError(null);
          }}
          className="h-5 w-5 shrink-0 rounded border-stroke text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-muted"
        />
        Manually only
      </label>

      <fieldset
        className="group mt-4 min-w-0 border-0 p-0"
        disabled={manualOnly}
      >
        <legend className="mb-1.5 text-sm font-medium text-ink-secondary group-disabled:text-ink-muted">
          Generate new analysis every
        </legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            ref={amountRef}
            id="analysis-interval-amount"
            type="number"
            min={1}
            max={MAX_INTERVAL_DAYS}
            step={1}
            inputMode="numeric"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setSaved(false);
              setError(null);
            }}
            onBlur={() => {
              const parsed = Number(amount);
              if (!Number.isFinite(parsed) || parsed < 1) {
                setAmount("1");
              } else {
                setAmount(String(Math.floor(parsed)));
              }
            }}
            className={`w-full min-w-0 tabular-nums sm:w-24 ${inputClassName}`}
            aria-label="Interval amount"
            aria-invalid={error && !manualOnly ? true : undefined}
            aria-describedby={error && !manualOnly ? errorId : undefined}
          />
          <select
            id="analysis-interval-unit"
            value={unit}
            onChange={(event) => {
              setUnit(event.target.value as AnalysisIntervalUnit);
              setSaved(false);
              setError(null);
            }}
            className={`w-full min-w-0 sm:w-32 ${inputClassName}`}
            aria-label="Interval unit"
          >
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
          </select>
        </div>
      </fieldset>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-3 break-words text-sm text-alert-text"
        >
          {error}
        </p>
      ) : null}
      <p
        id={statusId}
        role="status"
        className={
          saved && !error ? "mt-3 text-sm text-signal-text" : "sr-only"
        }
      >
        {saved && !error ? "Saved" : ""}
      </p>

      <div className="mt-5">
        <button
          type="submit"
          disabled={isSaving}
          className={primaryButtonClassName}
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
