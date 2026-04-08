export default function Loading() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <div className="h-3 w-28 animate-pulse rounded bg-slate-700" />
        <div className="mt-4 h-8 w-64 animate-pulse rounded bg-slate-700" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-800" />
        <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-slate-800" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
            <div className="h-5 w-1/2 animate-pulse rounded bg-slate-700" />
            <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-800" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-800" />
            <div className="mt-6 h-9 w-28 animate-pulse rounded bg-slate-700" />
          </div>
        ))}
      </div>
    </section>
  );
}
