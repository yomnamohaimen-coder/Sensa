import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { HAS_REPORTS, MOCK_LAST_ANALYSIS } from "@/lib/mock-data";

function TrendIndicator({
  trend,
  value,
}: {
  trend: "up" | "down" | "flat";
  value: string;
}) {
  const styles = {
    up: "text-emerald-600",
    down: "text-red-600",
    flat: "text-zinc-500",
  };

  const arrows = {
    up: "↑",
    down: "↓",
    flat: "→",
  };

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${styles[trend]}`}>
      <span aria-hidden="true">{arrows[trend]}</span>
      {value}
    </span>
  );
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("product_name")
    .eq("id", user!.id)
    .maybeSingle();

  const welcomeName = profile?.product_name?.trim();
  const welcomeMessage = welcomeName ? `Welcome, ${welcomeName}` : "Welcome";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {welcomeMessage}
        </h1>
      </header>

      <div className="mb-8">
        {HAS_REPORTS ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-500">
              Last updated: {MOCK_LAST_ANALYSIS.updatedAt}
            </p>
            <p className="mt-3 text-base text-zinc-800">
              {MOCK_LAST_ANALYSIS.summary}
            </p>
            <div className="mt-4">
              <TrendIndicator
                trend={MOCK_LAST_ANALYSIS.trend}
                value={MOCK_LAST_ANALYSIS.trendValue}
              />
            </div>
          </div>
        ) : (
          <p className="text-base text-zinc-600">
            You haven&apos;t run an analysis yet — start with your first upload.
          </p>
        )}
      </div>

      <Link
        href="/upload"
        className="inline-flex w-fit items-center justify-center rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Start new analysis
      </Link>

      <p className="mt-16 text-sm text-zinc-400">
        More insights and comparisons coming soon
      </p>
    </div>
  );
}
