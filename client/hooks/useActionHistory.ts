"use client"

import { useState, useCallback, useRef } from "react"

export interface GameAction {
  id: string
  type: 'move' | 'dice' | 'rule' | 'power-up' | 'chat' | 'system'
  playerId: string
  playerName: string
  description: string
  details?: Record<string, unknown>
  timestamp: number
}

interface UseActionHistoryOptions {
  maxHistory?: number
  onNewAction?: (action: GameAction) => void
}

export function useActionHistory(options: UseActionHistoryOptions = {}) {
  const { maxHistory = 100, onNewAction } = options
  const [actions, setActions] = useState<GameAction[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const isViewingRef = useRef(false)

  const addAction = useCallback((action: Omit<GameAction, 'id' | 'timestamp'>) => {
    const newAction: GameAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }

    setActions(prev => {
      const updated = [newAction, ...prev].slice(0, maxHistory)
      return updated
    })

    if (!isViewingRef.current) {
      setUnreadCount(prev => prev + 1)
    }

    onNewAction?.(newAction)
  }, [maxHistory, onNewAction])

  const clearHistory = useCallback(() => {
    setActions([])
    setUnreadCount(0)
  }, [])

  const markAsRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  const setViewing = useCallback((viewing: boolean) => {
    isViewingRef.current = viewing
    if (viewing) {
      setUnreadCount(0)
    }
  }, [])

  const getActionsByType = useCallback((type: GameAction['type']) => {
    return actions.filter(a => a.type === type)
  }, [actions])

  const getActionsByPlayer = useCallback((playerId: string) => {
    return actions.filter(a => a.playerId === playerId)
  }, [actions])

  const getRecentActions = useCallback((count: number = 10) => {
    return actions.slice(0, count)
  }, [actions])

  const formatActionMessage = useCallback((action: GameAction): string => {
    switch (action.type) {
      case 'move':
        return `${action.playerName} ${action.description}`
      case 'dice':
        return `${action.playerName} a lancé le dé: ${action.details?.value || '?'}`
      case 'rule':
        return `Règle activée: ${action.description}`
      case 'power-up':
        return `${action.playerName} a utilisé: ${action.description}`
      case 'chat':
        return `${action.playerName}: ${action.description}`
      case 'system':
        return action.description
      default:
        return action.description
    }
  }, [])

  return {
    actions,
    unreadCount,
    addAction,
    clearHistory,
    markAsRead,
    setViewing,
    getActionsByType,
    getActionsByPlayer,
    getRecentActions,
    formatActionMessage,
  }
}
