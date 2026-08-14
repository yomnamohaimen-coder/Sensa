export default function SessionRecordingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Session Recordings
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Watch real user sessions
        </p>
      </header>

      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
        <p className="text-sm text-zinc-600">No recordings yet</p>
      </div>
    </div>
  );
}
