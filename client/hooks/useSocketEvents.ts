"use client"

import { useEffect, useState, useCallback } from "react"
import { socket } from "@/services/socket"
import { toast } from "sonner"
import { Rule } from "@/src/types/rules"
import type { Player, ServerPlayer, GameStatus, Tile } from "./useGameState"
import type { TurnPhase } from "./useTurnManagement"

interface ServerGameState {
    roomId: string
    tiles: { id: string; type: string; index: number; position?: { x: number; y: number }; connections?: string[] }[]
    players: ServerPlayer[]
    currentTurn: string
    status: "waiting" | "playing" | "finished"
    winnerId?: string | null
    activeRules?: Rule[]
    coreRules?: Rule[]
    allowRuleEdit?: boolean
    boardConfig?: {
        allowRuleModification: boolean
        allowTileModification: boolean
    }
}

export interface GameConfig {
    mode: "local" | "online"
    action?: "create" | "join"
    players?: { name: string; color: string; isBot?: boolean; botDifficulty?: "easy" | "medium" | "hard" }[]
    roomName?: string
    roomCode?: string
    password?: string
    maxPlayers?: number
    playerName?: string
    allowRuleEdit?: boolean
    allowTileEdit?: boolean
    rulePackId?: string
}

export interface UseSocketEventsProps {
    gameConfig?: GameConfig
    isLocalMode: boolean
    mapServerPlayersToClient: (serverPlayers: ServerPlayer[]) => Player[]
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
    setCurrentTurnId: React.Dispatch<React.SetStateAction<string>>
    setGameStatus: React.Dispatch<React.SetStateAction<GameStatus>>
    setTurnPhase: React.Dispatch<React.SetStateAction<TurnPhase>>
    setDiceValue: React.Dispatch<React.SetStateAction<number | null>>
    setIsRolling: React.Dispatch<React.SetStateAction<boolean>>
    setRules: React.Dispatch<React.SetStateAction<Rule[]>>
    setCoreRules: React.Dispatch<React.SetStateAction<Rule[]>>
    setTiles: React.Dispatch<React.SetStateAction<Tile[]>>
    setWinner: React.Dispatch<React.SetStateAction<{ id: string; name: string; color?: string } | null>>
    setAllowRuleEdit: React.Dispatch<React.SetStateAction<boolean>>
    setAllowTileEdit: React.Dispatch<React.SetStateAction<boolean>>
    setIsHost: React.Dispatch<React.SetStateAction<boolean>>
    players: Player[]
    onNavigateHome: () => void
}

export interface UseSocketEventsReturn {
    isConnected: boolean
    activeRoom: string | null
}

