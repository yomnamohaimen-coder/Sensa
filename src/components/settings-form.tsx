"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type SettingsFormProps = {
  initialProductName: string;
};

export function SettingsForm({ initialProductName }: SettingsFormProps) {
  const router = useRouter();
  const [productName, setProductName] = useState(initialProductName);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        setError(saveError.message);
        return;
      }

      setSaved(true);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-base font-semibold text-zinc-900">Product</h2>
      <p className="mt-1 text-sm text-zinc-500">
        This name appears in your dashboard welcome message.
      </p>

      <div className="mt-5">
        <label
          htmlFor="product-name"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Product name
        </label>
        <input
          id="product-name"
          type="text"
          value={productName}
          onChange={(event) => {
            setProductName(event.target.value);
            setSaved(false);
          }}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          placeholder="Your product or company name"
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && !error && (
        <p className="mt-3 text-sm text-green-700">Saved</p>
      )}

      <div className="mt-5">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
