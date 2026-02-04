import { prisma, isDatabaseConnected } from '../config/prisma';
import { GameState } from '../types/game';
import { PlayerColor, GameStatus } from '@prisma/client';

/**
 * Service de gestion des parties avec Prisma
 */

// Mapping des couleurs
const colorMap: Record<string, PlayerColor> = {
    'cyan': PlayerColor.CYAN,
    'violet': PlayerColor.VIOLET,
    'orange': PlayerColor.ORANGE,
    'green': PlayerColor.GREEN,
};

const colorMapReverse: Record<PlayerColor, string> = {
    [PlayerColor.CYAN]: 'cyan',
    [PlayerColor.VIOLET]: 'violet',
    [PlayerColor.ORANGE]: 'orange',
    [PlayerColor.GREEN]: 'green',
};

class GameService {
    /**
     * Sauvegarde l'état d'une partie dans PostgreSQL
     */
    async saveGameState(gameState: GameState): Promise<void> {
        if (!await isDatabaseConnected()) {
            console.log('⚠️ [GameService] DB non connectée, sauvegarde ignorée');
            return;
        }

        try {
            // Upsert de la session
            await prisma.gameSession.upsert({
                where: { roomId: gameState.roomId },
                update: {
                    currentTurn: gameState.currentTurn,
                    status: gameState.status === 'finished' ? GameStatus.FINISHED :
                            gameState.status === 'playing' ? GameStatus.PLAYING : GameStatus.WAITING,
                    winnerId: gameState.winnerId,
                    lastActivity: new Date(),
                },
                create: {
                    roomId: gameState.roomId,
                    maxPlayers: 4,
                    currentTurn: gameState.currentTurn,
                    status: GameStatus.PLAYING,
                },
            });

            // Upsert des joueurs
            for (const player of gameState.players) {
                await prisma.player.upsert({
                    where: {
                        id: player.id,
                    },
                    update: {
                        position: player.position,
                        score: player.score,
                        isConnected: true,
                        lastSeen: new Date(),
                    },
                    create: {
                        id: player.id,
                        socketId: player.id,
                        name: player.name || 'Anonymous',
                        color: colorMap[player.color] || PlayerColor.CYAN,
                        position: player.position,
                        score: player.score,
                        gameSession: {
                            connect: { roomId: gameState.roomId }
                        }
                    },
                });
            }

            console.log(`💾 [GameService] Partie ${gameState.roomId} sauvegardée`);
        } catch (error) {
            console.error(`❌ [GameService] Erreur sauvegarde:`, error);
        }
    }

    /**
     * Sauvegarde asynchrone sans bloquer
     */
    saveGameStateAsync(gameState: GameState): void {
        this.saveGameState(gameState).catch(err => {
            console.error('❌ [GameService] Erreur sauvegarde async:', err);
        });
    }

    /**
     * Restaure une session depuis PostgreSQL
     */
    async restoreGameSession(roomId: string): Promise<GameState | null> {
        if (!await isDatabaseConnected()) {
            return null;
        }

        try {
            const session = await prisma.gameSession.findUnique({
                where: { roomId },
                include: {
                    players: true,
                    rules: true,
                },
            });

            if (!session) return null;

            const gameState: GameState = {
                roomId: session.roomId,
                tiles: Array.from({ length: 20 }, (_, i) => ({
                    id: `tile-${i}`,
                    index: i,
                    type: i === 0 ? 'start' : 'normal' as any,
                    position: { x: i - 10, y: 0 },
                    connections: i > 0 ? [`tile-${i - 1}`] : [],
                })),
                players: session.players.map(p => ({
                    id: p.socketId,
                    name: p.name,
                    color: colorMapReverse[p.color] as any,
                    position: p.position,
                    score: p.score,
                })),
                currentTurn: session.currentTurn,
                status: session.status === GameStatus.FINISHED ? 'finished' :
                        session.status === GameStatus.PLAYING ? 'playing' : 'waiting',
                winnerId: session.winnerId,
                activeRules: session.rules.map(r => ({
                    id: r.ruleId,
                    title: r.title,
                    trigger: r.trigger as any,
                    tileIndex: r.tileIndex ?? undefined,
                    conditions: r.conditions as any[] || [],
                    effects: r.effects as any[],
                    priority: r.priority,
                })),
                coreRules: [],
                boardConfig: {
                    minTiles: 10,
                    maxTiles: 50,
                    allowTileModification: true,
                    allowRuleModification: true,
                    modificationsPerTurn: 1,
                },
            };

            console.log(`📂 [GameService] Session ${roomId} restaurée`);
            return gameState;
        } catch (error) {
            console.error(`❌ [GameService] Erreur restauration:`, error);
            return null;
        }
    }

    /**
     * Met à jour le statut de connexion d'un joueur
     */
    async updatePlayerConnection(roomId: string, socketId: string, isConnected: boolean): Promise<void> {
        try {
            await prisma.player.updateMany({
                where: { socketId, gameSession: { roomId } },
                data: {
                    isConnected,
                    lastSeen: new Date(),
                },
            });
        } catch (error) {
            console.error('❌ [GameService] Erreur mise à jour connexion:', error);
        }
    }

    /**
     * Supprime une session
     */
    async deleteGameSession(roomId: string): Promise<void> {
        try {
            await prisma.gameSession.delete({ where: { roomId } });
            console.log(`🗑️ [GameService] Session ${roomId} supprimée`);
        } catch (error) {
            console.error(`❌ [GameService] Erreur suppression:`, error);
        }
    }

    /**
     * Crée une nouvelle session de jeu
     */
    async createGameSession(data: {
        roomId: string;
        roomName?: string;
        password?: string;
        maxPlayers: number;
        allowRuleEdit: boolean;
        isLocal: boolean;
        rulePackId?: string;
    }): Promise<void> {
        try {
            await prisma.gameSession.create({
                data: {
                    roomId: data.roomId,
                    roomName: data.roomName,
                    password: data.password,
                    maxPlayers: data.maxPlayers,
                    allowRuleEdit: data.allowRuleEdit,
                    isLocal: data.isLocal,
                    rulePackId: data.rulePackId,
                    status: GameStatus.WAITING,
                },
            });
            console.log(`✨ [GameService] Session ${data.roomId} créée`);
        } catch (error) {
            console.error('❌ [GameService] Erreur création session:', error);
        }
    }

    /**
     * Vérifie le mot de passe d'une session
     */
    async verifyPassword(roomId: string, password: string): Promise<boolean> {
        try {
            const session = await prisma.gameSession.findUnique({
                where: { roomId },
                select: { password: true },
            });
            if (!session) return false;
            if (!session.password) return true; // Pas de mot de passe requis
            return session.password === password; // TODO: hash comparison
        } catch {
            return false;
        }
    }
}

export const gameService = new GameService();
export default gameService;
