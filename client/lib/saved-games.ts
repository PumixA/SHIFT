// Système de sauvegarde des parties

import { Rule } from "@/src/types/rules"

export interface SavedGame {
    id: string
    name: string
    mode: "local" | "online"
    createdAt: string
    updatedAt: string
    players: {
        name: string
        color: "cyan" | "violet" | "orange" | "green"
        position: number
        score: number
    }[]
    tiles: {
        id: string
        x: number
        y: number
        type: "normal" | "special" | "start" | "end"
        directions?: ("up" | "down" | "left" | "right")[]
    }[]
    rules: Rule[]
    currentTurnIndex: number
    status: "waiting" | "playing" | "paused" | "finished"
    settings: {
        allowRuleEdit: boolean
        allowTileEdit: boolean
        maxModificationsPerTurn: number
    }
}

const STORAGE_KEY = "shift_saved_games"

export function getSavedGames(): SavedGame[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
}

export function getSavedGame(id: string): SavedGame | null {
    const games = getSavedGames()
    return games.find((g) => g.id === id) || null
}

export function saveGame(
    game: Omit<SavedGame, "id" | "createdAt" | "updatedAt"> & { id?: string; name: string }
): SavedGame {
    const games = getSavedGames()
    const now = new Date().toISOString()

    if (game.id) {
        // Mise à jour
        const index = games.findIndex((g) => g.id === game.id)
        if (index >= 0) {
            const updatedGame: SavedGame = {
                ...games[index],
                ...game,
                updatedAt: now,
            }
            games[index] = updatedGame
            localStorage.setItem(STORAGE_KEY, JSON.stringify(games))
            return updatedGame
        }
    }

    // Nouvelle sauvegarde
    const newGame: SavedGame = {
        ...game,
        id: `save-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
    }
    games.push(newGame)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games))
    return newGame
}

export function deleteSavedGame(id: string): void {
    const games = getSavedGames().filter((g) => g.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games))
}

export function renameSavedGame(id: string, newName: string): void {
    const games = getSavedGames()
    const index = games.findIndex((g) => g.id === id)
    if (index >= 0) {
        games[index].name = newName
        games[index].updatedAt = new Date().toISOString()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(games))
    }
}

export function exportSavedGame(id: string): string {
    const game = getSavedGame(id)
    if (!game) return ""
    return JSON.stringify(game, null, 2)
}

export function importSavedGame(jsonString: string): SavedGame | null {
    try {
        const game = JSON.parse(jsonString) as SavedGame
        // Valider les données minimales
        if (!game.name || !game.players || !game.tiles) {
            return null
        }
        return saveGame({
            ...game,
            id: undefined, // Créer un nouvel ID
            name: `${game.name} (Import)`,
        })
    } catch {
        return null
    }
}
