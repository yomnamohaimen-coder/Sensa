export function EmptyStatValue({ hero = false }: { hero?: boolean }) {
  return (
    <p
      className={
        hero
          ? "mt-2 text-base font-normal text-zinc-500"
          : "mt-1 text-sm font-normal text-zinc-500"
      }
    >
      No data yet
    </p>
  );
}

export function EmptyChartPlaceholder({
  message,
  compact = false,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex h-[5.5rem] w-full items-center justify-center rounded-md border border-dashed border-zinc-200 bg-zinc-50/50 px-3"
          : "flex min-h-[7rem] w-full items-center justify-center rounded-md border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-6"
      }
      role="status"
    >
      <div className="flex flex-col items-center gap-1.5 text-center">
        <svg
          aria-hidden="true"
          className="h-4 w-4 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.5l4.5-4.5 3.75 3.75L16.5 6 21 10.5M3 18h18"
          />
        </svg>
        <p className="text-xs leading-5 text-zinc-500">{message}</p>
      </div>
    </div>
  );
}
