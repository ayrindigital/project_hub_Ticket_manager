'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  API_BASE_URL,
  ApiError,
  clearChatHistory,
  getChatHistory,
  sendChatMessage,
  type ChatSourceReference,
} from '@/lib/api';

const SESSION_STORAGE_KEY = 'projecthub.chat.sessionId';

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: ChatSourceReference[];
}

const suggestedQuestions = [
  'What are the open high-priority tickets?',
  'Summarize recent activity across all projects.',
  'Which project has the most open tickets?',
];

function createSessionId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `session-${Date.now()}`;
}

function parseSources(value: unknown): ChatSourceReference[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const source = item as Record<string, unknown>;
    if (
      typeof source.sourceType !== 'string' ||
      typeof source.sourceId !== 'string' ||
      typeof source.snippet !== 'string' ||
      typeof source.distance !== 'number'
    ) {
      return [];
    }

    return [
      {
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        snippet: source.snippet,
        distance: source.distance,
        metadata:
          source.metadata && typeof source.metadata === 'object'
            ? (source.metadata as Record<string, unknown>)
            : null,
      },
    ];
  });
}

function sourceLabel(source: ChatSourceReference): string {
  const projectName =
    source.metadata && typeof source.metadata.projectName === 'string'
      ? source.metadata.projectName
      : null;
  const ticketTitle =
    source.metadata && typeof source.metadata.ticketTitle === 'string'
      ? source.metadata.ticketTitle
      : null;

  if (source.sourceType === 'ticket') {
    const title =
      ticketTitle ??
      source.snippet.split(':')[0]?.split('(')[0]?.trim() ??
      source.sourceId;
    return projectName ? `${title} - ${projectName}` : title;
  }

  if (projectName) {
    return `Project: ${projectName}`;
  }

  return `${source.sourceType} ${source.sourceId}`;
}

