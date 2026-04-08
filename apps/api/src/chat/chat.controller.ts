import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { ChatMessage } from '@prisma/client';
import type { Response } from 'express';
import { ChatService, type ChatReply } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  create(@Body() dto: CreateChatDto): Promise<ChatReply> {
    return this.chatService.chat(dto.message, dto.sessionId);
  }

  @Post('stream')
  async stream(@Body() dto: CreateChatDto, @Res() res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const reply = await this.chatService.streamChat(
        dto.message,
        dto.sessionId,
        async (token) => {
          this.sendSse(res, { token });
        },
      );

      this.sendSse(res, {
        done: true,
        sources: reply.sources,
        sessionId: reply.sessionId,
      });
    } catch (error) {
      this.sendSse(res, {
        done: true,
        error:
          error instanceof Error
            ? error.message
            : 'Streaming chat failed unexpectedly.',
      });
    } finally {
      res.end();
    }
  }

  @Get('history/:sessionId')
  history(@Param('sessionId') sessionId: string): Promise<ChatMessage[]> {
    return this.chatService.getHistory(sessionId);
  }

  @Delete('history/:sessionId')
  clearHistory(
    @Param('sessionId') sessionId: string,
  ): Promise<{ deleted: number }> {
    return this.chatService.clearHistory(sessionId);
  }

  private sendSse(res: Response, payload: Record<string, unknown>): void {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}
