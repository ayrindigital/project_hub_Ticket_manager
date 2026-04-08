import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Comment, TicketStatus } from '@prisma/client';
import { EMBEDDING_PROJECT_SYNC_EVENT } from '../embeddings/embedding.events';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(ticketId: string, dto: CreateCommentDto): Promise<Comment> {
    const ticket = await this.ensureTicketExists(ticketId);
    const comment = await this.prisma.comment.create({
      data: {
        ticketId,
        content: dto.content,
        author: dto.author,
      },
    });
    await this.prisma.ticket.updateMany({
      where: { id: ticketId, status: TicketStatus.TODO },
      data: { status: TicketStatus.IN_PROGRESS },
    });
    await this.emitProjectSync(ticket.projectId, 'comment.created');
    return comment;
  }

  async findByTicket(ticketId: string): Promise<Comment[]> {
    await this.ensureTicketExists(ticketId);
    return this.prisma.comment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findOneOrThrow(id);
    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: {
        content: dto.content,
        author: dto.author,
      },
    });
    await this.emitProjectSync(comment.ticket.projectId, 'comment.updated');
    return updatedComment;
  }

  async remove(id: string): Promise<Comment> {
    const comment = await this.findOneOrThrow(id);
    const deletedComment = await this.prisma.comment.delete({ where: { id } });
    await this.emitProjectSync(comment.ticket.projectId, 'comment.deleted');
    return deletedComment;
  }

  private async ensureTicketExists(ticketId: string): Promise<{
    id: string;
    projectId: string;
  }> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        projectId: true,
      },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }
    return ticket;
  }

  private async findOneOrThrow(id: string): Promise<
    Comment & {
      ticket: {
        projectId: string;
      };
    }
  > {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        ticket: {
          select: {
            projectId: true,
          },
        },
      },
    });
    if (!comment) {
      throw new NotFoundException(`Comment ${id} not found`);
    }
    return comment;
  }

  private async emitProjectSync(projectId: string, reason: string): Promise<void> {
    await this.eventEmitter.emitAsync(EMBEDDING_PROJECT_SYNC_EVENT, {
      projectId,
      reason,
    });
  }
}
