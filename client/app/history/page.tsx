"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Trophy, Calendar, Clock, Users, TrendingUp, TrendingDown, Minus, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { socket } from "@/services/socket"
import { PageHeader, GameCard } from "@/components/ui/design-system"

interface GameHistoryEntry {
    id: string
    roomId: string
    roomName?: string
    players: { id: string; name: string; score: number; position: number }[]
    winner: string
    isWinner: boolean
    playerScore: number
    turnCount: number
    duration: number
    rulePackUsed?: string
    playedAt: string
}

interface Stats {
    gamesPlayed: number
    gamesWon: number
    totalScore: number
    winRate: number
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
}

export default function HistoryPage() {
    const router = useRouter()
    const [history, setHistory] = useState<GameHistoryEntry[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [streak, setStreak] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const userId = localStorage.getItem("userId")
        if (!userId) {
            router.push("/")
            return
        }

        socket.connect()
        socket.emit("get_game_history", { userId, limit: 50 })

        socket.on("game_history", (data: { history: GameHistoryEntry[]; stats: Stats; streak: number }) => {
            setHistory(data.history)
            setStats(data.stats)
            setStreak(data.streak)
            setLoading(false)
        })

        return () => {
            socket.off("game_history")
        }
    }, [router])

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}m ${secs}s`
    }

    const getResultBadge = (isWinner: boolean, playerScore: number, winnerScore: number) => {
        if (isWinner) {
            return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Victoire</Badge>
        }
        const diff = winnerScore - playerScore
        if (diff <= 5) {
            return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Proche</Badge>
        }
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Défaite</Badge>
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Chargement de l'historique...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Background Effect */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.1),transparent_50%)]" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="hover:bg-white/10">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <PageHeader
                        icon={History}
                        title="HISTORIQUE"
                        subtitle={`${history.length} partie${history.length !== 1 ? 's' : ''} jouée${history.length !== 1 ? 's' : ''}`}
                        gradient="from-cyan-500 to-blue-600"
                    />
                </div>
            </header>

            <main className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
                {/* Stats Summary */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                >
                    {[
                        { icon: Trophy, value: stats?.gamesWon || 0, label: "Victoires", color: "yellow" },
                        { icon: Users, value: stats?.gamesPlayed || 0, label: "Parties", color: "cyan" },
                        { icon: TrendingUp, value: `${stats?.winRate?.toFixed(0) || 0}%`, label: "Taux victoire", color: "green" },
                        {
                            icon: streak > 0 ? TrendingUp : streak < 0 ? TrendingDown : Minus,
                            value: Math.abs(streak),
                            label: streak > 0 ? 'Série victoires' : streak < 0 ? 'Série défaites' : 'Neutre',
                            color: streak > 0 ? 'green' : streak < 0 ? 'red' : 'gray'
                        },
                    ].map((stat, i) => (
                        <motion.div key={stat.label} variants={itemVariants}>
                            <GameCard className="text-center">
                                <stat.icon className={`h-8 w-8 mx-auto mb-2 text-${stat.color}-400`} />
                                <p className="text-3xl font-black text-white">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </GameCard>
                        </motion.div>
                    ))}
                </motion.div>

                {/* History List */}
                {history.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <GameCard className="text-center py-12">
                            <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">Aucune partie jouée</p>
                            <Button className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600" onClick={() => router.push("/")}>
                                Jouer maintenant
                            </Button>
                        </GameCard>
                    </motion.div>
                ) : (
                    <ScrollArea className="h-[600px] pr-4">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-4"
                        >
                            {history.map((game) => {
                                const winnerPlayer = game.players.find(p => p.id === game.winner)
                                return (
                                    <motion.div key={game.id} variants={itemVariants}>
                                        <GameCard className={game.isWinner ? "border-green-500/30 bg-green-500/5" : ""}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-white">{game.roomName || `Partie ${game.roomId.substring(0, 6)}`}</h3>
                                                        {getResultBadge(game.isWinner, game.playerScore, winnerPlayer?.score || 0)}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(game.playedAt).toLocaleDateString('fr-FR')}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDuration(game.duration)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            {game.players.length} joueurs
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-3xl font-black text-cyan-400">{game.playerScore}</p>
                                                    <p className="text-xs text-muted-foreground">points</p>
                                                </div>
                                            </div>

                                            {/* Players */}
                                            <div className="flex flex-wrap gap-2">
                                                {game.players
                                                    .sort((a, b) => b.score - a.score)
                                                    .map((player, index) => (
                                                        <Badge
                                                            key={player.id}
                                                            variant="outline"
                                                            className={player.id === game.winner
                                                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                                                : "border-white/20 text-muted-foreground"
                                                            }
                                                        >
                                                            {index + 1}. {player.name} ({player.score}pts)
                                                            {player.id === game.winner && " \u{1F451}"}
                                                        </Badge>
                                                    ))}
                                            </div>

                                            {game.rulePackUsed && (
                                                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-white/5">
                                                    Pack: {game.rulePackUsed}
                                                </p>
                                            )}
                                        </GameCard>
                                    </motion.div>
                                )
                            })}
                        </motion.div>
                    </ScrollArea>
                )}
            </main>
        </div>
    )
}
