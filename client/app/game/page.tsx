"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ShiftGame from "@/components/shift-game"

interface GameConfig {
    mode: "local" | "online"
    action?: "create" | "join"
    players?: { name: string; color: string; isBot?: boolean; botDifficulty?: string }[]
    roomName?: string
    roomCode?: string
    password?: string
    maxPlayers?: number
    playerName?: string
    allowRuleEdit?: boolean
    allowTileEdit?: boolean
}

export default function GamePage() {
    const router = useRouter()
    const [config, setConfig] = useState<GameConfig | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const stored = sessionStorage.getItem("gameConfig")
        if (!stored) {
            router.push("/")
            return
        }

        try {
            const parsedConfig = JSON.parse(stored) as GameConfig
            setConfig(parsedConfig)
        } catch {
            router.push("/")
            return
        }

        setIsLoading(false)
    }, [router])

    if (isLoading || !config) {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center">
                <div className="space-y-4 text-center">
                    <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
                    <p className="text-muted-foreground">Chargement de la partie...</p>
                </div>
            </div>
        )
    }

    return <ShiftGame gameConfig={config} />
}
