"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    ArrowRight,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    Zap,
    Shield,
    Shuffle,
    SkipForward,
    Target,
    Star,
    Flag,
    Home,
    AlertTriangle,
    Check,
} from "lucide-react"
import { Rule, ActionType, TriggerType, TRIGGER_INFO, ACTION_INFO } from "@/src/types/rules"
import type { TileDirection } from "@/hooks/useGameState"
import { cn } from "@/lib/utils"

interface TileDetailModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tileIndex: number
    tileType: "normal" | "special" | "start" | "end"
    tileId?: string
    tileDirections?: TileDirection[]
    rules: Rule[]
    canModifyDirections?: boolean
    onChangeDirections?: (tileId: string, dirs: TileDirection[]) => void
}

const DIRECTION_CONFIG: { dir: TileDirection; label: string; icon: typeof ArrowUp; position: string }[] = [
    { dir: "up", label: "Haut", icon: ArrowUp, position: "col-start-2 row-start-1" },
    { dir: "left", label: "Gauche", icon: ArrowLeft, position: "col-start-1 row-start-2" },
    { dir: "right", label: "Droite", icon: ArrowRight, position: "col-start-3 row-start-2" },
    { dir: "down", label: "Bas", icon: ArrowDown, position: "col-start-2 row-start-3" },
]

