"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft, Play, Plus, Minus, User, Bot, Package, Pencil, Users,
    Globe, Gamepad2, Mail, Clock, UserPlus, Wifi, WifiOff, Check, X,
    ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SavedGamesList } from "@/components/menu/saved-games-list"
import { socket } from "@/services/socket"
import { toast, Toaster } from "sonner"
import { motion } from "framer-motion"
import { PageHeader } from "@/components/ui/design-system"

const PLAYER_COLORS = ['cyan', 'violet', 'orange', 'green'] as const

interface PlayerConfig {
    name: string
    color: typeof PLAYER_COLORS[number]
    isBot?: boolean
    botDifficulty?: 'easy' | 'medium' | 'hard'
}

interface Friend {
    id: string
    username: string
    avatarPreset?: string
    isOnline: boolean
}

interface GameInvite {
    id: string
    roomId: string
    hostName: string
    roomName: string
    createdAt: string
}

export default function PlayPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<"games" | "create">("games")

    // Mode de jeu
    const [gameMode, setGameMode] = useState<"local" | "online">("local")

    // Configuration création de partie
    const [roomName, setRoomName] = useState("")
    const [playerCount, setPlayerCount] = useState(2)
    const [players, setPlayers] = useState<PlayerConfig[]>([
        { name: "Joueur 1", color: "cyan", isBot: false },
        { name: "Joueur 2", color: "violet", isBot: false },
    ])
    const [playerName, setPlayerName] = useState("")
    const [allowRuleEdit, setAllowRuleEdit] = useState(true)
    const [allowTileEdit, setAllowTileEdit] = useState(true)
    const [selectedRulePack, setSelectedRulePack] = useState("default-classic")

    // Amis et invitations
    const [friends, setFriends] = useState<Friend[]>([])
    const [selectedFriends, setSelectedFriends] = useState<string[]>([])
    const [invites, setInvites] = useState<GameInvite[]>([])
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

    const rulePacks = [
        { id: "default-vanilla", name: "Vanilla", description: "Sans règles spéciales - plateau vierge" },
        { id: "default-classic", name: "Classique", description: "Cases bonus et pièges équilibrés" },
        { id: "default-chaos", name: "Chaos", description: "Téléportations et effets aléatoires" },
        { id: "default-strategic", name: "Stratégique", description: "Règles tactiques avancées" },
    ]

    // Charger le pseudo sauvegardé
    useEffect(() => {
        const storedName = localStorage.getItem("username")
        if (storedName) {
            setPlayerName(storedName)
            setPlayers(prev => {
                const newPlayers = [...prev]
                newPlayers[0] = { ...newPlayers[0], name: storedName }
                return newPlayers
            })
        }
    }, [])

    // Socket events pour les invitations
    useEffect(() => {
        const userId = localStorage.getItem("userId")
        if (!userId) return

        socket.connect()

        // Charger les amis
        socket.emit("get_friends", { userId })

        socket.on("friends_list", (data: { friends: Friend[] }) => {
            setFriends(data.friends)
        })

        // Charger les invitations reçues
        socket.emit("get_game_invites", { userId })

        socket.on("game_invites_list", (data: { invites: GameInvite[] }) => {
            setInvites(data.invites)
        })

        socket.on("game_invite_received", (data: { hostName: string; roomId: string; roomName: string }) => {
            toast.info(`${data.hostName} vous invite à rejoindre "${data.roomName}"`, {
                action: {
                    label: "Rejoindre",
                    onClick: () => joinInvite(data.roomId),
                },
            })
            socket.emit("get_game_invites", { userId })
        })

        return () => {
            socket.off("friends_list")
            socket.off("game_invites_list")
            socket.off("game_invite_received")
        }
    }, [])

    const updatePlayerCount = (delta: number) => {
        const newCount = Math.max(2, Math.min(4, playerCount + delta))
        setPlayerCount(newCount)

        if (newCount > players.length) {
            const newPlayers = [...players]
            for (let i = players.length; i < newCount; i++) {
                newPlayers.push({
                    name: `Joueur ${i + 1}`,
                    color: PLAYER_COLORS[i],
                    isBot: false,
                })
            }
            setPlayers(newPlayers)
        } else if (newCount < players.length) {
            setPlayers(players.slice(0, newCount))
        }
    }

    const updatePlayer = (index: number, updates: Partial<PlayerConfig>) => {
        const newPlayers = [...players]
        newPlayers[index] = { ...newPlayers[index], ...updates }

        if (updates.isBot && !newPlayers[index].name.includes("Bot")) {
            newPlayers[index].name = `Bot ${index + 1}`
            newPlayers[index].botDifficulty = 'medium'
        } else if (updates.isBot === false && newPlayers[index].name.includes("Bot")) {
            newPlayers[index].name = `Joueur ${index + 1}`
        }

        setPlayers(newPlayers)
    }

    const toggleFriendInvite = (friendId: string) => {
        setSelectedFriends(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        )
    }

    const startGame = () => {
        if (gameMode === "local") {
            const gameConfig = {
                mode: "local",
                players: players.map(p => ({
                    name: p.name,
                    color: p.color,
                    isBot: p.isBot,
                    botDifficulty: p.botDifficulty,
                })),
                allowRuleEdit,
                allowTileEdit,
                rulePackId: selectedRulePack,
            }
            sessionStorage.setItem("gameConfig", JSON.stringify(gameConfig))
            router.push("/game")
        } else {
            // Mode online
            const userId = localStorage.getItem("userId")
            const gameConfig = {
                mode: "online",
                action: "create",
                roomName: roomName || `Partie de ${playerName || "Host"}`,
                maxPlayers: playerCount,
                playerName: playerName || "Host",
                allowRuleEdit,
                allowTileEdit,
                rulePackId: selectedRulePack,
                invitedFriends: selectedFriends,
            }
            sessionStorage.setItem("gameConfig", JSON.stringify(gameConfig))

            // Envoyer les invitations aux amis sélectionnés
            if (selectedFriends.length > 0 && userId) {
                const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
                selectedFriends.forEach(friendId => {
                    socket.emit("invite_to_game", {
                        userId,
                        friendId,
                        roomId,
                        roomName: gameConfig.roomName,
                    })
                })
            }

            router.push("/game")
        }
    }

    const joinInvite = (roomId: string) => {
        const gameConfig = {
            mode: "online",
            action: "join",
            roomCode: roomId,
            playerName: playerName || localStorage.getItem("username") || "Player",
        }
        sessionStorage.setItem("gameConfig", JSON.stringify(gameConfig))
        router.push("/game")
    }

    const declineInvite = (inviteId: string) => {
        const userId = localStorage.getItem("userId")
        if (userId) {
            socket.emit("decline_game_invite", { userId, inviteId })
            setInvites(prev => prev.filter(i => i.id !== inviteId))
            toast.info("Invitation refusée")
        }
    }

    const onlineFriends = friends.filter(f => f.isOnline)

    return (
        <div className="min-h-screen bg-background">
            <Toaster position="bottom-right" theme="dark" richColors />

            {/* Background Effect */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.1),transparent_50%)]" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="hover:bg-white/10">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <PageHeader
                            icon={Gamepad2}
                            title="JOUER"
                            subtitle="Créer ou rejoindre une partie"
                            gradient="from-cyan-500 to-blue-600"
                        />
                    </div>
                </div>
            </header>

            <main className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "games" | "create")}>
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="games" className="flex items-center gap-2">
                            <Gamepad2 className="h-4 w-4" />
                            Mes Parties
                            {invites.length > 0 && (
                                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                    {invites.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="create" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Créer
                        </TabsTrigger>
                    </TabsList>

                    {/* Onglet Mes Parties */}
                    <TabsContent value="games" className="space-y-6">
                        {/* Invitations reçues */}
                        {invites.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    Invitations reçues
                                </div>
                                {invites.map((invite) => (
                                    <Card key={invite.id} className="bg-violet-500/10 border-violet-500/30">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                                                <Mail className="h-5 w-5 text-violet-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold">{invite.roomName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Invitation de {invite.hostName}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => joinInvite(invite.roomId)}
                                                    className="bg-violet-600 hover:bg-violet-500"
                                                >
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Rejoindre
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => declineInvite(invite.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </motion.div>
                        )}

                        {/* Parties sauvegardées */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <SavedGamesList
                                mode="local"
                                onCreateNew={() => setActiveTab("create")}
                            />
                        </div>
                    </TabsContent>

                    {/* Onglet Créer */}
                    <TabsContent value="create" className="space-y-6">
                        {/* Toggle Mode Local / En Ligne */}
                        <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
                            <button
                                onClick={() => setGameMode("local")}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all ${
                                    gameMode === "local"
                                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                        : "text-muted-foreground hover:text-white"
                                }`}
                            >
                                <WifiOff className="h-4 w-4" />
                                Local
                            </button>
                            <button
                                onClick={() => setGameMode("online")}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all ${
                                    gameMode === "online"
                                        ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                                        : "text-muted-foreground hover:text-white"
                                }`}
                            >
                                <Wifi className="h-4 w-4" />
                                En Ligne
                            </button>
                        </div>

                        <div className="space-y-6 bg-white/5 rounded-2xl p-6 border border-white/10">
                            {/* Nom de la partie (Online) */}
                            {gameMode === "online" && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        Nom de la partie
                                    </Label>
                                    <Input
                                        value={roomName}
                                        onChange={(e) => setRoomName(e.target.value)}
                                        placeholder={`Partie de ${playerName || "vous"}`}
                                        className="bg-white/5"
                                        maxLength={30}
                                    />
                                </div>
                            )}

                            {/* Pseudo (Online) */}
                            {gameMode === "online" && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        Votre pseudo
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                        <Input
                                            value={playerName}
                                            onChange={(e) => setPlayerName(e.target.value)}
                                            placeholder="Votre nom"
                                            className="flex-1 bg-white/5"
                                            maxLength={20}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Nombre de joueurs */}
                            <div className="space-y-3">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                    Nombre de joueurs
                                </Label>
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => updatePlayerCount(-1)}
                                        disabled={playerCount <= 2}
                                        className="h-10 w-10"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className={`text-4xl font-black w-12 text-center ${
                                        gameMode === "local" ? "text-cyan-400" : "text-violet-400"
                                    }`}>
                                        {playerCount}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => updatePlayerCount(1)}
                                        disabled={playerCount >= 4}
                                        className="h-10 w-10"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Configuration des joueurs (Local uniquement) */}
                            {gameMode === "local" && (
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        Joueurs
                                    </Label>
                                    <div className="grid gap-3">
                                        {players.map((player, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                                                <div
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${player.color}-500/20 border border-${player.color}-500/50`}
                                                >
                                                    {player.isBot ? (
                                                        <Bot className={`h-5 w-5 text-${player.color}-400`} />
                                                    ) : (
                                                        <User className={`h-5 w-5 text-${player.color}-400`} />
                                                    )}
                                                </div>
                                                <Input
                                                    value={player.name}
                                                    onChange={(e) => updatePlayer(index, { name: e.target.value })}
                                                    placeholder={`Joueur ${index + 1}`}
                                                    className="flex-1 bg-white/5"
                                                    maxLength={20}
                                                />

                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor={`bot-${index}`} className="text-xs text-muted-foreground cursor-pointer">
                                                        IA
                                                    </Label>
                                                    <Switch
                                                        id={`bot-${index}`}
                                                        checked={player.isBot}
                                                        onCheckedChange={(checked) => updatePlayer(index, { isBot: checked })}
                                                    />
                                                </div>

                                                {player.isBot && (
                                                    <Select
                                                        value={player.botDifficulty || 'medium'}
                                                        onValueChange={(v) => updatePlayer(index, { botDifficulty: v as 'easy' | 'medium' | 'hard' })}
                                                    >
                                                        <SelectTrigger className="w-24 h-8 bg-white/5">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="easy">Facile</SelectItem>
                                                            <SelectItem value="medium">Moyen</SelectItem>
                                                            <SelectItem value="hard">Difficile</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}

                                                <div className={`w-4 h-4 rounded-full bg-${player.color}-500`} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Inviter des amis (Online) */}
                            {gameMode === "online" && (
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <UserPlus className="h-4 w-4" />
                                        Inviter des amis
                                    </Label>

                                    {onlineFriends.length === 0 ? (
                                        <Card className="bg-white/5 border-dashed">
                                            <CardContent className="py-6 text-center">
                                                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                                                <p className="text-sm text-muted-foreground">
                                                    Aucun ami en ligne
                                                </p>
                                                <Link href="/friends">
                                                    <Button variant="link" size="sm" className="mt-2">
                                                        Gérer les amis
                                                    </Button>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="space-y-2">
                                            {onlineFriends.slice(0, 3).map((friend) => (
                                                <div
                                                    key={friend.id}
                                                    onClick={() => toggleFriendInvite(friend.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                                                        selectedFriends.includes(friend.id)
                                                            ? "bg-violet-500/20 border border-violet-500/30"
                                                            : "bg-white/5 hover:bg-white/10"
                                                    }`}
                                                >
                                                    <div className="relative">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                                                    </div>
                                                    <span className="flex-1 font-medium">{friend.username}</span>
                                                    {selectedFriends.includes(friend.id) && (
                                                        <Check className="h-5 w-5 text-violet-400" />
                                                    )}
                                                </div>
                                            ))}

                                            {onlineFriends.length > 3 && (
                                                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" className="w-full">
                                                            Voir tous les amis en ligne ({onlineFriends.length})
                                                            <ChevronRight className="h-4 w-4 ml-2" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Inviter des amis</DialogTitle>
                                                        </DialogHeader>
                                                        <ScrollArea className="max-h-[400px] mt-4">
                                                            <div className="space-y-2">
                                                                {onlineFriends.map((friend) => (
                                                                    <div
                                                                        key={friend.id}
                                                                        onClick={() => toggleFriendInvite(friend.id)}
                                                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                                                                            selectedFriends.includes(friend.id)
                                                                                ? "bg-violet-500/20 border border-violet-500/30"
                                                                                : "bg-white/5 hover:bg-white/10"
                                                                        }`}
                                                                    >
                                                                        <Avatar className="h-8 w-8">
                                                                            <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="flex-1 font-medium">{friend.username}</span>
                                                                        {selectedFriends.includes(friend.id) && (
                                                                            <Check className="h-5 w-5 text-violet-400" />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </ScrollArea>
                                                    </DialogContent>
                                                </Dialog>
                                            )}

                                            {selectedFriends.length > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    {selectedFriends.length} ami{selectedFriends.length > 1 ? "s" : ""} sélectionné{selectedFriends.length > 1 ? "s" : ""}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <Separator />

                            {/* Set de règles */}
                            <div className="space-y-3">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Set de règles
                                </Label>
                                <Select value={selectedRulePack} onValueChange={setSelectedRulePack}>
                                    <SelectTrigger className="bg-white/5">
                                        <SelectValue placeholder="Choisir un set" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rulePacks.map((pack) => (
                                            <SelectItem key={pack.id} value={pack.id}>
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{pack.name}</span>
                                                    <span className="text-xs text-muted-foreground">{pack.description}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Options de partie */}
                            <div className="space-y-3">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                    Options de partie
                                </Label>

                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <Pencil className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <Label htmlFor="rule-edit" className="cursor-pointer font-bold">
                                                Édition de règles
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Créer et modifier des règles en jeu
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        id="rule-edit"
                                        checked={allowRuleEdit}
                                        onCheckedChange={setAllowRuleEdit}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <Plus className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <Label htmlFor="tile-edit" className="cursor-pointer font-bold">
                                                Modification du plateau
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Ajouter ou supprimer des cases en jeu
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        id="tile-edit"
                                        checked={allowTileEdit}
                                        onCheckedChange={setAllowTileEdit}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bouton Lancer */}
                        <Button
                            onClick={startGame}
                            className={`w-full h-14 text-lg font-black uppercase tracking-wider ${
                                gameMode === "local"
                                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                                    : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                            }`}
                        >
                            <Play className="h-5 w-5 mr-2" />
                            {gameMode === "local" ? "Lancer la partie" : "Créer la partie"}
                        </Button>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
