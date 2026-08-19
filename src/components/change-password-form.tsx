"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const inputClassName =
  "w-full rounded-md border border-stroke px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-ink-muted focus:ring-1 focus:ring-ink-muted";

function mapPasswordUpdateError(message: string, code?: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return "Current password is incorrect.";
  }

  if (code === "weak_password" || lower.includes("password")) {
    if (lower.includes("least") || lower.includes("weak") || code === "weak_password") {
      return "New password is too weak. Use at least 6 characters.";
    }
  }

  return message || "Could not update password. Please try again.";
}

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        router.push("/login");
        return;
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        setError(mapPasswordUpdateError(verifyError.message, verifyError.code));
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(mapPasswordUpdateError(updateError.message, updateError.code));
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
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
      <h2 className="text-base font-semibold text-ink">Change password</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Update the password you use to sign in to Sensa.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="current-password"
            className="mb-1.5 block text-sm font-medium text-ink-secondary"
          >
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
              setSaved(false);
            }}
            className={inputClassName}
            placeholder="••••••••"
          />
        </div>

        <div>
          <label
            htmlFor="new-password"
            className="mb-1.5 block text-sm font-medium text-ink-secondary"
          >
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setSaved(false);
            }}
            className={inputClassName}
            placeholder="••••••••"
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="mb-1.5 block text-sm font-medium text-ink-secondary"
          >
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setSaved(false);
            }}
            className={inputClassName}
            placeholder="••••••••"
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && !error && (
        <p className="mt-3 text-sm text-green-700">Password updated</p>
      )}

      <div className="mt-5">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-on-ink transition-colors hover:bg-ink-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}
