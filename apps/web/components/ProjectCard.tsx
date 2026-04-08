import Link from 'next/link';

interface ProjectCardProps {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  ticketCount: number;
}

export function ProjectCard({ id, name, description, status, ticketCount }: ProjectCardProps) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">{name}</h2>
        <span
          className={`rounded-md px-2 py-1 text-xs font-semibold ${
            status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-700 text-slate-300'
          }`}
        >
          {status}
        </span>
      </div>

      <p className="mb-4 min-h-12 text-sm text-slate-500">
        {description || 'No description added yet.'}
      </p>

      <div className="flex items-center justify-between text-sm">
        <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-300">
          Tickets: {ticketCount}
        </span>
        <Link
          href={`/projects/${id}`}
          className="rounded-md bg-sky-600 px-3 py-1.5 font-medium text-white transition hover:bg-sky-500"
        >
          Open
        </Link>
      </div>
    </article>
  );
}