export function TileDetailModal({
    open,
    onOpenChange,
    tileIndex,
    tileType,
    tileId,
    tileDirections = ["right"],
    rules,
    canModifyDirections,
    onChangeDirections,
}: TileDetailModalProps) {
    const [draftDirections, setDraftDirections] = useState<TileDirection[]>(tileDirections)

    useEffect(() => {
        setDraftDirections(tileDirections)
    }, [tileDirections, open])

    const hasChanges =
        draftDirections.length !== tileDirections.length || draftDirections.some((d) => !tileDirections.includes(d))

    const toggleDirection = (dir: TileDirection) => {
        setDraftDirections((prev) => {
            if (prev.includes(dir)) {
                if (prev.length <= 1) return prev
                return prev.filter((d) => d !== dir)
            }
            return [...prev, dir]
        })
    }

    const handleApply = () => {
        if (tileId && onChangeDirections && hasChanges) {
            onChangeDirections(tileId, draftDirections)
            onOpenChange(false)
        }
    }

    const getTileIcon = () => {
        switch (tileType) {
            case "start":
                return <Home className="h-6 w-6 text-cyan-400" />
            case "end":
                return <Flag className="h-6 w-6 text-violet-400" />
            case "special":
                return <Star className="h-6 w-6 text-yellow-400" />
            default:
                return <Target className="text-muted-foreground h-6 w-6" />
        }
    }

    const getTileStyles = () => {
        switch (tileType) {
            case "start":
                return "border-cyan-500/50 bg-cyan-500/10"
            case "end":
                return "border-violet-500/50 bg-violet-500/10"
            case "special":
                return "border-yellow-500/50 bg-yellow-500/10"
            default:
                return "border-border bg-card/50"
        }
    }

    const getEffectIcon = (type: string) => {
        switch (type) {
            case ActionType.MOVE_RELATIVE:
                return <ArrowRight className="h-4 w-4" />
            case ActionType.TELEPORT:
            case ActionType.MOVE_TO_TILE:
                return <Shuffle className="h-4 w-4" />
            case ActionType.SKIP_TURN:
                return <SkipForward className="h-4 w-4" />
            case ActionType.APPLY_SHIELD:
                return <Shield className="h-4 w-4" />
            case ActionType.BACK_TO_START:
                return <Home className="h-4 w-4" />
            default:
                return <Zap className="h-4 w-4" />
        }
    }

    const getEffectColor = (type: string, value: number | string) => {
        const numValue = Number(value)

        if (
            type === ActionType.BACK_TO_START ||
            type === ActionType.SKIP_TURN ||
            type === ActionType.APPLY_SLOW ||
            (type === ActionType.MOVE_RELATIVE && numValue < 0) ||
            (type === ActionType.MODIFY_SCORE && numValue < 0)
        ) {
            return "text-red-400 bg-red-500/10 border-red-500/30"
        }

        if (
            type === ActionType.EXTRA_TURN ||
            type === ActionType.APPLY_SHIELD ||
            type === ActionType.APPLY_SPEED_BOOST ||
            type === ActionType.APPLY_DOUBLE_DICE ||
            (type === ActionType.MOVE_RELATIVE && numValue > 0) ||
            (type === ActionType.MODIFY_SCORE && numValue > 0)
        ) {
            return "text-green-400 bg-green-500/10 border-green-500/30"
        }

        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
    }

    const formatEffectDescription = (effect: Rule["effects"][0]) => {
        const info = ACTION_INFO[effect.type as ActionType]
        if (!info) return `${effect.type}: ${effect.value}`

        const value = Number(effect.value)
        const target =
            effect.target === "self"
                ? "vous"
                : effect.target === "others"
                  ? "les autres"
                  : effect.target === "all"
                    ? "tous"
                    : effect.target === "leader"
                      ? "le leader"
                      : effect.target === "last"
                        ? "le dernier"
                        : "un joueur aléatoire"

        switch (effect.type) {
            case ActionType.MOVE_RELATIVE:
                return value > 0
                    ? `Avancer ${target} de ${value} cases`
                    : `Reculer ${target} de ${Math.abs(value)} cases`
            case ActionType.TELEPORT:
            case ActionType.MOVE_TO_TILE:
                return `Téléporter ${target} à la case ${value}`
            case ActionType.BACK_TO_START:
                return `Renvoyer ${target} au départ`
            case ActionType.SKIP_TURN:
                return `${target} passe son prochain tour`
            case ActionType.EXTRA_TURN:
                return `${target} gagne ${value} tour(s) supplémentaire(s)`
            case ActionType.MODIFY_SCORE:
                return value > 0 ? `+${value} points pour ${target}` : `${value} points pour ${target}`
            case ActionType.APPLY_SHIELD:
                return `Bouclier pour ${target} (${effect.duration || value} tours)`
            case ActionType.APPLY_DOUBLE_DICE:
                return `Dé doublé pour ${target} (${effect.duration || value} tours)`
            case ActionType.APPLY_SPEED_BOOST:
                return `Boost de vitesse pour ${target} (${effect.duration || value} tours)`
            case ActionType.APPLY_SLOW:
                return `Ralentissement pour ${target} (${effect.duration || value} tours)`
            case ActionType.SWAP_POSITIONS:
                return `Échanger les positions avec ${target}`
            default:
                return info.description
        }
    }

    const getTriggerDescription = (rule: Rule) => {
        const triggerType = typeof rule.trigger === "object" ? rule.trigger.type : rule.trigger
        const info = TRIGGER_INFO[triggerType as TriggerType]
        return info?.description || triggerType
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className={`flex items-center gap-3 rounded-lg border p-3 ${getTileStyles()}`}>
                        {getTileIcon()}
                        <div>
                            <DialogTitle className="text-lg">
                                Case {tileIndex}
                                {tileType !== "normal" && (
                                    <Badge variant="outline" className="ml-2 capitalize">
                                        {tileType === "start" ? "Départ" : tileType === "end" ? "Arrivée" : "Spéciale"}
                                    </Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription>
                                {rules.length === 0
                                    ? "Aucune règle sur cette case"
                                    : `${rules.length} règle${rules.length > 1 ? "s" : ""} active${rules.length > 1 ? "s" : ""}`}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Separator />

                {/* Direction Editor */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Directions</h4>
                        <Badge variant="outline" className="text-[10px]">
                            {draftDirections.length}/4
                        </Badge>
                    </div>

                    <div className="grid grid-cols-3 grid-rows-3 place-items-center gap-2">
                        {DIRECTION_CONFIG.map(({ dir, label, icon: Icon, position }) => {
                            const isActive = draftDirections.includes(dir)
                            const isDisabled = !canModifyDirections
                            return (
                                <button
                                    key={dir}
                                    onClick={() => !isDisabled && toggleDirection(dir)}
                                    disabled={isDisabled}
                                    className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all",
                                        position,
                                        isActive
                                            ? "border-cyan-400 bg-cyan-500/20 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                                            : "border-white/10 bg-white/5 text-white/30",
                                        !isDisabled && "cursor-pointer hover:scale-110",
                                        isDisabled && "cursor-not-allowed opacity-50"
                                    )}
                                    title={label}
                                >
                                    <Icon className="h-5 w-5" />
                                </button>
                            )
                        })}
                        {/* Center tile indicator */}
                        <div className="col-start-2 row-start-2 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white/20 bg-white/10">
                            <div className="h-3 w-3 rounded-sm bg-white/40" />
                        </div>
                    </div>

                    {canModifyDirections && hasChanges ? (
                        <Button
                            size="sm"
                            onClick={handleApply}
                            className="w-full border border-cyan-500/30 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Appliquer les directions
                        </Button>
                    ) : null}

                    {!canModifyDirections ? (
                        <p className="text-muted-foreground text-center text-xs">Modifiable en phase de modification</p>
                    ) : null}
                </div>

                <Separator />

                <ScrollArea className="max-h-[300px]">
                    {rules.length === 0 ? (
                        <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
                            <Target className="mb-3 h-12 w-12 opacity-30" />
                            <p className="text-sm">Cette case n'a aucun effet</p>
                            <p className="text-xs opacity-60">Les joueurs peuvent y atterrir sans conséquence</p>
                        </div>
                    ) : (
                        <div className="space-y-4 p-1">
                            {rules.map((rule) => (
                                <div key={rule.id} className="border-border/50 overflow-hidden rounded-lg border">
                                    {/* Rule Header */}
                                    <div className="bg-card/50 border-border/50 border-b px-4 py-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold">{rule.title}</h4>
                                            {rule.tags && rule.tags.includes("core") ? (
                                                <Badge variant="secondary" className="text-[10px]">
                                                    Core
                                                </Badge>
                                            ) : null}
                                        </div>
                                        {rule.description ? (
                                            <p className="text-muted-foreground mt-1 text-xs">{rule.description}</p>
                                        ) : null}
                                    </div>

                                    {/* Trigger */}
                                    <div className="bg-background/50 px-4 py-2">
                                        <p className="text-muted-foreground text-xs">
                                            <span className="font-medium text-cyan-400">Déclencheur:</span>{" "}
                                            {getTriggerDescription(rule)}
                                        </p>
                                    </div>

                                    {/* Effects */}
                                    <div className="space-y-2 px-4 py-3">
                                        <p className="text-muted-foreground text-xs font-medium">Effets:</p>
                                        {rule.effects.map((effect, effectIndex) => (
                                            <div
                                                key={effectIndex}
                                                className={`flex items-center gap-2 rounded-lg border p-2 ${getEffectColor(effect.type as string, effect.value)}`}
                                            >
                                                {getEffectIcon(effect.type as string)}
                                                <span className="text-sm">{formatEffectDescription(effect)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Conditions */}
                                    {rule.conditions && rule.conditions.length > 0 ? (
                                        <div className="border-t border-yellow-500/20 bg-yellow-500/5 px-4 py-2">
                                            <div className="flex items-center gap-2 text-xs text-yellow-400">
                                                <AlertTriangle className="h-3 w-3" />
                                                <span>
                                                    {rule.conditions.length} condition
                                                    {rule.conditions.length > 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
