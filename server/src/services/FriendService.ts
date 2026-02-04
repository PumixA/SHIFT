import { prisma, isDatabaseConnected } from '../config/prisma';
import { FriendshipStatus } from '@prisma/client';

export interface FriendInfo {
  id: string;
  friendId: string;
  friendUsername: string;
  friendAvatarUrl: string | null;
  friendAvatarPreset: string | null;
  status: FriendshipStatus;
  createdAt: Date;
  isOnline?: boolean;
}

class FriendService {
  // Track online users (in-memory, could be Redis in production)
  private onlineUsers: Map<string, { socketId: string; lastSeen: Date }> = new Map();

  /**
   * Send a friend request
   */
  async sendFriendRequest(userId: string, friendId: string): Promise<{ success: boolean; message: string }> {
    if (!await isDatabaseConnected()) {
      return { success: false, message: 'Database not connected' };
    }

    if (userId === friendId) {
      return { success: false, message: 'Cannot add yourself as a friend' };
    }

    try {
      // Check if friendship already exists
      const existing = await prisma.friendship.findUnique({
        where: {
          userId_friendId: { userId, friendId }
        }
      });

      if (existing) {
        if (existing.status === FriendshipStatus.BLOCKED) {
          return { success: false, message: 'User is blocked' };
        }
        return { success: false, message: 'Friend request already sent' };
      }

      // Check if reverse friendship exists (they already sent us a request)
      const reverse = await prisma.friendship.findUnique({
        where: {
          userId_friendId: { userId: friendId, friendId: userId }
        }
      });

      if (reverse) {
        if (reverse.status === FriendshipStatus.PENDING) {
          // Auto-accept if they already sent us a request
          await this.acceptFriendRequest(friendId, userId);
          return { success: true, message: 'Friend request accepted (mutual)' };
        }
        if (reverse.status === FriendshipStatus.BLOCKED) {
          return { success: false, message: 'Cannot send request to this user' };
        }
      }

      await prisma.friendship.create({
        data: {
          userId,
          friendId,
          status: FriendshipStatus.PENDING
        }
      });

      console.log(`[FriendService] Friend request sent: ${userId} -> ${friendId}`);
      return { success: true, message: 'Friend request sent' };
    } catch (error) {
      console.error('[FriendService] Send friend request error:', error);
      return { success: false, message: 'Failed to send friend request' };
    }
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(userId: string, requesterId: string): Promise<{ success: boolean; message: string }> {
    if (!await isDatabaseConnected()) {
      return { success: false, message: 'Database not connected' };
    }

    try {
      // Update the incoming request
      await prisma.friendship.update({
        where: {
          userId_friendId: { userId: requesterId, friendId: userId }
        },
        data: { status: FriendshipStatus.ACCEPTED }
      });

      // Create the reverse friendship
      await prisma.friendship.upsert({
        where: {
          userId_friendId: { userId, friendId: requesterId }
        },
        update: { status: FriendshipStatus.ACCEPTED },
        create: {
          userId,
          friendId: requesterId,
          status: FriendshipStatus.ACCEPTED
        }
      });

      console.log(`[FriendService] Friend request accepted: ${requesterId} <-> ${userId}`);
      return { success: true, message: 'Friend request accepted' };
    } catch (error) {
      console.error('[FriendService] Accept friend request error:', error);
      return { success: false, message: 'Failed to accept friend request' };
    }
  }

  /**
   * Decline a friend request
   */
  async declineFriendRequest(userId: string, requesterId: string): Promise<{ success: boolean; message: string }> {
    if (!await isDatabaseConnected()) {
      return { success: false, message: 'Database not connected' };
    }

    try {
      await prisma.friendship.delete({
        where: {
          userId_friendId: { userId: requesterId, friendId: userId }
        }
      });

      console.log(`[FriendService] Friend request declined: ${requesterId} -> ${userId}`);
      return { success: true, message: 'Friend request declined' };
    } catch (error) {
      console.error('[FriendService] Decline friend request error:', error);
      return { success: false, message: 'Failed to decline friend request' };
    }
  }

  /**
   * Remove a friend
   */
  async removeFriend(userId: string, friendId: string): Promise<{ success: boolean; message: string }> {
    if (!await isDatabaseConnected()) {
      return { success: false, message: 'Database not connected' };
    }

    try {
      // Remove both directions
      await prisma.friendship.deleteMany({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId }
          ]
        }
      });

