"use client"

import { useCallback, useState } from "react"
import { socket } from "@/services/socket"
import { toast } from "sonner"
import type { Tile } from "./useGameState"
import type { TurnPhase } from "./useTurnManagement"

export interface LocalAction {
    type: string
    playerId: string
    playerName?: string
    playerColor?: string
    description: string
    details?: Record<string, unknown>
    turnNumber?: number
}

export interface UseTileManagementProps {
    isLocalMode: boolean
    activeRoom: string | null
    canModifyTilesNow: boolean
    turnPhase: TurnPhase
    tiles: Tile[]
    setTiles: React.Dispatch<React.SetStateAction<Tile[]>>
    markModificationDone: () => void
    onLocalAction?: (action: LocalAction) => void
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

            const newTile: Tile = {
                id: `tile-${Date.now()}`,
                x: newX,
                y: newY,
                type: "normal",
                connections: [tiles.find((t) => t.x === baseTile.x && t.y === baseTile.y)?.id || ""],
            }

            if (isLocalMode) {
                setTiles((prev) => [...prev, newTile])
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
                setTiles((prev) => prev.filter((t) => t.id !== tileId))
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
        openTileSelectionModal,
        handleTileDetails,
    }
}
