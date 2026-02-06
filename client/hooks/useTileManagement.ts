"use client"

import { useCallback, useState } from "react"
import { socket } from "@/services/socket"
import { toast } from "sonner"
import type { Tile, TileDirection } from "./useGameState"

const OPPOSITE_DIRECTION: Record<TileDirection, TileDirection> = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
}
import type { TurnPhase } from "./useTurnManagement"
import type { GameAction } from "@/components/game/action-history"

export interface UseTileManagementProps {
    isLocalMode: boolean
    activeRoom: string | null
    canModifyTilesNow: boolean
    turnPhase: TurnPhase
    tiles: Tile[]
    setTiles: React.Dispatch<React.SetStateAction<Tile[]>>
    markModificationDone: () => void
    onLocalAction?: (action: Omit<GameAction, "id" | "timestamp">) => void
    currentPlayer?: { id: string | number; name: string; color: string }
    turnNumber?: number
}

export interface UseTileManagementReturn {
    // State
    tileSelectionModalOpen: boolean
    setTileSelectionModalOpen: React.Dispatch<React.SetStateAction<boolean>>
    tileSelectionMode: "add" | "remove"
    setTileSelectionMode: React.Dispatch<React.SetStateAction<"add" | "remove">>
    tileDetailOpen: boolean
    setTileDetailOpen: React.Dispatch<React.SetStateAction<boolean>>
    selectedTileIndex: number
    setSelectedTileIndex: React.Dispatch<React.SetStateAction<number>>

    // Actions
    handleAddTile: (direction: "up" | "down" | "left" | "right", fromTile?: { x: number; y: number }) => void
    handleRemoveTile: (tileId: string) => void
    handleChangeDirections: (tileId: string, newDirections: TileDirection[]) => void
    openTileSelectionModal: (mode: "add" | "remove") => void
    handleTileDetails: (index: number) => void
}

