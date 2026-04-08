'use client';

import { useEffect, useState } from 'react';
import {
  ApiError,
  createComment,
  deleteComment,
  getCommentsByTicket,
  type Comment,
  updateComment,
} from '@/lib/api';

interface TicketCommentsProps {
  ticketId: string;
  onCommentCountChange: (nextCount: number) => void;
}

const commentDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

function formatCommentDateTime(value: string): string {
  return commentDateTimeFormatter.format(new Date(value));
}

export function TicketComments({
  ticketId,
  onCommentCountChange,
}: TicketCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingAuthor, setEditingAuthor] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    setEditingCommentId(null);

    getCommentsByTicket(ticketId)
      .then((nextComments) => {
        if (!active) {
          return;
        }

        setComments(nextComments);
        onCommentCountChange(nextComments.length);
      })
      .catch((caughtError) => {
        if (!active) {
          return;
        }

        setError(
          caughtError instanceof ApiError
            ? caughtError.message
            : 'Could not load comments right now.',
        );
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [ticketId]);

  async function handleCreateComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedAuthor = author.trim();
    const normalizedContent = content.trim();

    if (normalizedAuthor.length < 2) {
      setError('Author name must be at least 2 characters.');
      return;
    }

    if (normalizedContent.length < 1) {
      setError('Comment content cannot be empty.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const createdComment = await createComment(ticketId, {
        author: normalizedAuthor,
        content: normalizedContent,
      });

      setComments((current) => {
        const nextComments = [createdComment, ...current];
        onCommentCountChange(nextComments.length);
        return nextComments;
      });
      setAuthor('');
      setContent('');
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not create the comment right now.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveComment(commentId: string) {
    const normalizedAuthor = editingAuthor.trim();
    const normalizedContent = editingContent.trim();

    if (normalizedAuthor.length < 2) {
      setError('Author name must be at least 2 characters.');
      return;
    }

    if (normalizedContent.length < 1) {
      setError('Comment content cannot be empty.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const updated = await updateComment(commentId, {
        author: normalizedAuthor,
        content: normalizedContent,
      });

      setComments((current) =>
        current.map((comment) => (comment.id === commentId ? updated : comment)),
      );
      setEditingCommentId(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not update the comment right now.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    setError(null);

    try {
      await deleteComment(commentId);
      setComments((current) => {
        const nextComments = current.filter((comment) => comment.id !== commentId);
        onCommentCountChange(nextComments.length);
        return nextComments;
      });
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not delete the comment right now.',
      );
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h5 className="mt-1 text-lg font-semibold text-slate-100">Comments</h5>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
          {comments.length}
        </span>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-700" />
              <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-800" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-400">
          No comments yet. Add the first update below.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/30">
          {comments.map((comment, index) => {
            const isEditing = editingCommentId === comment.id;

            return (
              <article
                key={comment.id}
                className={`p-3 ${index !== comments.length - 1 ? 'border-b border-slate-800' : ''}`}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      value={editingAuthor}
                      onChange={(event) => setEditingAuthor(event.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/70"
                    />
                    <textarea
                      value={editingContent}
                      onChange={(event) => setEditingContent(event.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/70"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveComment(comment.id)}
                        disabled={isSubmitting}
                        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-500 disabled:cursor-wait disabled:opacity-70"
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCommentId(null)}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-100">{comment.author}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatCommentDateTime(comment.updatedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditingAuthor(comment.author);
                            setEditingContent(comment.content);
                            setError(null);
                          }}
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="rounded-md bg-rose-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-rose-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{comment.content}</p>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}

      <form
        onSubmit={handleCreateComment}
        className="rounded-xl border border-slate-800 bg-slate-900 p-4"
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Add Comment
        </p>
        <div className="mt-3 space-y-2">
          <input
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/70"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            placeholder="Share an update on this ticket"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/70"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? 'Posting...' : 'Add Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}
