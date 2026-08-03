export default function UploadPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Upload data
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Upload a CSV of user behavior events to generate your first analysis.
        </p>
      </header>
    </div>
  );
}
