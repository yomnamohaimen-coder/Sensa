import { MOCK_REPORTS } from "@/lib/mock-data";

export default function ReportsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Reports
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Your past analyses
        </p>
      </header>

      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white shadow-sm">
        {MOCK_REPORTS.map((report) => (
          <li key={report.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-zinc-50"
            >
              <span className="text-sm font-medium text-zinc-900">
                {report.label}
              </span>
              <span className="text-sm text-zinc-500">{report.date}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
