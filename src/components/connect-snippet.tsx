"use client";

import { useState } from "react";

type ConnectSnippetProps = {
  snippet: string;
};

export function ConnectSnippet({ snippet }: ConnectSnippetProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-900">Your tracking snippet</p>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="mt-4 overflow-x-auto rounded-md bg-zinc-100 px-4 py-3 text-xs leading-relaxed text-zinc-800">
        <code>{snippet}</code>
      </pre>

      <div className="mt-4 space-y-3 text-sm text-zinc-500">
        <p>
          For the easiest setup, paste this snippet once in your website&apos;s
          shared layout or template file (e.g. a common header or footer include)
          it will then load automatically on every page.
        </p>
        <p>
          If your website doesn&apos;t use a shared template, paste it before the
          closing{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs text-zinc-700">
            {"</head>"}
          </code>{" "}
          tag on each individual page you want to track.
        </p>
      </div>
    </div>
  );
}
