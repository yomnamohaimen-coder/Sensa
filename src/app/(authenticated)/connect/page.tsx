import { cookies, headers } from "next/headers";
import { ConnectSiteUrlForm } from "@/components/connect-site-url-form";
import { ConnectSnippet } from "@/components/connect-snippet";
import { createClient } from "@/utils/supabase/server";

function getAppOrigin(headerStore: Headers) {
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const proto =
    headerStore.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${proto}://${host}`;
}

export default async function ConnectPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("tracking_id, site_url")
    .eq("id", user!.id)
    .maybeSingle();

  const trackingId = profile?.tracking_id ?? null;
  const origin = getAppOrigin(headerStore);
  const snippet = trackingId
    ? `<script src="${origin}/track.js" data-tracking-id="${trackingId}"></script>`
    : null;

  const { count: trackingEventCount } = trackingId
    ? await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("source", "tracking_script")
    : { count: 0 };

  const isConnected = (trackingEventCount ?? 0) > 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Connect
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Connect your website to start collecting data automatically, instead of
          uploading files manually.
        </p>
      </header>

      {snippet ? (
        <ConnectSnippet snippet={snippet} />
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-600">
            Your tracking ID is not available yet. Refresh the page, or contact
            support if this persists.
          </p>
        </div>
      )}

      <div className="mt-6">
        <ConnectSiteUrlForm initialSiteUrl={profile?.site_url ?? ""} />
      </div>

      <div
        className={`mt-6 rounded-lg border px-4 py-4 text-sm ${
          isConnected
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-zinc-200 bg-white text-zinc-600 shadow-sm"
        }`}
      >
        {isConnected ? (
          <p>✓ Connected — data is being received</p>
        ) : (
          <p>
            Waiting for data… visit your website after adding the snippet to test
            the connection
          </p>
        )}
      </div>
    </div>
  );
}
