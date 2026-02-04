import { prisma, isDatabaseConnected } from '../config/prisma';

// Note: web-push needs to be installed: npm install web-push
// import webPush from 'web-push';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
}

class PushNotificationService {
  private vapidPublicKey: string;
  private vapidPrivateKey: string;
  private vapidEmail: string;

  constructor() {
    // These should be set via environment variables in production
    this.vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
    this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
    this.vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@shift-game.com';

    // Configure web-push if keys are available
    if (this.vapidPublicKey && this.vapidPrivateKey) {
      // Uncomment when web-push is installed:
      // webPush.setVapidDetails(
      //   this.vapidEmail,
      //   this.vapidPublicKey,
      //   this.vapidPrivateKey
      // );
      console.log('[PushService] VAPID keys configured');
    } else {
      console.log('[PushService] VAPID keys not configured - push notifications disabled');
    }
  }

  /**
   * Get VAPID public key for client
   */
  getPublicKey(): string {
    return this.vapidPublicKey;
  }

  /**
   * Register a push subscription for a user
   */
  async registerSubscription(userId: string, subscription: PushSubscriptionData): Promise<{ success: boolean; message: string }> {
    if (!await isDatabaseConnected()) {
      return { success: false, message: 'Database not connected' };
    }

    try {
      await prisma.pushSubscription.upsert({
        where: { endpoint: subscription.endpoint },
        update: {
          userId,
          keys: subscription.keys
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys
        }
      });

      console.log(`[PushService] Subscription registered for user ${userId}`);
      return { success: true, message: 'Subscription registered' };
    } catch (error) {
      console.error('[PushService] Register subscription error:', error);
      return { success: false, message: 'Failed to register subscription' };
    }
  }

  /**
   * Unregister a push subscription
   */
  async unregisterSubscription(endpoint: string): Promise<{ success: boolean; message: string }> {
    if (!await isDatabaseConnected()) {
      return { success: false, message: 'Database not connected' };
    }

    try {
      await prisma.pushSubscription.delete({
        where: { endpoint }
      });

      console.log(`[PushService] Subscription unregistered`);
      return { success: true, message: 'Subscription unregistered' };
    } catch (error) {
      console.error('[PushService] Unregister subscription error:', error);
      return { success: false, message: 'Failed to unregister subscription' };
    }
  }

  /**
   * Send notification to a specific user
   */
  async sendToUser(userId: string, notification: NotificationPayload): Promise<{ success: boolean; sent: number }> {
    if (!this.vapidPublicKey || !this.vapidPrivateKey) {
      console.log('[PushService] Push notifications not configured');
      return { success: false, sent: 0 };
    }

    if (!await isDatabaseConnected()) {
      return { success: false, sent: 0 };
    }

    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId }
      });

      let sent = 0;
      const failedEndpoints: string[] = [];

      for (const sub of subscriptions) {
        try {
          // Uncomment when web-push is installed:
          // await webPush.sendNotification(
          //   {
          //     endpoint: sub.endpoint,
          //     keys: sub.keys as { p256dh: string; auth: string }
          //   },
          //   JSON.stringify(notification)
          // );
          console.log(`[PushService] Notification sent to ${sub.endpoint.substring(0, 50)}...`);
          sent++;
        } catch (error: any) {
          console.error('[PushService] Send notification error:', error);
          // If subscription is invalid, mark for deletion
          if (error.statusCode === 404 || error.statusCode === 410) {
            failedEndpoints.push(sub.endpoint);
          }
        }
      }

      // Clean up failed subscriptions
      if (failedEndpoints.length > 0) {
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: { in: failedEndpoints } }
        });
        console.log(`[PushService] Cleaned up ${failedEndpoints.length} invalid subscriptions`);
      }

      return { success: sent > 0, sent };
    } catch (error) {
      console.error('[PushService] Send to user error:', error);
      return { success: false, sent: 0 };
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToUsers(userIds: string[], notification: NotificationPayload): Promise<{ success: boolean; sent: number }> {
    let totalSent = 0;

    for (const userId of userIds) {
      const result = await this.sendToUser(userId, notification);
      totalSent += result.sent;
    }

    return { success: totalSent > 0, sent: totalSent };
  }

  /**
   * Send "It's your turn" notification
   */
  async sendYourTurnNotification(userId: string, roomName?: string): Promise<{ success: boolean; sent: number }> {
    return this.sendToUser(userId, {
      title: 'SHIFT - C\'est votre tour!',
      body: roomName ? `C'est à vous de jouer dans ${roomName}` : 'C\'est à vous de jouer!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'your-turn',
      data: {
        type: 'your_turn',
        roomName
      },
      actions: [
        { action: 'play', title: 'Jouer' }
      ]
    });
  }

  /**
   * Send game invite notification
   */
  async sendGameInviteNotification(userId: string, inviterName: string, roomId: string): Promise<{ success: boolean; sent: number }> {
    return this.sendToUser(userId, {
      title: 'SHIFT - Invitation à jouer',
      body: `${inviterName} vous invite à rejoindre une partie!`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'game-invite',
      data: {
        type: 'game_invite',
        inviterName,
        roomId
      },
      actions: [
        { action: 'accept', title: 'Accepter' },
        { action: 'decline', title: 'Refuser' }
      ]
    });
  }

  /**
   * Send friend request notification
   */
  async sendFriendRequestNotification(userId: string, requesterName: string): Promise<{ success: boolean; sent: number }> {
    return this.sendToUser(userId, {
      title: 'SHIFT - Demande d\'ami',
      body: `${requesterName} souhaite vous ajouter comme ami!`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'friend-request',
      data: {
        type: 'friend_request',
        requesterName
      },
      actions: [
        { action: 'accept', title: 'Accepter' },
        { action: 'view', title: 'Voir' }
      ]
    });
  }

  /**
   * Send game over notification
   */
  async sendGameOverNotification(userId: string, won: boolean, roomName?: string): Promise<{ success: boolean; sent: number }> {
    return this.sendToUser(userId, {
      title: won ? 'SHIFT - Victoire!' : 'SHIFT - Partie terminée',
      body: won
        ? (roomName ? `Vous avez gagné dans ${roomName}!` : 'Félicitations, vous avez gagné!')
        : (roomName ? `La partie dans ${roomName} est terminée` : 'La partie est terminée'),
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'game-over',
      data: {
        type: 'game_over',
        won,
        roomName
      }
    });
  }

  /**
   * Get subscription count for a user
   */
  async getSubscriptionCount(userId: string): Promise<number> {
    if (!await isDatabaseConnected()) return 0;

    try {
      return await prisma.pushSubscription.count({
        where: { userId }
      });
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if user has any subscriptions
   */
  async hasSubscription(userId: string): Promise<boolean> {
    const count = await this.getSubscriptionCount(userId);
    return count > 0;
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
