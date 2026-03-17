import { ProjectCard } from '@/components/ProjectCard';
import { getProjectTicketCount, getProjects } from '@/lib/api';

export default async function DashboardPage() {
  try {
    const projects = await getProjects();
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => ({
        ...project,
        ticketCount: await getProjectTicketCount(project.id),
      })),
    );

    return (
      <section>
        <header className="mb-6 rounded-xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Day 6 Frontend</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Projects Dashboard</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            This page fetches projects from NestJS API and shows a basic card view for learning Next.js server components.
          </p>
          <button
            type="button"
            className="mt-4 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
          >
            New Project (Day 7)
          </button>
        </header>

        {projectsWithCounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
            No projects found. Create one from API/Postman and refresh this page.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projectsWithCounts.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                description={project.description}
                status={project.status}
                ticketCount={project.ticketCount}
              />
            ))}
          </div>
        )}
      </section>
    );
  } catch {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-xl font-semibold">Could not fetch projects</h2>
        <p className="mt-2 text-sm">
          Make sure API is running at http://localhost:3001 and CORS is enabled.
        </p>
      </section>
    );
  }
}
