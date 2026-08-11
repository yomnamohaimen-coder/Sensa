import { ListingPageHeatmap } from "@/components/heatmap/listing-page-heatmap";

/** Temporary visual QA page — remove after heatmap wiring is confirmed. */
const TEST_REPORT_ID = "c42d33ca-1fd0-4a15-a4ff-3c8d34f04e21";

export default function HeatmapTestPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Heatmap test
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Temporary QA page for{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs text-zinc-700">
            ListingPageHeatmap
          </code>{" "}
          using report{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs text-zinc-700">
            {TEST_REPORT_ID}
          </code>
          .
        </p>
      </header>

      <ListingPageHeatmap reportId={TEST_REPORT_ID} />
    </div>
  );
}
