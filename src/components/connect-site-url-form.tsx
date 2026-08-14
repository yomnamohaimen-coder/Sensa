"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type ConnectSiteUrlFormProps = {
  initialSiteUrl: string;
};

export function ConnectSiteUrlForm({ initialSiteUrl }: ConnectSiteUrlFormProps) {
  const router = useRouter();
  const [siteUrl, setSiteUrl] = useState(initialSiteUrl);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setIsSaving(true);

    const trimmed = siteUrl.trim();
    if (trimmed) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          setError("Site URL must start with http:// or https://");
          setIsSaving(false);
          return;
        }
      } catch {
        setError("Enter a valid URL, e.g. https://example.com");
        setIsSaving(false);
        return;
      }
    }

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
          site_url: trimmed || null,
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
      <h2 className="text-base font-semibold text-zinc-900">Your website</h2>
      <p className="mt-1 text-sm text-zinc-500">
        The base URL Sensa should visit when capturing page screenshots for
        heatmaps (e.g. http://localhost:5173 or https://example.com).
      </p>

      <div className="mt-5">
        <label
          htmlFor="site-url"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Site URL
        </label>
        <input
          id="site-url"
          type="url"
          value={siteUrl}
          placeholder="https://example.com"
          onChange={(event) => {
            setSiteUrl(event.target.value);
            setSaved(false);
          }}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-3 text-sm text-green-700">Saved</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="mt-5 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
