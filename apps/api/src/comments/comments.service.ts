import { Injectable, NotFoundException } from '@nestjs/common';
import { Comment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ticketId: string, dto: CreateCommentDto): Promise<Comment> {
    await this.ensureTicketExists(ticketId);
    return this.prisma.comment.create({
      data: {
        ticketId,
        content: dto.content,
        author: dto.author,
      },
    });
  }

  async findByTicket(ticketId: string): Promise<Comment[]> {
    await this.ensureTicketExists(ticketId);
    return this.prisma.comment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateCommentDto): Promise<Comment> {
    await this.findOneOrThrow(id);
    return this.prisma.comment.update({
      where: { id },
      data: {
        content: dto.content,
        author: dto.author,
      },
    });
  }

  async remove(id: string): Promise<Comment> {
    await this.findOneOrThrow(id);
    return this.prisma.comment.delete({ where: { id } });
  }

  private async ensureTicketExists(ticketId: string): Promise<void> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }
  }

  private async findOneOrThrow(id: string): Promise<Comment> {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment ${id} not found`);
    }
    return comment;
  }
}
