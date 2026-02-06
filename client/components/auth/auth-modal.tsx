"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, LogIn, UserPlus, Loader2, AlertCircle, Mail, Lock, Eye, EyeOff } from "lucide-react"
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
    defaultTab?: "login" | "register"
}

interface AuthResult {
    success: boolean
    message: string
    user?: {
        id: string
        username: string
        email: string
    }
}

export function AuthModal({ open, onOpenChange, onAuthenticated, defaultTab = "login" }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">(defaultTab)
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const resetForm = () => {
        setUsername("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setError(null)
        setSuccess(null)
    }

    const handleRegister = () => {
        if (!username.trim() || !email.trim() || !password) {
            setError("Tous les champs sont requis")
            return
        }

        if (username.length < 3 || username.length > 20) {
            setError("Le nom doit contenir entre 3 et 20 caractères")
            return
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Adresse email invalide")
            return
        }

        if (password.length < 6) {
            setError("Le mot de passe doit contenir au moins 6 caractères")
            return
        }

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas")
            return
        }

        setLoading(true)
        setError(null)

        socket.connect()

        const handleResult = (result: AuthResult) => {
            setLoading(false)
            if (result.success && result.user) {
                localStorage.setItem("userId", result.user.id)
                localStorage.setItem("username", result.user.username)
                localStorage.setItem("userEmail", result.user.email)
                onAuthenticated(result.user.id, result.user.username)
                onOpenChange(false)
                resetForm()
            } else {
                setError(result.message)
            }
            socket.off("auth_result", handleResult)
        }

        socket.on("auth_result", handleResult)
        socket.emit("auth_register", {
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
        })

        setTimeout(() => {
            if (loading) {
                setError("Le serveur ne répond pas")
                setLoading(false)
                socket.off("auth_result", handleResult)
            }
        }, 15000)
    }

    const handleLogin = () => {
        if (!email.trim() || !password) {
            setError("Email et mot de passe requis")
            return
        }

        setLoading(true)
        setError(null)

        socket.connect()

        const handleResult = (result: AuthResult) => {
            setLoading(false)
            if (result.success && result.user) {
                localStorage.setItem("userId", result.user.id)
                localStorage.setItem("username", result.user.username)
                localStorage.setItem("userEmail", result.user.email)
                onAuthenticated(result.user.id, result.user.username)
                onOpenChange(false)
                resetForm()
            } else {
                setError(result.message)
            }
            socket.off("auth_result", handleResult)
        }

        socket.on("auth_result", handleResult)
        socket.emit("auth_login", {
            email: email.trim().toLowerCase(),
            password,
        })

        setTimeout(() => {
            if (loading) {
                setError("Le serveur ne répond pas")
                setLoading(false)
                socket.off("auth_result", handleResult)
            }
        }, 15000)
    }

    const handleForgotPassword = () => {
        if (!email.trim()) {
            setError("Veuillez entrer votre adresse email")
            return
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Adresse email invalide")
            return
        }

        setLoading(true)
        setError(null)
        setSuccess(null)

        socket.connect()

        const handleResult = (result: { success: boolean; message: string }) => {
            setLoading(false)
            if (result.success) {
                setSuccess(result.message)
                setError(null)
            } else {
                setError(result.message)
            }
            socket.off("forgot_password_result", handleResult)
        }

        socket.on("forgot_password_result", handleResult)
        socket.emit("auth_forgot_password", { email: email.trim().toLowerCase() })

        setTimeout(() => {
            if (loading) {
                setError("Le serveur ne répond pas")
                setLoading(false)
                socket.off("forgot_password_result", handleResult)
            }
        }, 15000)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (activeTab === "register") {
            handleRegister()
        } else if (activeTab === "login") {
            handleLogin()
        } else {
            handleForgotPassword()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-violet-500" />
                        {activeTab === "forgot" ? "Mot de passe oublié" : "Connexion à SHIFT"}
                    </DialogTitle>
                    <DialogDescription>
                        {activeTab === "forgot"
                            ? "Entrez votre email pour recevoir un lien de réinitialisation"
                            : "Créez un compte ou connectez-vous pour accéder à votre profil"}
                    </DialogDescription>
                </DialogHeader>

                {activeTab !== "forgot" ? (
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => {
                            setActiveTab(v as "login" | "register")
                            setError(null)
                            setSuccess(null)
                        }}
                    >
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login" className="flex items-center gap-2">
                                <LogIn className="h-4 w-4" />
                                Connexion
                            </TabsTrigger>
                            <TabsTrigger value="register" className="flex items-center gap-2">
                                <UserPlus className="h-4 w-4" />
                                Inscription
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

                            <TabsContent value="login" className="mt-0 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email">Email</Label>
                                    <div className="relative">
                                        <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        <Input
                                            id="login-email"
                                            type="email"
                                            placeholder="votre@email.com"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value)
                                                setError(null)
                                            }}
                                            disabled={loading}
                                            className="border-white/10 bg-white/5 pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-password">Mot de passe</Label>
                                    <div className="relative">
                                        <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        <Input
                                            id="login-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value)
                                                setError(null)
                                            }}
                                            disabled={loading}
                                            className="border-white/10 bg-white/5 pr-10 pl-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 hover:text-white"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab("forgot")
                                        setError(null)
                                    }}
                                    className="text-sm text-violet-400 hover:text-violet-300 hover:underline"
                                >
                                    Mot de passe oublié ?
                                </button>
                            </TabsContent>

                            <TabsContent value="register" className="mt-0 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="register-username">Nom d&apos;utilisateur</Label>
                                    <div className="relative">
                                        <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        <Input
                                            id="register-username"
                                            placeholder="VotreNom"
                                            value={username}
                                            onChange={(e) => {
                                                setUsername(e.target.value)
                                                setError(null)
                                            }}
                                            disabled={loading}
                                            className="border-white/10 bg-white/5 pl-10"
                                        />
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        3-20 caractères, visible par les autres
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-email">Email</Label>
                                    <div className="relative">
                                        <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        <Input
                                            id="register-email"
                                            type="email"
                                            placeholder="votre@email.com"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value)
                                                setError(null)
                                            }}
                                            disabled={loading}
                                            className="border-white/10 bg-white/5 pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-password">Mot de passe</Label>
                                    <div className="relative">
                                        <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        <Input
                                            id="register-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value)
                                                setError(null)
                                            }}
                                            disabled={loading}
                                            className="border-white/10 bg-white/5 pr-10 pl-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 hover:text-white"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-muted-foreground text-xs">Minimum 6 caractères</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-confirm">Confirmer le mot de passe</Label>
                                    <div className="relative">
                                        <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        <Input
                                            id="register-confirm"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value)
                                                setError(null)
                                            }}
                                            disabled={loading}
                                            className="border-white/10 bg-white/5 pl-10"
                                        />
                                    </div>
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
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            {success ? (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400"
                                >
                                    <Mail className="h-4 w-4 flex-shrink-0" />
                                    {success}
                                </motion.div>
                            ) : null}
                        </AnimatePresence>

                        <div className="space-y-2">
                            <Label htmlFor="forgot-email">Email</Label>
                            <div className="relative">
                                <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <Input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="votre@email.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        setError(null)
                                        setSuccess(null)
                                    }}
                                    disabled={loading}
                                    className="border-white/10 bg-white/5 pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setActiveTab("login")
                                    setError(null)
                                    setSuccess(null)
                                }}
                                className="flex-1"
                            >
                                Retour
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Mail className="mr-2 h-4 w-4" />
                                )}
                                Envoyer
                            </Button>
                        </div>
                    </form>
                )}

                <p className="text-muted-foreground mt-2 text-center text-xs">
                    Vos données sont sécurisées et ne seront jamais partagées.
                </p>
            </DialogContent>
        </Dialog>
    )
}
