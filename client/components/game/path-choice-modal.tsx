"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, MapPin, Route, Footprints } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PathOption, TileNode } from "@/lib/path-utils"

interface PathChoiceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    paths: PathOption[]
    tiles: TileNode[]
    diceValue: number
    onSelectPath: (path: PathOption) => void
    playerColor?: string
}

export function PathChoiceModal({
    open,
    onOpenChange,
    paths,
    tiles,
    diceValue,
    onSelectPath,
    playerColor = "cyan",
}: PathChoiceModalProps) {
    const [selectedPathIndex, setSelectedPathIndex] = useState<number | null>(null)
    const [hoveredPathIndex, setHoveredPathIndex] = useState<number | null>(null)

    // Calculer les bornes pour la mini carte
    const bounds = useMemo(() => {
        if (tiles.length === 0) return { minX: -5, maxX: 5, minY: -2, maxY: 2 }
        const xs = tiles.map((t) => t.x)
        const ys = tiles.map((t) => t.y)
        return {
            minX: Math.min(...xs) - 1,
            maxX: Math.max(...xs) + 1,
            minY: Math.min(...ys) - 1,
            maxY: Math.max(...ys) + 1,
        }
    }, [tiles])

    // Chemin actuellement affiché (sélectionné ou survolé)
    const displayedPath =
        hoveredPathIndex !== null
            ? paths[hoveredPathIndex]
            : selectedPathIndex !== null
              ? paths[selectedPathIndex]
              : null

    // Obtenir les IDs des cases dans le chemin affiché
    const pathTileIds = useMemo(() => {
        if (!displayedPath) return new Set<string>()
        return new Set(displayedPath.path.map((step) => step.tileId))
    }, [displayedPath])

    // ID de la destination
    const destinationId = displayedPath?.finalTile.id

    const handleConfirm = () => {
        if (selectedPathIndex !== null && paths[selectedPathIndex]) {
            onSelectPath(paths[selectedPathIndex])
            onOpenChange(false)
            setSelectedPathIndex(null)
        }
    }

    const colorClasses = {
        cyan: { bg: "bg-cyan-500", border: "border-cyan-400", text: "text-cyan-400" },
        violet: { bg: "bg-violet-500", border: "border-violet-400", text: "text-violet-400" },
        orange: { bg: "bg-orange-500", border: "border-orange-400", text: "text-orange-400" },
        green: { bg: "bg-green-500", border: "border-green-400", text: "text-green-400" },
    }

    const colors = colorClasses[playerColor as keyof typeof colorClasses] || colorClasses.cyan

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Route className={`h-5 w-5 ${colors.text}`} />
                        Choisissez votre chemin
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                        <Badge variant="outline" className={colors.border}>
                            <Footprints className="mr-1 h-3 w-3" />
                            {diceValue} pas
                        </Badge>
                        <span>Plusieurs chemins possibles - Sélectionnez votre destination</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    {/* Mini Map */}
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <ScrollArea className="h-[200px]">
                            <div
                                className="relative mx-auto"
                                style={{
                                    width: `${(bounds.maxX - bounds.minX + 1) * 36}px`,
                                    height: `${(bounds.maxY - bounds.minY + 1) * 36}px`,
                                }}
                            >
                                {tiles.map((tile) => {
                                    const isInPath = pathTileIds.has(tile.id)
                                    const isDestination = tile.id === destinationId
                                    const isStart = displayedPath?.path[0]?.tileId === tile.id

                                    return (
                                        <div
                                            key={tile.id}
                                            className={cn(
                                                "absolute h-8 w-8 rounded-md border-2 transition-all duration-200",
                                                "flex items-center justify-center text-[10px] font-bold",
                                                isDestination
                                                    ? `${colors.border} ${colors.bg}/40 z-20 scale-110`
                                                    : isStart
                                                      ? "z-10 border-white/60 bg-white/20"
                                                      : isInPath
                                                        ? `${colors.border}/50 ${colors.bg}/20 z-10`
                                                        : "border-white/20 bg-white/5",
                                                tile.type === "start" && "border-green-500/50 bg-green-500/10"
                                            )}
                                            style={{
                                                left: `${(tile.x - bounds.minX) * 36}px`,
                                                top: `${(tile.y - bounds.minY) * 36}px`,
                                            }}
                                        >
                                            {isDestination ? <MapPin className={`h-4 w-4 ${colors.text}`} /> : null}
                                            {isStart && !isDestination ? (
                                                <div className={`h-2 w-2 rounded-full ${colors.bg}`} />
                                            ) : null}
                                            {tile.type === "start" && !isStart && !isDestination && "D"}
                                        </div>
                                    )
                                })}

                                {/* Lignes de connexion pour le chemin affiché */}
                                {displayedPath && displayedPath.path.length > 1 ? (
                                    <svg
                                        className="pointer-events-none absolute inset-0 z-5"
                                        style={{
                                            width: `${(bounds.maxX - bounds.minX + 1) * 36}px`,
                                            height: `${(bounds.maxY - bounds.minY + 1) * 36}px`,
                                        }}
                                    >
                                        {displayedPath.path.slice(0, -1).map((step, idx) => {
                                            const nextStep = displayedPath.path[idx + 1]
                                            const x1 = (step.x - bounds.minX) * 36 + 16
                                            const y1 = (step.y - bounds.minY) * 36 + 16
                                            const x2 = (nextStep.x - bounds.minX) * 36 + 16
                                            const y2 = (nextStep.y - bounds.minY) * 36 + 16

                                            return (
                                                <line
                                                    key={idx}
                                                    x1={x1}
                                                    y1={y1}
                                                    x2={x2}
                                                    y2={y2}
                                                    stroke={
                                                        playerColor === "cyan"
                                                            ? "#22d3ee"
                                                            : playerColor === "violet"
                                                              ? "#a78bfa"
                                                              : playerColor === "orange"
                                                                ? "#fb923c"
                                                                : "#4ade80"
                                                    }
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    strokeDasharray="6 4"
                                                    className="animate-pulse"
                                                />
                                            )
                                        })}
                                    </svg>
                                ) : null}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Liste des chemins */}
                    <div className="space-y-2">
                        <h4 className="text-muted-foreground text-sm font-semibold">
                            Destinations possibles ({paths.length})
                        </h4>
                        <div className="grid max-h-[150px] gap-2 overflow-y-auto">
                            {paths.map((pathOption, index) => {
                                const isSelected = selectedPathIndex === index

                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedPathIndex(index)}
                                        onMouseEnter={() => setHoveredPathIndex(index)}
                                        onMouseLeave={() => setHoveredPathIndex(null)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all",
                                            isSelected
                                                ? `${colors.border} ${colors.bg}/20`
                                                : "border-white/10 bg-white/5 hover:border-white/30"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                                isSelected ? colors.bg : "bg-white/10"
                                            )}
                                        >
                                            <MapPin
                                                className={cn(
                                                    "h-5 w-5",
                                                    isSelected ? "text-white" : "text-muted-foreground"
                                                )}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">
                                                    Case ({pathOption.finalTile.x}, {pathOption.finalTile.y})
                                                </span>
                                                {pathOption.finalTile.type === "start" && (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-green-500/50 text-[10px] text-green-400"
                                                    >
                                                        Départ
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-muted-foreground flex items-center gap-1 text-xs">
                                                <Footprints className="h-3 w-3" />
                                                {pathOption.path.length - 1} pas • ID: {pathOption.finalTile.id}
                                            </div>
                                        </div>
                                        <ArrowRight
                                            className={cn(
                                                "h-5 w-5 transition-transform",
                                                isSelected ? colors.text : "text-muted-foreground",
                                                isSelected && "translate-x-1"
                                            )}
                                        />
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Bouton de confirmation */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={selectedPathIndex === null}
                            className={cn("gap-2", selectedPathIndex !== null && `${colors.bg} hover:opacity-90`)}
                        >
                            <MapPin className="h-4 w-4" />
                            Confirmer le chemin
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
