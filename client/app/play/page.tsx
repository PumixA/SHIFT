"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Play,
    Plus,
    Minus,
    User,
    Bot,
    Pencil,
    Users,
    Gamepad2,
    Mail,
    UserPlus,
    Wifi,
    WifiOff,
    Check,
    X,
    ChevronRight,
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
import { toast } from "sonner"
import { motion } from "framer-motion"
import { PageHeader } from "@/components/ui/design-system"

const PLAYER_COLORS = ["cyan", "violet", "orange", "green"] as const

interface PlayerConfig {
    name: string
    color: (typeof PLAYER_COLORS)[number]
    isBot?: boolean
    botDifficulty?: "easy" | "medium" | "hard"
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
    const [activeTab, setActiveTab] = useState<"games" | "join" | "create">("games")

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
    // Amis et invitations
    const [friends, setFriends] = useState<Friend[]>([])
    const [selectedFriends, setSelectedFriends] = useState<string[]>([])
    const [invites, setInvites] = useState<GameInvite[]>([])
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

    // Charger le pseudo sauvegardé
    useEffect(() => {
        const storedName = localStorage.getItem("username")
        if (storedName) {
            setPlayerName(storedName)
            setPlayers((prev) => {
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
        const newCount = Math.max(2, playerCount + delta)
        setPlayerCount(newCount)

        if (newCount > players.length) {
            const newPlayers = [...players]
            for (let i = players.length; i < newCount; i++) {
                newPlayers.push({
                    name: `Joueur ${i + 1}`,
                    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
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
            newPlayers[index].botDifficulty = "medium"
        } else if (updates.isBot === false && newPlayers[index].name.includes("Bot")) {
            newPlayers[index].name = `Joueur ${index + 1}`
        }

        setPlayers(newPlayers)
    }

    const toggleFriendInvite = (friendId: string) => {
        setSelectedFriends((prev) =>
            prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
        )
    }

    const startGame = () => {
        if (gameMode === "local") {
            const storedUsername = localStorage.getItem("username")
            const gameConfig = {
                mode: "local",
                roomName: `Partie de ${storedUsername || players[0]?.name || "Joueur"}`,
                players: players.map((p) => ({
                    name: p.name,
                    color: p.color,
                    isBot: p.isBot,
                    botDifficulty: p.botDifficulty,
                })),
                allowRuleEdit,
                allowTileEdit,
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
                invitedFriends: selectedFriends,
            }
            sessionStorage.setItem("gameConfig", JSON.stringify(gameConfig))

            // Envoyer les invitations aux amis sélectionnés
            if (selectedFriends.length > 0 && userId) {
                const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
                selectedFriends.forEach((friendId) => {
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
            setInvites((prev) => prev.filter((i) => i.id !== inviteId))
            toast.info("Invitation refusée")
        }
    }

    const onlineFriends = friends.filter((f) => f.isOnline)

    return (
        <div className="bg-background min-h-screen">
            {/* Background Effect */}
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.1),transparent_50%)]" />
            </div>

            {/* Header */}
            <header className="bg-background/80 relative sticky top-0 z-10 border-b border-white/5 backdrop-blur-xl">
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

            <main className="relative z-10 container mx-auto max-w-2xl px-4 py-6">
                <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as "games" | "join" | "create")}>
                    <TabsList className="mb-6 grid w-full grid-cols-3">
                        <TabsTrigger value="games" className="flex items-center gap-2">
                            <Gamepad2 className="h-4 w-4" />
                            Parties
                        </TabsTrigger>
                        <TabsTrigger value="join" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Rejoindre
                            {invites.length > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="ml-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
                                >
                                    {invites.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="create" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Créer
                        </TabsTrigger>
                    </TabsList>

                    {/* Onglet Parties */}
                    <TabsContent value="games" className="space-y-6">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                            <SavedGamesList mode="local" onCreateNew={() => setActiveTab("create")} />
                        </div>
                    </TabsContent>

                    {/* Onglet Rejoindre */}
                    <TabsContent value="join" className="space-y-6">
                        {invites.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                                <Mail className="text-muted-foreground/30 mx-auto mb-4 h-16 w-16" />
                                <p className="text-muted-foreground">Aucune invitation en attente</p>
                                <p className="text-muted-foreground mt-2 text-sm">
                                    Les invitations de vos amis apparaîtront ici
                                </p>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                <div className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
                                    <Mail className="h-4 w-4" />
                                    Invitations reçues ({invites.length})
                                </div>
                                {invites.map((invite) => (
                                    <Card key={invite.id} className="border-violet-500/30 bg-violet-500/10">
                                        <CardContent className="flex items-center gap-4 p-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20">
                                                <Mail className="h-5 w-5 text-violet-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold">{invite.roomName}</p>
                                                <p className="text-muted-foreground text-sm">
                                                    Invitation de {invite.hostName}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => joinInvite(invite.roomId)}
                                                    className="bg-violet-600 hover:bg-violet-500"
                                                >
                                                    <Check className="mr-1 h-4 w-4" />
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
                    </TabsContent>

                    {/* Onglet Créer */}
                    <TabsContent value="create" className="space-y-6">
                        {/* Toggle Mode Local / En Ligne */}
                        <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
                            <button
                                onClick={() => setGameMode("local")}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold transition-all ${
                                    gameMode === "local"
                                        ? "border border-cyan-500/30 bg-cyan-500/20 text-cyan-400"
                                        : "text-muted-foreground hover:text-white"
                                }`}
                            >
                                <WifiOff className="h-4 w-4" />
                                Local
                            </button>
                            <button
                                onClick={() => setGameMode("online")}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold transition-all ${
                                    gameMode === "online"
                                        ? "border border-violet-500/30 bg-violet-500/20 text-violet-400"
                                        : "text-muted-foreground hover:text-white"
                                }`}
                            >
                                <Wifi className="h-4 w-4" />
                                En Ligne
                            </button>
                        </div>

                        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                            {/* Nom de la partie (Online) */}
                            {gameMode === "online" && (
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
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
                                    <Label className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
                                        Votre pseudo
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <User className="text-muted-foreground h-5 w-5" />
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
                                <Label className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
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
                                    <span
                                        className={`w-12 text-center text-4xl font-black ${
                                            gameMode === "local" ? "text-cyan-400" : "text-violet-400"
                                        }`}
                                    >
                                        {playerCount}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => updatePlayerCount(1)}
                                        className="h-10 w-10"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Configuration des joueurs (Local uniquement) */}
                            {gameMode === "local" && (
                                <div className="space-y-3">
                                    <Label className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
                                        Joueurs
                                    </Label>
                                    <div className="grid gap-3">
                                        {players.map((player, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 rounded-xl bg-white/5 p-3"
                                            >
                                                <div
                                                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${player.color}-500/20 border border-${player.color}-500/50`}
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
                                                    <Label
                                                        htmlFor={`bot-${index}`}
                                                        className="text-muted-foreground cursor-pointer text-xs"
                                                    >
                                                        IA
                                                    </Label>
                                                    <Switch
                                                        id={`bot-${index}`}
                                                        checked={player.isBot}
                                                        onCheckedChange={(checked: boolean) =>
                                                            updatePlayer(index, { isBot: checked })
                                                        }
                                                    />
                                                </div>

                                                {player.isBot ? (
                                                    <Select
                                                        value={player.botDifficulty || "medium"}
                                                        onValueChange={(v: string) =>
                                                            updatePlayer(index, {
                                                                botDifficulty: v as "easy" | "medium" | "hard",
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 w-24 bg-white/5">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="easy">Facile</SelectItem>
                                                            <SelectItem value="medium">Moyen</SelectItem>
                                                            <SelectItem value="hard">Difficile</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : null}

                                                <div className={`h-4 w-4 rounded-full bg-${player.color}-500`} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Inviter des amis (Online) */}
                            {gameMode === "online" && (
                                <div className="space-y-3">
                                    <Label className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
                                        <UserPlus className="h-4 w-4" />
                                        Inviter des amis
                                    </Label>

                                    {onlineFriends.length === 0 ? (
                                        <Card className="border-dashed bg-white/5">
                                            <CardContent className="py-6 text-center">
                                                <Users className="text-muted-foreground mx-auto mb-2 h-8 w-8 opacity-50" />
                                                <p className="text-muted-foreground text-sm">Aucun ami en ligne</p>
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
                                                    className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all ${
                                                        selectedFriends.includes(friend.id)
                                                            ? "border border-violet-500/30 bg-violet-500/20"
                                                            : "bg-white/5 hover:bg-white/10"
                                                    }`}
                                                >
                                                    <div className="relative">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback>
                                                                {friend.username.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="border-background absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 bg-green-500" />
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
                                                            <ChevronRight className="ml-2 h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Inviter des amis</DialogTitle>
                                                        </DialogHeader>
                                                        <ScrollArea className="mt-4 max-h-[400px]">
                                                            <div className="space-y-2">
                                                                {onlineFriends.map((friend) => (
                                                                    <div
                                                                        key={friend.id}
                                                                        onClick={() => toggleFriendInvite(friend.id)}
                                                                        className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all ${
                                                                            selectedFriends.includes(friend.id)
                                                                                ? "border border-violet-500/30 bg-violet-500/20"
                                                                                : "bg-white/5 hover:bg-white/10"
                                                                        }`}
                                                                    >
                                                                        <Avatar className="h-8 w-8">
                                                                            <AvatarFallback>
                                                                                {friend.username
                                                                                    .charAt(0)
                                                                                    .toUpperCase()}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="flex-1 font-medium">
                                                                            {friend.username}
                                                                        </span>
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
                                                <p className="text-muted-foreground text-xs">
                                                    {selectedFriends.length} ami{selectedFriends.length > 1 ? "s" : ""}{" "}
                                                    sélectionné{selectedFriends.length > 1 ? "s" : ""}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <Separator />

                            {/* Options de partie */}
                            <div className="space-y-3">
                                <Label className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
                                    Options de partie
                                </Label>

                                <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                                    <div className="flex items-center gap-3">
                                        <Pencil className="text-muted-foreground h-5 w-5" />
                                        <div>
                                            <Label htmlFor="rule-edit" className="cursor-pointer font-bold">
                                                Édition de règles
                                            </Label>
                                            <p className="text-muted-foreground text-xs">
                                                Créer et modifier des règles en jeu
                                            </p>
                                        </div>
                                    </div>
                                    <Switch id="rule-edit" checked={allowRuleEdit} onCheckedChange={setAllowRuleEdit} />
                                </div>

                                <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                                    <div className="flex items-center gap-3">
                                        <Plus className="text-muted-foreground h-5 w-5" />
                                        <div>
                                            <Label htmlFor="tile-edit" className="cursor-pointer font-bold">
                                                Modification du plateau
                                            </Label>
                                            <p className="text-muted-foreground text-xs">
                                                Ajouter ou supprimer des cases en jeu
                                            </p>
                                        </div>
                                    </div>
                                    <Switch id="tile-edit" checked={allowTileEdit} onCheckedChange={setAllowTileEdit} />
                                </div>
                            </div>
                        </div>

                        {/* Bouton Lancer */}
                        <Button
                            onClick={startGame}
                            className={`h-14 w-full text-lg font-black tracking-wider uppercase ${
                                gameMode === "local"
                                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                                    : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                            }`}
                        >
                            <Play className="mr-2 h-5 w-5" />
                            {gameMode === "local" ? "Lancer la partie" : "Créer la partie"}
                        </Button>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
