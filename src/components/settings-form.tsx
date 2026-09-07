"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const PRODUCT_NAME_MAX_LENGTH = 120;

const primaryButtonClassName =
  "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-ink px-4 text-sm font-medium text-on-ink transition-colors hover:bg-ink-hover active:bg-ink-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-muted disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

type SettingsFormProps = {
  initialProductName: string;
};

export function SettingsForm({ initialProductName }: SettingsFormProps) {
  const router = useRouter();
  const errorId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [productName, setProductName] = useState(initialProductName);
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
          product_name: productName.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (saveError) {
        setError(
          saveError.message ||
            "Could not save product name. Please try again.",
        );
        inputRef.current?.focus();
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("Could not save product name. Check your connection and try again.");
      inputRef.current?.focus();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="min-w-0 rounded-lg border border-hairline bg-surface p-5 shadow-sm"
      aria-busy={isSaving || undefined}
    >
      <h3 className="text-base font-semibold text-ink">Product</h3>
      <p className="mt-1 max-w-prose text-sm text-ink-muted">
        This name appears in your dashboard welcome message.
      </p>

      <div className="mt-5 min-w-0">
        <label
          htmlFor="product-name"
          className="mb-1.5 block text-sm font-medium text-ink-secondary"
        >
          Product name
        </label>
        <input
          ref={inputRef}
          id="product-name"
          type="text"
          dir="auto"
          maxLength={PRODUCT_NAME_MAX_LENGTH}
          autoComplete="organization"
          spellCheck={false}
          value={productName}
          onChange={(event) => {
            setProductName(event.target.value);
            setSaved(false);
            setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-h-11 w-full min-w-0 rounded-md border border-stroke bg-surface px-3 py-2 text-base text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-ink-muted focus:ring-1 focus:ring-ink-muted aria-invalid:border-alert aria-invalid:caret-alert-text aria-invalid:focus:border-alert aria-invalid:focus:ring-alert sm:text-sm"
          placeholder="Your product or company name"
        />
      </div>

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
