import Link from 'next/link';
import { getProjectById, getTicketsByProject } from '@/lib/api';

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  try {
    const [project, tickets] = await Promise.all([
      getProjectById(projectId),
      getTicketsByProject(projectId),
    ]);

    return (
      <section className="space-y-4">
        <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Project Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{project.name}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {project.description || 'No description available.'}
          </p>
          <p className="mt-3 text-sm text-slate-700">Status: {project.status}</p>
        </header>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Tickets (basic preview)</h3>
          {tickets.length === 0 ? (
            <p className="text-sm text-slate-600">No tickets yet for this project.</p>
          ) : (
            <ul className="space-y-2">
              {tickets.map((ticket) => (
                <li key={ticket.id} className="rounded-md border border-slate-200 p-3">
                  <p className="font-medium text-slate-900">{ticket.title}</p>
                  <p className="text-sm text-slate-600">
                    {ticket.status} | {ticket.priority}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link href="/" className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
          Back to Dashboard
        </Link>
      </section>
    );
  } catch {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <p className="mt-2 text-sm">Please check the project URL or create a project from the dashboard.</p>
        <Link href="/" className="mt-3 inline-flex rounded-md border border-amber-400 px-3 py-1.5 text-sm hover:bg-amber-100">
          Back to Dashboard
        </Link>
      </section>
    );
  }
}
