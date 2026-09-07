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
    <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink">Your tracking snippet</p>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-md border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-canvas hover:text-ink"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="mt-4 overflow-x-auto rounded-md bg-raised px-4 py-3 text-xs leading-relaxed text-ink">
        <code>{snippet}</code>
      </pre>

      <div className="mt-4 space-y-3 text-sm text-ink-muted">
        <p>
          For the easiest setup, paste this snippet once in your website&apos;s
          shared layout or template file (e.g. a common header or footer include)
          it will then load automatically on every page.
        </p>
        <p>
          If your website doesn&apos;t use a shared template, paste it before the
          closing{" "}
          <code className="rounded bg-raised px-1 py-0.5 text-xs text-ink-secondary">
            {"</head>"}
          </code>{" "}
          tag on each individual page you want to track.
        </p>
      </div>
    </div>
  );
}
