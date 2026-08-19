"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const inputClassName =
  "w-full min-w-0 rounded-md border border-stroke px-3 py-2 text-base text-ink outline-none transition-colors focus:border-ink-muted focus:ring-1 focus:ring-ink-muted sm:text-sm";

const primaryButtonClassName =
  "rounded-md bg-ink px-4 py-2 text-sm font-medium text-on-ink transition-colors hover:bg-ink-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-muted disabled:cursor-not-allowed disabled:opacity-60";

type PasswordField = "current" | "new" | "confirm";

function mapPasswordUpdateError(message: string, code?: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return "Current password is incorrect.";
  }

  if (code === "weak_password" || lower.includes("password")) {
    if (
      lower.includes("least") ||
      lower.includes("weak") ||
      code === "weak_password"
    ) {
      return "New password is too weak. Use at least 6 characters.";
    }
  }

  return message || "Could not update password. Please try again.";
}

export function ChangePasswordForm() {
  const router = useRouter();
  const errorId = useId();
  const statusId = useId();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalidFields, setInvalidFields] = useState<
    Partial<Record<PasswordField, boolean>>
  >({});
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function describedBy(field: PasswordField) {
    return error && invalidFields[field] ? errorId : undefined;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setInvalidFields({});

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      setInvalidFields({
        current: !currentPassword,
        new: !newPassword,
        confirm: !confirmPassword,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      setInvalidFields({ confirm: true });
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      setInvalidFields({ new: true });
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from your current password.");
      setInvalidFields({ new: true });
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
        setInvalidFields({ current: true });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(mapPasswordUpdateError(updateError.message, updateError.code));
        setInvalidFields({ new: true });
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
    } catch {
      setError("Could not update password. Check your connection and try again.");
      setInvalidFields({ current: true });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="min-w-0 rounded-lg border border-hairline bg-surface p-5 shadow-sm"
      noValidate
    >
      <h3 className="text-base font-semibold text-ink">Change password</h3>
      <p className="mt-1 max-w-prose text-sm text-ink-muted">
        Update the password you use to sign in to Sensa.
      </p>

      <div className="mt-5 space-y-4">
        <div className="min-w-0">
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
            required
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
              setSaved(false);
              setError(null);
              setInvalidFields((fields) => ({ ...fields, current: false }));
            }}
            aria-invalid={invalidFields.current || undefined}
            aria-describedby={describedBy("current")}
            className={inputClassName}
          />
        </div>

        <div className="min-w-0">
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
            required
            minLength={6}
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setSaved(false);
              setError(null);
              setInvalidFields((fields) => ({ ...fields, new: false }));
            }}
            aria-invalid={invalidFields.new || undefined}
            aria-describedby={describedBy("new")}
            className={inputClassName}
          />
        </div>

        <div className="min-w-0">
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
            required
            minLength={6}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setSaved(false);
              setError(null);
              setInvalidFields((fields) => ({ ...fields, confirm: false }));
            }}
            aria-invalid={invalidFields.confirm || undefined}
            aria-describedby={describedBy("confirm")}
            className={inputClassName}
          />
        </div>
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-3 break-words text-sm text-red-600"
        >
          {error}
        </p>
      ) : null}
      {saved && !error ? (
        <p id={statusId} role="status" className="mt-3 text-sm text-green-700">
          Password updated
        </p>
      ) : null}

      <div className="mt-5">
        <button
          type="submit"
          disabled={isSaving}
          className={primaryButtonClassName}
        >
          {isSaving ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}
