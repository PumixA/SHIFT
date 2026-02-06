"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
    ArrowLeft,
    UserPlus,
    Users,
    Clock,
    X,
    Check,
    Search,
    UserX,
    MessageCircle,
    Gamepad2,
    Copy,
    ExternalLink,
    Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { socket } from "@/services/socket"
import { toast } from "sonner"
import { PageHeader, GameCard } from "@/components/ui/design-system"

interface Friend {
    id: string
    username: string
    avatarPreset?: string
    isOnline: boolean
    currentGame?: string // roomId si en partie
}

interface FriendRequest {
    id: string
    username: string
    avatarPreset?: string
    createdAt: string
}

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
}

// Friend Card Component
function FriendCard({
    friend,
    onInvite,
    onMessage,
    onRemove,
}: {
    friend: Friend
    onInvite: () => void
    onMessage: () => void
    onRemove: () => void
}) {
    const [confirmRemove, setConfirmRemove] = useState(false)

    return (
        <>
            <motion.div variants={itemVariants}>
                <GameCard className="transition-colors hover:bg-white/10">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-12 w-12 border-2 border-white/10">
                                <AvatarImage
                                    src={friend.avatarPreset ? `/avatars/${friend.avatarPreset}.png` : undefined}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-500 font-bold text-white">
                                    {friend.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span
                                className={`border-background absolute -right-0.5 -bottom-0.5 h-4 w-4 rounded-full border-2 ${
                                    friend.currentGame
                                        ? "bg-orange-500"
                                        : friend.isOnline
                                          ? "bg-green-500"
                                          : "bg-gray-500"
                                }`}
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-white">{friend.username}</p>
                            <p className="text-muted-foreground text-sm">
                                {friend.currentGame ? (
                                    <span className="flex items-center gap-1 text-orange-400">
                                        <Gamepad2 className="h-3 w-3" />
                                        En partie
                                    </span>
                                ) : friend.isOnline ? (
                                    <span className="text-green-400">En ligne</span>
                                ) : (
                                    "Hors ligne"
                                )}
                            </p>
                        </div>

                        <div className="flex gap-1">
                            {friend.isOnline && !friend.currentGame ? (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={onInvite}
                                    className="h-9 w-9 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300"
                                    title="Inviter à jouer"
                                >
                                    <Gamepad2 className="h-4 w-4" />
                                </Button>
                            ) : null}
                            {friend.currentGame ? (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300"
                                    title="Rejoindre la partie"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            ) : null}
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={onMessage}
                                className="h-9 w-9 hover:bg-white/10"
                                title="Message"
                            >
                                <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setConfirmRemove(true)}
                                className="h-9 w-9 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                                title="Retirer"
                            >
                                <UserX className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </GameCard>
            </motion.div>

            <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Retirer {friend.username} ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette personne sera retirée de votre liste d'amis. Vous pourrez l'ajouter à nouveau plus
                            tard.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={onRemove} className="bg-red-500 hover:bg-red-600">
                            Retirer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// Request Card Component
function RequestCard({
    request,
    onAccept,
    onDecline,
    type,
}: {
    request: FriendRequest
    onAccept?: () => void
    onDecline?: () => void
    type: "pending" | "sent"
}) {
    return (
        <motion.div variants={itemVariants}>
            <GameCard>
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={request.avatarPreset ? `/avatars/${request.avatarPreset}.png` : undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 font-bold text-white">
                            {request.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                        <p className="font-bold text-white">{request.username}</p>
                        <p className="text-muted-foreground text-sm">
                            {new Date(request.createdAt).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                            })}
                        </p>
                    </div>

                    {type === "pending" ? (
                        <div className="flex gap-2">
                            <Button size="sm" onClick={onAccept} className="bg-green-500 hover:bg-green-600">
                                <Check className="mr-1 h-4 w-4" /> Accepter
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={onDecline}
                                className="h-8 w-8 text-red-400 hover:text-red-300"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground border-white/20">
                            <Clock className="mr-1 h-3 w-3" />
                            En attente
                        </Badge>
                    )}
                </div>
            </GameCard>
        </motion.div>
    )
}

// Empty State Component
function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
    return (
        <div className="py-16 text-center">
            <Icon className="text-muted-foreground/30 mx-auto mb-4 h-16 w-16" />
            <p className="text-muted-foreground">{message}</p>
        </div>
    )
}

export default function FriendsPage() {
    const router = useRouter()
    const [friends, setFriends] = useState<Friend[]>([])
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [addFriendId, setAddFriendId] = useState("")
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        const storedUserId = localStorage.getItem("userId")
        if (!storedUserId) {
            router.push("/profile")
            return
        }
        setUserId(storedUserId)

        socket.connect()
        socket.emit("get_friends", { userId: storedUserId })

        socket.on("friends_list", (data: { friends: Friend[]; pending: FriendRequest[]; sent: FriendRequest[] }) => {
            setFriends(data.friends)
            setPendingRequests(data.pending)
            setSentRequests(data.sent)
            setLoading(false)
        })

        socket.on("friend_request_result", (result: { success: boolean; message?: string }) => {
            if (result.success) {
                toast.success("Demande d'ami envoyée !")
                setAddDialogOpen(false)
                socket.emit("get_friends", { userId: storedUserId })
            } else {
                toast.error(result.message || "Erreur lors de l'envoi")
            }
        })

        socket.on("friend_request_received", (data: { requesterId: string; requesterName: string }) => {
            toast.info(`${data.requesterName} vous a envoyé une demande d'ami !`, {
                icon: <UserPlus className="h-4 w-4" />,
            })
            socket.emit("get_friends", { userId: storedUserId })
        })

        socket.on("friend_request_accepted", () => {
            toast.success("Demande d'ami acceptée !")
            socket.emit("get_friends", { userId: storedUserId })
        })

        socket.on("friend_removed", (result: { success: boolean }) => {
            if (result.success) {
                toast.info("Ami retiré de la liste")
                socket.emit("get_friends", { userId: storedUserId })
            }
        })

        return () => {
            socket.off("friends_list")
            socket.off("friend_request_result")
            socket.off("friend_request_received")
            socket.off("friend_request_accepted")
            socket.off("friend_removed")
        }
    }, [router])

    const sendFriendRequest = () => {
        if (!userId || !addFriendId.trim()) return
        socket.emit("friend_request_send", { userId, friendId: addFriendId.trim() })
        setAddFriendId("")
    }

    const acceptRequest = (requesterId: string) => {
        if (!userId) return
        socket.emit("friend_request_accept", { userId, requesterId })
    }

    const declineRequest = (requesterId: string) => {
        if (!userId) return
        socket.emit("friend_request_decline", { userId, requesterId })
    }

    const removeFriend = (friendId: string) => {
        if (!userId) return
        socket.emit("remove_friend", { userId, friendId })
    }

    const inviteToGame = (friendId: string) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
        if (!userId) return
        socket.emit("invite_to_game", { userId, friendId, roomId })
        toast.success("Invitation envoyée !", { icon: <Gamepad2 className="h-4 w-4" /> })
    }

    const copyUserId = () => {
        if (userId) {
            navigator.clipboard.writeText(userId)
            toast.success("ID copié !")
        }
    }

    const filteredFriends = friends.filter((f) => f.username.toLowerCase().includes(searchQuery.toLowerCase()))

    const onlineFriends = filteredFriends.filter((f) => f.isOnline)
    const offlineFriends = filteredFriends.filter((f) => !f.isOnline)

    if (loading) {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
                    <p className="text-muted-foreground">Chargement...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-background min-h-screen">
            {/* Background Effect */}
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.1),transparent_50%)]" />
            </div>

            {/* Header */}
            <header className="bg-background/80 relative sticky top-0 z-10 border-b border-white/5 backdrop-blur-xl">
                <div className="container mx-auto flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/")}
                            className="hover:bg-white/10"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <PageHeader
                            icon={Users}
                            title="AMIS"
                            subtitle={`${friends.length} ami${friends.length !== 1 ? "s" : ""} • ${onlineFriends.length} en ligne`}
                            gradient="from-cyan-500 to-blue-600"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {/* User ID Badge */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={copyUserId}
                            className="border-white/10 text-xs hover:bg-white/5"
                        >
                            <Copy className="mr-2 h-3 w-3" />
                            Mon ID: {userId?.slice(0, 8)}...
                        </Button>

                        {/* Add Friend Dialog */}
                        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500">
                                    <UserPlus className="mr-2 h-4 w-4" /> Ajouter
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-cyan-400" />
                                        Ajouter un ami
                                    </DialogTitle>
                                    <DialogDescription>
                                        Entrez l'ID de votre ami pour lui envoyer une demande
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="ID de l'utilisateur (ex: abc123...)"
                                            value={addFriendId}
                                            onChange={(e) => setAddFriendId(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && sendFriendRequest()}
                                            className="font-mono"
                                        />
                                        <Button onClick={sendFriendRequest} disabled={!addFriendId.trim()}>
                                            Envoyer
                                        </Button>
                                    </div>
                                    <p className="text-muted-foreground text-sm">
                                        Votre ami peut trouver son ID depuis cette page en cliquant sur "Mon ID"
                                    </p>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </header>

            <main className="relative z-10 container mx-auto max-w-3xl px-4 py-8">
                <Tabs defaultValue="friends" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 bg-white/5 p-1">
                        <TabsTrigger
                            value="friends"
                            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20"
                        >
                            <Users className="h-4 w-4" /> Amis
                        </TabsTrigger>
                        <TabsTrigger
                            value="pending"
                            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20"
                        >
                            <Clock className="h-4 w-4" /> Reçues
                            {pendingRequests.length > 0 && (
                                <Badge className="ml-1 flex h-5 min-w-[20px] items-center justify-center bg-green-500 p-0 text-white">
                                    {pendingRequests.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="sent"
                            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/20 data-[state=active]:to-purple-500/20"
                        >
                            <UserPlus className="h-4 w-4" /> Envoyées
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="friends" className="space-y-6">
                        {/* Search */}
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                placeholder="Rechercher un ami..."
                                className="border-white/10 bg-white/5 pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {filteredFriends.length === 0 ? (
                            <EmptyState
                                icon={Users}
                                message={
                                    searchQuery
                                        ? "Aucun ami trouvé"
                                        : "Vous n'avez pas encore d'amis. Ajoutez des amis pour jouer ensemble !"
                                }
                            />
                        ) : (
                            <>
                                {/* Online Friends */}
                                {onlineFriends.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-green-400 uppercase">
                                            <span className="h-2 w-2 rounded-full bg-green-500" />
                                            En ligne ({onlineFriends.length})
                                        </h3>
                                        <motion.div
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                            className="space-y-2"
                                        >
                                            {onlineFriends.map((friend) => (
                                                <FriendCard
                                                    key={friend.id}
                                                    friend={friend}
                                                    onInvite={() => inviteToGame(friend.id)}
                                                    onMessage={() => toast.info("Messagerie bientôt disponible")}
                                                    onRemove={() => removeFriend(friend.id)}
                                                />
                                            ))}
                                        </motion.div>
                                    </div>
                                )}

                                {/* Offline Friends */}
                                {offlineFriends.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
                                            <span className="h-2 w-2 rounded-full bg-gray-500" />
                                            Hors ligne ({offlineFriends.length})
                                        </h3>
                                        <motion.div
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                            className="space-y-2"
                                        >
                                            {offlineFriends.map((friend) => (
                                                <FriendCard
                                                    key={friend.id}
                                                    friend={friend}
                                                    onInvite={() => inviteToGame(friend.id)}
                                                    onMessage={() => toast.info("Messagerie bientôt disponible")}
                                                    onRemove={() => removeFriend(friend.id)}
                                                />
                                            ))}
                                        </motion.div>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="pending">
                        {pendingRequests.length === 0 ? (
                            <EmptyState icon={Clock} message="Aucune demande en attente" />
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-2"
                            >
                                {pendingRequests.map((request) => (
                                    <RequestCard
                                        key={request.id}
                                        request={request}
                                        type="pending"
                                        onAccept={() => acceptRequest(request.id)}
                                        onDecline={() => declineRequest(request.id)}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </TabsContent>

                    <TabsContent value="sent">
                        {sentRequests.length === 0 ? (
                            <EmptyState icon={UserPlus} message="Aucune demande envoyée" />
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-2"
                            >
                                {sentRequests.map((request) => (
                                    <RequestCard key={request.id} request={request} type="sent" />
                                ))}
                            </motion.div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
