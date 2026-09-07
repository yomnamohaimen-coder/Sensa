"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const PASSWORD_MAX_LENGTH = 72;

const inputClassName =
  "min-h-11 w-full min-w-0 rounded-md border border-stroke bg-surface px-3 py-2 text-base text-ink outline-none transition-colors focus:border-ink-muted focus:ring-1 focus:ring-ink-muted aria-invalid:border-alert aria-invalid:caret-alert-text aria-invalid:focus:border-alert aria-invalid:focus:ring-alert sm:text-sm";

const primaryButtonClassName =
  "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-ink px-4 text-sm font-medium text-on-ink transition-colors hover:bg-ink-hover active:bg-ink-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-muted disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

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
  const currentRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
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
    if (isSaving) {
      return;
    }
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
      (!currentPassword
        ? currentRef
        : !newPassword
          ? newRef
          : confirmRef
      ).current?.focus();
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      setInvalidFields({ confirm: true });
      confirmRef.current?.focus();
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      setInvalidFields({ new: true });
      newRef.current?.focus();
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from your current password.");
      setInvalidFields({ new: true });
      newRef.current?.focus();
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
        currentRef.current?.focus();
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(mapPasswordUpdateError(updateError.message, updateError.code));
        setInvalidFields({ new: true });
        newRef.current?.focus();
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
    } catch {
      setError("Could not update password. Check your connection and try again.");
      setInvalidFields({ current: true });
      currentRef.current?.focus();
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
            ref={currentRef}
            id="current-password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={PASSWORD_MAX_LENGTH}
            spellCheck={false}
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
            ref={newRef}
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            maxLength={PASSWORD_MAX_LENGTH}
            spellCheck={false}
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
            ref={confirmRef}
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            maxLength={PASSWORD_MAX_LENGTH}
            spellCheck={false}
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
        {saved && !error ? "Password updated" : ""}
      </p>

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
