"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Edit,
  Trash2,
  Grid,
  Book,
  CheckCircle,
  Lock,
  ArrowRight
} from "lucide-react"

interface ModificationPanelProps {
  canModify: boolean
  canModifyRules: boolean
  canModifyTiles: boolean
  hasModifiedThisTurn: boolean
  hasPlayedThisTurn: boolean
  isCurrentTurn: boolean
  onAddRule: () => void
  onAddTile: () => void
  onRemoveTile: () => void
  onEndTurn: () => void
  reason?: string
}

export function ModificationPanel({
  canModify,
  canModifyRules,
  canModifyTiles,
  hasModifiedThisTurn,
  hasPlayedThisTurn,
  isCurrentTurn,
  onAddRule,
  onAddTile,
  onRemoveTile,
  onEndTurn,
  reason
}: ModificationPanelProps) {
  const [expanded, setExpanded] = useState(false)

  if (!isCurrentTurn) {
    return null
  }

  // If player hasn't played yet, show a prompt to roll dice
  if (!hasPlayedThisTurn) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <Card className="bg-background/95 backdrop-blur-md border-cyan-500/30 shadow-lg shadow-cyan-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-sm">C'est votre tour !</p>
              <p className="text-xs text-muted-foreground">Lancez le dé pour commencer</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If player has already modified, show completion state
  if (hasModifiedThisTurn) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <Card className="bg-background/95 backdrop-blur-md border-green-500/30 shadow-lg shadow-green-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-green-400">Modification effectuée</p>
              <p className="text-xs text-muted-foreground">Fin du tour automatique</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onEndTurn}
              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              Terminer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main modification panel
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card className="bg-background/95 backdrop-blur-md border-violet-500/30 shadow-lg shadow-violet-500/10 min-w-[320px]">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Modification</CardTitle>
              <Badge variant="outline" className="text-[10px]">1 action</Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onEndTurn}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Passer
            </Button>
          </div>
          <CardDescription className="text-xs">
            Vous pouvez modifier une règle OU une case
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 pt-2">
          {!canModify ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              <Lock className="h-5 w-5" />
              <p className="text-sm">{reason || "Modifications désactivées"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* Rules Section */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        onClick={onAddRule}
                        disabled={!canModifyRules}
                        className="w-full h-auto flex-col gap-2 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 disabled:opacity-50"
                        variant="ghost"
                      >
                        <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                          <Book className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium">Règle</span>
                        <span className="text-[10px] text-muted-foreground">Ajouter / Modifier</span>
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!canModifyRules && (
                    <TooltipContent>
                      <p>Modification de règles désactivée</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              {/* Tiles Section */}
              <div className="flex flex-col gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          onClick={onAddTile}
                          disabled={!canModifyTiles}
                          className="w-full h-auto flex-col gap-1 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-400 disabled:opacity-50"
                          variant="ghost"
                        >
                          <div className="flex items-center gap-1">
                            <Plus className="h-4 w-4" />
                            <Grid className="h-4 w-4" />
                          </div>
                          <span className="text-xs">Ajouter case</span>
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {!canModifyTiles && (
                      <TooltipContent>
                        <p>Modification de cases désactivée</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          onClick={onRemoveTile}
                          disabled={!canModifyTiles}
                          className="w-full h-auto flex-col gap-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 disabled:opacity-50"
                          variant="ghost"
                        >
                          <div className="flex items-center gap-1">
                            <Trash2 className="h-4 w-4" />
                            <Grid className="h-4 w-4" />
                          </div>
                          <span className="text-xs">Supprimer case</span>
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {!canModifyTiles && (
                      <TooltipContent>
                        <p>Modification de cases désactivée</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
