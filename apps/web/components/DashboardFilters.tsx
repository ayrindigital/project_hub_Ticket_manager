'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type DashboardStatusFilter = 'ALL' | 'ACTIVE' | 'ARCHIVED';

interface DashboardFiltersProps {
  initialQuery: string;
  initialStatus: DashboardStatusFilter;
}

export function DashboardFilters({
  initialQuery,
  initialStatus,
}: DashboardFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<DashboardStatusFilter>(initialStatus);

  useEffect(() => {
    setQuery(initialQuery);
    setStatus(initialStatus);
  }, [initialQuery, initialStatus]);

  function applyFilters(nextQuery: string, nextStatus: DashboardStatusFilter) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextQuery.trim()) {
      params.set('q', nextQuery.trim());
    } else {
      params.delete('q');
    }

    if (nextStatus === 'ALL') {
      params.delete('status');
    } else {
      params.set('status', nextStatus);
    }

    startTransition(() => {
      router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters(query, status);
  }

  function handleClear() {
    setQuery('');
    setStatus('ALL');
    startTransition(() => {
      router.push(pathname);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-[minmax(0,1fr)_180px_auto_auto]"
    >
      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Search
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by project name or description"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-slate-500"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Status
        </span>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as DashboardStatusFilter)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-500"
        >
          <option value="ALL">All projects</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-wait disabled:bg-sky-900"
      >
        {isPending ? 'Applying...' : 'Apply'}
      </button>

      <button
        type="button"
        onClick={handleClear}
        disabled={isPending}
        className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100 disabled:cursor-wait"
      >
        Clear
      </button>
    </form>
  );
}