      console.log(`[FriendService] Friendship removed: ${userId} <-> ${friendId}`);
      return { success: true, message: 'Friend removed' };
    } catch (error) {
      console.error('[FriendService] Remove friend error:', error);
      return { success: false, message: 'Failed to remove friend' };
    }
  }

  /**
   * Block a user
   */
  async blockUser(userId: string, targetId: string): Promise<{ success: boolean; message: string }> {
    if (!await isDatabaseConnected()) {
      return { success: false, message: 'Database not connected' };
    }

    try {
      await prisma.friendship.upsert({
        where: {
          userId_friendId: { userId, friendId: targetId }
        },
        update: { status: FriendshipStatus.BLOCKED },
        create: {
          userId,
          friendId: targetId,
          status: FriendshipStatus.BLOCKED
        }
      });

      console.log(`[FriendService] User blocked: ${userId} blocked ${targetId}`);
      return { success: true, message: 'User blocked' };
    } catch (error) {
      console.error('[FriendService] Block user error:', error);
      return { success: false, message: 'Failed to block user' };
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string, targetId: string): Promise<{ success: boolean; message: string }> {
    if (!await isDatabaseConnected()) {
      return { success: false, message: 'Database not connected' };
    }

    try {
      await prisma.friendship.delete({
        where: {
          userId_friendId: { userId, friendId: targetId }
        }
      });

      console.log(`[FriendService] User unblocked: ${userId} unblocked ${targetId}`);
      return { success: true, message: 'User unblocked' };
    } catch (error) {
      console.error('[FriendService] Unblock user error:', error);
      return { success: false, message: 'Failed to unblock user' };
    }
  }

  /**
   * Get friend list
   */
  async getFriends(userId: string): Promise<FriendInfo[]> {
    if (!await isDatabaseConnected()) return [];

    try {
      const friendships = await prisma.friendship.findMany({
        where: {
          userId,
          status: FriendshipStatus.ACCEPTED
        },
        include: {
          friend: true
        }
      });

      return friendships.map(f => ({
        id: f.id,
        friendId: f.friendId,
        friendUsername: f.friend.username,
        friendAvatarUrl: f.friend.avatarUrl,
        friendAvatarPreset: f.friend.avatarPreset,
        status: f.status,
        createdAt: f.createdAt,
        isOnline: this.onlineUsers.has(f.friendId)
      }));
    } catch (error) {
      console.error('[FriendService] Get friends error:', error);
      return [];
    }
  }

  /**
   * Get pending friend requests (incoming)
   */
  async getPendingRequests(userId: string): Promise<FriendInfo[]> {
    if (!await isDatabaseConnected()) return [];

    try {
      const requests = await prisma.friendship.findMany({
        where: {
          friendId: userId,
          status: FriendshipStatus.PENDING
        },
        include: {
          user: true
        }
      });

      return requests.map(r => ({
        id: r.id,
        friendId: r.userId,
        friendUsername: r.user.username,
        friendAvatarUrl: r.user.avatarUrl,
        friendAvatarPreset: r.user.avatarPreset,
        status: r.status,
        createdAt: r.createdAt,
        isOnline: this.onlineUsers.has(r.userId)
      }));
    } catch (error) {
      console.error('[FriendService] Get pending requests error:', error);
      return [];
    }
  }

  /**
   * Get sent friend requests (outgoing)
   */
  async getSentRequests(userId: string): Promise<FriendInfo[]> {
    if (!await isDatabaseConnected()) return [];

    try {
      const requests = await prisma.friendship.findMany({
        where: {
          userId,
          status: FriendshipStatus.PENDING
        },
        include: {
          friend: true
        }
      });

      return requests.map(r => ({
        id: r.id,
        friendId: r.friendId,
        friendUsername: r.friend.username,
        friendAvatarUrl: r.friend.avatarUrl,
        friendAvatarPreset: r.friend.avatarPreset,
        status: r.status,
        createdAt: r.createdAt,
        isOnline: this.onlineUsers.has(r.friendId)
      }));
    } catch (error) {
      console.error('[FriendService] Get sent requests error:', error);
      return [];
    }
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(userId: string): Promise<FriendInfo[]> {
    if (!await isDatabaseConnected()) return [];

    try {
      const blocked = await prisma.friendship.findMany({
        where: {
          userId,
          status: FriendshipStatus.BLOCKED
        },
        include: {
          friend: true
        }
      });

      return blocked.map(b => ({
        id: b.id,
        friendId: b.friendId,
        friendUsername: b.friend.username,
        friendAvatarUrl: b.friend.avatarUrl,
        friendAvatarPreset: b.friend.avatarPreset,
        status: b.status,
        createdAt: b.createdAt,
        isOnline: false
      }));
    } catch (error) {
      console.error('[FriendService] Get blocked users error:', error);
      return [];
    }
  }

  /**
   * Check if users are friends
   */
  async areFriends(userId: string, friendId: string): Promise<boolean> {
    if (!await isDatabaseConnected()) return false;

    try {
      const friendship = await prisma.friendship.findFirst({
        where: {
          userId,
          friendId,
          status: FriendshipStatus.ACCEPTED
        }
      });
      return !!friendship;
    } catch (error) {
      return false;
    }
  }

  /**
   * Mark user as online
   */
  setUserOnline(userId: string, socketId: string): void {
    this.onlineUsers.set(userId, { socketId, lastSeen: new Date() });
  }

  /**
   * Mark user as offline
   */
  setUserOffline(userId: string): void {
    this.onlineUsers.delete(userId);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  /**
   * Get online friends
   */
  async getOnlineFriends(userId: string): Promise<FriendInfo[]> {
    const friends = await this.getFriends(userId);
    return friends.filter(f => f.isOnline);
  }

  /**
   * Get socket ID for a user
   */
  getUserSocketId(userId: string): string | undefined {
    return this.onlineUsers.get(userId)?.socketId;
  }
}

export const friendService = new FriendService();
export default friendService;
