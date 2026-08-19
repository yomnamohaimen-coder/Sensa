"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/app/actions/delete-account";
import { createClient } from "@/utils/supabase/client";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

type DeleteAccountFormProps = {
  email: string;
  productName: string;
};

export function DeleteAccountForm({
  email,
  productName,
}: DeleteAccountFormProps) {
  const router = useRouter();
  const errorId = useId();
  const descriptionId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const isDeletingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  isDeletingRef.current = isDeleting;

  const confirmHint = [email, productName].filter(Boolean).join(" or ") ||
    "your email address";

  function closeDialog() {
    if (isDeletingRef.current) {
      return;
    }
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    confirmationRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isDeletingRef.current) {
          setOpen(false);
        }
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const root = dialogRef.current;
      if (!root) {
        return;
      }

      const nodes = [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
      if (nodes.length === 0) {
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !root.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !root.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open]);

  async function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDeletingRef.current) {
      return;
    }
    setError(null);
    setIsDeleting(true);

    try {
      const result = await deleteAccount(confirmation);
      if ("error" in result) {
        setError(result.error);
        confirmationRef.current?.focus();
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setError("Could not delete account. Check your connection and try again.");
      confirmationRef.current?.focus();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-alert-stroke bg-alert-wash p-5">
        <h3 className="text-base font-semibold text-alert dark:text-alert-text">Delete account</h3>
        <p className="mt-1 max-w-prose text-sm text-alert-secondary">
          Permanently remove your Sensa account, reports, tracking data, heatmaps,
          and session recordings. This cannot be undone.
        </p>
        <div className="mt-5">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => {
              setOpen(true);
              setError(null);
              setConfirmation("");
            }}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-alert px-4 text-sm font-medium text-on-alert transition-colors hover:bg-alert-hover active:bg-alert-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-alert-text sm:w-auto"
          >
            Delete account
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-overlay sm:items-center sm:px-4"
          onClick={closeDialog}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby={descriptionId}
            aria-busy={isDeleting || undefined}
            className="max-h-[min(100dvh,100%)] w-full max-w-md min-w-0 overflow-y-auto rounded-t-lg border border-alert-stroke bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] shadow-lg sm:rounded-lg sm:pb-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="delete-account-title"
              className="text-base font-semibold text-ink"
            >
              Confirm account deletion
            </h2>
            <p
              id={descriptionId}
              className="mt-2 text-sm break-words text-ink-secondary"
            >
              This will permanently delete your account and all associated data.
              Type{" "}
              <span className="font-medium text-ink">{confirmHint}</span> to
              confirm.
            </p>

            <form
              onSubmit={handleDelete}
              className="mt-5"
              aria-busy={isDeleting || undefined}
            >
              <label
                htmlFor="delete-account-confirmation"
                className="mb-1.5 block text-sm font-medium text-ink-secondary"
              >
                Confirmation
              </label>
              <input
                ref={confirmationRef}
                id="delete-account-confirmation"
                type="text"
                dir="auto"
                autoComplete="off"
                spellCheck={false}
                value={confirmation}
                onChange={(event) => {
                  setConfirmation(event.target.value);
                  setError(null);
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={
                  error ? `${descriptionId} ${errorId}` : descriptionId
                }
                className="min-h-11 w-full min-w-0 rounded-md border border-stroke bg-surface px-3 py-2 text-base text-ink caret-alert-text outline-none transition-colors placeholder:text-ink-muted focus:border-alert focus:ring-1 focus:ring-alert aria-invalid:border-alert sm:text-sm"
                placeholder="Email or product name"
              />

              {error ? (
                <p
                  id={errorId}
                  role="alert"
                  className="mt-3 break-words text-sm text-alert-text"
                >
                  {error}
                </p>
              ) : null}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={closeDialog}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-stroke bg-surface px-4 text-sm font-medium text-ink-secondary transition-colors hover:bg-canvas active:bg-canvas focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-muted disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || !confirmation.trim()}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-alert px-4 text-sm font-medium text-on-alert transition-colors hover:bg-alert-hover active:bg-alert-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-alert-text disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isDeleting ? "Deleting…" : "Delete permanently"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
