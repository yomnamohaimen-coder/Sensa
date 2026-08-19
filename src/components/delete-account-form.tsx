"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/app/actions/delete-account";
import { createClient } from "@/utils/supabase/client";

type DeleteAccountFormProps = {
  email: string;
  productName: string;
};

export function DeleteAccountForm({
  email,
  productName,
}: DeleteAccountFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmHint = productName
    ? `${email} or ${productName}`
    : email;

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
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-red-200 bg-red-50/60 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Delete account</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Permanently remove your Sensa account, reports, tracking data, heatmaps,
          and session recordings. This cannot be undone.
        </p>
        <div className="mt-5">
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setError(null);
              setConfirmation("");
            }}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800"
          >
            Delete account
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4"
          role="presentation"
          onClick={() => {
            if (!isDeleting) {
              setOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="w-full max-w-md rounded-lg border border-red-200 bg-surface p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id="delete-account-title"
              className="text-base font-semibold text-ink"
            >
              Confirm account deletion
            </h3>
            <p className="mt-2 text-sm text-ink-secondary">
              This will permanently delete your account and all associated data.
              Type <span className="font-medium text-ink">{confirmHint}</span>{" "}
              to confirm.
            </p>

            <form onSubmit={handleDelete} className="mt-5">
              <label
                htmlFor="delete-account-confirmation"
                className="mb-1.5 block text-sm font-medium text-ink-secondary"
              >
                Confirmation
              </label>
              <input
                id="delete-account-confirmation"
                type="text"
                autoComplete="off"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="w-full rounded-md border border-stroke px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500"
                placeholder={confirmHint}
              />

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-stroke bg-surface px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-canvas disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || !confirmation.trim()}
                  className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? "Deleting…" : "Delete permanently"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