function normalizeAssistantContent(content: string): string {
  let cleaned = content;

  cleaned = cleaned.replace(/(?:^|\n)Tool observations:[\s\S]*?(?=\nSources:|$)/i, '');
  cleaned = cleaned.replace(/(?:^|\n)Sources:[\s\S]*$/i, '');
  cleaned = cleaned.replace(/^Answer for:\s*/i, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

function sourceHref(source: ChatSourceReference): string | null {
  const projectId =
    source.metadata && typeof source.metadata.projectId === 'string'
      ? source.metadata.projectId
      : null;
  const ticketId =
    source.metadata && typeof source.metadata.ticketId === 'string'
      ? source.metadata.ticketId
      : null;

  if (projectId && ticketId) {
    return `/projects/${projectId}?ticketId=${ticketId}`;
  }
  if (projectId) {
    return `/projects/${projectId}`;
  }

  return null;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const prefillPrompt = searchParams.get('prompt')?.trim() ?? '';
  const endRef = useRef<HTMLDivElement | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    const nextSessionId = storedSessionId || createSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
    setSessionId(nextSessionId);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let isActive = true;
    setIsLoadingHistory(true);
    setError(null);

    getChatHistory(sessionId)
      .then((history) => {
        if (!isActive) {
          return;
        }
        setMessages(
          history
            .filter((message) => message.role === 'user' || message.role === 'assistant')
            .map((message) => ({
              id: message.id,
              role: message.role as 'user' | 'assistant',
              content: message.content,
              sources: parseSources(message.sources),
            })),
        );
      })
      .catch((caughtError) => {
        if (!isActive) {
          return;
        }
        setError(
          caughtError instanceof ApiError
            ? caughtError.message
            : 'Could not load chat history.',
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingHistory(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [sessionId]);

  useEffect(() => {
    if (prefillPrompt && !input) {
      setInput(prefillPrompt);
    }
  }, [prefillPrompt, input]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const canSend = useMemo(
    () => Boolean(sessionId && input.trim() && !isStreaming),
    [sessionId, input, isStreaming],
  );

  async function streamChat(
    message: string,
    activeSessionId: string,
    assistantMessageId: string,
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sessionId: activeSessionId,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error('Streaming endpoint is unavailable.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const applyToken = (token: string) => {
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessageId
            ? {
                ...item,
                content: `${item.content}${token}`,
              }
            : item,
        ),
      );
    };

    const applyDone = (sources: ChatSourceReference[]) => {
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessageId
            ? {
                ...item,
                sources,
              }
            : item,
        ),
      );
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      let separatorIndex = buffer.indexOf('\n\n');

      while (separatorIndex !== -1) {
        const eventPayload = buffer.slice(0, separatorIndex).trim();
        buffer = buffer.slice(separatorIndex + 2);

        const dataLine = eventPayload
          .split('\n')
          .find((line) => line.startsWith('data:'));

        if (dataLine) {
          const jsonPayload = dataLine.slice(5).trim();
          if (jsonPayload) {
            const parsed = JSON.parse(jsonPayload) as {
              token?: string;
              done?: boolean;
              error?: string;
              sources?: unknown;
            };

            if (parsed.token) {
              applyToken(parsed.token);
            }

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.done) {
              applyDone(parseSources(parsed.sources));
            }
          }
        }

        separatorIndex = buffer.indexOf('\n\n');
      }
    }
  }

  async function submitMessage(): Promise<void> {
    const message = input.trim();
    if (!message || !sessionId || isStreaming) {
      return;
    }

    setError(null);
    setInput('');
    setIsStreaming(true);

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    setMessages((current) => [
      ...current,
      {
        id: userMessageId,
        role: 'user',
        content: message,
        sources: [],
      },
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        sources: [],
      },
    ]);

    try {
      await streamChat(message, sessionId, assistantMessageId);
    } catch {
      try {
        const fallback = await sendChatMessage(message, sessionId);
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessageId
              ? {
                  ...item,
                  content: fallback.response,
                  sources: fallback.sources,
                }
              : item,
          ),
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof ApiError
            ? caughtError.message
            : 'Could not get a chat response.',
        );
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessageId
              ? { ...item, content: 'Failed to generate a response.' }
              : item,
          ),
        );
      }
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMessage();
  }

  async function handleNewConversation() {
    const nextSessionId = createSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
    setSessionId(nextSessionId);
    setMessages([]);
    setInput('');
    setError(null);
    setIsLoadingHistory(false);
  }

  async function handleClearCurrentConversation() {
    if (!sessionId || isStreaming) {
      return;
    }

    setError(null);
    try {
      await clearChatHistory(sessionId);
      setMessages([]);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not clear this conversation.',
      );
    }
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        void submitMessage();
      }
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-7rem)] flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">AI Project Assistant</h2>
          <p className="mt-1 text-sm text-slate-500">Session: {sessionId || 'initializing...'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleNewConversation()}
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
          >
            New Chat
          </button>
          <button
            type="button"
            disabled={!sessionId || isStreaming}
            onClick={() => void handleClearCurrentConversation()}
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear
          </button>
        </div>
      </header>

      <div className="mx-auto mt-6 flex w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {isLoadingHistory ? (
            <p className="text-sm text-slate-500">Loading chat history...</p>
          ) : messages.length === 0 ? (
            <div className="mx-auto max-w-3xl space-y-5 py-10 text-center">
              <h3 className="text-2xl font-semibold text-slate-100">How can I help today?</h3>
              <p className="text-sm text-slate-500">
                Ask about projects, ticket status, blockers, and recent comment activity.
              </p>
              <div className="grid gap-2 text-left md:grid-cols-3">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => setInput(question)}
                    className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-4xl space-y-5">
              {messages.map((message) => {
                const isUser = message.role === 'user';
                const displayText =
                  message.role === 'assistant'
                    ? normalizeAssistantContent(message.content) || (isStreaming ? 'Thinking...' : '')
                    : message.content || (isStreaming ? 'Thinking...' : '');

                return (
                  <article
                    key={message.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 md:max-w-[80%] ${
                        isUser
                          ? 'border border-sky-500/40 bg-sky-500/15 text-sky-50'
                          : 'border border-slate-800 bg-slate-900 text-slate-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-7">{displayText}</p>
                      {message.role === 'assistant' && message.sources.length > 0 ? (
                        <div className="mt-3 border-t border-slate-800 pt-3">
                          <div className="flex flex-wrap gap-2">
                            {message.sources.map((source, index) => {
                              const href = sourceHref(source);
                              const label = sourceLabel(source);
                              const key = `${source.sourceType}-${source.sourceId}-${index}`;
                              const isTicket = source.sourceType === 'ticket';
                              const chipClass = isTicket
                                ? 'rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-100 transition hover:border-sky-400 hover:bg-sky-500/20'
                                : 'rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-600 hover:text-slate-100';

                              return href ? (
                                <Link key={key} href={href} className={chipClass}>
                                  {label}
                                </Link>
                              ) : (
                                <span key={key} className={chipClass}>
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-800 bg-slate-900/70 p-3 md:p-4">
          {error ? (
            <p className="mb-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-4xl">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2">
              <textarea
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Message AI Project Assistant..."
                className="max-h-40 min-h-10 w-full resize-y bg-transparent px-1 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-sky-900"
              >
                {isStreaming ? '...' : 'Send'}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Enter to send, Shift+Enter for newline.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
