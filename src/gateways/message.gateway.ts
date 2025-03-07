import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

import { MessageService } from '../components/message/message.service';

interface MessagePayload {
  content: string;
  senderId: number;
  receiverId?: number;
  timestamp?: number;
}

interface SavedMessage {
  id: number;
  senderId: number;
  receiverId?: number;
  content: string;
  createdAt: Date;
}

interface TypingPayload {
  senderId: number;
  receiverId?: number;
  isTyping: boolean;
}

interface UnsendMessagePayload {
  messageId: number;
  senderId: number;
  receiverId?: number;
}

// Constants to avoid magic numbers
const MESSAGE_EXPIRY_MS = 10000; // 10 seconds
const MAX_PROCESSED_MESSAGES = 1000;
const MESSAGES_TO_CLEAN = 500;

@WebSocketGateway({
  cors: { origin: '*' },
})
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MessageGateway.name);
  private readonly connectedClients = new Map<string, Socket>();

  private readonly recentMessages = new Map<string, number>();
  private static readonly processedMessages = new Set<string>();

  constructor(private readonly messageService: MessageService) {}

  handleConnection(client: Socket): void {
    this.logger.log(`Client socket connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client socket disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: MessagePayload): Promise<void> {
    // Early return if message is a duplicate
    if (this.isDuplicateMessage(payload)) {
      return;
    }

    try {
      // Save to database and notify clients
      const savedMessage = await this.saveAndBroadcastMessage(client, payload);

      client.emit('messageSent', {
        success: true,
        message: savedMessage,
      });

      const isCorrectBroadcast =
        payload.receiverId === savedMessage.receiverId &&
        payload.senderId === savedMessage.senderId;

      if (isCorrectBroadcast) {
        client.broadcast.emit('newMessage', {
          id: savedMessage.id,
          senderId: savedMessage.senderId,
          receiverId: savedMessage.receiverId,
          content: savedMessage.content,
          timestamp: savedMessage.createdAt,
        });
      }
    } catch (error) {
      this.handleMessageError(client, payload, error);
    }
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, payload: TypingPayload): void {
    client.broadcast.emit('userTyping', {
      senderId: payload.senderId,
      receiverId: payload.receiverId,
      isTyping: payload.isTyping,
    });
  }

  @SubscribeMessage('unsendMessage')
  async handleUnsendMessage(
    client: Socket,
    payload: UnsendMessagePayload,
  ): Promise<void> {
    try {
      // Find the message directly using the repository
      const message = await this.messageService.findOneById(payload.messageId);

      if (!message) {
        client.emit('error', { message: 'Message not found' });
        return;
      }

      if (message.senderId !== payload.senderId) {
        client.emit('error', {
          message: 'You can only unsend your own messages',
        });
        return;
      }

      // Mark message as unsent in the database
      await this.messageService.markAsUnsent(payload.messageId);

      // Notify the sender that the message was unsent
      client.emit('messageUnsent', {
        success: true,
        messageId: payload.messageId,
      });

      // Broadcast to the recipient that the message was unsent
      client.broadcast.emit('messageUnsent', {
        messageId: payload.messageId,
        senderId: payload.senderId,
        receiverId: payload.receiverId,
      });

      this.logger.log(
        `Message ${payload.messageId} unsent by user ${payload.senderId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error unsending message: ${error.message}`,
        error.stack,
      );
      client.emit('error', { message: 'Failed to unsend message' });
    }
  }

  // Helper methods for better organization
  private isDuplicateMessage(payload: MessagePayload): boolean {
    const messageKey = this.createMessageKey(payload);

    if (MessageGateway.processedMessages.has(messageKey)) {
      this.logger.debug(`Duplicate message detected: ${messageKey}`);
      return true;
    }

    // Mark as processed
    const now = Date.now();
    MessageGateway.processedMessages.add(messageKey);
    this.recentMessages.set(messageKey, now);

    // Clean up old messages
    this.cleanupOldMessages(now);

    return false;
  }

  private createMessageKey(payload: MessagePayload): string {
    const now = Date.now();
    const { senderId, receiverId, content, timestamp } = payload;

    return [
      senderId,
      receiverId || 'broadcast',
      content,
      timestamp || now,
    ].join('-');
  }

  private async saveAndBroadcastMessage(
    client: Socket,
    payload: MessagePayload,
  ): Promise<SavedMessage> {
    this.logger.debug(
      `Processing message from ${client.id}: ${JSON.stringify(payload)}`,
    );

    const result = await this.messageService.create({
      content: payload.content,
      senderId: payload.senderId,
      receiverId: payload.receiverId,
    });

    return result as SavedMessage;
  }

  private handleMessageError(
    client: Socket,
    payload: MessagePayload,
    error: any,
  ): void {
    this.logger.error(`Error saving message: ${error.message}`, error.stack);
    client.emit('error', { message: 'Failed to save message' });

    // Remove from processed messages on failure
    const messageKey = this.createMessageKey(payload);
    MessageGateway.processedMessages.delete(messageKey);
    this.recentMessages.delete(messageKey);
  }

  private cleanupOldMessages(now: number): void {
    // Remove expired messages
    for (const [key, timestamp] of this.recentMessages.entries()) {
      if (now - timestamp > MESSAGE_EXPIRY_MS) {
        this.recentMessages.delete(key);
        MessageGateway.processedMessages.delete(key);
      }
    }

    // Prevent memory leaks
    if (MessageGateway.processedMessages.size > MAX_PROCESSED_MESSAGES) {
      const keysToDelete = Array.from(MessageGateway.processedMessages).slice(
        0,
        MESSAGES_TO_CLEAN,
      );

      keysToDelete.forEach((key) =>
        MessageGateway.processedMessages.delete(key),
      );
      this.logger.debug(`Cleaned up ${MESSAGES_TO_CLEAN} old messages`);
    }
  }
}