export function useSocketEvents({
    gameConfig,
    isLocalMode,
    mapServerPlayersToClient,
    setPlayers,
    setCurrentTurnId,
    setGameStatus,
    setTurnPhase,
    setDiceValue,
    setIsRolling,
    setRules,
    setCoreRules,
    setTiles,
    setWinner,
    setAllowRuleEdit,
    setAllowTileEdit,
    setIsHost,
    players,
    onNavigateHome,
}: UseSocketEventsProps): UseSocketEventsReturn {
    const [isConnected, setIsConnected] = useState(socket.connected)
    const [activeRoom, setActiveRoom] = useState<string | null>(null)

    useEffect(() => {
        if (isLocalMode) return

        const onConnect = () => {
            setIsConnected(true)
            toast.success("Connecté au serveur")

            if (gameConfig?.action === "create") {
                const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
                socket.emit("create_room", {
                    roomId,
                    roomName: gameConfig.roomName,
                    password: gameConfig.password,
                    maxPlayers: gameConfig.maxPlayers,
                    allowRuleEdit: gameConfig.allowRuleEdit,
                    rulePackId: gameConfig.rulePackId,
                    playerName: gameConfig.playerName,
                })
            } else if (gameConfig?.action === "join" && gameConfig.roomCode) {
                socket.emit("join_room", gameConfig.roomCode, {
                    password: gameConfig.password,
                    playerName: gameConfig.playerName,
                })
            }
        }

        const onDisconnect = () => {
            setIsConnected(false)
            toast.error("Déconnecté du serveur")
        }

        const onRoomJoined = (roomId: string) => {
            setActiveRoom(roomId)
            toast.info(`Salon rejoint : ${roomId}`)
        }

        const onGameStateSync = (gameState: ServerGameState) => {
            const syncedPlayers = mapServerPlayersToClient(gameState.players)
            setPlayers(syncedPlayers)
            setCurrentTurnId(gameState.currentTurn)
            setGameStatus(gameState.status)
            setAllowRuleEdit(gameState.allowRuleEdit ?? true)

            const me = gameState.players.find((p) => p.id === socket.id)
            setIsHost(me?.isHost ?? false)

            if (me) {
                if (me.hasPlayedThisTurn) {
                    setTurnPhase("MODIFY")
                } else {
                    setTurnPhase("ROLL")
                }
            }

            if (gameState.boardConfig) {
                setAllowRuleEdit(gameState.boardConfig.allowRuleModification)
                setAllowTileEdit(gameState.boardConfig.allowTileModification)
            }

            if (gameState.activeRules) setRules(gameState.activeRules)
            if (gameState.coreRules) setCoreRules(gameState.coreRules)

            if (gameState.tiles?.length > 0 && gameState.tiles[0].position) {
                setTiles(
                    gameState.tiles.map((t, i) => ({
                        id: t.id,
                        x: t.position?.x ?? i - 10,
                        y: t.position?.y ?? 0,
                        type: t.type as "normal" | "special" | "start" | "end",
                        connections: t.connections || [],
                    }))
                )
            }

            if (gameState.status === "finished" && gameState.winnerId) {
                const winningPlayer = gameState.players.find((p) => p.id === gameState.winnerId)
                if (winningPlayer) {
                    setWinner({
                        id: gameState.winnerId,
                        name: winningPlayer.name || "Joueur",
                        color: winningPlayer.color,
                    })
                }
            }
        }

        const onDiceResult = (data: { diceValue: number; players: ServerPlayer[]; currentTurn: string }) => {
            setIsRolling(true)
            let rolls = 0
            const interval = setInterval(() => {
                setDiceValue(Math.floor(Math.random() * 6) + 1)
                rolls++
                if (rolls >= 10) {
                    clearInterval(interval)
                    setDiceValue(data.diceValue)
                    setIsRolling(false)
                    setPlayers(mapServerPlayersToClient(data.players))
                    setCurrentTurnId(data.currentTurn)
                    setTurnPhase("MODIFY")
                    toast.info(`Résultat : ${data.diceValue}`, { icon: "🎲" })
                }
            }, 50)
        }

        const onGameOver = (data: { winnerId: string; winnerName: string }) => {
            const winningPlayer = players.find((p) => String(p.id) === data.winnerId)
            setWinner({ id: data.winnerId, name: data.winnerName, color: winningPlayer?.color })
            setGameStatus("finished")
        }

        const onRematchStarted = (gameState: ServerGameState) => {
            setPlayers(mapServerPlayersToClient(gameState.players))
            setCurrentTurnId(gameState.currentTurn)
            setGameStatus("playing")
            setTurnPhase("ROLL")
            setWinner(null)
            setDiceValue(null)
            if (gameState.activeRules) setRules(gameState.activeRules)
            toast.success("Nouvelle partie !", { icon: "🎮" })
        }

        const onError = (data: { message: string }) => toast.error(data.message)

        const onKicked = (data: { reason?: string }) => {
            toast.error(data.reason || "Vous avez été exclu de la partie")
            sessionStorage.removeItem("gameConfig")
            onNavigateHome()
        }

        const onPlayerKicked = (data: { playerId: string; playerName: string }) => {
            toast.info(`${data.playerName} a été exclu de la partie`)
        }

        const onSettingsUpdated = (data: { allowRuleEdit?: boolean; allowTileEdit?: boolean }) => {
            if (data.allowRuleEdit !== undefined) {
                setAllowRuleEdit(data.allowRuleEdit)
            }
            if (data.allowTileEdit !== undefined) {
                setAllowTileEdit(data.allowTileEdit)
            }
            toast.info("Les paramètres de la partie ont été modifiés")
        }

        socket.on("connect", onConnect)
        socket.on("disconnect", onDisconnect)
        socket.on("room_joined", onRoomJoined)
        socket.on("game_state_sync", onGameStateSync)
        socket.on("dice_result", onDiceResult)
        socket.on("game_over", onGameOver)
        socket.on("rematch_started", onRematchStarted)
        socket.on("error", onError)
        socket.on("kicked_from_game", onKicked)
        socket.on("player_kicked", onPlayerKicked)
        socket.on("game_settings_updated", onSettingsUpdated)

        return () => {
            socket.off("connect", onConnect)
            socket.off("disconnect", onDisconnect)
            socket.off("room_joined", onRoomJoined)
            socket.off("game_state_sync", onGameStateSync)
            socket.off("dice_result", onDiceResult)
            socket.off("game_over", onGameOver)
            socket.off("rematch_started", onRematchStarted)
            socket.off("error", onError)
            socket.off("kicked_from_game", onKicked)
            socket.off("player_kicked", onPlayerKicked)
            socket.off("game_settings_updated", onSettingsUpdated)
            socket.disconnect()
        }
    }, [
        isLocalMode,
        gameConfig,
        mapServerPlayersToClient,
        setPlayers,
        setCurrentTurnId,
        setGameStatus,
        setTurnPhase,
        setDiceValue,
        setIsRolling,
        setRules,
        setCoreRules,
        setTiles,
        setWinner,
        setAllowRuleEdit,
        setAllowTileEdit,
        setIsHost,
        players,
        onNavigateHome,
    ])

    return {
        isConnected,
        activeRoom,
    }
}
