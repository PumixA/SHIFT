"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Grid, Book, CheckCircle, Lock, ArrowRight } from "lucide-react"

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
    reason,
}: ModificationPanelProps) {
    const [expanded, setExpanded] = useState(false)

    if (!isCurrentTurn) {
        return null
    }

    // If player hasn't played yet, show a prompt to roll dice
    if (!hasPlayedThisTurn) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 fixed bottom-20 left-1/2 z-40 -translate-x-1/2 duration-300">
                <Card className="bg-background/95 border-cyan-500/30 shadow-lg shadow-cyan-500/10 backdrop-blur-md">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
                            <ArrowRight className="h-5 w-5 animate-pulse text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">C'est votre tour !</p>
                            <p className="text-muted-foreground text-xs">Lancez le dé pour commencer</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // If player has already modified, show completion state
    if (hasModifiedThisTurn) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 fixed bottom-20 left-1/2 z-40 -translate-x-1/2 duration-300">
                <Card className="bg-background/95 border-green-500/30 shadow-lg shadow-green-500/10 backdrop-blur-md">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-green-400">Modification effectuée</p>
                            <p className="text-muted-foreground text-xs">Fin du tour automatique</p>
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
        <div className="animate-in fade-in slide-in-from-bottom-4 fixed bottom-20 left-1/2 z-40 -translate-x-1/2 duration-300">
            <Card className="bg-background/95 min-w-[320px] border-violet-500/30 shadow-lg shadow-violet-500/10 backdrop-blur-md">
                <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base">Modification</CardTitle>
                            <Badge variant="outline" className="text-[10px]">
                                1 action
                            </Badge>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onEndTurn}
                            className="text-muted-foreground hover:text-foreground text-xs"
                        >
                            Passer
                        </Button>
                    </div>
                    <CardDescription className="text-xs">Vous pouvez modifier une règle OU une case</CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-2">
                    {!canModify ? (
                        <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400">
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
                                                className="h-auto w-full flex-col gap-2 border border-cyan-500/30 bg-cyan-500/10 py-4 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50"
                                                variant="ghost"
                                            >
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
                                                    <Book className="h-5 w-5" />
                                                </div>
                                                <span className="text-sm font-medium">Règle</span>
                                                <span className="text-muted-foreground text-[10px]">
                                                    Ajouter / Modifier
                                                </span>
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
                                                    className="h-auto w-full flex-col gap-1 border border-violet-500/30 bg-violet-500/10 py-2 text-violet-400 hover:bg-violet-500/20 disabled:opacity-50"
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
                                                    className="h-auto w-full flex-col gap-1 border border-red-500/30 bg-red-500/10 py-2 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
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
