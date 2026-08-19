"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selected = mounted && theme === "dark" ? "dark" : "light";

  return (
    <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
      <h2 className="text-base font-semibold text-ink">Appearance</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Choose how Sensa looks on this device. This does not follow your system
        setting.
      </p>

      <div
        role="radiogroup"
        aria-label="Color theme"
        className="mt-5 flex w-full max-w-xs rounded-md bg-raised p-1"
      >
        {OPTIONS.map((option) => {
          const isSelected = selected === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={!mounted}
              onClick={() => setTheme(option.value)}
              className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-surface text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink-secondary"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
