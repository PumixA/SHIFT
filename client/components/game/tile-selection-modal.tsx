"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Grid,
  GitFork
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Tile {
  id: string
  x: number
  y: number
  type: string
  connections?: string[]
}

interface TileSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tiles: Tile[]
  onSelectTile: (tileId: string, direction: "up" | "down" | "left" | "right") => void
  mode: "add" | "remove"
}

export function TileSelectionModal({
  open,
  onOpenChange,
  tiles,
  onSelectTile,
  mode,
}: TileSelectionModalProps) {
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null)
  const [hoveredDirection, setHoveredDirection] = useState<string | null>(null)

  // Calculate which directions are available for a tile
  const getAvailableDirections = (tile: Tile): ("up" | "down" | "left" | "right")[] => {
    const directions: ("up" | "down" | "left" | "right")[] = []

    // Check each direction
    const checks = [
      { dir: "up" as const, dx: 0, dy: -1 },
      { dir: "down" as const, dx: 0, dy: 1 },
      { dir: "left" as const, dx: -1, dy: 0 },
      { dir: "right" as const, dx: 1, dy: 0 },
    ]

    for (const { dir, dx, dy } of checks) {
      const targetX = tile.x + dx
      const targetY = tile.y + dy
      const exists = tiles.some(t => t.x === targetX && t.y === targetY)

      if (mode === "add" && !exists) {
        directions.push(dir)
      } else if (mode === "remove" && exists) {
        // For remove mode, show directions where tiles exist
        directions.push(dir)
      }
    }

    return directions
  }

  const selectedTile = tiles.find(t => t.id === selectedTileId)
  const availableDirections = selectedTile ? getAvailableDirections(selectedTile) : []

  // Calculate bounds for the mini map
  const bounds = useMemo(() => {
    if (tiles.length === 0) return { minX: -5, maxX: 5, minY: -2, maxY: 2 }
    const xs = tiles.map(t => t.x)
    const ys = tiles.map(t => t.y)
    return {
      minX: Math.min(...xs) - 1,
      maxX: Math.max(...xs) + 1,
      minY: Math.min(...ys) - 1,
      maxY: Math.max(...ys) + 1,
    }
  }, [tiles])

  const handleDirectionClick = (direction: "up" | "down" | "left" | "right") => {
    if (selectedTileId) {
      onSelectTile(selectedTileId, direction)
      onOpenChange(false)
      setSelectedTileId(null)
    }
  }

  const DirectionIcon = {
    up: ArrowUp,
    down: ArrowDown,
    left: ArrowLeft,
    right: ArrowRight,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid className="h-5 w-5 text-cyan-400" />
            {mode === "add" ? "Ajouter une case" : "Supprimer une case"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Sélectionnez une case existante puis choisissez la direction où ajouter la nouvelle case"
              : "Sélectionnez une case à supprimer"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Mini Map */}
          <div className="bg-black/30 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-muted-foreground">
                Plateau - Cliquez sur une case
              </span>
              <Badge variant="outline">{tiles.length} cases</Badge>
            </div>

            <ScrollArea className="h-[200px]">
              <div
                className="relative mx-auto"
                style={{
                  width: `${(bounds.maxX - bounds.minX + 1) * 40}px`,
                  height: `${(bounds.maxY - bounds.minY + 1) * 40}px`,
                }}
              >
                {tiles.map((tile) => {
                  const isSelected = tile.id === selectedTileId
                  const hasAvailableDirections = getAvailableDirections(tile).length > 0

                  return (
                    <button
                      key={tile.id}
                      onClick={() => setSelectedTileId(tile.id)}
                      disabled={!hasAvailableDirections}
                      className={cn(
                        "absolute w-9 h-9 rounded-lg border-2 transition-all",
                        "flex items-center justify-center text-xs font-bold",
                        isSelected
                          ? "border-cyan-400 bg-cyan-500/30 scale-110 z-10"
                          : hasAvailableDirections
                          ? "border-white/30 bg-white/10 hover:border-white/50 hover:bg-white/20 cursor-pointer"
                          : "border-white/10 bg-white/5 opacity-50 cursor-not-allowed",
                        tile.type === "start" && "border-green-500/50 bg-green-500/20",
                      )}
                      style={{
                        left: `${(tile.x - bounds.minX) * 40}px`,
                        top: `${(tile.y - bounds.minY) * 40}px`,
                      }}
                      title={`Case ${tile.id} (${tile.x}, ${tile.y})`}
                    >
                      {tile.type === "start" ? "D" : ""}
                    </button>
                  )
                })}

                {/* Show potential new positions when tile is selected */}
                {selectedTile && mode === "add" && (
                  <>
                    {[
                      { dir: "up", dx: 0, dy: -1 },
                      { dir: "down", dx: 0, dy: 1 },
                      { dir: "left", dx: -1, dy: 0 },
                      { dir: "right", dx: 1, dy: 0 },
                    ].map(({ dir, dx, dy }) => {
                      const targetX = selectedTile.x + dx
                      const targetY = selectedTile.y + dy
                      const exists = tiles.some(t => t.x === targetX && t.y === targetY)

                      if (exists) return null

                      return (
                        <div
                          key={dir}
                          className="absolute w-9 h-9 rounded-lg border-2 border-dashed border-cyan-400/50 bg-cyan-500/10 animate-pulse"
                          style={{
                            left: `${(targetX - bounds.minX) * 40}px`,
                            top: `${(targetY - bounds.minY) * 40}px`,
                          }}
                        >
                          <Plus className="w-4 h-4 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Direction Selection */}
          {selectedTile && mode === "add" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-bold">
                  Choisir la direction depuis la case {selectedTile.id}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
                {/* Up */}
                <div />
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-12 w-12",
                    availableDirections.includes("up")
                      ? "border-cyan-500/50 hover:bg-cyan-500/20"
                      : "opacity-30 cursor-not-allowed"
                  )}
                  disabled={!availableDirections.includes("up")}
                  onClick={() => handleDirectionClick("up")}
                  onMouseEnter={() => setHoveredDirection("up")}
                  onMouseLeave={() => setHoveredDirection(null)}
                >
                  <ArrowUp className="h-6 w-6" />
                </Button>
                <div />

                {/* Left, Center, Right */}
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-12 w-12",
                    availableDirections.includes("left")
                      ? "border-cyan-500/50 hover:bg-cyan-500/20"
                      : "opacity-30 cursor-not-allowed"
                  )}
                  disabled={!availableDirections.includes("left")}
                  onClick={() => handleDirectionClick("left")}
                  onMouseEnter={() => setHoveredDirection("left")}
                  onMouseLeave={() => setHoveredDirection(null)}
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <div className="h-12 w-12 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                  <span className="text-xs font-bold text-cyan-400">ICI</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-12 w-12",
                    availableDirections.includes("right")
                      ? "border-cyan-500/50 hover:bg-cyan-500/20"
                      : "opacity-30 cursor-not-allowed"
                  )}
                  disabled={!availableDirections.includes("right")}
                  onClick={() => handleDirectionClick("right")}
                  onMouseEnter={() => setHoveredDirection("right")}
                  onMouseLeave={() => setHoveredDirection(null)}
                >
                  <ArrowRight className="h-6 w-6" />
                </Button>

                {/* Down */}
                <div />
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-12 w-12",
                    availableDirections.includes("down")
                      ? "border-cyan-500/50 hover:bg-cyan-500/20"
                      : "opacity-30 cursor-not-allowed"
                  )}
                  disabled={!availableDirections.includes("down")}
                  onClick={() => handleDirectionClick("down")}
                  onMouseEnter={() => setHoveredDirection("down")}
                  onMouseLeave={() => setHoveredDirection(null)}
                >
                  <ArrowDown className="h-6 w-6" />
                </Button>
                <div />
              </div>

              {availableDirections.length === 0 && (
                <p className="text-sm text-yellow-400 text-center">
                  Aucune direction disponible depuis cette case
                </p>
              )}
            </div>
          )}

          {/* Remove mode confirmation */}
          {selectedTile && mode === "remove" && (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Voulez-vous supprimer la case <strong>{selectedTile.id}</strong> ?
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTileId(null)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    onSelectTile(selectedTile.id, "up") // Direction doesn't matter for remove
                    onOpenChange(false)
                    setSelectedTileId(null)
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-muted-foreground">
            {mode === "add" ? (
              <>
                <strong>1.</strong> Cliquez sur une case existante •{" "}
                <strong>2.</strong> Choisissez une direction •{" "}
                <strong>Note:</strong> Les cases avec un chemin à 2 directions permettent de créer des embranchements
              </>
            ) : (
              <>
                <strong>Attention:</strong> Supprimer une case peut couper le chemin entre les joueurs et l'arrivée.
                Les joueurs ne peuvent pas passer par des cases supprimées.
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
