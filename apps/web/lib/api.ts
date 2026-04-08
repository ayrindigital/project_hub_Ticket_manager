export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiResponse<T> {
  data: T;
  message: string | string[];
  statusCode: number;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | object | null;
};

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary extends Project {
  ticketCount: number;
}

export interface ProjectPayload {
  name: string;
  description?: string;
  status?: ProjectStatus;
}

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketSummary extends Ticket {
  commentCount: number;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  ticketId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketPayload {
  title?: string;
  description?: string;
  status?: Ticket['status'];
  priority?: Ticket['priority'];
}

export interface TicketQueryOptions {
  status?: Ticket['status'];
  priority?: Ticket['priority'];
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface CommentPayload {
  author?: string;
  content?: string;
}

export interface ChatSourceReference {
  sourceType: string;
  sourceId: string;
  snippet: string;
  metadata: Record<string, unknown> | null;
  distance: number;
}

export interface ChatReply {
  response: string;
  sources: ChatSourceReference[];
  sessionId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | string;
  content: string;
  sources: unknown;
  sessionId: string;
  createdAt: string;
}

const PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const INTERNAL_API_BASE_URL =
  process.env.API_INTERNAL_URL ?? 'http://localhost:3001';

export const API_BASE_URL =
  typeof window === 'undefined'
    ? INTERNAL_API_BASE_URL
    : PUBLIC_API_BASE_URL;

const API_TIMEOUT_MS = 20_000;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const headers = new Headers(options.headers);
  const body =
    options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body;

  if (body && !headers.has('Content-Type') && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: 'no-store',
      ...options,
      headers,
      body,
      signal: controller.signal,
    });

    const payload = (await response.json()) as ApiResponse<T>;

    if (!response.ok) {
      const message = Array.isArray(payload.message)
        ? payload.message.join(', ')
        : payload.message;
      throw new ApiError(message || `API request failed for ${path}`, response.status);
    }

    return payload.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(`API request timed out for ${path}`, 504);
    }

    throw new ApiError(`API request failed for ${path}`, 500);
  } finally {
    clearTimeout(timeout);
  }
}

export async function getProjects(status?: ProjectStatus): Promise<ProjectSummary[]> {
  const query = status ? `?status=${status}` : '';
  return request<ProjectSummary[]>(`/projects${query}`);
}

export async function getProjectById(projectId: string): Promise<Project> {
  return request<Project>(`/projects/${projectId}`);
}

export async function getTicketsByProject(projectId: string): Promise<TicketSummary[]> {
  return request<TicketSummary[]>(`/projects/${projectId}/tickets`);
}

function buildQueryString(
  params: Record<string, string | undefined>,
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export async function getTicketSummariesByProject(
  projectId: string,
  options: TicketQueryOptions = {},
): Promise<TicketSummary[]> {
  const query = buildQueryString({
    status: options.status,
    priority: options.priority,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
  });

  return request<TicketSummary[]>(`/projects/${projectId}/tickets${query}`);
}

export async function createTicket(
  projectId: string,
  payload: TicketPayload,
): Promise<Ticket> {
  return request<Ticket>(`/projects/${projectId}/tickets`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateTicket(
  ticketId: string,
  payload: TicketPayload,
): Promise<Ticket> {
  return request<Ticket>(`/tickets/${ticketId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteTicket(ticketId: string): Promise<Ticket> {
  return request<Ticket>(`/tickets/${ticketId}`, {
    method: 'DELETE',
  });
}

export async function getCommentsByTicket(ticketId: string): Promise<Comment[]> {
  return request<Comment[]>(`/tickets/${ticketId}/comments`);
}

export async function createComment(
  ticketId: string,
  payload: Required<CommentPayload>,
): Promise<Comment> {
  return request<Comment>(`/tickets/${ticketId}/comments`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateComment(
  commentId: string,
  payload: CommentPayload,
): Promise<Comment> {
  return request<Comment>(`/comments/${commentId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteComment(commentId: string): Promise<Comment> {
  return request<Comment>(`/comments/${commentId}`, {
    method: 'DELETE',
  });
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  return request<Project>('/projects', {
    method: 'POST',
    body: payload,
  });
}

export async function updateProject(
  projectId: string,
  payload: ProjectPayload,
): Promise<Project> {
  return request<Project>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function archiveProject(projectId: string): Promise<Project> {
  return request<Project>(`/projects/${projectId}`, {
    method: 'DELETE',
  });
}

export async function sendChatMessage(
  message: string,
  sessionId: string,
): Promise<ChatReply> {
  return request<ChatReply>('/chat', {
    method: 'POST',
    body: { message, sessionId },
  });
}

export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  return request<ChatMessage[]>(`/chat/history/${sessionId}`);
}

export async function clearChatHistory(
  sessionId: string,
): Promise<{ deleted: number }> {
  return request<{ deleted: number }>(`/chat/history/${sessionId}`, {
    method: 'DELETE',
  });
}
