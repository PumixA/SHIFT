"use client"

import { useState, useCallback, useMemo } from "react"
import { socket } from "@/services/socket"
import type { Player, GameStatus } from "./useGameState"

export type TurnPhase = "ROLL" | "MOVE_CHOICE" | "MODIFY" | "END"

export interface UseTurnManagementProps {
    players: Player[]
    gameStatus: GameStatus
    isLocalMode: boolean
    allowRuleEdit: boolean
    allowTileEdit: boolean
    isHost: boolean
}

export interface UseTurnManagementReturn {
    // State
    currentTurnId: string
    setCurrentTurnId: React.Dispatch<React.SetStateAction<string>>
    localTurnIndex: number
    setLocalTurnIndex: React.Dispatch<React.SetStateAction<number>>
    turnPhase: TurnPhase
    setTurnPhase: React.Dispatch<React.SetStateAction<TurnPhase>>
    diceValue: number | null
    setDiceValue: React.Dispatch<React.SetStateAction<number | null>>
    isRolling: boolean
    setIsRolling: React.Dispatch<React.SetStateAction<boolean>>

    // Computed
    currentPlayer: Player | undefined
    isMyTurn: boolean
    canRollDice: boolean
    canModify: boolean
    canModifyRulesNow: boolean
    canModifyTilesNow: boolean

    // Actions
    advanceToNextPlayer: () => void
    handleEndTurn: () => void
    markModificationDone: () => void
}

export function useTurnManagement({
    players,
    gameStatus,
    isLocalMode,
    allowRuleEdit,
    allowTileEdit,
    isHost,
}: UseTurnManagementProps): UseTurnManagementReturn {
    // State
    const [currentTurnId, setCurrentTurnId] = useState<string>("")
    const [localTurnIndex, setLocalTurnIndex] = useState(0)
    const [turnPhase, setTurnPhase] = useState<TurnPhase>("ROLL")
    const [diceValue, setDiceValue] = useState<number | null>(null)
    const [isRolling, setIsRolling] = useState(false)

    // Computed
    const currentPlayer = useMemo(() => {
        if (isLocalMode) {
            return players[localTurnIndex]
        }
        return players.find((p) => String(p.id) === currentTurnId)
    }, [isLocalMode, players, localTurnIndex, currentTurnId])

    const isMyTurn = useMemo(() => {
        if (isLocalMode) {
            return String(players[localTurnIndex]?.id) === currentTurnId
        }
        return currentTurnId === socket.id
    }, [isLocalMode, players, localTurnIndex, currentTurnId])

    const canRollDice = useMemo(() => {
        if (!isMyTurn) return false
        if (gameStatus !== "playing") return false
        if (isRolling) return false
        if (turnPhase !== "ROLL") return false
        return true
    }, [isMyTurn, gameStatus, isRolling, turnPhase])

    const canModify = useMemo(() => {
        if (!isMyTurn) return false
        if (gameStatus !== "playing") return false
        if (turnPhase !== "MODIFY") return false
        return true
    }, [isMyTurn, gameStatus, turnPhase])

    const canModifyRulesNow = useMemo(() => {
        if (!canModify) return false
        if (!allowRuleEdit && !isHost) return false
        return true
    }, [canModify, allowRuleEdit, isHost])

    const canModifyTilesNow = useMemo(() => {
        if (!canModify) return false
        if (!allowTileEdit && !isHost) return false
        return true
    }, [canModify, allowTileEdit, isHost])

    // Actions
    const advanceToNextPlayer = useCallback(() => {
        if (isLocalMode) {
            const nextIndex = (localTurnIndex + 1) % players.length
            setLocalTurnIndex(nextIndex)
            setCurrentTurnId(String(players[nextIndex]?.id))
        }
        setTurnPhase("ROLL")
        setDiceValue(null)
    }, [isLocalMode, localTurnIndex, players])

    const handleEndTurn = useCallback(() => {
        advanceToNextPlayer()
    }, [advanceToNextPlayer])

    const markModificationDone = useCallback(() => {
        advanceToNextPlayer()
    }, [advanceToNextPlayer])

    return {
        currentTurnId,
        setCurrentTurnId,
        localTurnIndex,
        setLocalTurnIndex,
        turnPhase,
        setTurnPhase,
        diceValue,
        setDiceValue,
        isRolling,
        setIsRolling,
        currentPlayer,
        isMyTurn,
        canRollDice,
        canModify,
        canModifyRulesNow,
        canModifyTilesNow,
        advanceToNextPlayer,
        handleEndTurn,
        markModificationDone,
    }
}
