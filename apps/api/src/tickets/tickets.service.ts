import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Priority, Prisma, ProjectStatus, Ticket, TicketStatus } from '@prisma/client';
import { EMBEDDING_PROJECT_SYNC_EVENT } from '../embeddings/embedding.events';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

const ticketListSelection = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      comments: true,
    },
  },
} satisfies Prisma.TicketSelect;

export type TicketListItem = Prisma.TicketGetPayload<{
  select: typeof ticketListSelection;
}>;

export type TicketListQueryResult = Omit<TicketListItem, '_count'> & {
  commentCount: number;
};

export interface TicketDetailQueryResult extends Ticket {
  project: {
    id: string;
    name: string;
    status: ProjectStatus;
  };
  commentCount: number;
}

interface FindAllTicketsOptions {
  projectId?: string;
  status?: TicketStatus;
  priority?: Priority;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(projectId: string, dto: CreateTicketDto): Promise<Ticket> {
    await this.ensureProjectExists(projectId);
    const ticket = await this.prisma.ticket.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        status: dto.status ?? TicketStatus.TODO,
        priority: dto.priority ?? Priority.MEDIUM,
      },
    });
    await this.emitProjectSync(projectId, 'ticket.created');
    return ticket;
  }

  async findByProject(
    projectId: string,
    status?: TicketStatus,
    priority?: Priority,
    sortBy: 'createdAt' | 'updatedAt' | 'priority' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<TicketListQueryResult[]> {
    await this.ensureProjectExists(projectId);
    await this.promoteCommentedTodoTickets(projectId);
    const tickets = await this.prisma.ticket.findMany({
      where: {
        projectId,
        status,
        priority,
      },
      select: ticketListSelection,
      orderBy: this.buildOrderBy(sortBy, sortOrder),
    });

    return tickets.map(({ _count, ...ticket }) => ({
      ...ticket,
      commentCount: _count.comments,
    }));
  }

  async findAll(options: FindAllTicketsOptions = {}): Promise<TicketListQueryResult[]> {
    if (options.projectId) {
      await this.ensureProjectExists(options.projectId);
    }
    await this.promoteCommentedTodoTickets(options.projectId);

    const sortBy = options.sortBy ?? 'createdAt';
    const sortOrder = options.sortOrder ?? 'desc';

    const tickets = await this.prisma.ticket.findMany({
      where: {
        projectId: options.projectId,
        status: options.status,
        priority: options.priority,
      },
      select: ticketListSelection,
      orderBy: this.buildOrderBy(sortBy, sortOrder),
    });

    return tickets.map(({ _count, ...ticket }) => ({
      ...ticket,
      commentCount: _count.comments,
    }));
  }

  async findOne(id: string): Promise<TicketDetailQueryResult> {
    await this.prisma.ticket.updateMany({
      where: {
        id,
        status: TicketStatus.TODO,
        comments: {
          some: {},
        },
      },
      data: {
        status: TicketStatus.IN_PROGRESS,
      },
    });

    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    const { _count, ...ticketWithoutCount } = ticket;
    return {
      ...ticketWithoutCount,
      commentCount: _count.comments,
    };
  }

  async update(id: string, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
      },
    });
    await this.emitProjectSync(ticket.projectId, 'ticket.updated');
    return updatedTicket;
  }

  async remove(id: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const deletedTicket = await this.prisma.ticket.delete({ where: { id } });
    await this.emitProjectSync(ticket.projectId, 'ticket.deleted');
    return deletedTicket;
  }

  private async ensureProjectExists(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  private buildOrderBy(
    sortBy: 'createdAt' | 'updatedAt' | 'priority',
    sortOrder: 'asc' | 'desc',
  ): Prisma.TicketOrderByWithRelationInput | Prisma.TicketOrderByWithRelationInput[] {
    if (sortBy === 'priority') {
      return [{ priority: sortOrder }, { createdAt: 'desc' }, { id: 'desc' }];
    }

    return {
      [sortBy]: sortOrder,
    } as Prisma.TicketOrderByWithRelationInput;
  }

  private async emitProjectSync(projectId: string, reason: string): Promise<void> {
    await this.eventEmitter.emitAsync(EMBEDDING_PROJECT_SYNC_EVENT, {
      projectId,
      reason,
    });
  }

  private async promoteCommentedTodoTickets(projectId?: string): Promise<void> {
    await this.prisma.ticket.updateMany({
      where: {
        projectId,
        status: TicketStatus.TODO,
        comments: {
          some: {},
        },
      },
      data: {
        status: TicketStatus.IN_PROGRESS,
      },
    });
  }
}
