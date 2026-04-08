export default function ProjectLoading() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-700" />
        <div className="mt-4 h-8 w-56 animate-pulse rounded bg-slate-700" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-800" />
        <div className="mt-2 h-4 w-3/5 animate-pulse rounded bg-slate-800" />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-700" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-slate-800 p-4">
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-700" />
              <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
