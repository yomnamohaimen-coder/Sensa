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

  const confirmHint = productName
    ? `${email} or ${productName}`
    : email;

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
      previous?.focus();
    };
  }, [open]);

  async function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsDeleting(true);

    try {
      const result = await deleteAccount(confirmation);
      if ("error" in result) {
        setError(result.error);
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setError("Could not delete account. Check your connection and try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-red-200 bg-red-50/60 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Delete account</h2>
        <p className="mt-1 max-w-prose text-sm text-ink-secondary">
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
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
          >
            Delete account
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4"
          onClick={closeDialog}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby={descriptionId}
            className="w-full max-w-md min-w-0 rounded-lg border border-red-200 bg-surface p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id="delete-account-title"
              className="text-base font-semibold text-ink"
            >
              Confirm account deletion
            </h3>
            <p
              id={descriptionId}
              className="mt-2 text-sm break-words text-ink-secondary"
            >
              This will permanently delete your account and all associated data.
              Type{" "}
              <span className="font-medium text-ink">{confirmHint}</span> to
              confirm.
            </p>

            <form onSubmit={handleDelete} className="mt-5">
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
                autoComplete="off"
                value={confirmation}
                onChange={(event) => {
                  setConfirmation(event.target.value);
                  setError(null);
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className="w-full min-w-0 rounded-md border border-stroke px-3 py-2 text-base text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-red-500 focus:ring-1 focus:ring-red-500 sm:text-sm"
                placeholder={confirmHint}
              />

              {error ? (
                <p
                  id={errorId}
                  role="alert"
                  className="mt-3 break-words text-sm text-red-600"
                >
                  {error}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={closeDialog}
                  className="rounded-md border border-stroke bg-surface px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-canvas focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-muted disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || !confirmation.trim()}
                  className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
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
