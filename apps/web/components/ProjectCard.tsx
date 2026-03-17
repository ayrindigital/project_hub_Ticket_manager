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
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{name}</h2>
        <span
          className={`rounded-md px-2 py-1 text-xs font-semibold ${
            status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {status}
        </span>
      </div>

      <p className="mb-4 min-h-12 text-sm text-slate-600">
        {description || 'No description added yet.'}
      </p>

      <div className="flex items-center justify-between text-sm">
        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">
          Tickets: {ticketCount}
        </span>
        <Link
          href={`/projects/${id}`}
          className="rounded-md bg-slate-900 px-3 py-1.5 font-medium text-white transition hover:bg-slate-700"
        >
          Open
        </Link>
      </div>
    </article>
  );
}
