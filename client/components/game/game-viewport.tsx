"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle, useMemo } from "react"
import { ZoomIn, ZoomOut, Move, Crosshair, Zap, Info, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import type { Tile, Player } from "@/hooks/useGameState"
import type { Rule } from "@/src/types/rules"

export interface GameViewportRef {
    centerOnTile: (x: number, y: number) => void
    zoomIn: () => void
    zoomOut: () => void
}

interface GameViewportProps {
    tiles: Tile[]
    players: Player[]
    currentTurn: number | string
    onAddTile: (direction: "up" | "down" | "left" | "right", fromTile?: { x: number; y: number }) => void
    onCenterCamera: () => void
    isSelectionMode?: boolean
    onTileClick?: (index: number) => void
    rules?: Rule[]
    onTileDetails?: (index: number) => void
    isRemoveTileMode?: boolean
    onRemoveTile?: (tileId: string) => void
    canModifyTiles?: boolean
}

const TILE_SIZE = 64
const TILE_GAP = 8
const TOTAL_TILE_SIZE = TILE_SIZE + TILE_GAP

export const GameViewport = forwardRef<GameViewportRef, GameViewportProps>(
    (
        {
            tiles,
            players,
            currentTurn,
            onAddTile,
            onCenterCamera,
            isSelectionMode,
            onTileClick,
            rules = [],
            onTileDetails,
            isRemoveTileMode,
            onRemoveTile,
            canModifyTiles = true,
        },
        ref
    ) => {
        const containerRef = useRef<HTMLDivElement>(null)
        const [pan, setPan] = useState({ x: 0, y: 0 })
        const [zoom, setZoom] = useState(1)
        const [isDragging, setIsDragging] = useState(false)
        const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
        const [isInitialized, setIsInitialized] = useState(false)
        const [selectedTileForExpand, setSelectedTileForExpand] = useState<{ x: number; y: number } | null>(null)

        // Récupérer les règles pour une case spécifique
        const getRulesForTile = useCallback(
            (tileIndex: number) => {
                return rules.filter((rule) => {
                    const triggerType = typeof rule.trigger === "object" ? rule.trigger.type : rule.trigger

                    // Seulement les triggers basés sur les cases
                    if (
                        triggerType !== "ON_LAND" &&
                        triggerType !== "ON_PASS_OVER" &&
                        triggerType !== "ON_REACH_POSITION"
                    ) {
                        return false
                    }

                    // Valeur du trigger
                    const triggerValue = typeof rule.trigger === "object" ? rule.trigger.value : null

                    // PAS de règles globales - seulement les règles avec une case spécifique
                    if (triggerValue === null || triggerValue === undefined) {
                        return false
                    }

                    return Number(triggerValue) === tileIndex
                })
            },
            [rules]
        )

        // Vérifier si une position est occupée par une case
        const isTileAt = useCallback(
            (x: number, y: number) => {
                return tiles.some((t) => t.x === x && t.y === y)
            },
            [tiles]
        )

        // Obtenir les directions disponibles pour ajouter une case
        const getAvailableDirections = useCallback(
            (tileX: number, tileY: number) => {
                const directions: { dir: "up" | "down" | "left" | "right"; x: number; y: number }[] = []
                if (!isTileAt(tileX, tileY - 1)) directions.push({ dir: "up", x: tileX, y: tileY - 1 })
                if (!isTileAt(tileX, tileY + 1)) directions.push({ dir: "down", x: tileX, y: tileY + 1 })
                if (!isTileAt(tileX - 1, tileY)) directions.push({ dir: "left", x: tileX - 1, y: tileY })
                if (!isTileAt(tileX + 1, tileY)) directions.push({ dir: "right", x: tileX + 1, y: tileY })
                return directions
            },
            [isTileAt]
        )

        const worldBounds = useMemo(() => {
            if (tiles.length === 0) {
                return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, offsetX: 0, offsetY: 0 }
            }

            const bounds = tiles.reduce(
                (acc, tile) => ({
                    minX: Math.min(acc.minX, tile.x),
                    maxX: Math.max(acc.maxX, tile.x),
                    minY: Math.min(acc.minY, tile.y),
                    maxY: Math.max(acc.maxY, tile.y),
                }),
                {
                    minX: Number.POSITIVE_INFINITY,
                    maxX: Number.NEGATIVE_INFINITY,
                    minY: Number.POSITIVE_INFINITY,
                    maxY: Number.NEGATIVE_INFINITY,
                }
            )

            const padding = 5
            const width = (bounds.maxX - bounds.minX + 1 + padding * 2) * TOTAL_TILE_SIZE
            const height = (bounds.maxY - bounds.minY + 1 + padding * 2) * TOTAL_TILE_SIZE

            const offsetX = (-bounds.minX + padding) * TOTAL_TILE_SIZE
            const offsetY = (-bounds.minY + padding) * TOTAL_TILE_SIZE

            return { ...bounds, width, height, offsetX, offsetY }
        }, [tiles])

        const tileToWorld = useCallback(
            (tileX: number, tileY: number) => ({
                x: tileX * TOTAL_TILE_SIZE + worldBounds.offsetX,
                y: tileY * TOTAL_TILE_SIZE + worldBounds.offsetY,
            }),
            [worldBounds.offsetX, worldBounds.offsetY]
        )

        const centerOnTile = useCallback(
            (tileX: number, tileY: number) => {
                if (!containerRef.current) return
                const rect = containerRef.current.getBoundingClientRect()
                const worldPos = tileToWorld(tileX, tileY)

                setPan({
                    x: rect.width / 2 - (worldPos.x + TILE_SIZE / 2) * zoom,
                    y: rect.height / 2 - (worldPos.y + TILE_SIZE / 2) * zoom,
                })
            },
            [tileToWorld, zoom]
        )

        const zoomIn = useCallback(() => {
            setZoom((prev) => Math.min(prev * 1.2, 2))
        }, [])

        const zoomOut = useCallback(() => {
            setZoom((prev) => Math.max(prev * 0.8, 0.3))
        }, [])

        useImperativeHandle(
            ref,
            () => ({
                centerOnTile,
                zoomIn,
                zoomOut,
            }),
            [centerOnTile, zoomIn, zoomOut]
        )

        // Centrer le plateau au démarrage
        useEffect(() => {
            if (containerRef.current && !isInitialized && tiles.length > 0) {
                const rect = containerRef.current.getBoundingClientRect()
                const centerTileX = Math.floor((worldBounds.minX + worldBounds.maxX) / 2)
                const centerTileY = Math.floor((worldBounds.minY + worldBounds.maxY) / 2)
                const worldPos = tileToWorld(centerTileX, centerTileY)

                setPan({
                    x: rect.width / 2 - worldPos.x,
                    y: rect.height / 2 - worldPos.y,
                })
                setIsInitialized(true)
            }
        }, [tiles.length, worldBounds, tileToWorld, isInitialized])

        const handleMouseDown = useCallback(
            (e: React.MouseEvent) => {
                if (e.button === 0) {
                    setIsDragging(true)
                    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
                }
            },
            [pan]
        )

        const handleMouseMove = useCallback(
            (e: React.MouseEvent) => {
                if (isDragging) {
                    setPan({
                        x: e.clientX - dragStart.x,
                        y: e.clientY - dragStart.y,
                    })
                }
            },
            [isDragging, dragStart]
        )

        const handleMouseUp = useCallback(() => {
            setIsDragging(false)
        }, [])

        const handleWheel = useCallback((e: React.WheelEvent) => {
            e.preventDefault()
            const delta = e.deltaY > 0 ? 0.9 : 1.1
            setZoom((prev) => Math.min(Math.max(prev * delta, 0.3), 2))
        }, [])

        const handleAddTileFromTile = (tile: Tile, direction: "up" | "down" | "left" | "right") => {
            onAddTile(direction, { x: tile.x, y: tile.y })
        }

        return (
            <div
                className={`absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 ${isSelectionMode ? "cursor-crosshair" : ""}`}
            >
                {/* Grille de fond */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
            `,
                        backgroundSize: `${TOTAL_TILE_SIZE * zoom}px ${TOTAL_TILE_SIZE * zoom}px`,
                        backgroundPosition: `${pan.x}px ${pan.y}px`,
                    }}
                />

                {/* Viewport */}
                <div
                    ref={containerRef}
                    className={`absolute inset-0 overflow-hidden ${isSelectionMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
                    onMouseDown={!isSelectionMode ? handleMouseDown : undefined}
                    onMouseMove={!isSelectionMode ? handleMouseMove : undefined}
                    onMouseUp={!isSelectionMode ? handleMouseUp : undefined}
                    onMouseLeave={!isSelectionMode ? handleMouseUp : undefined}
                    onWheel={handleWheel}
                >
                    <div
                        className="absolute"
                        style={{
                            width: worldBounds.width,
                            height: worldBounds.height,
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: "0 0",
                        }}
                    >
                        {/* Cases */}
                        {tiles.map((tile, index) => {
                            const worldPos = tileToWorld(tile.x, tile.y)
                            const tileRules = getRulesForTile(index)
                            const availableDirections = getAvailableDirections(tile.x, tile.y)

                            return (
                                <ContextMenu key={tile.id}>
                                    <ContextMenuTrigger asChild>
                                        <div style={{ position: "absolute", left: worldPos.x, top: worldPos.y }}>
                                            <GameTile
                                                tile={tile}
                                                index={index}
                                                isSelectionMode={isSelectionMode}
                                                isRemoveTileMode={isRemoveTileMode}
                                                onClick={() => {
                                                    if (isSelectionMode && onTileClick) {
                                                        onTileClick(index)
                                                    } else if (isRemoveTileMode && onRemoveTile) {
                                                        onRemoveTile(tile.id)
                                                    } else if (onTileDetails) {
                                                        onTileDetails(index)
                                                    }
                                                }}
                                                rules={tileRules}
                                                showExpandButtons={
                                                    !!(
                                                        canModifyTiles &&
                                                        selectedTileForExpand?.x === tile.x &&
                                                        selectedTileForExpand?.y === tile.y
                                                    )
                                                }
                                                availableDirections={availableDirections}
                                                onAddTile={(dir) => handleAddTileFromTile(tile, dir)}
                                            />
                                        </div>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        <ContextMenuItem onClick={() => onTileDetails?.(index)}>
                                            <Info className="mr-2 h-4 w-4" />
                                            Voir les détails
                                        </ContextMenuItem>
                                        {canModifyTiles ? (
                                            <>
                                                <ContextMenuSeparator />
                                                {availableDirections.map(({ dir }) => (
                                                    <ContextMenuItem
                                                        key={dir}
                                                        onClick={() => handleAddTileFromTile(tile, dir)}
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Ajouter case{" "}
                                                        {dir === "up"
                                                            ? "en haut"
                                                            : dir === "down"
                                                              ? "en bas"
                                                              : dir === "left"
                                                                ? "à gauche"
                                                                : "à droite"}
                                                    </ContextMenuItem>
                                                ))}
                                                {tile.type !== "start" && tile.type !== "end" && (
                                                    <>
                                                        <ContextMenuSeparator />
                                                        <ContextMenuItem
                                                            onClick={() => onRemoveTile?.(tile.id)}
                                                            className="text-red-400"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Supprimer cette case
                                                        </ContextMenuItem>
                                                    </>
                                                )}
                                            </>
                                        ) : null}
                                    </ContextMenuContent>
                                </ContextMenu>
                            )
                        })}

                        {/* Joueurs */}
                        {players.map((player) => {
                            const worldPos = tileToWorld(player.position.x, player.position.y)
                            return (
                                <PlayerToken
                                    key={player.id}
                                    player={player}
                                    x={worldPos.x}
                                    y={worldPos.y}
                                    isActive={player.id === currentTurn || String(player.id) === String(currentTurn)}
                                    playerIndex={players.findIndex((p) => p.id === player.id)}
                                    totalPlayers={players.length}
                                />
                            )
                        })}
                    </div>
                </div>

                {/* Contrôles de zoom */}
                <div className="absolute right-2 bottom-16 z-10 flex flex-col gap-2 md:right-4 md:bottom-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onCenterCamera}
                        className="bg-card/80 h-8 w-8 border-cyan-400/30 text-cyan-400 backdrop-blur-sm hover:border-cyan-400 hover:bg-cyan-400/10 md:h-10 md:w-10"
                        title="Centrer sur le joueur actuel"
                    >
                        <Crosshair className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setZoom((prev) => Math.min(prev * 1.2, 2))}
                        className="bg-card/80 border-border h-8 w-8 text-violet-400 backdrop-blur-sm hover:border-violet-400 hover:bg-violet-400/10 md:h-10 md:w-10"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setZoom((prev) => Math.max(prev * 0.8, 0.3))}
                        className="bg-card/80 border-border h-8 w-8 text-violet-400 backdrop-blur-sm hover:border-violet-400 hover:bg-violet-400/10 md:h-10 md:w-10"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                </div>

                {/* Instructions */}
                <div className="text-muted-foreground absolute bottom-4 left-4 z-10 hidden items-center gap-2 rounded-lg bg-black/50 px-3 py-2 text-xs md:flex">
                    <Move className="h-3 w-3" />
                    <span>Glisser pour déplacer • Clic droit pour options</span>
                </div>
            </div>
        )
    }
)

