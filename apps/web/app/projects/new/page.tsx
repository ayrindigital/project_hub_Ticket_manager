import Link from 'next/link';
import { ProjectForm } from '@/components/ProjectForm';

export default function NewProjectPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm">
        <h2 className="mt-2 text-3xl font-semibold text-slate-100">Create New Project</h2>
        <p className="mt-2 text-sm text-slate-500">
          Add a project from the UI and you will be redirected to its detail page after the API
          creates it.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <ProjectForm mode="create" />
      </div>

      <Link
        href="/"
        className="inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
      >
        Back to Dashboard
      </Link>
    </section>
  );
}
