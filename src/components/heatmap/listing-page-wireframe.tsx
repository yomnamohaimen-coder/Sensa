/**
 * Static structural wireframe of the harbor-homes listing page.
 * Fixed at 1512px wide so heatmap % coordinates align with tracked desktop viewports.
 */
export const LISTING_WIREFRAME_WIDTH = 1512;

export function ListingPageWireframe() {
  return (
    <div
      className="pointer-events-none select-none overflow-hidden bg-zinc-100 text-zinc-700"
      style={{ width: LISTING_WIREFRAME_WIDTH }}
      aria-hidden="true"
    >
      {/* Full-bleed hero */}
      <div
        className="relative w-full bg-zinc-300"
        style={{ height: "48vh", minHeight: 320 }}
      >
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-zinc-900/70 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="h-3 w-40 rounded bg-white/30" />
          <div className="mt-3 h-6 w-2/3 max-w-xl rounded bg-white/40" />
        </div>
      </div>

      {/* Content band */}
      <div className="mx-auto w-full max-w-[1152px] px-5 py-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-10">
          {/* Left: listing details (~61% / 1.4fr) */}
          <div className="min-w-0 flex-[1.4]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Featured listing
            </p>

            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-800 lg:text-5xl">
              Riverside loft with city views
            </h2>

            <p className="mt-3 text-sm text-zinc-500">
              2 bed · 2 bath · 1,180 sq ft · Downtown
            </p>

            <p className="mt-4 text-2xl font-bold text-zinc-900">$2,450 / month</p>

            <p className="mt-5 max-w-[672px] text-sm leading-6 text-zinc-600">
              Bright open-plan living with floor-to-ceiling windows, a renovated
              kitchen, and a private balcony overlooking the waterfront. Walking
              distance to transit, cafes, and parks. Placeholder copy for layout
              only — not a real listing.
            </p>

            <h3 className="mt-8 text-base font-semibold text-zinc-800">
              Amenities
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                "In-unit laundry",
                "Dishwasher",
                "Central AC",
                "Parking included",
                "Pet friendly",
                "Rooftop access",
              ].map((label) => (
                <div
                  key={label}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-center text-xs text-zinc-500"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: contact card (~39% / 0.9fr), sticky on lg+ */}
          <div className="min-w-0 flex-[0.9]">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
              <h3 className="text-lg font-semibold text-zinc-900">
                Contact an agent
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Ask a question or schedule a tour. Form fields are placeholders
                only.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <div className="h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm leading-[44px] text-zinc-400">
                  Your name
                </div>
                <div className="h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm leading-[44px] text-zinc-400">
                  Email address
                </div>
                <div className="min-h-[112px] w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-400">
                  Message
                </div>
                <div className="flex h-11 w-full items-center justify-center rounded-md bg-zinc-800 text-sm font-medium text-white">
                  Send message
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
