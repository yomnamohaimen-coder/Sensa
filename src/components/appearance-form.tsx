"use client";

import { useRef, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

type ThemeValue = (typeof OPTIONS)[number]["value"];

/** Theme lives in localStorage, so the control only renders after hydration. */
function subscribeMounted() {
  return () => {};
}

function isMountedOnClient() {
  return true;
}

function isMountedOnServer() {
  return false;
}

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeMounted,
    isMountedOnClient,
    isMountedOnServer,
  );
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

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
    <div
      className="min-w-0 rounded-lg border border-hairline bg-surface p-5 shadow-sm"
      aria-busy={!mounted || undefined}
    >
      <p id="appearance-theme-hint" className="max-w-prose text-sm text-ink-muted">
        Choose how Sensa looks on this device. This does not follow your system
        setting.
      </p>

      {mounted ? (
        <div
          role="radiogroup"
          aria-label="Color theme"
          aria-describedby="appearance-theme-hint"
          className="mt-5 flex w-full min-w-0 rounded-md bg-raised p-1 sm:max-w-xs"
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
                className={`min-h-11 min-w-0 flex-1 cursor-pointer rounded px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-muted ${
                  isSelected
                    ? "bg-surface text-ink shadow-sm"
                    : "text-ink-muted hover:text-ink-secondary active:bg-surface/80 active:text-ink"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div
          className="mt-5 h-11 w-full rounded-md bg-raised sm:max-w-xs"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
