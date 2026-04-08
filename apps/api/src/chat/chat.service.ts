import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ChatMessage,
  Prisma,
  Priority,
  ProjectStatus,
  TicketStatus,
} from '@prisma/client';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  EmbeddingsService,
  type EmbeddingSearchResult,
} from '../embeddings/embeddings.service';
import { PrismaService } from '../prisma/prisma.service';

interface ChatSourceReference {
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

type AgentToolName =
  | 'search_projects'
  | 'get_project_details'
  | 'get_ticket_details'
  | 'list_tickets'
  | 'get_project_stats'
  | 'final';

interface AgentDecision {
  action: AgentToolName;
  input: Record<string, unknown>;
}

interface AgentStep {
  tool: Exclude<AgentToolName, 'final'>;
  input: Record<string, unknown>;
  output: string;
}

interface AgentToolResult {
  output: string;
  sources: ChatSourceReference[];
}

interface ChatContext {
  history: ChatMessage[];
  standaloneQuestion: string;
}

interface AgentRunResult {
  answer: string;
  sources: ChatSourceReference[];
}

type ResolvedTicket = {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: Priority;
  projectId: string;
  project: {
    id: string;
    name: string;
  };
  comments: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: Date;
  }>;
};

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async chat(message: string, sessionId: string): Promise<ChatReply> {
    const context = await this.prepareChatContext(message, sessionId);
    const result = await this.runAgent(context, undefined);

    await this.persistConversation(
      message,
      sessionId,
      result.answer,
      result.sources,
    );

    return this.toChatReply(result.answer, result.sources, sessionId);
  }

  async streamChat(
    message: string,
    sessionId: string,
    onToken: (token: string) => void | Promise<void>,
  ): Promise<ChatReply> {
    const context = await this.prepareChatContext(message, sessionId);
    const result = await this.runAgent(context, onToken);

    await this.persistConversation(
      message,
      sessionId,
      result.answer,
      result.sources,
    );

    return this.toChatReply(result.answer, result.sources, sessionId);
  }

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async clearHistory(sessionId: string): Promise<{ deleted: number }> {
    const result = await this.prisma.chatMessage.deleteMany({
      where: { sessionId },
    });

    return { deleted: result.count };
  }

  private async prepareChatContext(
    message: string,
    sessionId: string,
  ): Promise<ChatContext> {
    const history = await this.getRecentHistory(sessionId);
    const standaloneQuestion = await this.rewriteQuestion(message, history);

    return {
      history,
      standaloneQuestion,
    };
  }

  private async runAgent(
    context: ChatContext,
    onToken?: (token: string) => void | Promise<void>,
  ): Promise<AgentRunResult> {
    const steps: AgentStep[] = [];
    const sourceMap = new Map<string, ChatSourceReference>();
    const maxIterations = 4;

    for (let iteration = 0; iteration < maxIterations; iteration += 1) {
      const decision = await this.decideNextAction(
        context.standaloneQuestion,
        context.history,
        steps,
      );

      if (decision.action === 'final') {
        break;
      }

      const toolResult = await this.runTool(decision.action, decision.input);
      steps.push({
        tool: decision.action,
        input: decision.input,
        output: toolResult.output,
      });
      this.mergeSources(sourceMap, toolResult.sources);
    }

    if (steps.length === 0) {
      const fallback = await this.runSearchProjectsTool({
        query: context.standaloneQuestion,
        limit: 5,
      });
      steps.push({
        tool: 'search_projects',
        input: { query: context.standaloneQuestion, limit: 5 },
        output: fallback.output,
      });
      this.mergeSources(sourceMap, fallback.sources);
    }

    const sources = Array.from(sourceMap.values());
    const answer = await this.composeFinalAnswer(
      context.standaloneQuestion,
      context.history,
      steps,
      sources,
      onToken,
    );

    return { answer, sources };
  }

  private async decideNextAction(
    question: string,
    history: ChatMessage[],
    steps: AgentStep[],
  ): Promise<AgentDecision> {
    if (this.isOfflineMode()) {
      return this.heuristicDecision(question, steps);
    }

    const plannerModel = this.createChatModel();
    const historyText = history.length
      ? history
          .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
          .join('\n')
      : 'No prior chat history.';
    const stepsText = steps.length
      ? steps
          .map(
            (step, index) =>
              `${index + 1}. TOOL=${step.tool}\nINPUT=${JSON.stringify(step.input)}\nOUTPUT=${step.output.slice(0, 1000)}`,
          )
          .join('\n\n')
      : 'No tool calls yet.';

    try {
      const plannerResponse = await plannerModel.invoke([
        new SystemMessage(
          [
            'You are an orchestration agent for a project management assistant.',
            'Choose exactly one next action.',
            'Available actions:',
            '- search_projects: semantic + keyword retrieval across projects/tickets/comments.',
            '- get_project_details: fetch a single project with summary details.',
            '- get_ticket_details: fetch one ticket with recent comments.',
            '- list_tickets: list tickets using filters.',
            '- get_project_stats: aggregate ticket counts by status/priority.',
            '- final: finish planning and let the writer answer.',
            'Return valid JSON only, with this shape:',
            '{"action":"<tool_or_final>","input":{...}}',
            'Rules:',
            '- Use final when enough context exists.',
            '- Keep input compact and explicit.',
            '- Never return markdown.',
          ].join(' '),
        ),
        new HumanMessage(
          [
            `Question:\n${question}`,
            `Chat History:\n${historyText}`,
            `Previous Tool Steps:\n${stepsText}`,
          ].join('\n\n'),
        ),
      ]);

      return this.parseAgentDecision(this.extractText(plannerResponse.content));
    } catch {
      return this.heuristicDecision(question, steps);
    }
  }

  private parseAgentDecision(raw: string): AgentDecision {
    const cleaned = raw
      .replace(/^```json/i, '')
      .replace(/^```/i, '')
      .replace(/```$/i, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned) as {
        action?: unknown;
        input?: unknown;
      };
      const action = this.normalizeAction(parsed.action);

      if (!action || action === 'final') {
        return { action: 'final', input: {} };
      }

      return {
        action,
        input: this.asRecord(parsed.input),
      };
    } catch {
      return { action: 'final', input: {} };
    }
  }

  private normalizeAction(value: unknown): AgentToolName | null {
    if (typeof value !== 'string') {
      return null;
    }

    if (
      value === 'search_projects' ||
      value === 'get_project_details' ||
      value === 'get_ticket_details' ||
      value === 'list_tickets' ||
      value === 'get_project_stats' ||
      value === 'final'
    ) {
      return value;
    }

    return null;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private async runTool(
    tool: Exclude<AgentToolName, 'final'>,
    input: Record<string, unknown>,
  ): Promise<AgentToolResult> {
    if (tool === 'search_projects') {
      return this.runSearchProjectsTool(input);
    }
    if (tool === 'get_project_details') {
      return this.runGetProjectDetailsTool(input);
    }
    if (tool === 'get_ticket_details') {
      return this.runGetTicketDetailsTool(input);
    }
    if (tool === 'list_tickets') {
      return this.runListTicketsTool(input);
    }

    return this.runGetProjectStatsTool(input);
  }

  private async runSearchProjectsTool(
    input: Record<string, unknown>,
  ): Promise<AgentToolResult> {
    const query = this.readString(input.query) ?? '';
    const limit = this.readNumber(input.limit, 5, 1, 10);
    const projectRef = this.readString(input.project);
    const project = await this.resolveProject(projectRef);
    const scopedProjectId = project?.id ?? undefined;

    let semantic: EmbeddingSearchResult[] = [];
    if (query && !this.isOfflineMode()) {
      try {
        semantic = await this.embeddingsService.search(
          query,
          Math.min(limit * 2, 20),
        );
      } catch {
        semantic = [];
      }
    }
    const semanticSources = semantic
      .filter((item) =>
        scopedProjectId
          ? this.readString(item.metadata?.projectId) === scopedProjectId
          : true,
      )
      .slice(0, limit)
      .map((item) => this.embeddingToSource(item));

    const keywordSources = await this.runKeywordSearch(query, scopedProjectId, limit);
    const merged = this.uniqueSources([...semanticSources, ...keywordSources], limit);

    return {
      output: JSON.stringify(
        {
          query,
          projectScope: project?.name ?? null,
          results: merged.map((source) => ({
            sourceType: source.sourceType,
            sourceId: source.sourceId,
            snippet: source.snippet,
            metadata: source.metadata,
          })),
        },
        null,
        2,
      ),
      sources: merged,
    };
  }

  private async runGetProjectDetailsTool(
    input: Record<string, unknown>,
  ): Promise<AgentToolResult> {
    const projectRef =
      this.readString(input.project) ??
      this.readString(input.projectId) ??
      this.readString(input.projectName);
    const project = await this.resolveProject(projectRef);

    if (!project) {
      return {
        output: 'Project not found.',
        sources: [],
      };
    }

    const ticketCounts = project.tickets.reduce<Record<string, number>>(
      (accumulator, ticket) => {
        accumulator[ticket.status] = (accumulator[ticket.status] ?? 0) + 1;
        return accumulator;
      },
      {},
    );

    const source: ChatSourceReference = {
      sourceType: 'project',
      sourceId: project.id,
      snippet: `Project ${project.name} (${project.status}) with ${project.tickets.length} tickets.`,
      metadata: {
        projectId: project.id,
        projectName: project.name,
        status: project.status,
      },
      distance: 0,
    };

    return {
      output: JSON.stringify(
        {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          ticketCount: project.tickets.length,
          ticketCountsByStatus: ticketCounts,
        },
        null,
        2,
      ),
      sources: [source],
    };
  }

  private async runGetTicketDetailsTool(
    input: Record<string, unknown>,
  ): Promise<AgentToolResult> {
    const ticketRef =
      this.readString(input.ticket) ??
      this.readString(input.ticketId) ??
      this.readString(input.ticketTitle);
    const projectRef = this.readString(input.project);

    const project = await this.resolveProject(projectRef);
    const ticket = await this.resolveTicket(ticketRef, project?.id);

    if (!ticket) {
      return {
        output: 'Ticket not found.',
        sources: [],
      };
    }

    const ticketSource: ChatSourceReference = {
      sourceType: 'ticket',
      sourceId: ticket.id,
      snippet: `${ticket.title} (${ticket.status}, ${ticket.priority})`,
      metadata: {
        projectId: ticket.projectId,
        projectName: ticket.project.name,
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
      },
      distance: 0,
    };

    const commentSources: ChatSourceReference[] = ticket.comments
      .slice(0, 3)
      .map((comment) => ({
        sourceType: 'comment',
        sourceId: comment.id,
        snippet: `${comment.author}: ${comment.content.slice(0, 220)}`,
        metadata: {
          projectId: ticket.projectId,
          projectName: ticket.project.name,
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          commentId: comment.id,
          author: comment.author,
          createdAt: comment.createdAt.toISOString(),
        },
        distance: 0,
      }));

    return {
      output: JSON.stringify(
        {
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          project: {
            id: ticket.project.id,
            name: ticket.project.name,
          },
          recentComments: ticket.comments.slice(0, 5).map((comment) => ({
            id: comment.id,
            author: comment.author,
            content: comment.content,
            createdAt: comment.createdAt.toISOString(),
          })),
        },
        null,
        2,
      ),
      sources: [ticketSource, ...commentSources],
    };
  }

  private async runListTicketsTool(
    input: Record<string, unknown>,
  ): Promise<AgentToolResult> {
    const projectRef = this.readString(input.project);
    const status = this.readTicketStatus(input.status);
    const priority = this.readPriority(input.priority);
    const limit = this.readNumber(input.limit, 10, 1, 30);
    const project = await this.resolveProject(projectRef);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        projectId: project?.id,
        status: status ?? undefined,
        priority: priority ?? undefined,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: limit,
    });

    const sources: ChatSourceReference[] = tickets.map((ticket) => ({
      sourceType: 'ticket',
      sourceId: ticket.id,
      snippet: `${ticket.title} (${ticket.status}, ${ticket.priority})`,
      metadata: {
        projectId: ticket.projectId,
        projectName: ticket.project.name,
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
      },
      distance: 0,
    }));

    return {
      output: JSON.stringify(
        {
          filters: {
            project: project?.name ?? null,
            status: status ?? null,
            priority: priority ?? null,
          },
          tickets: tickets.map((ticket) => ({
            id: ticket.id,
            title: ticket.title,
            status: ticket.status,
            priority: ticket.priority,
            project: ticket.project.name,
            updatedAt: ticket.updatedAt.toISOString(),
            commentCount: ticket._count.comments,
          })),
        },
        null,
        2,
      ),
      sources,
    };
  }

  private async runGetProjectStatsTool(
    input: Record<string, unknown>,
  ): Promise<AgentToolResult> {
    const projectRef =
      this.readString(input.project) ??
      this.readString(input.projectId) ??
      this.readString(input.projectName);
    const project = await this.resolveProject(projectRef);

    if (!project) {
      return {
        output: 'Project not found.',
        sources: [],
      };
    }

    const statusCounts = project.tickets.reduce<Record<string, number>>(
      (accumulator, ticket) => {
        accumulator[ticket.status] = (accumulator[ticket.status] ?? 0) + 1;
        return accumulator;
      },
      {},
    );
    const priorityCounts = project.tickets.reduce<Record<string, number>>(
      (accumulator, ticket) => {
        accumulator[ticket.priority] = (accumulator[ticket.priority] ?? 0) + 1;
        return accumulator;
      },
      {},
    );

    const source: ChatSourceReference = {
      sourceType: 'project',
      sourceId: project.id,
      snippet: `Stats for ${project.name}: ${project.tickets.length} tickets.`,
      metadata: {
        projectId: project.id,
        projectName: project.name,
      },
      distance: 0,
    };

    return {
      output: JSON.stringify(
        {
          project: {
            id: project.id,
            name: project.name,
            status: project.status,
          },
          totals: {
            tickets: project.tickets.length,
          },
          byStatus: statusCounts,
          byPriority: priorityCounts,
        },
        null,
        2,
      ),
      sources: [source],
    };
  }

  private async composeFinalAnswer(
    question: string,
    history: ChatMessage[],
    steps: AgentStep[],
    sources: ChatSourceReference[],
    onToken?: (token: string) => void | Promise<void>,
  ): Promise<string> {
    if (this.isOfflineMode()) {
      const offlineAnswer = this.composeFallbackAnswer(question, steps, sources);
      if (onToken) {
        for (const token of offlineAnswer.split(/(\s+)/).filter(Boolean)) {
          await onToken(token);
        }
      }
      return offlineAnswer;
    }

    const historyText = history.length
      ? history
          .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
          .join('\n')
      : 'No prior chat history.';
    const toolContext = steps
      .map(
        (step, index) =>
          `Step ${index + 1}\nTool: ${step.tool}\nInput: ${JSON.stringify(step.input)}\nOutput:\n${step.output}`,
      )
      .join('\n\n');
    const sourceContext = sources.length
      ? sources
          .map(
            (source, index) =>
              `[S${index + 1}] ${source.sourceType} ${source.sourceId}\nSnippet: ${source.snippet}\nMetadata: ${JSON.stringify(source.metadata ?? {})}`,
          )
          .join('\n\n')
      : 'No sources found.';

    const messages = [
      new SystemMessage(
        [
          'You are a helpful project management assistant.',
          'Answer using the provided tool outputs and sources only.',
          'Cite supporting sources inline with labels like [S1], [S2].',
          'If data is missing, say: "I don\'t have information about that in the project data."',
        ].join(' '),
      ),
      new HumanMessage(
        [
          `Question:\n${question}`,
          `Chat History:\n${historyText}`,
          `Agent Tool Outputs:\n${toolContext}`,
          `Sources:\n${sourceContext}`,
        ].join('\n\n'),
      ),
    ];

    const model = this.createChatModel();

    try {
      if (!onToken) {
        const response = await model.invoke(messages);
        const text = this.extractText(response.content).trim();
        if (!text) {
          throw new InternalServerErrorException(
            'Chat model returned an empty response.',
          );
        }

        return text;
      }

      const stream = await model.stream(messages);
      let answer = '';

      for await (const chunk of stream) {
        const text = this.extractText(chunk.content);
        if (!text) {
          continue;
        }

        answer += text;
        await onToken(text);
      }

      const trimmed = answer.trim();
      if (!trimmed) {
        throw new InternalServerErrorException(
          'Chat model returned an empty streamed response.',
        );
      }

      return trimmed;
    } catch {
      const fallback = this.composeFallbackAnswer(question, steps, sources);
      if (onToken) {
        for (const token of fallback.split(/(\s+)/).filter(Boolean)) {
          await onToken(token);
        }
      }
      return fallback;
    }
  }

  private async runKeywordSearch(
    query: string,
    projectId: string | undefined,
    limit: number,
  ): Promise<ChatSourceReference[]> {
    if (!query.trim()) {
      return [];
    }

    const safeLimit = Math.max(1, Math.min(limit, 10));
    const terms = this.extractSearchTerms(query);
    const ticketOr = [
      { title: { contains: query, mode: 'insensitive' as const } },
      { description: { contains: query, mode: 'insensitive' as const } },
      ...terms.map((term) => ({
        title: { contains: term, mode: 'insensitive' as const },
      })),
      ...terms.map((term) => ({
        description: { contains: term, mode: 'insensitive' as const },
      })),
    ];
    const ticketMatches = await this.prisma.ticket.findMany({
      where: {
        projectId,
        OR: ticketOr,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: safeLimit,
    });

    const commentOr = [
      { content: { contains: query, mode: 'insensitive' as const } },
      { author: { contains: query, mode: 'insensitive' as const } },
      ...terms.map((term) => ({
        content: { contains: term, mode: 'insensitive' as const },
      })),
      ...terms.map((term) => ({
        author: { contains: term, mode: 'insensitive' as const },
      })),
    ];
    const commentMatches = await this.prisma.comment.findMany({
      where: {
        ticket: {
          projectId,
        },
        OR: commentOr,
      },
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            projectId: true,
            project: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: safeLimit,
    });

    const projectOr = [
      { name: { contains: query, mode: 'insensitive' as const } },
      { description: { contains: query, mode: 'insensitive' as const } },
      ...terms.map((term) => ({
        name: { contains: term, mode: 'insensitive' as const },
      })),
      ...terms.map((term) => ({
        description: { contains: term, mode: 'insensitive' as const },
      })),
    ];
    const projectMatches = await this.prisma.project.findMany({
      where: {
        id: projectId,
        OR: projectOr,
      },
      orderBy: { updatedAt: 'desc' },
      take: safeLimit,
    });

    const ticketSources: ChatSourceReference[] = ticketMatches.map((ticket) => ({
      sourceType: 'ticket',
      sourceId: ticket.id,
      snippet: `${ticket.title}: ${(ticket.description ?? 'No description').slice(0, 220)}`,
      metadata: {
        projectId: ticket.projectId,
        projectName: ticket.project.name,
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
      },
      distance: 0,
    }));

    const commentSources: ChatSourceReference[] = commentMatches.map((comment) => ({
      sourceType: 'comment',
      sourceId: comment.id,
      snippet: `${comment.author}: ${comment.content.slice(0, 220)}`,
      metadata: {
        projectId: comment.ticket.projectId,
        projectName: comment.ticket.project.name,
        ticketId: comment.ticket.id,
        ticketTitle: comment.ticket.title,
        commentId: comment.id,
      },
      distance: 0,
    }));

    const projectSources: ChatSourceReference[] = projectMatches.map((project) => ({
      sourceType: 'project',
      sourceId: project.id,
      snippet: `${project.name}: ${(project.description ?? 'No description').slice(0, 220)}`,
      metadata: {
        projectId: project.id,
        projectName: project.name,
        status: project.status,
      },
      distance: 0,
    }));

    return this.uniqueSources(
      [...ticketSources, ...commentSources, ...projectSources],
      safeLimit,
    );
  }

  private extractSearchTerms(query: string): string[] {
    const unique = new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 4),
    );

    return Array.from(unique).slice(0, 8);
  }

  private embeddingToSource(
    embedding: EmbeddingSearchResult,
  ): ChatSourceReference {
    return {
      sourceType: embedding.sourceType,
      sourceId: embedding.sourceId,
      snippet: embedding.content.slice(0, 280),
      metadata: embedding.metadata,
      distance: embedding.distance,
    };
  }

  private uniqueSources(
    sources: ChatSourceReference[],
    limit: number,
  ): ChatSourceReference[] {
    const byKey = new Map<string, ChatSourceReference>();

    for (const source of sources) {
      const key = `${source.sourceType}:${source.sourceId}`;
      const existing = byKey.get(key);
      if (!existing || source.distance < existing.distance) {
        byKey.set(key, source);
      }
    }

    return Array.from(byKey.values()).slice(0, limit);
  }

  private mergeSources(
    sourceMap: Map<string, ChatSourceReference>,
    sources: ChatSourceReference[],
  ): void {
    for (const source of sources) {
      const key = `${source.sourceType}:${source.sourceId}`;
      const existing = sourceMap.get(key);
      if (!existing || source.distance < existing.distance) {
        sourceMap.set(key, source);
      }
    }
  }

  private async resolveProject(reference?: string): Promise<
    | {
        id: string;
        name: string;
        description: string | null;
        status: ProjectStatus;
        tickets: Array<{
          id: string;
          title: string;
          status: TicketStatus;
          priority: Priority;
        }>;
      }
    | null
  > {
    if (!reference?.trim()) {
      return null;
    }

    const trimmed = reference.trim();
    const byId = await this.prisma.project.findUnique({
      where: { id: trimmed },
      include: {
        tickets: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    if (byId) {
      return byId;
    }

    return this.prisma.project.findFirst({
      where: {
        OR: [
          { name: { equals: trimmed, mode: 'insensitive' } },
          { name: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      include: {
        tickets: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private async resolveTicket(
    reference?: string,
    projectId?: string,
  ): Promise<ResolvedTicket | null> {
    if (!reference?.trim()) {
      return null;
    }

    const trimmed = reference.trim();
    const byId = await this.prisma.ticket.findUnique({
      where: { id: trimmed },
      include: {
        project: {
          select: { id: true, name: true },
        },
        comments: {
          select: {
            id: true,
            author: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (byId && (!projectId || byId.projectId === projectId)) {
      return byId;
    }

    return this.prisma.ticket.findFirst({
      where: {
        projectId,
        OR: [
          { title: { equals: trimmed, mode: 'insensitive' } },
          { title: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        comments: {
          select: {
            id: true,
            author: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private async getRecentHistory(sessionId: string): Promise<ChatMessage[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return messages.reverse();
  }

  private async rewriteQuestion(
    message: string,
    history: ChatMessage[],
  ): Promise<string> {
    if (this.isOfflineMode()) {
      return message;
    }

    if (history.length === 0) {
      return message;
    }

    const historyText = history
      .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
      .join('\n');

    const rewriteModel = this.createChatModel();
    try {
      const rewritten = await rewriteModel.invoke([
        new SystemMessage(
          'Rewrite the user question into a standalone question using the chat history. If the question is already standalone, return it unchanged. Output only the rewritten question.',
        ),
        new HumanMessage(
          `Chat history:\n${historyText}\n\nUser question:\n${message}`,
        ),
      ]);

      const content = this.extractText(rewritten.content).trim();
      return content || message;
    } catch {
      return message;
    }
  }

  private heuristicDecision(
    question: string,
    steps: AgentStep[],
  ): AgentDecision {
    if (steps.length >= 2) {
      return { action: 'final', input: {} };
    }

    const normalized = question.toLowerCase();
    if (normalized.includes('how many') || normalized.includes('count')) {
      return {
        action: 'get_project_stats',
        input: { project: this.extractProjectHint(question) ?? question },
      };
    }
    if (
      normalized.includes('list') ||
      normalized.includes('in-progress') ||
      normalized.includes('in progress')
    ) {
      return {
        action: 'list_tickets',
        input: { status: 'IN_PROGRESS', limit: 10 },
      };
    }
    if (normalized.includes('latest update') || normalized.includes('ticket')) {
      return {
        action: 'search_projects',
        input: {
          query: question,
          project: this.extractProjectHint(question),
          limit: 5,
        },
      };
    }

    return { action: 'search_projects', input: { query: question, limit: 5 } };
  }

  private extractProjectHint(question: string): string | null {
    const normalized = question.toLowerCase();
    if (normalized.includes('e-commerce')) {
      return 'E-Commerce Platform';
    }
    if (normalized.includes('mobile app')) {
      return 'Mobile App Redesign';
    }
    if (normalized.includes('api gateway')) {
      return 'API Gateway Migration';
    }

    return null;
  }

  private isOfflineMode(): boolean {
    return process.env.CHAT_AGENT_OFFLINE === 'true';
  }

  private composeFallbackAnswer(
    question: string,
    steps: AgentStep[],
    sources: ChatSourceReference[],
  ): string {
    if (sources.length === 0) {
      return 'I don\'t have information about that in the project data.';
    }

    const lines: string[] = [
      `Answer for: ${question}`,
      '',
      'Tool observations:',
    ];

    steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step.tool} -> ${step.output.slice(0, 220)}`);
    });

    lines.push('', 'Sources:');
    sources.slice(0, 5).forEach((source, index) => {
      lines.push(
        `[S${index + 1}] ${source.sourceType} ${source.sourceId}: ${source.snippet}`,
      );
    });

    return lines.join('\n');
  }

  private async persistConversation(
    message: string,
    sessionId: string,
    answer: string,
    sources: ChatSourceReference[],
  ): Promise<void> {
    await this.prisma.chatMessage.createMany({
      data: [
        {
          role: 'user',
          content: message,
          sessionId,
        },
        {
          role: 'assistant',
          content: answer,
          sessionId,
          sources: sources as unknown as Prisma.InputJsonValue,
        },
      ],
    });
  }

  private toChatReply(
    answer: string,
    sources: ChatSourceReference[],
    sessionId: string,
  ): ChatReply {
    return {
      response: answer,
      sources,
      sessionId,
    };
  }

  private createChatModel(): ChatGoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY is missing. Add it to apps/api/.env before using chat endpoints.',
      );
    }

    return new ChatGoogleGenerativeAI({
      apiKey,
      model: process.env.GEMINI_CHAT_MODEL ?? 'gemini-2.0-flash',
      temperature: 0.1,
      maxRetries: 2,
    });
  }

  private extractText(
    content: string | Array<{ text?: string; type?: string }>,
  ): string {
    if (typeof content === 'string') {
      return content;
    }

    return content
      .map((part) =>
        'text' in part && typeof part.text === 'string' ? part.text : '',
      )
      .join(' ');
  }

  private readString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private readNumber(
    value: unknown,
    fallback: number,
    min: number,
    max: number,
  ): number {
    const numeric =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number.parseInt(value, 10)
          : Number.NaN;

    if (Number.isNaN(numeric)) {
      return fallback;
    }

    return Math.min(Math.max(numeric, min), max);
  }

  private readTicketStatus(value: unknown): TicketStatus | null {
    const status = this.readString(value);
    if (!status) {
      return null;
    }

    return (Object.values(TicketStatus) as string[]).includes(status)
      ? (status as TicketStatus)
      : null;
  }

  private readPriority(value: unknown): Priority | null {
    const priority = this.readString(value);
    if (!priority) {
      return null;
    }

    return (Object.values(Priority) as string[]).includes(priority)
      ? (priority as Priority)
      : null;
  }
}
