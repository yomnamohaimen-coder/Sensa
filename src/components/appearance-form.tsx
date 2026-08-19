"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

type ThemeValue = (typeof OPTIONS)[number]["value"];

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selected: ThemeValue = mounted && theme === "dark" ? "dark" : "light";

  function focusOption(index: number) {
    const next = OPTIONS[index];
    if (!next) {
      return;
    }
    setTheme(next.value);
    optionRefs.current[index]?.focus();
  }

  return (
    <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
      <p className="max-w-prose text-sm text-ink-muted">
        Choose how Sensa looks on this device. This does not follow your system
        setting.
      </p>

      <div
        role="radiogroup"
        aria-label="Color theme"
        className="mt-5 flex w-full max-w-xs rounded-md bg-raised p-1"
      >
        {OPTIONS.map((option, index) => {
          const isSelected = selected === option.value;

          return (
            <button
              key={option.value}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setTheme(option.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  focusOption((index + 1) % OPTIONS.length);
                } else if (
                  event.key === "ArrowLeft" ||
                  event.key === "ArrowUp"
                ) {
                  event.preventDefault();
                  focusOption((index - 1 + OPTIONS.length) % OPTIONS.length);
                } else if (event.key === "Home") {
                  event.preventDefault();
                  focusOption(0);
                } else if (event.key === "End") {
                  event.preventDefault();
                  focusOption(OPTIONS.length - 1);
                }
              }}
              className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-muted ${
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
