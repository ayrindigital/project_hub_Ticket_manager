export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API request failed for ${path} with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getProjects(status?: ProjectStatus): Promise<Project[]> {
  const query = status ? `?status=${status}` : '';
  return request<Project[]>(`/projects${query}`);
}

export async function getProjectById(projectId: string): Promise<Project> {
  return request<Project>(`/projects/${projectId}`);
}

export async function getTicketsByProject(projectId: string): Promise<Ticket[]> {
  return request<Ticket[]>(`/projects/${projectId}/tickets`);
}

export async function getProjectTicketCount(projectId: string): Promise<number> {
  try {
    const tickets = await getTicketsByProject(projectId);
    return tickets.length;
  } catch {
    return 0;
  }
}
