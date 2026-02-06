"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, ArrowLeft, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { socket } from "@/services/socket"

function ResetPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [validating, setValidating] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [tokenValid, setTokenValid] = useState<boolean | null>(null)

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            setTokenValid(false)
            setError("Lien invalide ou expiré")
            setValidating(false)
            return
        }

        socket.connect()

        const handleResult = (result: { valid: boolean; message?: string }) => {
            setValidating(false)
            setTokenValid(result.valid)
            if (!result.valid) {
                setError(result.message || "Lien invalide ou expiré")
            }
            socket.off("validate_token_result", handleResult)
        }

        socket.on("validate_token_result", handleResult)
        socket.emit("auth_validate_reset_token", { token })

        return () => {
            socket.off("validate_token_result", handleResult)
        }
    }, [token])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!password || password.length < 6) {
            setError("Le mot de passe doit contenir au moins 6 caractères")
            return
        }

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas")
            return
        }

        setLoading(true)
        setError(null)

        const handleResult = (result: { success: boolean; message: string }) => {
            setLoading(false)
            if (result.success) {
                setSuccess(true)
            } else {
                setError(result.message)
            }
            socket.off("reset_password_result", handleResult)
        }

        socket.on("reset_password_result", handleResult)
        socket.emit("auth_reset_password", { token, password })

        setTimeout(() => {
            if (loading) {
                setError("Le serveur ne répond pas")
                setLoading(false)
                socket.off("reset_password_result", handleResult)
            }
        }, 15000)
    }

    // Loading state
    if (validating) {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-violet-500" />
                    <p className="text-muted-foreground">Vérification du lien...</p>
                </div>
            </div>
        )
    }

    // Success state
    if (success) {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
                <div className="pointer-events-none fixed inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.1),transparent_50%)]" />
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 w-full max-w-md space-y-6 rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center"
                >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Mot de passe modifié</h1>
                        <p className="text-muted-foreground mt-2">
                            Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push("/profile")}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500"
                    >
                        Se connecter
                    </Button>
                </motion.div>
            </div>
        )
    }

    // Invalid token state
    if (tokenValid === false) {
        return (
            <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
                <div className="pointer-events-none fixed inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.1),transparent_50%)]" />
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 w-full max-w-md space-y-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"
                >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Lien invalide</h1>
                        <p className="text-muted-foreground mt-2">
                            {error || "Ce lien de réinitialisation est invalide ou a expiré."}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => router.push("/")} className="flex-1">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Accueil
                        </Button>
                        <Button
                            onClick={() => router.push("/profile")}
                            className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600"
                        >
                            Réessayer
                        </Button>
                    </div>
                </motion.div>
            </div>
        )
    }

    // Reset form
    return (
        <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.1),transparent_50%)]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md space-y-6"
            >
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/20">
                        <KeyRound className="h-8 w-8 text-violet-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Nouveau mot de passe</h1>
                    <p className="text-muted-foreground mt-2">Choisissez un nouveau mot de passe sécurisé</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                    {error ? (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
                        >
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    ) : null}

                    <div className="space-y-2">
                        <Label htmlFor="password">Nouveau mot de passe</Label>
                        <div className="relative">
                            <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="password"
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
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="text-muted-foreground text-xs">Minimum 6 caractères</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                        <div className="relative">
                            <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="confirm"
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

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Modification...
                            </>
                        ) : (
                            <>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Modifier le mot de passe
                            </>
                        )}
                    </Button>
                </form>

                <p className="text-muted-foreground text-center text-xs">
                    <button onClick={() => router.push("/")} className="text-violet-400 hover:underline">
                        Retour à l&apos;accueil
                    </button>
                </p>
            </motion.div>
        </div>
    )
}

function LoadingFallback() {
    return (
        <div className="bg-background flex min-h-screen items-center justify-center">
            <div className="text-center">
                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-violet-500" />
                <p className="text-muted-foreground">Chargement...</p>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ResetPasswordContent />
        </Suspense>
    )
}
