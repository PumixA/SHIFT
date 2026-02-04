"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ShiftGame from "@/components/shift-game"

interface GameConfig {
    mode: "local" | "online"
    action?: "create" | "join"
    players?: { name: string; color: string }[]
    roomName?: string
    roomCode?: string
    password?: string
    maxPlayers?: number
    playerName?: string
    allowRuleEdit?: boolean
    rulePackId?: string
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-muted-foreground">Chargement de la partie...</p>
                </div>
            </div>
        )
    }

    return <ShiftGame gameConfig={config} />
}
