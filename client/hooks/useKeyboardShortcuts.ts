"use client"

import { useEffect, useCallback, useRef } from "react"

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
  action: () => void
  description?: string
  enabled?: boolean
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
  preventDefault?: boolean
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const { shortcuts, enabled = true, preventDefault = true } = options
  const shortcutsRef = useRef(shortcuts)

  // Keep shortcuts ref up to date
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Ignore if user is typing in an input
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    const key = event.key.toLowerCase()
    const ctrl = event.ctrlKey || event.metaKey
    const alt = event.altKey
    const shift = event.shiftKey
    const meta = event.metaKey

    for (const shortcut of shortcutsRef.current) {
      if (shortcut.enabled === false) continue

      const matchKey = shortcut.key.toLowerCase() === key
      const matchCtrl = shortcut.ctrl ? ctrl : !ctrl
      const matchAlt = shortcut.alt ? alt : !alt
      const matchShift = shortcut.shift ? shift : !shift
      const matchMeta = shortcut.meta ? meta : true // Don't require meta unless specified

      if (matchKey && matchCtrl && matchAlt && matchShift && matchMeta) {
        if (preventDefault) {
          event.preventDefault()
        }
        shortcut.action()
        return
      }
    }
  }, [enabled, preventDefault])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Preset shortcuts for the game
export const GAME_SHORTCUTS = {
  ROLL_DICE: { key: ' ', description: 'Lancer le dé' },
  TOGGLE_RULES: { key: 'r', description: 'Afficher les règles' },
  TOGGLE_CHAT: { key: 'c', description: 'Ouvrir le chat' },
  TOGGLE_HISTORY: { key: 'h', description: 'Historique des actions' },
  TOGGLE_SETTINGS: { key: 's', ctrl: true, description: 'Paramètres' },
  ZOOM_IN: { key: '+', description: 'Zoomer' },
  ZOOM_OUT: { key: '-', description: 'Dézoomer' },
  RESET_VIEW: { key: '0', description: 'Réinitialiser la vue' },
  ESCAPE: { key: 'Escape', description: 'Fermer / Annuler' },
  CONFIRM: { key: 'Enter', description: 'Confirmer' },
  NEXT_PLAYER: { key: 'Tab', description: 'Joueur suivant' },
  PREV_PLAYER: { key: 'Tab', shift: true, description: 'Joueur précédent' },
  UNDO: { key: 'z', ctrl: true, description: 'Annuler' },
  REDO: { key: 'y', ctrl: true, description: 'Rétablir' },
  FULLSCREEN: { key: 'f', description: 'Plein écran' },
  MUTE: { key: 'm', description: 'Couper le son' },
}

// Helper to create game shortcuts
export function createGameShortcuts(handlers: {
  onRollDice?: () => void
  onToggleRules?: () => void
  onToggleChat?: () => void
  onToggleHistory?: () => void
  onToggleSettings?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onResetView?: () => void
  onEscape?: () => void
  onConfirm?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onFullscreen?: () => void
  onMute?: () => void
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = []

  if (handlers.onRollDice) {
    shortcuts.push({ ...GAME_SHORTCUTS.ROLL_DICE, action: handlers.onRollDice })
  }
  if (handlers.onToggleRules) {
    shortcuts.push({ ...GAME_SHORTCUTS.TOGGLE_RULES, action: handlers.onToggleRules })
  }
  if (handlers.onToggleChat) {
    shortcuts.push({ ...GAME_SHORTCUTS.TOGGLE_CHAT, action: handlers.onToggleChat })
  }
  if (handlers.onToggleHistory) {
    shortcuts.push({ ...GAME_SHORTCUTS.TOGGLE_HISTORY, action: handlers.onToggleHistory })
  }
  if (handlers.onToggleSettings) {
    shortcuts.push({ ...GAME_SHORTCUTS.TOGGLE_SETTINGS, action: handlers.onToggleSettings })
  }
  if (handlers.onZoomIn) {
    shortcuts.push({ ...GAME_SHORTCUTS.ZOOM_IN, action: handlers.onZoomIn })
  }
  if (handlers.onZoomOut) {
    shortcuts.push({ ...GAME_SHORTCUTS.ZOOM_OUT, action: handlers.onZoomOut })
  }
  if (handlers.onResetView) {
    shortcuts.push({ ...GAME_SHORTCUTS.RESET_VIEW, action: handlers.onResetView })
  }
  if (handlers.onEscape) {
    shortcuts.push({ ...GAME_SHORTCUTS.ESCAPE, action: handlers.onEscape })
  }
  if (handlers.onConfirm) {
    shortcuts.push({ ...GAME_SHORTCUTS.CONFIRM, action: handlers.onConfirm })
  }
  if (handlers.onUndo) {
    shortcuts.push({ ...GAME_SHORTCUTS.UNDO, action: handlers.onUndo })
  }
  if (handlers.onRedo) {
    shortcuts.push({ ...GAME_SHORTCUTS.REDO, action: handlers.onRedo })
  }
  if (handlers.onFullscreen) {
    shortcuts.push({ ...GAME_SHORTCUTS.FULLSCREEN, action: handlers.onFullscreen })
  }
  if (handlers.onMute) {
    shortcuts.push({ ...GAME_SHORTCUTS.MUTE, action: handlers.onMute })
  }

  return shortcuts
}