export function useTileManagement({
    isLocalMode,
    activeRoom,
    canModifyTilesNow,
    turnPhase,
    tiles,
    setTiles,
    markModificationDone,
    onLocalAction,
    currentPlayer,
    turnNumber,
}: UseTileManagementProps): UseTileManagementReturn {
    const [tileSelectionModalOpen, setTileSelectionModalOpen] = useState(false)
    const [tileSelectionMode, setTileSelectionMode] = useState<"add" | "remove">("add")
    const [tileDetailOpen, setTileDetailOpen] = useState(false)
    const [selectedTileIndex, setSelectedTileIndex] = useState<number>(0)

    const handleAddTile = useCallback(
        (direction: "up" | "down" | "left" | "right", fromTile?: { x: number; y: number }) => {
            if (!canModifyTilesNow) {
                if (turnPhase === "ROLL") {
                    toast.warning("Lancez le dé d'abord")
                } else {
                    toast.error("Vous ne pouvez pas modifier le plateau maintenant")
                }
                return
            }

            const baseTile = fromTile || tiles[tiles.length - 1]
            let newX = baseTile.x
            let newY = baseTile.y

            switch (direction) {
                case "up":
                    newY -= 1
                    break
                case "down":
                    newY += 1
                    break
                case "left":
                    newX -= 1
                    break
                case "right":
                    newX += 1
                    break
            }

            if (tiles.some((t) => t.x === newX && t.y === newY)) {
                toast.error("Une case existe déjà à cet endroit")
                return
            }

            // New tile gets the opposite direction (link back to source)
            const oppositeDir = OPPOSITE_DIRECTION[direction]
            const newDirections: TileDirection[] =
                direction === "right" || direction === "left" ? [oppositeDir] : [oppositeDir, "right"]

            const newTile: Tile = {
                id: `tile-${Date.now()}`,
                x: newX,
                y: newY,
                type: "normal",
                connections: [],
                directions: newDirections,
            }

            if (isLocalMode) {
                const baseTileId = tiles.find((t) => t.x === baseTile.x && t.y === baseTile.y)?.id
                setTiles((prev) => {
                    const withNewTile = [...prev, newTile]
                    // Add the direction to the source tile so it connects to the new tile
                    if (baseTileId) {
                        return withNewTile.map((t) => {
                            if (t.id === baseTileId && !t.directions.includes(direction)) {
                                return { ...t, directions: [...t.directions, direction] }
                            }
                            return t
                        })
                    }
                    return withNewTile
                })
                toast.success("Case ajoutée !")
                markModificationDone()

                // Track action
                if (onLocalAction && currentPlayer) {
                    onLocalAction({
                        type: "tile_added",
                        playerId: String(currentPlayer.id),
                        playerName: currentPlayer.name,
                        playerColor: currentPlayer.color,
                        description: `${currentPlayer.name} ajoute une case en position (${newX}, ${newY})`,
                        details: { tileId: newTile.id, x: newX, y: newY, direction },
                        turnNumber,
                    })
                }
            } else if (activeRoom) {
                socket.emit("modify_tile", { type: "add", position: { x: newX, y: newY }, tileType: "normal" })
            }
        },
        [
            canModifyTilesNow,
            turnPhase,
            tiles,
            isLocalMode,
            activeRoom,
            markModificationDone,
            setTiles,
            onLocalAction,
            currentPlayer,
            turnNumber,
        ]
    )

    const handleRemoveTile = useCallback(
        (tileId: string) => {
            if (!canModifyTilesNow) {
                if (turnPhase === "ROLL") {
                    toast.warning("Lancez le dé d'abord")
                } else {
                    toast.error("Vous ne pouvez pas modifier le plateau maintenant")
                }
                return
            }

            const tile = tiles.find((t) => t.id === tileId)
            if (tile?.type === "start") {
                toast.error("Impossible de supprimer la case de départ")
                return
            }

            if (isLocalMode) {
                const removedTile = tiles.find((t) => t.id === tileId)
                setTiles((prev) => {
                    const without = prev.filter((t) => t.id !== tileId)
                    if (!removedTile) return without
                    // Remove directions pointing toward the removed tile from neighbors
                    return without.map((t) => {
                        const dx = removedTile.x - t.x
                        const dy = removedTile.y - t.y
                        let dirToRemoved: TileDirection | null = null
                        if (dx === 1 && dy === 0) dirToRemoved = "right"
                        else if (dx === -1 && dy === 0) dirToRemoved = "left"
                        else if (dx === 0 && dy === 1) dirToRemoved = "down"
                        else if (dx === 0 && dy === -1) dirToRemoved = "up"
                        if (dirToRemoved && t.directions.includes(dirToRemoved)) {
                            const newDirs = t.directions.filter((d) => d !== dirToRemoved)
                            // Keep at least one direction if possible
                            return { ...t, directions: newDirs.length > 0 ? newDirs : t.directions }
                        }
                        return t
                    })
                })
                toast.success("Case supprimée")
                markModificationDone()

                // Track action
                if (onLocalAction && currentPlayer && removedTile) {
                    onLocalAction({
                        type: "tile_removed",
                        playerId: String(currentPlayer.id),
                        playerName: currentPlayer.name,
                        playerColor: currentPlayer.color,
                        description: `${currentPlayer.name} supprime une case en position (${removedTile.x}, ${removedTile.y})`,
                        details: { tileId, x: removedTile.x, y: removedTile.y },
                        turnNumber,
                    })
                }
            } else if (activeRoom) {
                socket.emit("modify_tile", { type: "remove", tileId })
            }
        },
        [
            canModifyTilesNow,
            turnPhase,
            tiles,
            isLocalMode,
            activeRoom,
            markModificationDone,
            setTiles,
            onLocalAction,
            currentPlayer,
            turnNumber,
        ]
    )

    const openTileSelectionModal = useCallback(
        (mode: "add" | "remove") => {
            if (!canModifyTilesNow) {
                if (turnPhase === "ROLL") {
                    toast.warning("Lancez le dé d'abord")
                } else {
                    toast.error("Vous ne pouvez pas modifier le plateau maintenant")
                }
                return
            }
            setTileSelectionMode(mode)
            setTileSelectionModalOpen(true)
        },
        [canModifyTilesNow, turnPhase]
    )

    const handleChangeDirections = useCallback(
        (tileId: string, newDirections: TileDirection[]) => {
            if (!canModifyTilesNow) {
                if (turnPhase === "ROLL") {
                    toast.warning("Lancez le dé d'abord")
                } else {
                    toast.error("Vous ne pouvez pas modifier le plateau maintenant")
                }
                return
            }

            if (newDirections.length === 0) {
                toast.error("Au moins une direction doit rester active")
                return
            }

            const tile = tiles.find((t) => t.id === tileId)
            if (!tile) return

            if (isLocalMode) {
                setTiles((prev) => prev.map((t) => (t.id === tileId ? { ...t, directions: newDirections } : t)))
                toast.success("Directions modifiées !")
                markModificationDone()

                if (onLocalAction && currentPlayer) {
                    onLocalAction({
                        type: "tile_direction_changed",
                        playerId: String(currentPlayer.id),
                        playerName: currentPlayer.name,
                        playerColor: currentPlayer.color,
                        description: `${currentPlayer.name} modifie les directions de la case (${tile.x}, ${tile.y})`,
                        details: { tileId, x: tile.x, y: tile.y, directions: newDirections },
                        turnNumber,
                    })
                }
            }
        },
        [
            canModifyTilesNow,
            turnPhase,
            tiles,
            isLocalMode,
            markModificationDone,
            setTiles,
            onLocalAction,
            currentPlayer,
            turnNumber,
        ]
    )

    const handleTileDetails = useCallback((index: number) => {
        setSelectedTileIndex(index)
        setTileDetailOpen(true)
    }, [])

    return {
        tileSelectionModalOpen,
        setTileSelectionModalOpen,
        tileSelectionMode,
        setTileSelectionMode,
        tileDetailOpen,
        setTileDetailOpen,
        selectedTileIndex,
        setSelectedTileIndex,
        handleAddTile,
        handleRemoveTile,
        handleChangeDirections,
        openTileSelectionModal,
        handleTileDetails,
    }
}