GameViewport.displayName = "GameViewport"

function GameTile({
    tile,
    index,
    isSelectionMode,
    isRemoveTileMode,
    onClick,
    rules = [],
    showExpandButtons,
    availableDirections,
    onAddTile,
}: {
    tile: Tile
    index: number
    isSelectionMode?: boolean
    isRemoveTileMode?: boolean
    onClick?: () => void
    rules?: Rule[]
    showExpandButtons?: boolean
    availableDirections?: { dir: "up" | "down" | "left" | "right"; x: number; y: number }[]
    onAddTile?: (direction: "up" | "down" | "left" | "right") => void
}) {
    const hasRules = rules.length > 0
    const hasPositiveRules = rules.some((r) =>
        r.effects.some((e) => {
            const val = Number(e.value)
            return (
                (e.type === "MOVE_RELATIVE" && val > 0) ||
                (e.type === "MODIFY_SCORE" && val > 0) ||
                e.type === "EXTRA_TURN" ||
                e.type === "APPLY_SHIELD" ||
                e.type === "APPLY_DOUBLE_DICE" ||
                e.type === "APPLY_SPEED_BOOST"
            )
        })
    )
    const hasNegativeRules = rules.some((r) =>
        r.effects.some((e) => {
            const val = Number(e.value)
            return (
                (e.type === "MOVE_RELATIVE" && val < 0) ||
                (e.type === "MODIFY_SCORE" && val < 0) ||
                e.type === "SKIP_TURN" ||
                e.type === "BACK_TO_START" ||
                e.type === "APPLY_SLOW"
            )
        })
    )

    const getStyles = () => {
        // Cases de départ et d'arrivée
        if (tile.type === "start") {
            return "bg-gradient-to-br from-cyan-600/50 to-cyan-800/50 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-cyan-300"
        }
        if (tile.type === "end") {
            return "bg-gradient-to-br from-violet-600/50 to-violet-800/50 border-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)] text-violet-300"
        }

        // Style basé sur les règles
        if (hasNegativeRules && hasPositiveRules) {
            return "bg-gradient-to-br from-yellow-900/60 to-amber-900/60 border-yellow-500/70 shadow-[0_0_15px_rgba(234,179,8,0.3)] text-yellow-300"
        }
        if (hasNegativeRules) {
            return "bg-gradient-to-br from-red-900/60 to-rose-900/60 border-red-500/70 shadow-[0_0_15px_rgba(239,68,68,0.3)] text-red-300"
        }
        if (hasPositiveRules) {
            return "bg-gradient-to-br from-green-900/60 to-emerald-900/60 border-green-500/70 shadow-[0_0_15px_rgba(34,197,94,0.3)] text-green-300"
        }

        // Case normale sans règle - bien visible
        return "bg-gradient-to-br from-slate-800/80 to-slate-700/80 border-slate-500/50 hover:border-slate-400/70 text-slate-300 shadow-lg"
    }

    const getLabel = () => {
        switch (tile.type) {
            case "start":
                return "🏁"
            case "end":
                return "🏆"
            default:
                return ""
        }
    }

    const getModeClass = () => {
        if (isSelectionMode) {
            return "cursor-crosshair hover:ring-2 hover:ring-cyan-400 hover:scale-105 z-20"
        }
        if (isRemoveTileMode) {
            return "cursor-pointer hover:ring-2 hover:ring-red-400 hover:scale-95 z-20"
        }
        if (hasRules) {
            return "cursor-pointer hover:scale-105"
        }
        return "cursor-pointer hover:scale-102 hover:brightness-110"
    }

    return (
        <div className="relative">
            <div
                onClick={onClick}
                className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 text-lg font-bold transition-all duration-300 ${getStyles()} ${getModeClass()}`}
            >
                {getLabel()}

                {/* Indicateur de règle */}
                {hasRules && tile.type !== "start" && tile.type !== "end" ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap
                            className={`h-6 w-6 drop-shadow-lg ${hasNegativeRules && !hasPositiveRules ? "text-red-300" : hasPositiveRules && !hasNegativeRules ? "text-green-300" : "text-yellow-300"}`}
                        />
                    </div>
                ) : null}

                {/* Badge nombre de règles */}
                {hasRules ? (
                    <Badge
                        variant="secondary"
                        className={`absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center p-0 text-[10px] font-bold shadow-lg ${
                            hasNegativeRules && !hasPositiveRules
                                ? "bg-red-500 text-white"
                                : hasPositiveRules && !hasNegativeRules
                                  ? "bg-green-500 text-white"
                                  : hasRules
                                    ? "bg-violet-500 text-white"
                                    : "bg-muted"
                        }`}
                    >
                        {rules.length}
                    </Badge>
                ) : null}

                {/* Icône info */}
                {hasRules ? <Info className="absolute right-1 bottom-1 h-3 w-3 opacity-60" /> : null}

                {/* Direction indicators */}
                {tile.directions?.map((dir) => (
                    <div
                        key={dir}
                        className={`absolute h-0 w-0 opacity-60 ${
                            dir === "up"
                                ? "-top-1.5 left-1/2 -translate-x-1/2 border-r-[4px] border-b-[5px] border-l-[4px] border-r-transparent border-b-cyan-400 border-l-transparent"
                                : dir === "down"
                                  ? "-bottom-1.5 left-1/2 -translate-x-1/2 border-t-[5px] border-r-[4px] border-l-[4px] border-t-cyan-400 border-r-transparent border-l-transparent"
                                  : dir === "left"
                                    ? "top-1/2 -left-1.5 -translate-y-1/2 border-t-[4px] border-r-[5px] border-b-[4px] border-t-transparent border-r-cyan-400 border-b-transparent"
                                    : "top-1/2 -right-1.5 -translate-y-1/2 border-t-[4px] border-b-[4px] border-l-[5px] border-t-transparent border-b-transparent border-l-cyan-400"
                        }`}
                    />
                ))}

                {/* Index */}
                <span className="absolute bottom-0.5 left-1 font-mono text-[9px] font-bold opacity-50">{index}</span>

                {/* Mode suppression */}
                {isRemoveTileMode && tile.type !== "start" && tile.type !== "end" ? (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-red-500/30 backdrop-blur-sm">
                        <Trash2 className="h-6 w-6 text-red-400" />
                    </div>
                ) : null}
            </div>

            {/* Boutons d'expansion */}
            {showExpandButtons && availableDirections ? (
                <>
                    {availableDirections.map(({ dir }) => (
                        <Button
                            key={dir}
                            size="icon"
                            variant="outline"
                            className={`absolute h-6 w-6 border-cyan-400/50 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/40 ${
                                dir === "up"
                                    ? "-top-8 left-1/2 -translate-x-1/2"
                                    : dir === "down"
                                      ? "-bottom-8 left-1/2 -translate-x-1/2"
                                      : dir === "left"
                                        ? "top-1/2 -left-8 -translate-y-1/2"
                                        : "top-1/2 -right-8 -translate-y-1/2"
                            }`}
                            onClick={(e) => {
                                e.stopPropagation()
                                onAddTile?.(dir)
                            }}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    ))}
                </>
            ) : null}
        </div>
    )
}

function PlayerToken({
    player,
    x,
    y,
    isActive,
    playerIndex,
    totalPlayers,
}: {
    player: Player
    x: number
    y: number
    isActive: boolean
    playerIndex: number
    totalPlayers: number
}) {
    const colors: Record<string, { bg: string; border: string; glow: string; text: string }> = {
        cyan: {
            bg: "bg-cyan-400",
            border: "border-cyan-300",
            glow: "shadow-[0_0_15px_rgba(34,211,238,0.8)]",
            text: "text-cyan-900",
        },
        violet: {
            bg: "bg-violet-400",
            border: "border-violet-300",
            glow: "shadow-[0_0_15px_rgba(168,85,247,0.8)]",
            text: "text-violet-900",
        },
        orange: {
            bg: "bg-orange-400",
            border: "border-orange-300",
            glow: "shadow-[0_0_15px_rgba(251,146,60,0.8)]",
            text: "text-orange-900",
        },
        green: {
            bg: "bg-green-400",
            border: "border-green-300",
            glow: "shadow-[0_0_15px_rgba(74,222,128,0.8)]",
            text: "text-green-900",
        },
    }

    const colorStyle = player.color && colors[player.color] ? colors[player.color] : colors.cyan

    // Décaler les jetons pour qu'ils soient tous visibles
    const angle = (playerIndex / totalPlayers) * Math.PI * 2 - Math.PI / 2
    const radius = totalPlayers > 1 ? 10 : 0
    const offsetX = Math.cos(angle) * radius
    const offsetY = Math.sin(angle) * radius

    return (
        <div
            className={`absolute h-7 w-7 rounded-full border-3 transition-all duration-300 ${colorStyle.bg} ${colorStyle.border} ${isActive ? colorStyle.glow : ""} ${isActive ? "z-20 scale-125" : "z-10 scale-100"}`}
            style={{
                left: x + TILE_SIZE / 2 - 14 + offsetX,
                top: y + TILE_SIZE / 2 - 14 + offsetY,
            }}
        >
            <span
                className={`absolute inset-0 flex items-center justify-center text-[11px] font-black ${colorStyle.text}`}
            >
                {player.name.charAt(0).toUpperCase()}
            </span>
            {isActive ? (
                <span className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full border border-yellow-300 bg-yellow-400" />
            ) : null}
        </div>
    )
}
