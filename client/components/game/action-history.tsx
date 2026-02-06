"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dice1,
    Dice2,
    Dice3,
    Dice4,
    Dice5,
    Dice6,
    Footprints,
    Zap,
    UserPlus,
    UserMinus,
    Trophy,
    Book,
    MessageCircle,
    Grid,
    Clock,
    Filter,
    ChevronDown,
    ChevronUp,
    Play,
} from "lucide-react"
import { socket } from "@/services/socket"
import { cn } from "@/lib/utils"

export interface GameAction {
    id: string
    type:
        | "dice_roll"
        | "move"
        | "rule_triggered"
        | "effect_applied"
        | "effect_expired"
        | "power_up"
        | "chat"
        | "join"
        | "leave"
        | "rule_added"
        | "rule_modified"
        | "rule_deleted"
        | "tile_added"
        | "tile_removed"
        | "victory"
        | "turn_start"
        | "turn_end"
    playerId: string
    playerName?: string
    playerColor?: string
    description: string
    details?: Record<string, any>
    timestamp: string
    turnNumber?: number
}

interface ActionHistoryProps {
    roomId: string
    currentPlayerId?: string
    onReplayAction?: (action: GameAction) => void
    localActions?: GameAction[]
    isLocalMode?: boolean
}

const DiceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]

const ACTION_CATEGORIES = {
    all: { label: "Tout", icon: Clock },
    moves: { label: "Mouvements", icon: Footprints },
    rules: { label: "Règles", icon: Book },
    effects: { label: "Effets", icon: Zap },
    players: { label: "Joueurs", icon: UserPlus },
}

