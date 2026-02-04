"use client"

import { Dices, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Player } from "@/components/shift-game"

interface TopBarProps {
    currentTurnId: string
    players: Player[]
    diceValue: number | null
    isRolling: boolean
    onRollDice: () => void
    gameStatus: 'waiting' | 'playing' | 'finished'
    isLocalMode?: boolean
    canRoll?: boolean
}

export function TopBar({
    currentTurnId,
    players,
    diceValue,
    isRolling,
    onRollDice,
    gameStatus,
    isLocalMode = false,
    canRoll = true,
}: TopBarProps) {
    if (!players || players.length === 0) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground animate-pulse text-sm">En attente de joueurs...</span>
            </div>
        )
    }

    const currentPlayer = players.find(p => String(p.id) === currentTurnId)

    return (
        <div className="flex items-center gap-3">
            {/* Players Indicators */}
            <div className="hidden md:flex items-center gap-2">
                {players.map((player, index) => {
                    const isActive = String(player.id) === currentTurnId
                    const colorClass = player.color === 'cyan' ? 'bg-cyan-500 border-cyan-400' :
                                       player.color === 'violet' ? 'bg-violet-500 border-violet-400' :
                                       player.color === 'orange' ? 'bg-orange-500 border-orange-400' :
                                       'bg-green-500 border-green-400'
                    const textColor = player.color === 'cyan' ? 'text-cyan-400' :
                                      player.color === 'violet' ? 'text-violet-400' :
                                      player.color === 'orange' ? 'text-orange-400' :
                                      'text-green-400'

                    return (
                        <div
                            key={player.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                                isActive ? 'bg-white/10 border border-white/20' : 'opacity-50'
                            }`}
                        >
                            <div className={`w-3 h-3 rounded-full ${colorClass.split(' ')[0]} ${isActive ? 'animate-pulse' : ''}`} />
                            <span className={`text-sm font-bold ${isActive ? textColor : 'text-muted-foreground'}`}>
                                {player.name}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">{player.score}</span>
                        </div>
                    )
                })}
            </div>

            {/* Dice Button */}
            {gameStatus === 'finished' ? (
                <div className="h-10 px-4 flex items-center justify-center bg-red-500/10 rounded-lg border border-red-500/50">
                    <span className="text-sm text-red-400 font-bold">TERMINÉ</span>
                </div>
            ) : gameStatus === 'waiting' ? (
                <div className="h-10 px-4 flex items-center justify-center bg-muted/20 rounded-lg border border-border/50">
                    <span className="text-sm text-muted-foreground animate-pulse">En attente...</span>
                </div>
            ) : canRoll ? (
                <Button
                    onClick={onRollDice}
                    disabled={isRolling}
                    className={`h-10 px-6 font-bold transition-all ${
                        isRolling
                            ? "animate-pulse bg-violet-500/20 text-violet-400"
                            : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-400/50"
                    }`}
                    variant="outline"
                >
                    <Dices className={`mr-2 h-5 w-5 ${isRolling ? "animate-spin" : ""}`} />
                    {diceValue !== null && !isRolling ? diceValue : "LANCER"}
                </Button>
            ) : (
                <div className="h-10 px-4 flex items-center gap-2 bg-muted/20 rounded-lg border border-border/50">
                    <div className={`w-3 h-3 rounded-full bg-${currentPlayer?.color || 'cyan'}-500 animate-pulse`} />
                    <span className="text-sm text-muted-foreground">
                        {currentPlayer?.name || 'Joueur'} joue...
                    </span>
                </div>
            )}

            {/* Dice Result Display (Mobile) */}
            {diceValue !== null && !isRolling && (
                <div className="md:hidden flex items-center gap-1 text-violet-400">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-bold">{diceValue}</span>
                </div>
            )}
        </div>
    )
}
