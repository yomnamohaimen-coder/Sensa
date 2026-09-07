import { ListingPageHeatmap } from "@/components/heatmap/listing-page-heatmap";

/** Temporary visual QA page — remove after heatmap wiring is confirmed. */
const TEST_REPORT_ID = "8192d36a-2a55-46a1-8a21-041a79b1f735";

export default function HeatmapTestPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Heatmap test
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Temporary QA page for{" "}
          <code className="rounded bg-raised px-1 py-0.5 text-xs text-ink-secondary">
            ListingPageHeatmap
          </code>{" "}
          using report{" "}
          <code className="rounded bg-raised px-1 py-0.5 text-xs text-ink-secondary">
            {TEST_REPORT_ID}
          </code>
          .
        </p>
      </header>

      <ListingPageHeatmap reportId={TEST_REPORT_ID} />
    </div>
  );
}
