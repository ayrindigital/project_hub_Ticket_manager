'use client';

import { startTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ApiError,
  createProject,
  type Project,
  type ProjectPayload,
  updateProject,
} from '@/lib/api';

interface ProjectFormProps {
  mode: 'create' | 'edit';
  projectId?: string;
  initialProject?: Pick<Project, 'name' | 'description' | 'status'>;
  onCancel?: () => void;
  onSuccess?: (project: Project) => void;
}

export function ProjectForm({
  mode,
  projectId,
  initialProject,
  onCancel,
  onSuccess,
}: ProjectFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialProject?.name ?? '');
  const [description, setDescription] = useState(initialProject?.description ?? '');
  const [status, setStatus] = useState<ProjectPayload['status']>(
    initialProject?.status ?? 'ACTIVE',
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = name.trim();
    const normalizedDescription = description.trim();

    if (normalizedName.length < 3) {
      setError('Project name must be at least 3 characters.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const payload: ProjectPayload = {
        name: normalizedName,
        description: normalizedDescription || undefined,
        status,
      };

      const project =
        mode === 'create'
          ? await createProject(payload)
          : await updateProject(projectId!, payload);

      onSuccess?.(project);

      startTransition(() => {
        router.push(`/projects/${project.id}`);
        router.refresh();
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not save the project right now.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-300">Project Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Project Alpha"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-500"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-300">Description</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          placeholder="Short summary of the project goals"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-500"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-300">Status</span>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as ProjectPayload['status'])}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-500"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
      </label>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-wait disabled:bg-sky-900"
        >
          {isSubmitting
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create Project'
              : 'Save Changes'}
        </button>

        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
