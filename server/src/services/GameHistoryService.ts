import { prisma, isDatabaseConnected } from '../config/prisma';
import { GameState } from '../types/game';

export interface GameHistoryEntry {
  id: string;
  userId: string;
  roomId: string;
  roomName: string | null;
  players: {
    id: string;
    name: string;
    score: number;
    position: number;
  }[];
  winner: string;
  isWinner: boolean;
  playerScore: number;
  turnCount: number;
  duration: number;
  rulePackUsed: string | null;
  playedAt: Date;
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  averageScore: number;
  averageDuration: number;
  totalPlayTime: number;
  favoriteRulePack: string | null;
}

class GameHistoryService {
  /**
   * Record a completed game for all players
   */
  async recordGame(gameState: GameState, duration: number): Promise<void> {
    if (!await isDatabaseConnected()) return;

    const winnerId = gameState.winnerId;
    const winnerPlayer = gameState.players.find(p => p.id === winnerId);
    const winner = winnerPlayer?.name || winnerId || 'Unknown';

    try {
      // Create history entry for each player with a userId
      for (const player of gameState.players) {
        if (!player.userId) continue;

        await prisma.gameHistory.create({
          data: {
            userId: player.userId,
            roomId: gameState.roomId,
            roomName: gameState.roomName,
            players: gameState.players.map(p => ({
              id: p.id,
              name: p.name || 'Anonymous',
              score: p.score,
              position: p.position
            })),
            winner,
            isWinner: player.id === winnerId,
            playerScore: player.score,
            turnCount: gameState.turnCount || 0,
            duration,
            rulePackUsed: gameState.rulePackId
          }
        });
      }

      console.log(`[GameHistoryService] Game ${gameState.roomId} recorded for ${gameState.players.filter(p => p.userId).length} players`);
    } catch (error) {
      console.error('[GameHistoryService] Record game error:', error);
    }
  }

  /**
   * Get game history for a user
   */
  async getHistory(userId: string, limit: number = 20, offset: number = 0): Promise<GameHistoryEntry[]> {
    if (!await isDatabaseConnected()) return [];

    try {
      const history = await prisma.gameHistory.findMany({
        where: { userId },
        orderBy: { playedAt: 'desc' },
        skip: offset,
        take: limit
      });

      return history.map(h => ({
        id: h.id,
        userId: h.userId,
        roomId: h.roomId,
        roomName: h.roomName,
        players: h.players as any[],
        winner: h.winner,
        isWinner: h.isWinner,
        playerScore: h.playerScore,
        turnCount: h.turnCount,
        duration: h.duration,
        rulePackUsed: h.rulePackUsed,
        playedAt: h.playedAt
      }));
    } catch (error) {
      console.error('[GameHistoryService] Get history error:', error);
      return [];
    }
  }

  /**
   * Get game statistics for a user
   */
  async getStats(userId: string): Promise<GameStats> {
    if (!await isDatabaseConnected()) {
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        averageScore: 0,
        averageDuration: 0,
        totalPlayTime: 0,
        favoriteRulePack: null
      };
    }

    try {
      const history = await prisma.gameHistory.findMany({
        where: { userId }
      });

      if (history.length === 0) {
        return {
          totalGames: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          averageScore: 0,
          averageDuration: 0,
          totalPlayTime: 0,
          favoriteRulePack: null
        };
      }

      const wins = history.filter(h => h.isWinner).length;
      const totalScore = history.reduce((sum, h) => sum + h.playerScore, 0);
      const totalDuration = history.reduce((sum, h) => sum + h.duration, 0);

      // Find favorite rule pack
      const packCounts: Record<string, number> = {};
      for (const h of history) {
        if (h.rulePackUsed) {
          packCounts[h.rulePackUsed] = (packCounts[h.rulePackUsed] || 0) + 1;
        }
      }
      const favoriteRulePack = Object.entries(packCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

      return {
        totalGames: history.length,
        wins,
        losses: history.length - wins,
        winRate: Math.round((wins / history.length) * 100),
        averageScore: Math.round(totalScore / history.length),
        averageDuration: Math.round(totalDuration / history.length),
        totalPlayTime: totalDuration,
        favoriteRulePack
      };
    } catch (error) {
      console.error('[GameHistoryService] Get stats error:', error);
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        averageScore: 0,
        averageDuration: 0,
        totalPlayTime: 0,
        favoriteRulePack: null
      };
    }
  }

  /**
   * Get recent games against a specific opponent
   */
  async getGamesAgainst(userId: string, opponentName: string, limit: number = 10): Promise<GameHistoryEntry[]> {
    if (!await isDatabaseConnected()) return [];

    try {
      const history = await prisma.gameHistory.findMany({
        where: { userId },
        orderBy: { playedAt: 'desc' },
        take: 100 // Get more to filter
      });

      // Filter games where opponent was present
      const gamesAgainst = history.filter(h => {
        const players = h.players as any[];
        return players.some(p => p.name?.toLowerCase().includes(opponentName.toLowerCase()));
      });

      return gamesAgainst.slice(0, limit).map(h => ({
        id: h.id,
        userId: h.userId,
        roomId: h.roomId,
        roomName: h.roomName,
        players: h.players as any[],
        winner: h.winner,
        isWinner: h.isWinner,
        playerScore: h.playerScore,
        turnCount: h.turnCount,
        duration: h.duration,
        rulePackUsed: h.rulePackUsed,
        playedAt: h.playedAt
      }));
    } catch (error) {
      console.error('[GameHistoryService] Get games against error:', error);
      return [];
    }
  }

  /**
   * Get win streak
   */
  async getWinStreak(userId: string): Promise<{ current: number; best: number }> {
    if (!await isDatabaseConnected()) return { current: 0, best: 0 };

    try {
      const history = await prisma.gameHistory.findMany({
        where: { userId },
        orderBy: { playedAt: 'desc' }
      });

      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;

      for (let i = 0; i < history.length; i++) {
        if (history[i].isWinner) {
          tempStreak++;
          if (i === 0) currentStreak = tempStreak;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 0;
          if (i === 0) currentStreak = 0;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);

      return { current: currentStreak, best: bestStreak };
    } catch (error) {
      console.error('[GameHistoryService] Get win streak error:', error);
      return { current: 0, best: 0 };
    }
  }

  /**
   * Delete game history for a user
   */
  async deleteHistory(userId: string): Promise<{ success: boolean; count: number }> {
    if (!await isDatabaseConnected()) {
      return { success: false, count: 0 };
    }

    try {
      const result = await prisma.gameHistory.deleteMany({
        where: { userId }
      });

      console.log(`[GameHistoryService] Deleted ${result.count} history entries for user ${userId}`);
      return { success: true, count: result.count };
    } catch (error) {
      console.error('[GameHistoryService] Delete history error:', error);
      return { success: false, count: 0 };
    }
  }

  /**
   * Get history count for a user
   */
  async getHistoryCount(userId: string): Promise<number> {
    if (!await isDatabaseConnected()) return 0;

    try {
      return await prisma.gameHistory.count({
        where: { userId }
      });
    } catch (error) {
      return 0;
    }
  }
}

export const gameHistoryService = new GameHistoryService();
export default gameHistoryService;
