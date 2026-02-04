import { prisma, isDatabaseConnected } from '../config/prisma';

export interface CreateUserData {
  username: string;
  avatarUrl?: string;
  avatarPreset?: string;
}

export interface UserWithProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  avatarPreset: string | null;
  createdAt: Date;
  profile: {
    gamesPlayed: number;
    gamesWon: number;
    totalScore: number;
    highestScore: number;
    totalTurns: number;
    totalPlayTime: number;
    favoriteRulePack: string | null;
  } | null;
}

class UserService {
  /**
   * Create a new user with profile
   */
  async createUser(data: CreateUserData): Promise<UserWithProfile | null> {
    if (!await isDatabaseConnected()) {
      console.log('[UserService] DB not connected');
      return null;
    }

    try {
      const user = await prisma.user.create({
        data: {
          username: data.username,
          avatarUrl: data.avatarUrl,
          avatarPreset: data.avatarPreset || 'default',
          profile: {
            create: {}
          }
        },
        include: {
          profile: true
        }
      });

      console.log(`[UserService] User ${data.username} created`);
      return user;
    } catch (error) {
      console.error('[UserService] Create user error:', error);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserWithProfile | null> {
    if (!await isDatabaseConnected()) return null;

    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      });
    } catch (error) {
      console.error('[UserService] Get user error:', error);
      return null;
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<UserWithProfile | null> {
    if (!await isDatabaseConnected()) return null;

    try {
      return await prisma.user.findUnique({
        where: { username },
        include: { profile: true }
      });
    } catch (error) {
      console.error('[UserService] Get user by username error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, data: Partial<CreateUserData>): Promise<UserWithProfile | null> {
    if (!await isDatabaseConnected()) return null;

    try {
      return await prisma.user.update({
        where: { id: userId },
        data: {
          username: data.username,
          avatarUrl: data.avatarUrl,
          avatarPreset: data.avatarPreset
        },
        include: { profile: true }
      });
    } catch (error) {
      console.error('[UserService] Update user error:', error);
      return null;
    }
  }

  /**
   * Update user statistics after a game
   */
  async updateStats(userId: string, gameData: {
    won: boolean;
    score: number;
    turns: number;
    duration: number;
    rulePackUsed?: string;
  }): Promise<void> {
    if (!await isDatabaseConnected()) return;

    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId }
      });

      if (!profile) {
        await prisma.userProfile.create({
          data: {
            userId,
            gamesPlayed: 1,
            gamesWon: gameData.won ? 1 : 0,
            totalScore: gameData.score,
            highestScore: gameData.score,
            totalTurns: gameData.turns,
            totalPlayTime: gameData.duration,
            favoriteRulePack: gameData.rulePackUsed
          }
        });
      } else {
        await prisma.userProfile.update({
          where: { userId },
          data: {
            gamesPlayed: { increment: 1 },
            gamesWon: gameData.won ? { increment: 1 } : undefined,
            totalScore: { increment: gameData.score },
            highestScore: gameData.score > profile.highestScore ? gameData.score : undefined,
            totalTurns: { increment: gameData.turns },
            totalPlayTime: { increment: gameData.duration }
          }
        });
      }

      console.log(`[UserService] Stats updated for user ${userId}`);
    } catch (error) {
      console.error('[UserService] Update stats error:', error);
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 10): Promise<UserWithProfile[]> {
    if (!await isDatabaseConnected()) return [];

    try {
      return await prisma.user.findMany({
        include: { profile: true },
        orderBy: {
          profile: {
            gamesWon: 'desc'
          }
        },
        take: limit
      });
    } catch (error) {
      console.error('[UserService] Get leaderboard error:', error);
      return [];
    }
  }

  /**
   * Search users by username
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserWithProfile[]> {
    if (!await isDatabaseConnected()) return [];

    try {
      return await prisma.user.findMany({
        where: {
          username: {
            contains: query,
            mode: 'insensitive'
          }
        },
        include: { profile: true },
        take: limit
      });
    } catch (error) {
      console.error('[UserService] Search users error:', error);
      return [];
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<boolean> {
    if (!await isDatabaseConnected()) return false;

    try {
      await prisma.user.delete({ where: { id: userId } });
      console.log(`[UserService] User ${userId} deleted`);
      return true;
    } catch (error) {
      console.error('[UserService] Delete user error:', error);
      return false;
    }
  }

  /**
   * Get or create user (for anonymous sessions)
   */
  async getOrCreateUser(username: string, avatarPreset?: string): Promise<UserWithProfile | null> {
    let user = await this.getUserByUsername(username);
    if (!user) {
      user = await this.createUser({ username, avatarPreset });
    }
    return user;
  }
}

export const userService = new UserService();
export default userService;
