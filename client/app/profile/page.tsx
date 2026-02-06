"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Trophy, Target, Flame, Clock, Edit2, Save, User, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { socket } from "@/services/socket"
import { toast } from "sonner"
import { PageHeader, GameCard } from "@/components/ui/design-system"
import { AuthModal } from "@/components/auth/auth-modal"

interface UserStats {
    gamesPlayed: number
    gamesWon: number
    totalScore: number
    winRate: number
    avgScore: number
    currentStreak: number
    bestStreak: number
}

interface UserProfile {
    id: string
    username: string
    avatarUrl?: string
    avatarPreset?: string
    createdAt: string
}

const AVATAR_PRESETS = [
    { id: "cyber-1", name: "Cyber Knight" },
    { id: "cyber-2", name: "Neon Runner" },
    { id: "cyber-3", name: "Data Hacker" },
    { id: "cyber-4", name: "Chrome Warrior" },
    { id: "cyber-5", name: "Synth Rider" },
    { id: "cyber-6", name: "Grid Master" },
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
}

export default function ProfilePage() {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [user, setUser] = useState<UserProfile | null>(null)
    const [stats, setStats] = useState<UserStats | null>(null)
    const [editUsername, setEditUsername] = useState("")
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [authModalOpen, setAuthModalOpen] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

    const loadProfile = useCallback((userId: string) => {
        socket.connect()
        socket.emit("get_user_profile", { userId })
    }, [])

    const handleAuthenticated = useCallback(
        (userId: string, username: string) => {
            setIsAuthenticated(true)
            loadProfile(userId)
            toast.success(`Bienvenue, ${username} !`)
        },
        [loadProfile]
    )

    const handleLogout = useCallback(() => {
        localStorage.removeItem("userId")
        localStorage.removeItem("username")
        setUser(null)
        setStats(null)
        setIsAuthenticated(false)
        setAuthModalOpen(true)
        toast.info("Vous avez été déconnecté")
    }, [])

    useEffect(() => {
        const userId = localStorage.getItem("userId")

        if (!userId) {
            setIsAuthenticated(false)
            setLoading(false)
            setAuthModalOpen(true)
            return
        }

        setIsAuthenticated(true)
        loadProfile(userId)

        socket.on("user_profile", (data: { user: UserProfile | null; stats: UserStats | null }) => {
            if (data.user) {
                setUser(data.user)
                setStats(data.stats)
                setEditUsername(data.user.username)
                setSelectedAvatar(data.user.avatarPreset || null)
            } else {
                // User not found in DB, clear localStorage
                localStorage.removeItem("userId")
                localStorage.removeItem("username")
                setIsAuthenticated(false)
                setAuthModalOpen(true)
            }
            setLoading(false)
        })

        socket.on("user_profile_updated", (data: { user: UserProfile }) => {
            setUser(data.user)
            setIsEditing(false)
            toast.success("Profil mis à jour !")
        })

        return () => {
            socket.off("user_profile")
            socket.off("user_profile_updated")
        }
    }, [loadProfile])

    const handleSave = () => {
        if (!user) return
        socket.emit("update_user_profile", {
            userId: user.id,
            username: editUsername,
            avatarPreset: selectedAvatar,
        })
    }

    // Show auth modal when not authenticated
    if (isAuthenticated === false) {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
                <div className="pointer-events-none fixed inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.1),transparent_50%)]" />
                </div>
                <div className="relative z-10 text-center">
                    <User className="mx-auto mb-4 h-16 w-16 text-violet-500" />
                    <h1 className="mb-2 text-3xl font-bold text-white">Accès au Profil</h1>
                    <p className="text-muted-foreground mb-6">
                        Connectez-vous pour accéder à votre profil et statistiques
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button variant="outline" onClick={() => router.push("/")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Button>
                        <Button
                            onClick={() => setAuthModalOpen(true)}
                            className="bg-gradient-to-r from-violet-500 to-purple-600"
                        >
                            <User className="mr-2 h-4 w-4" />
                            Se connecter
                        </Button>
                    </div>
                </div>
                <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} onAuthenticated={handleAuthenticated} />
            </div>
        )
    }

    if (loading) {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                    <p className="text-muted-foreground">Chargement du profil...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-background min-h-screen">
            {/* Background Effect */}
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.1),transparent_50%)]" />
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
                            icon={User}
                            title="PROFIL"
                            subtitle={user?.username || "Mon compte"}
                            gradient="from-violet-500 to-purple-600"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <>
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    variant="outline"
                                    className="border-white/20 hover:bg-white/10"
                                >
                                    <Edit2 className="mr-2 h-4 w-4" /> Modifier
                                </Button>
                                <Button
                                    onClick={handleLogout}
                                    variant="ghost"
                                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                >
                                    <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button onClick={() => setIsEditing(false)} variant="ghost">
                                    <X className="mr-2 h-4 w-4" /> Annuler
                                </Button>
                                <Button onClick={handleSave} className="bg-gradient-to-r from-violet-500 to-purple-600">
                                    <Save className="mr-2 h-4 w-4" /> Sauvegarder
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="relative z-10 container mx-auto max-w-5xl px-4 py-8">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-1"
                    >
                        <GameCard className="text-center">
                            <div className="relative mx-auto w-fit">
                                <Avatar className="h-28 w-28 border-4 border-violet-500/30">
                                    <AvatarImage src={selectedAvatar ? `/avatars/${selectedAvatar}.png` : undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-3xl font-bold text-white">
                                        {user?.username?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {stats && stats.currentStreak >= 3 ? (
                                    <div className="absolute -top-2 -right-2 rounded-full bg-orange-500 p-1.5">
                                        <Flame className="h-4 w-4 text-white" />
                                    </div>
                                ) : null}
                            </div>

                            {isEditing ? (
                                <div className="mt-6 space-y-4">
                                    <div className="space-y-2 text-left">
                                        <Label htmlFor="username">Nom d'utilisateur</Label>
                                        <Input
                                            id="username"
                                            value={editUsername}
                                            onChange={(e) => setEditUsername(e.target.value)}
                                            className="border-white/10 bg-white/5"
                                        />
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <Label>Avatar</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {AVATAR_PRESETS.map((avatar) => (
                                                <button
                                                    key={avatar.id}
                                                    onClick={() => setSelectedAvatar(avatar.id)}
                                                    className={`rounded-lg border-2 p-2 transition-all ${
                                                        selectedAvatar === avatar.id
                                                            ? "border-violet-500 bg-violet-500/20"
                                                            : "border-white/10 hover:border-violet-500/50"
                                                    }`}
                                                >
                                                    <Avatar className="mx-auto h-10 w-10">
                                                        <AvatarImage src={`/avatars/${avatar.id}.png`} />
                                                        <AvatarFallback className="text-xs">
                                                            {avatar.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2 className="mt-4 text-2xl font-bold text-white">{user?.username}</h2>
                                    <p className="text-muted-foreground text-sm">
                                        Membre depuis{" "}
                                        {user?.createdAt
                                            ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
                                                  month: "long",
                                                  year: "numeric",
                                              })
                                            : "N/A"}
                                    </p>
                                </>
                            )}
                        </GameCard>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6 lg:col-span-2"
                    >
                        <div className="space-y-6">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {[
                                    {
                                        icon: Trophy,
                                        value: stats?.gamesWon || 0,
                                        label: "Victoires",
                                        color: "yellow",
                                    },
                                    {
                                        icon: Target,
                                        value: stats?.gamesPlayed || 0,
                                        label: "Parties",
                                        color: "cyan",
                                    },
                                    {
                                        icon: Flame,
                                        value: stats?.currentStreak || 0,
                                        label: "Série",
                                        color: "orange",
                                    },
                                    { icon: Clock, value: stats?.totalScore || 0, label: "Score", color: "violet" },
                                ].map((stat, i) => (
                                    <motion.div key={stat.label} variants={itemVariants}>
                                        <GameCard className="text-center">
                                            <stat.icon className={`mx-auto mb-2 h-8 w-8 text-${stat.color}-400`} />
                                            <p className="text-3xl font-black text-white">{stat.value}</p>
                                            <p className="text-muted-foreground text-xs">{stat.label}</p>
                                        </GameCard>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Win Rate */}
                            <motion.div variants={itemVariants}>
                                <GameCard>
                                    <h3 className="text-muted-foreground mb-4 text-sm font-bold tracking-wider uppercase">
                                        Taux de victoire
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <Progress value={stats?.winRate || 0} className="h-3 flex-1" />
                                        <span className="text-3xl font-black text-violet-400">
                                            {stats?.winRate?.toFixed(0) || 0}%
                                        </span>
                                    </div>
                                </GameCard>
                            </motion.div>

                            {/* Detailed Stats */}
                            <motion.div variants={itemVariants}>
                                <GameCard>
                                    <h3 className="text-muted-foreground mb-4 text-sm font-bold tracking-wider uppercase">
                                        Détails
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            {
                                                label: "Score moyen par partie",
                                                value: stats?.avgScore?.toFixed(0) || 0,
                                            },
                                            { label: "Meilleure série", value: stats?.bestStreak || 0 },
                                            {
                                                label: "Parties perdues",
                                                value: (stats?.gamesPlayed || 0) - (stats?.gamesWon || 0),
                                            },
                                        ].map((item) => (
                                            <div
                                                key={item.label}
                                                className="flex items-center justify-between border-b border-white/5 py-2 last:border-0"
                                            >
                                                <span className="text-muted-foreground">{item.label}</span>
                                                <span className="text-xl font-bold text-white">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </GameCard>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    )
}
