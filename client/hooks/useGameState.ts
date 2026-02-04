"use client"

import { useState, useCallback, useMemo } from "react"
import { Rule } from "@/src/types/rules"

// --- Interfaces ---
export interface Tile {
    id: string
    x: number
    y: number
    type: "normal" | "special" | "start" | "end"
    connections?: string[]
}

export interface Player {
    id: number | string
    name: string
    avatar: string
    score: number
    color: "cyan" | "violet" | "orange" | "green"
    position: { x: number; y: number }
    isHost?: boolean
    isBot?: boolean
    botDifficulty?: 'easy' | 'medium' | 'hard'
}

export interface GameConfig {
    mode: "local" | "online"
    action?: "create" | "join"
    players?: { name: string; color: string; isBot?: boolean; botDifficulty?: 'easy' | 'medium' | 'hard' }[]
    roomName?: string
    roomCode?: string
    password?: string
    maxPlayers?: number
    playerName?: string
    allowRuleEdit?: boolean
    allowTileEdit?: boolean
    rulePackId?: string
}

export interface ServerPlayer {
    id: string
    name?: string
    color: 'cyan' | 'violet' | 'orange' | 'green'
    position: number
    score: number
    isHost?: boolean
    hasPlayedThisTurn?: boolean
    hasModifiedThisTurn?: boolean
}

export type GameStatus = 'waiting' | 'playing' | 'finished'

// --- Constants ---
const createInitialTiles = (): Tile[] => Array.from({ length: 20 }, (_, i) => ({
    id: `tile-${i}`,
    x: i - 10,
    y: 0,
    type: i === 0 ? "start" : "normal" as const,
    connections: [
        ...(i > 0 ? [`tile-${i - 1}`] : []),
        ...(i < 19 ? [`tile-${i + 1}`] : [])
    ],
}))

export interface UseGameStateReturn {
    // State
    tiles: Tile[]
    setTiles: React.Dispatch<React.SetStateAction<Tile[]>>
    players: Player[]
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
    rules: Rule[]
    setRules: React.Dispatch<React.SetStateAction<Rule[]>>
    coreRules: Rule[]
    setCoreRules: React.Dispatch<React.SetStateAction<Rule[]>>
    winner: { id: string; name: string; color?: string } | null
    setWinner: React.Dispatch<React.SetStateAction<{ id: string; name: string; color?: string } | null>>
    gameStatus: GameStatus
    setGameStatus: React.Dispatch<React.SetStateAction<GameStatus>>

    // Computed
    allRules: Rule[]
    isLocalMode: boolean

    // Helpers
    getCoordinatesFromIndex: (index: number) => { x: number; y: number }
    getTileIndexFromCoords: (x: number, y: number) => number
    mapServerPlayersToClient: (serverPlayers: ServerPlayer[]) => Player[]
}

export function useGameState(gameConfig?: GameConfig): UseGameStateReturn {
    // Core state
    const [tiles, setTiles] = useState<Tile[]>(createInitialTiles)
    const [players, setPlayers] = useState<Player[]>([])
    const [rules, setRules] = useState<Rule[]>([])
    const [coreRules, setCoreRules] = useState<Rule[]>([])
    const [winner, setWinner] = useState<{ id: string; name: string; color?: string } | null>(null)
    const [gameStatus, setGameStatus] = useState<GameStatus>('waiting')

    // Computed
    const isLocalMode = gameConfig?.mode === 'local'
    const allRules = useMemo(() => [...rules, ...coreRules], [rules, coreRules])

    // Helpers
    const getCoordinatesFromIndex = useCallback((index: number) => {
        const tile = tiles[index]
        if (tile) return { x: tile.x, y: tile.y }
        return { x: -10, y: 0 }
    }, [tiles])

    const getTileIndexFromCoords = useCallback((x: number, y: number) => {
        return tiles.findIndex(t => t.x === x && t.y === y)
    }, [tiles])

    const mapServerPlayersToClient = useCallback((serverPlayers: ServerPlayer[]): Player[] => {
        return serverPlayers.map((p, idx) => {
            const tileIndex = Math.min(p.position, tiles.length - 1)
            const coords = getCoordinatesFromIndex(tileIndex)
            return {
                id: p.id,
                name: p.name || `Joueur ${idx + 1}`,
                avatar: `/cyberpunk-avatar-${(idx % 4) + 1}.png`,
                score: p.score,
                color: p.color,
                position: coords,
                isHost: p.isHost,
            }
        })
    }, [getCoordinatesFromIndex, tiles.length])

    return {
        tiles,
        setTiles,
        players,
        setPlayers,
        rules,
        setRules,
        coreRules,
        setCoreRules,
        winner,
        setWinner,
        gameStatus,
        setGameStatus,
        allRules,
        isLocalMode,
        getCoordinatesFromIndex,
        getTileIndexFromCoords,
        mapServerPlayersToClient,
    }
}
