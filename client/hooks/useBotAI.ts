"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { BotAI, createBotAI, BotDifficulty, BotDecision, getBotThinkingMessage } from "@/lib/bot-ai"

interface BotPlayer {
  id: string
  name: string
  color: string
  difficulty: BotDifficulty
}

interface UseBotAIOptions {
  bots: BotPlayer[]
  onBotAction?: (botId: string, action: BotDecision) => void
  onBotThinking?: (botId: string, message: string) => void
  onBotDone?: (botId: string) => void
}

export function useBotAI(options: UseBotAIOptions) {
  const { bots, onBotAction, onBotThinking, onBotDone } = options

  const [botInstances, setBotInstances] = useState<Record<string, BotAI>>({})
  const [activeBotId, setActiveBotId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const processingRef = useRef(false)

  // Initialize bot instances
  useEffect(() => {
    const instances: Record<string, BotAI> = {}
    bots.forEach(bot => {
      instances[bot.id] = createBotAI(bot.difficulty)
    })
    setBotInstances(instances)
  }, [bots])

  // Get bot by ID
  const getBot = useCallback((botId: string): BotAI | null => {
    return botInstances[botId] || null
  }, [botInstances])

  // Execute bot turn
  const executeBotTurn = useCallback(async (
    botId: string,
    gameState: {
      tiles: any[]
      players: any[]
      rules: any[]
      turnNumber: number
    },
    canModify: boolean
  ): Promise<BotDecision | null> => {
    if (processingRef.current) return null

    const bot = bots.find(b => b.id === botId)
    const botAI = botInstances[botId]

    if (!bot || !botAI) return null

    processingRef.current = true
    setIsProcessing(true)
    setActiveBotId(botId)

    try {
      // Notify thinking state
      const thinkingMessage = getBotThinkingMessage(bot.difficulty)
      onBotThinking?.(botId, thinkingMessage)

      // Get player state from game state
      const playerState = gameState.players.find(p => p.id === botId)
      if (!playerState) return null

      // Execute decision
      const decision = await botAI.decideAction(
        {
          id: botId,
          name: bot.name,
          color: bot.color,
          difficulty: bot.difficulty,
          score: playerState.score,
          position: playerState.position,
          effects: playerState.effects || [],
        },
        {
          tiles: gameState.tiles,
          players: gameState.players,
          rules: gameState.rules,
          currentPlayerId: botId,
          turnNumber: gameState.turnNumber,
        },
        canModify
      )

      // Notify action
      onBotAction?.(botId, decision)

      return decision
    } finally {
      processingRef.current = false
      setIsProcessing(false)
      setActiveBotId(null)
      onBotDone?.(botId)
    }
  }, [bots, botInstances, onBotAction, onBotThinking, onBotDone])

  // Check if a player is a bot
  const isBot = useCallback((playerId: string): boolean => {
    return bots.some(b => b.id === playerId)
  }, [bots])

  // Get bot difficulty
  const getBotDifficulty = useCallback((botId: string): BotDifficulty | null => {
    const bot = bots.find(b => b.id === botId)
    return bot?.difficulty || null
  }, [bots])

  return {
    botInstances,
    activeBotId,
    isProcessing,
    getBot,
    executeBotTurn,
    isBot,
    getBotDifficulty,
  }
}
