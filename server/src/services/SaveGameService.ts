import { prisma, isDatabaseConnected } from '../config/prisma';
import { GameState } from '../types/game';

export interface SavedGameInfo {
  id: string;
  userId: string;
  roomId: string;
  roomName: string | null;
  playerCount: number;
  currentTurn: string;
  turnCount: number;
  status: string;
  lastActivity: Date;
  createdAt: Date;
}

class SaveGameService {
  /**
   * Save a game for later resumption
   */
  async saveGame(userId: string, gameState: GameState): Promise<{ success: boolean; message: string; id?: string }> {
    if (!await isDatabaseConnected()) {
      return { success: false, message: 'Database not connected' };
    }

    try {
      const saved = await prisma.savedGame.upsert({
        where: { roomId: gameState.roomId },
        update: {
          userId,
          roomName: gameState.roomName,
          gameState: JSON.parse(JSON.stringify(gameState)),
          lastActivity: new Date()
        },
        create: {
          userId,
          roomId: gameState.roomId,
          roomName: gameState.roomName,
          gameState: JSON.parse(JSON.stringify(gameState)),
          lastActivity: new Date()
        }
      });

      console.log(`[SaveGameService] Game ${gameState.roomId} saved for user ${userId}`);
      return { success: true, message: 'Game saved successfully', id: saved.id };
    } catch (error) {
      console.error('[SaveGameService] Save game error:', error);
      return { success: false, message: 'Failed to save game' };
    }
  }

  /**
   * Load a saved game
   */
  async loadGame(userId: string, roomId: string): Promise<GameState | null> {
    if (!await isDatabaseConnected()) return null;

    try {
      const saved = await prisma.savedGame.findFirst({
        where: {
          roomId,
          userId
        }
      });

      if (!saved) {
        console.log(`[SaveGameService] No saved game found for room ${roomId}`);
        return null;
      }

      console.log(`[SaveGameService] Game ${roomId} loaded`);
      return saved.gameState as unknown as GameState;
    } catch (error) {
      console.error('[SaveGameService] Load game error:', error);
      return null;
    }
  }

  /**
   * Get all saved games for a user
   */
  async getSavedGames(userId: string): Promise<SavedGameInfo[]> {
    if (!await isDatabaseConnected()) return [];

    try {
      const savedGames = await prisma.savedGame.findMany({
        where: { userId },
        orderBy: { lastActivity: 'desc' }
      });

      return savedGames.map(sg => {
        const state = sg.gameState as any;
        return {
          id: sg.id,
          userId: sg.userId,
          roomId: sg.roomId,
          roomName: sg.roomName,
          playerCount: state.players?.length || 0,
          currentTurn: state.currentTurn || '',
          turnCount: state.turnCount || 0,
          status: state.status || 'unknown',
          lastActivity: sg.lastActivity,
          createdAt: sg.createdAt
        };
      });
    } catch (error) {
      console.error('[SaveGameService] Get saved games error:', error);
      return [];
    }
  }

  /**
   * Delete a saved game
   */
  async deleteSavedGame(userId: string, roomId: string): Promise<{ success: boolean; message: string }> {
    if (!await isDatabaseConnected()) {
      return { success: false, message: 'Database not connected' };
    }

    try {
      await prisma.savedGame.deleteMany({
        where: { userId, roomId }
      });

      console.log(`[SaveGameService] Saved game ${roomId} deleted`);
      return { success: true, message: 'Saved game deleted' };
    } catch (error) {
      console.error('[SaveGameService] Delete saved game error:', error);
      return { success: false, message: 'Failed to delete saved game' };
    }
  }

  /**
   * Delete all saved games for a user
   */
  async deleteAllSavedGames(userId: string): Promise<{ success: boolean; count: number }> {
    if (!await isDatabaseConnected()) {
      return { success: false, count: 0 };
    }

    try {
      const result = await prisma.savedGame.deleteMany({
        where: { userId }
      });

      console.log(`[SaveGameService] Deleted ${result.count} saved games for user ${userId}`);
      return { success: true, count: result.count };
    } catch (error) {
      console.error('[SaveGameService] Delete all saved games error:', error);
      return { success: false, count: 0 };
    }
  }

  /**
   * Check if a saved game exists
   */
  async hasSavedGame(userId: string, roomId: string): Promise<boolean> {
    if (!await isDatabaseConnected()) return false;

    try {
      const count = await prisma.savedGame.count({
        where: { userId, roomId }
      });
      return count > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get saved game count for a user
   */
  async getSavedGameCount(userId: string): Promise<number> {
    if (!await isDatabaseConnected()) return 0;

    try {
      return await prisma.savedGame.count({
        where: { userId }
      });
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clean up old saved games (older than X days)
   */
  async cleanupOldSaves(daysOld: number = 30): Promise<number> {
    if (!await isDatabaseConnected()) return 0;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.savedGame.deleteMany({
        where: {
          lastActivity: { lt: cutoffDate }
        }
      });

      console.log(`[SaveGameService] Cleaned up ${result.count} old saved games`);
      return result.count;
    } catch (error) {
      console.error('[SaveGameService] Cleanup error:', error);
      return 0;
    }
  }
}

export const saveGameService = new SaveGameService();
export default saveGameService;
