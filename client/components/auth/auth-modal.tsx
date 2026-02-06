"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, LogIn, UserPlus, Loader2, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { socket } from "@/services/socket"

interface AuthModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAuthenticated: (userId: string, username: string) => void
}

export function AuthModal({ open, onOpenChange, onAuthenticated }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState<"login" | "register">("register")
    const [username, setUsername] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleRegister = () => {
        if (!username.trim()) {
            setError("Veuillez entrer un nom d'utilisateur")
            return
        }

        if (username.length < 3) {
            setError("Le nom doit contenir au moins 3 caractères")
            return
        }

        if (username.length > 20) {
            setError("Le nom ne peut pas dépasser 20 caractères")
            return
        }

        setLoading(true)
        setError(null)

        socket.connect()

        const handleRegistered = (data: { userId: string; user: { username: string } }) => {
            localStorage.setItem("userId", data.userId)
            localStorage.setItem("username", data.user.username)
            setLoading(false)
            onAuthenticated(data.userId, data.user.username)
            onOpenChange(false)
            socket.off("user_registered", handleRegistered)
            socket.off("error", handleError)
        }

        const handleError = (data: { message: string }) => {
            setError(data.message || "Erreur lors de l'inscription")
            setLoading(false)
            socket.off("user_registered", handleRegistered)
            socket.off("error", handleError)
        }

        socket.on("user_registered", handleRegistered)
        socket.on("error", handleError)
        socket.emit("register_user", { username: username.trim() })

        // Timeout after 10 seconds
        setTimeout(() => {
            if (loading) {
                setError("Le serveur ne répond pas. Vérifiez votre connexion.")
                setLoading(false)
                socket.off("user_registered", handleRegistered)
                socket.off("error", handleError)
            }
        }, 10000)
    }

    const handleLogin = () => {
        if (!username.trim()) {
            setError("Veuillez entrer votre nom d'utilisateur")
            return
        }

        setLoading(true)
        setError(null)

        socket.connect()

        const handleProfile = (data: { user: { id: string; username: string } | null }) => {
            if (data.user) {
                localStorage.setItem("userId", data.user.id)
                localStorage.setItem("username", data.user.username)
                setLoading(false)
                onAuthenticated(data.user.id, data.user.username)
                onOpenChange(false)
            } else {
                setError("Utilisateur introuvable. Vérifiez le nom ou créez un compte.")
                setLoading(false)
            }
            socket.off("user_found", handleProfile)
            socket.off("error", handleError)
        }

        const handleError = (data: { message: string }) => {
            setError(data.message || "Erreur lors de la connexion")
            setLoading(false)
            socket.off("user_found", handleProfile)
            socket.off("error", handleError)
        }

        socket.on("user_found", handleProfile)
        socket.on("error", handleError)
        socket.emit("find_user_by_username", { username: username.trim() })

        // Timeout
        setTimeout(() => {
            if (loading) {
                setError("Le serveur ne répond pas. Vérifiez votre connexion.")
                setLoading(false)
                socket.off("user_found", handleProfile)
                socket.off("error", handleError)
            }
        }, 10000)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (activeTab === "register") {
            handleRegister()
        } else {
            handleLogin()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-violet-500" />
                        Connexion à SHIFT
                    </DialogTitle>
                    <DialogDescription>Créez un compte ou connectez-vous pour accéder à votre profil</DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="register" className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Créer un compte
                        </TabsTrigger>
                        <TabsTrigger value="login" className="flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
                            Se connecter
                        </TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                        <AnimatePresence mode="wait">
                            {error ? (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
                                >
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {error}
                                </motion.div>
                            ) : null}
                        </AnimatePresence>

                        <TabsContent value="register" className="mt-0 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="register-username">Nom d'utilisateur</Label>
                                <Input
                                    id="register-username"
                                    placeholder="Entrez un nom unique"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value)
                                        setError(null)
                                    }}
                                    disabled={loading}
                                    className="border-white/10 bg-white/5"
                                />
                                <p className="text-muted-foreground text-xs">
                                    3-20 caractères. Ce nom sera visible par les autres joueurs.
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="login" className="mt-0 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="login-username">Nom d'utilisateur</Label>
                                <Input
                                    id="login-username"
                                    placeholder="Votre nom d'utilisateur"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value)
                                        setError(null)
                                    }}
                                    disabled={loading}
                                    className="border-white/10 bg-white/5"
                                />
                            </div>
                        </TabsContent>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {activeTab === "register" ? "Création..." : "Connexion..."}
                                </>
                            ) : activeTab === "register" ? (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Créer mon compte
                                </>
                            ) : (
                                <>
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Se connecter
                                </>
                            )}
                        </Button>
                    </form>
                </Tabs>

                <p className="text-muted-foreground mt-4 text-center text-xs">
                    En créant un compte, vos statistiques et parties seront sauvegardées.
                </p>
            </DialogContent>
        </Dialog>
    )
}
