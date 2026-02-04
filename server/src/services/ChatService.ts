import { prisma, isDatabaseConnected } from '../config/prisma';
import { MessageType } from '@prisma/client';

export interface ChatMessageData {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'emoji' | 'system';
  createdAt: Date;
}

export interface EmojiReaction {
  emoji: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

class ChatService {
  // In-memory reactions (could be Redis in production)
  private roomReactions: Map<string, EmojiReaction[]> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map();

  /**
   * Send a chat message
   */
  async sendMessage(data: {
    roomId: string;
    senderId: string;
    senderName: string;
    content: string;
    type?: 'text' | 'emoji' | 'system';
  }): Promise<ChatMessageData | null> {
    const messageType = data.type || 'text';

    // Create in-memory message for real-time
    const message: ChatMessageData = {
      id: crypto.randomUUID(),
      roomId: data.roomId,
      senderId: data.senderId,
      senderName: data.senderName,
      content: data.content,
      type: messageType,
      createdAt: new Date()
    };

    // Save to DB if connected (async, don't block)
    this.saveMessageAsync(message);

    return message;
  }

  /**
   * Save message to database (async)
   */
  private async saveMessageAsync(message: ChatMessageData): Promise<void> {
    if (!await isDatabaseConnected()) return;

    try {
      await prisma.chatMessage.create({
        data: {
          id: message.id,
          roomId: message.roomId,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          type: this.mapMessageType(message.type),
          createdAt: message.createdAt
        }
      });
    } catch (error) {
      console.error('[ChatService] Save message error:', error);
    }
  }

  /**
   * Get message history for a room
   */
  async getMessages(roomId: string, limit: number = 50, before?: Date): Promise<ChatMessageData[]> {
    if (!await isDatabaseConnected()) return [];

    try {
      const messages = await prisma.chatMessage.findMany({
        where: {
          roomId,
          ...(before ? { createdAt: { lt: before } } : {})
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return messages.map(m => ({
        id: m.id,
        roomId: m.roomId,
        senderId: m.senderId,
        senderName: m.senderName,
        content: m.content,
        type: this.mapMessageTypeReverse(m.type),
        createdAt: m.createdAt
      })).reverse();
    } catch (error) {
      console.error('[ChatService] Get messages error:', error);
      return [];
    }
  }

  /**
   * Delete messages for a room
   */
  async deleteRoomMessages(roomId: string): Promise<void> {
    if (!await isDatabaseConnected()) return;

    try {
      await prisma.chatMessage.deleteMany({
        where: { roomId }
      });
      console.log(`[ChatService] Messages deleted for room ${roomId}`);
    } catch (error) {
      console.error('[ChatService] Delete messages error:', error);
    }
  }

  /**
   * Send emoji reaction
   */
  sendEmojiReaction(roomId: string, data: { emoji: string; senderId: string; senderName: string }): EmojiReaction {
    const reaction: EmojiReaction = {
      emoji: data.emoji,
      senderId: data.senderId,
      senderName: data.senderName,
      timestamp: new Date()
    };

    // Store in memory (keep last 100 reactions per room)
    let reactions = this.roomReactions.get(roomId) || [];
    reactions.push(reaction);
    if (reactions.length > 100) {
      reactions = reactions.slice(-100);
    }
    this.roomReactions.set(roomId, reactions);

    return reaction;
  }

  /**
   * Get recent reactions for a room
   */
  getRecentReactions(roomId: string, limit: number = 10): EmojiReaction[] {
    const reactions = this.roomReactions.get(roomId) || [];
    return reactions.slice(-limit);
  }

  /**
   * Set user typing status
   */
  setTyping(roomId: string, userId: string, isTyping: boolean): void {
    let typingSet = this.typingUsers.get(roomId);

    if (!typingSet) {
      typingSet = new Set();
      this.typingUsers.set(roomId, typingSet);
    }

    if (isTyping) {
      typingSet.add(userId);
    } else {
      typingSet.delete(userId);
    }
  }

  /**
   * Get typing users for a room
   */
  getTypingUsers(roomId: string): string[] {
    return Array.from(this.typingUsers.get(roomId) || []);
  }

  /**
   * Create a system message
   */
  createSystemMessage(roomId: string, content: string): ChatMessageData {
    const message: ChatMessageData = {
      id: crypto.randomUUID(),
      roomId,
      senderId: 'system',
      senderName: 'System',
      content,
      type: 'system',
      createdAt: new Date()
    };

    this.saveMessageAsync(message);
    return message;
  }

  /**
   * Clean up room data
   */
  cleanupRoom(roomId: string): void {
    this.roomReactions.delete(roomId);
    this.typingUsers.delete(roomId);
  }

  private mapMessageType(type: 'text' | 'emoji' | 'system'): MessageType {
    switch (type) {
      case 'text': return MessageType.TEXT;
      case 'emoji': return MessageType.EMOJI;
      case 'system': return MessageType.SYSTEM;
      default: return MessageType.TEXT;
    }
  }

  private mapMessageTypeReverse(type: MessageType): 'text' | 'emoji' | 'system' {
    switch (type) {
      case MessageType.TEXT: return 'text';
      case MessageType.EMOJI: return 'emoji';
      case MessageType.SYSTEM: return 'system';
      default: return 'text';
    }
  }
}

export const chatService = new ChatService();
export default chatService;
