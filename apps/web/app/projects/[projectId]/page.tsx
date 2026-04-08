import Link from 'next/link';
import { ProjectDetailActions } from '@/components/ProjectDetailActions';
import { TicketBoard } from '@/components/TicketBoard';
import { ApiError, getProjectById, getTicketsByProject } from '@/lib/api';

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ ticketId?: string }>;
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectPageProps) {
  const { projectId } = await params;
  const { ticketId } = await searchParams;

  try {
    const project = await getProjectById(projectId);
    const ticketsResult = await getTicketsByProject(projectId)
      .then((tickets) => ({ tickets, error: null }))
      .catch(() => ({ tickets: [], error: 'Could not load tickets right now.' }));

    return (
      <section className="space-y-4">
        <header className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Project Detail</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-100">{project.name}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {project.description || 'No description available.'}
              </p>
              <p className="mt-3 text-sm text-slate-300">Status: {project.status}</p>
            </div>
            <div className="md:w-[340px]">
              <ProjectDetailActions project={project} />
            </div>
          </div>
          <div className="mt-4">
            <Link
              href={`/chat?prompt=${encodeURIComponent(`Tell me about the project ${project.name}`)}`}
              className="inline-flex rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
            >
              Ask AI About This Project
            </Link>
          </div>
        </header>

        <div>
          {ticketsResult.error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <h3 className="text-lg font-semibold">Could not load tickets</h3>
              <p className="mt-2 text-sm">{ticketsResult.error}</p>
            </div>
          ) : (
            <TicketBoard
              projectId={project.id}
              initialTickets={ticketsResult.tickets}
              initialSelectedTicketId={ticketId}
            />
          )}
        </div>

        <Link href="/" className="inline-flex rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">
          Back to Dashboard
        </Link>
      </section>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status !== 404) {
      return (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h2 className="text-xl font-semibold">Could not load project</h2>
          <p className="mt-2 text-sm">The API did not return project data successfully.</p>
          <Link href="/" className="mt-3 inline-flex rounded-md border border-amber-400 px-3 py-1.5 text-sm hover:bg-amber-100">
            Back to Dashboard
          </Link>
        </section>
      );
    }

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
