"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Play, Trash2, Clock, Users, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { socket } from "@/services/socket"
import { toast, Toaster } from "sonner"
import { PageHeader, GameCard } from "@/components/ui/design-system"

interface SavedGame {
    id: string
    roomId: string
    roomName?: string
    lastActivity: string
    createdAt: string
    gameState: {
        players: { id: string; name: string; position: number; score: number; color: string }[]
        currentTurn: string
        turnCount: number
        status: string
    }
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
}

export default function SavedGamesPage() {
    const router = useRouter()
    const [savedGames, setSavedGames] = useState<SavedGame[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const userId = localStorage.getItem("userId")
        if (!userId) {
            router.push("/")
            return
        }

        socket.connect()
        socket.emit("get_saved_games", { userId })

        socket.on("saved_games_list", (games: SavedGame[]) => {
            setSavedGames(games)
            setLoading(false)
        })

        socket.on("game_state_loaded", (data: { success: boolean; gameState?: any; message?: string }) => {
            if (data.success) {
                toast.success("Partie chargée !")
                sessionStorage.setItem("gameConfig", JSON.stringify({
                    mode: "online",
                    action: "continue",
                    roomId: data.gameState?.roomId
                }))
                router.push("/game")
            } else {
                toast.error(data.message || "Erreur lors du chargement")
            }
        })

        socket.on("saved_game_deleted", (result: { success: boolean }) => {
            if (result.success) {
                toast.success("Partie supprimée")
                socket.emit("get_saved_games", { userId })
            }
        })

        return () => {
            socket.off("saved_games_list")
            socket.off("game_state_loaded")
            socket.off("saved_game_deleted")
        }
    }, [router])

    const loadGame = (roomId: string) => {
        const userId = localStorage.getItem("userId")
        if (!userId) return
        socket.emit("load_saved_game", { userId, roomId })
    }

    const deleteGame = (roomId: string) => {
        const userId = localStorage.getItem("userId")
        if (!userId) return
        socket.emit("delete_saved_game", { userId, roomId })
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffHours / 24)

        if (diffHours < 1) return "Il y a moins d'une heure"
        if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`
        if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
        return date.toLocaleDateString('fr-FR')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Chargement des sauvegardes...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Toaster position="bottom-right" theme="dark" richColors />

            {/* Background Effect */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.1),transparent_50%)]" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="hover:bg-white/10">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <PageHeader
                        icon={Save}
                        title="SAUVEGARDES"
                        subtitle={`${savedGames.length} partie${savedGames.length !== 1 ? 's' : ''} sauvegardée${savedGames.length !== 1 ? 's' : ''}`}
                        gradient="from-green-500 to-emerald-600"
                    />
                </div>
            </header>

            <main className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
                {savedGames.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <GameCard className="text-center py-12">
                            <Save className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground mb-2">Aucune partie sauvegardée</p>
                            <p className="text-sm text-muted-foreground/60 mb-6">
                                Pendant une partie, cliquez sur "Sauvegarder" pour reprendre plus tard
                            </p>
                            <Button className="bg-gradient-to-r from-green-500 to-emerald-600" onClick={() => router.push("/")}>
                                Nouvelle partie
                            </Button>
                        </GameCard>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {savedGames.map((game) => (
                            <motion.div key={game.id} variants={itemVariants}>
                                <GameCard className="h-full hover:bg-white/10 transition-colors">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-bold text-white">
                                                {game.roomName || `Partie ${game.roomId.substring(0, 6)}`}
                                            </h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(game.lastActivity)}
                                            </p>
                                        </div>
                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                            Tour {game.gameState.turnCount || 0}
                                        </Badge>
                                    </div>

                                    {/* Players */}
                                    <div className="space-y-2 mb-4">
                                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                            <Users className="h-3 w-3" /> Joueurs
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {game.gameState.players.map((player) => {
                                                const colorClass = player.color === 'cyan' ? 'bg-cyan-500' :
                                                    player.color === 'violet' ? 'bg-violet-500' :
                                                        player.color === 'orange' ? 'bg-orange-500' :
                                                            'bg-green-500'
                                                return (
                                                    <Badge
                                                        key={player.id}
                                                        variant="outline"
                                                        className={`border-white/20 ${player.id === game.gameState.currentTurn ? 'border-yellow-500 bg-yellow-500/10' : ''}`}
                                                    >
                                                        <span className={`h-2 w-2 rounded-full ${colorClass} mr-1.5`} />
                                                        {player.name}
                                                        {player.id === game.gameState.currentTurn && " (tour)"}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-2 mb-4">
                                        <p className="text-xs text-muted-foreground">Progression</p>
                                        <div className="flex gap-1">
                                            {game.gameState.players.map((player) => {
                                                const colorClass = player.color === 'cyan' ? 'bg-cyan-500' :
                                                    player.color === 'violet' ? 'bg-violet-500' :
                                                        player.color === 'orange' ? 'bg-orange-500' :
                                                            'bg-green-500'
                                                const progress = Math.min((player.position / 19) * 100, 100)
                                                return (
                                                    <div key={player.id} className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${colorClass} transition-all`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-4 border-t border-white/10">
                                        <Button
                                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500"
                                            onClick={() => loadGame(game.roomId)}
                                        >
                                            <Play className="h-4 w-4 mr-2" /> Reprendre
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-500/20">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Supprimer cette partie ?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Cette action est irréversible. La partie sauvegardée sera définitivement supprimée.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => deleteGame(game.roomId)}
                                                        className="bg-red-500 hover:bg-red-600"
                                                    >
                                                        Supprimer
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </GameCard>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-10 p-4 rounded-xl bg-green-500/10 border border-green-500/20"
                >
                    <p className="text-sm text-green-200">
                        <strong>Note :</strong> Les parties sauvegardées sont conservées pendant 30 jours.
                        Pensez à reprendre vos parties en cours pour ne pas perdre votre progression !
                    </p>
                </motion.div>
            </main>
        </div>
    )
}
