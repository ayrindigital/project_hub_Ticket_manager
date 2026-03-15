import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Comment } from '@prisma/client';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('tickets/:ticketId/comments')
  create(
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<Comment> {
    return this.commentsService.create(ticketId, dto);
  }

  @Get('tickets/:ticketId/comments')
  findByTicket(@Param('ticketId') ticketId: string): Promise<Comment[]> {
    return this.commentsService.findByTicket(ticketId);
  }

  @Patch('comments/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ): Promise<Comment> {
    return this.commentsService.update(id, dto);
  }

  @Delete('comments/:id')
  remove(@Param('id') id: string): Promise<Comment> {
    return this.commentsService.remove(id);
  }
}
