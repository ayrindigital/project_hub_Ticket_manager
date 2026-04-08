'use client';

import { startTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, archiveProject, type Project } from '@/lib/api';
import { ProjectForm } from '@/components/ProjectForm';

interface ProjectDetailActionsProps {
  project: Project;
}

export function ProjectDetailActions({ project }: ProjectDetailActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleArchive() {
    setError(null);
    setIsArchiving(true);

    try {
      await archiveProject(project.id);
      startTransition(() => {
        router.refresh();
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not archive the project right now.',
      );
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsEditing((value) => !value);
          }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
        >
          {isEditing ? 'Close Editor' : 'Edit Project'}
        </button>

        <button
          type="button"
          onClick={handleArchive}
          disabled={isArchiving || project.status === 'ARCHIVED'}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-200"
        >
          {project.status === 'ARCHIVED'
            ? 'Already Archived'
            : isArchiving
              ? 'Archiving...'
              : 'Archive Project'}
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {isEditing ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Edit Project
          </p>
          <ProjectForm
            mode="edit"
            projectId={project.id}
            initialProject={project}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => {
              setIsEditing(false);
              setError(null);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