export function ActionHistory({
    roomId,
    currentPlayerId,
    onReplayAction,
    localActions,
    isLocalMode,
}: ActionHistoryProps) {
    const [actions, setActions] = useState<GameAction[]>([])
    const [filter, setFilter] = useState<keyof typeof ACTION_CATEGORIES>("all")
    const [expandedTurns, setExpandedTurns] = useState<Set<number>>(new Set())
    const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline")
    const scrollRef = useRef<HTMLDivElement>(null)

    // Use local actions in local mode
    useEffect(() => {
        if (isLocalMode && localActions) {
            setActions(localActions)
        }
    }, [isLocalMode, localActions])

    // Fetch from server in online mode
    useEffect(() => {
        if (isLocalMode || !roomId) return

        socket.emit("get_action_history", { roomId })

        socket.on("action_history", (history: GameAction[]) => {
            setActions(history)
        })

        const actionTypes = [
            "dice_result",
            "rule_added",
            "rule_deleted",
            "tile_added",
            "tile_removed",
            "effect_applied",
            "effect_expired",
            "game_over",
        ]

        const handleNewAction = () => {
            socket.emit("get_action_history", { roomId })
        }

        actionTypes.forEach((type) => {
            socket.on(type, handleNewAction)
        })

        return () => {
            socket.off("action_history")
            actionTypes.forEach((type) => {
                socket.off(type, handleNewAction)
            })
        }
    }, [roomId, isLocalMode])

    const getActionIcon = (action: GameAction) => {
        switch (action.type) {
            case "dice_roll":
                const diceValue = action.details?.diceValue || 1
                const DiceIcon = DiceIcons[Math.min(diceValue - 1, 5)]
                return <DiceIcon className="h-4 w-4" />
            case "move":
                return <Footprints className="h-4 w-4" />
            case "rule_triggered":
            case "effect_applied":
            case "power_up":
                return <Zap className="h-4 w-4" />
            case "effect_expired":
                return <Zap className="h-4 w-4 opacity-50" />
            case "join":
                return <UserPlus className="h-4 w-4" />
            case "leave":
                return <UserMinus className="h-4 w-4" />
            case "victory":
                return <Trophy className="h-4 w-4" />
            case "rule_added":
            case "rule_modified":
            case "rule_deleted":
                return <Book className="h-4 w-4" />
            case "tile_added":
            case "tile_removed":
                return <Grid className="h-4 w-4" />
            case "chat":
                return <MessageCircle className="h-4 w-4" />
            case "turn_start":
            case "turn_end":
                return <Play className="h-4 w-4" />
            default:
                return <Zap className="h-4 w-4" />
        }
    }

    const getActionColor = (type: string) => {
        switch (type) {
            case "dice_roll":
                return "text-cyan-400 border-cyan-500/50 bg-cyan-500/10"
            case "move":
                return "text-blue-400 border-blue-500/50 bg-blue-500/10"
            case "rule_triggered":
            case "effect_applied":
            case "power_up":
                return "text-violet-400 border-violet-500/50 bg-violet-500/10"
            case "effect_expired":
                return "text-gray-400 border-gray-500/50 bg-gray-500/10"
            case "join":
                return "text-green-400 border-green-500/50 bg-green-500/10"
            case "leave":
                return "text-red-400 border-red-500/50 bg-red-500/10"
            case "victory":
                return "text-yellow-400 border-yellow-500/50 bg-yellow-500/10"
            case "rule_added":
                return "text-cyan-400 border-cyan-500/50 bg-cyan-500/10"
            case "rule_deleted":
                return "text-red-400 border-red-500/50 bg-red-500/10"
            case "tile_added":
                return "text-green-400 border-green-500/50 bg-green-500/10"
            case "tile_removed":
                return "text-orange-400 border-orange-500/50 bg-orange-500/10"
            case "turn_start":
            case "turn_end":
                return "text-white/70 border-white/30 bg-white/5"
            default:
                return "text-muted-foreground border-muted bg-muted/50"
        }
    }

    const getPlayerColor = (color?: string) => {
        const colorMap: Record<string, string> = {
            cyan: "bg-cyan-500",
            violet: "bg-violet-500",
            orange: "bg-orange-500",
            green: "bg-green-500",
        }
        return colorMap[color || ""] || "bg-gray-500"
    }

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    }

    const filterActions = (actions: GameAction[]) => {
        if (filter === "all") return actions
        return actions.filter((action) => {
            switch (filter) {
                case "moves":
                    return ["dice_roll", "move"].includes(action.type)
                case "rules":
                    return ["rule_triggered", "rule_added", "rule_modified", "rule_deleted"].includes(action.type)
                case "effects":
                    return ["effect_applied", "effect_expired", "power_up"].includes(action.type)
                case "players":
                    return ["join", "leave", "turn_start", "turn_end"].includes(action.type)
                default:
                    return true
            }
        })
    }

    // Group actions by turn
    const groupByTurn = (actions: GameAction[]) => {
        const turns: Map<number, GameAction[]> = new Map()
        let currentTurn = 0

        actions.forEach((action) => {
            if (action.turnNumber !== undefined) {
                currentTurn = action.turnNumber
            }
            if (!turns.has(currentTurn)) {
                turns.set(currentTurn, [])
            }
            turns.get(currentTurn)!.push(action)
        })

        return turns
    }

    const toggleTurn = (turn: number) => {
        const newExpanded = new Set(expandedTurns)
        if (newExpanded.has(turn)) {
            newExpanded.delete(turn)
        } else {
            newExpanded.add(turn)
        }
        setExpandedTurns(newExpanded)
    }

    const filteredActions = filterActions(actions)
    const turnGroups = groupByTurn(filteredActions)
    const sortedTurns = Array.from(turnGroups.keys()).sort((a, b) => b - a)

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-white/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold">
                        <Clock className="h-4 w-4 text-cyan-400" />
                        Historique
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                        {actions.length} action{actions.length !== 1 ? "s" : ""}
                    </Badge>
                </div>

                {/* View mode toggle */}
                <Tabs
                    value={viewMode}
                    onValueChange={(v: string) => setViewMode(v as "timeline" | "list")}
                    className="mb-3"
                >
                    <TabsList className="grid h-8 w-full grid-cols-2">
                        <TabsTrigger value="timeline" className="text-xs">
                            Timeline
                        </TabsTrigger>
                        <TabsTrigger value="list" className="text-xs">
                            Liste
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Filters */}
                <div className="flex flex-wrap gap-1">
                    {Object.entries(ACTION_CATEGORIES).map(([key, { label, icon: Icon }]) => (
                        <Button
                            key={key}
                            variant={filter === key ? "default" : "ghost"}
                            size="sm"
                            className={cn("h-7 px-2 text-xs", filter === key ? "bg-cyan-600 hover:bg-cyan-500" : "")}
                            onClick={() => setFilter(key as keyof typeof ACTION_CATEGORIES)}
                        >
                            <Icon className="mr-1 h-3 w-3" />
                            {label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1" ref={scrollRef}>
                {actions.length === 0 ? (
                    <div className="p-8 text-center">
                        <Clock className="text-muted-foreground/30 mx-auto mb-4 h-12 w-12" />
                        <p className="text-muted-foreground text-sm">Aucune action pour le moment</p>
                        <p className="text-muted-foreground/70 mt-1 text-xs">
                            Les actions apparaîtront ici au fur et à mesure
                        </p>
                    </div>
                ) : viewMode === "timeline" ? (
                    /* Timeline View */
                    <div className="p-4">
                        {sortedTurns.map((turn) => {
                            const turnActions = turnGroups.get(turn) || []
                            const isExpanded = expandedTurns.has(turn) || turn === sortedTurns[0]
                            const firstAction = turnActions[0]
                            const playerName = firstAction?.playerName || `Joueur`

                            return (
                                <div key={turn} className="mb-4">
                                    {/* Turn Header */}
                                    <button
                                        onClick={() => toggleTurn(turn)}
                                        className="mb-2 flex w-full items-center gap-3 rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10"
                                    >
                                        <div
                                            className={cn(
                                                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                                                getPlayerColor(firstAction?.playerColor)
                                            )}
                                        >
                                            {turn}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-medium">Tour {turn}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {playerName} · {turnActions.length} action
                                                {turnActions.length !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp className="text-muted-foreground h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="text-muted-foreground h-4 w-4" />
                                        )}
                                    </button>

                                    {/* Turn Actions (Timeline) */}
                                    {isExpanded ? (
                                        <div className="ml-4 space-y-2 border-l-2 border-white/10 pl-4">
                                            {turnActions.map((action, idx) => (
                                                <div
                                                    key={action.id}
                                                    className={cn(
                                                        "relative flex items-start gap-3 rounded-lg border p-3 transition-all",
                                                        getActionColor(action.type),
                                                        "cursor-pointer hover:scale-[1.02]"
                                                    )}
                                                    onClick={() => onReplayAction?.(action)}
                                                >
                                                    {/* Timeline dot */}
                                                    <div
                                                        className={cn(
                                                            "border-background absolute top-4 -left-[25px] h-3 w-3 rounded-full border-2",
                                                            action.type === "victory"
                                                                ? "bg-yellow-500"
                                                                : action.type === "rule_triggered"
                                                                  ? "bg-violet-500"
                                                                  : getPlayerColor(action.playerColor)
                                                        )}
                                                    />

                                                    <div className="mt-0.5">{getActionIcon(action)}</div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm">{action.description}</p>
                                                        {action.details ? (
                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                                {action.details.diceValue ? (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="h-5 text-[10px]"
                                                                    >
                                                                        Dé: {action.details.diceValue}
                                                                    </Badge>
                                                                ) : null}
                                                                {action.details.position !== undefined && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="h-5 text-[10px]"
                                                                    >
                                                                        Case: {action.details.position}
                                                                    </Badge>
                                                                )}
                                                                {action.details.scoreChange !== undefined && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn(
                                                                            "h-5 text-[10px]",
                                                                            action.details.scoreChange > 0
                                                                                ? "text-green-400"
                                                                                : "text-red-400"
                                                                        )}
                                                                    >
                                                                        {action.details.scoreChange > 0 ? "+" : ""}
                                                                        {action.details.scoreChange} pts
                                                                    </Badge>
                                                                )}
                                                                {action.details.ruleName ? (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="h-5 text-[10px] text-violet-400"
                                                                    >
                                                                        {action.details.ruleName}
                                                                    </Badge>
                                                                ) : null}
                                                            </div>
                                                        ) : null}
                                                        <p className="text-muted-foreground mt-1 text-[10px]">
                                                            {formatTime(action.timestamp)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    /* List View */
                    <div className="space-y-2 p-4">
                        {[...filteredActions].reverse().map((action) => (
                            <div
                                key={action.id}
                                className={cn(
                                    "flex items-start gap-3 rounded-lg border p-3 transition-all",
                                    getActionColor(action.type),
                                    "cursor-pointer hover:scale-[1.01]"
                                )}
                                onClick={() => onReplayAction?.(action)}
                            >
                                {/* Player avatar */}
                                {action.playerColor ? (
                                    <div
                                        className={cn(
                                            "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                                            getPlayerColor(action.playerColor)
                                        )}
                                    >
                                        {(action.playerName || "J")[0]}
                                    </div>
                                ) : null}
                                <div className="mt-0.5">{getActionIcon(action)}</div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm">{action.description}</p>
                                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                                        {formatTime(action.timestamp)}
                                        {action.turnNumber !== undefined && ` · Tour ${action.turnNumber}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Summary Footer */}
            {actions.length > 0 && (
                <div className="border-t border-white/10 bg-white/5 p-3">
                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>Tours: {sortedTurns.length}</span>
                        <span>Règles: {actions.filter((a) => a.type === "rule_triggered").length}</span>
                        <span>Dés: {actions.filter((a) => a.type === "dice_roll").length}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
