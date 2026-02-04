"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { GAMEPAD_MAPPINGS, GamepadMapping, GamepadAction } from "@/lib/gamepad-mappings"

interface GamepadState {
  index: number
  id: string
  connected: boolean
  mapping: GamepadMapping
  assignedPlayerId: string | null
}

interface UseMultiGamepadOptions {
  assignments: Record<number, string | null>
  onAction?: (playerId: string, action: GamepadAction) => void
  pollInterval?: number
  deadzone?: number
  vibrationEnabled?: boolean
}

export function useMultiGamepad(options: UseMultiGamepadOptions) {
  const {
    assignments,
    onAction,
    pollInterval = 16,
    deadzone = 0.15,
    vibrationEnabled = true
  } = options

  const [gamepads, setGamepads] = useState<GamepadState[]>([])
  const lastButtonStates = useRef<Record<number, Record<number, boolean>>>({})
  const lastAxisValues = useRef<Record<number, Record<number, number>>>({})
  const animationFrameRef = useRef<number | null>(null)

  const detectMapping = useCallback((gamepad: Gamepad): GamepadMapping => {
    const id = gamepad.id.toLowerCase()
    if (id.includes("xbox") || id.includes("xinput")) return GAMEPAD_MAPPINGS.xbox
    if (id.includes("playstation") || id.includes("dualshock") || id.includes("dualsense")) return GAMEPAD_MAPPINGS.playstation
    if (id.includes("nintendo") || id.includes("switch")) return GAMEPAD_MAPPINGS.nintendo
    return GAMEPAD_MAPPINGS.generic
  }, [])

  const scanGamepads = useCallback(() => {
    const detected: GamepadState[] = []
    const pads = navigator.getGamepads()

    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i]
      if (pad) {
        detected.push({
          index: pad.index,
          id: pad.id,
          connected: pad.connected,
          mapping: detectMapping(pad),
          assignedPlayerId: assignments[pad.index] || null
        })
      }
    }

    setGamepads(detected)
  }, [assignments, detectMapping])

  const pollGamepads = useCallback(() => {
    const pads = navigator.getGamepads()

    for (let i = 0; i < pads.length; i++) {
      const gamepad = pads[i]
      if (!gamepad) continue

      const playerId = assignments[gamepad.index]
      if (!playerId || !onAction) continue

      const gamepadState = gamepads.find(g => g.index === gamepad.index)
      if (!gamepadState) continue

      // Initialiser les états si nécessaire
      if (!lastButtonStates.current[i]) lastButtonStates.current[i] = {}
      if (!lastAxisValues.current[i]) lastAxisValues.current[i] = {}

      // Vérifier les boutons
      gamepad.buttons.forEach((button, btnIndex) => {
        const isPressed = button.pressed || button.value > 0.5
        const wasPressed = lastButtonStates.current[i][btnIndex] || false

        if (isPressed && !wasPressed) {
          const action = gamepadState.mapping.buttons[btnIndex]
          if (action) {
            onAction(playerId, action)
          }
        }

        lastButtonStates.current[i][btnIndex] = isPressed
      })

      // Vérifier les axes
      gamepad.axes.forEach((value, axisIndex) => {
        const lastValue = lastAxisValues.current[i][axisIndex] || 0

        if (Math.abs(value) > deadzone && Math.abs(lastValue) <= deadzone) {
          const axisConfig = gamepadState.mapping.axes[axisIndex]
          if (axisConfig) {
            const action = value > 0 ? axisConfig.positive : axisConfig.negative
            if (action) {
              onAction(playerId, action)
            }
          }
        }

        lastAxisValues.current[i][axisIndex] = value
      })
    }

    animationFrameRef.current = requestAnimationFrame(pollGamepads)
  }, [assignments, gamepads, onAction, deadzone])

  // Gérer les événements de connexion/déconnexion
  useEffect(() => {
    const handleConnect = () => scanGamepads()
    const handleDisconnect = () => scanGamepads()

    window.addEventListener("gamepadconnected", handleConnect)
    window.addEventListener("gamepaddisconnected", handleDisconnect)

    // Scan initial
    scanGamepads()

    return () => {
      window.removeEventListener("gamepadconnected", handleConnect)
      window.removeEventListener("gamepaddisconnected", handleDisconnect)
    }
  }, [scanGamepads])

  // Polling
  useEffect(() => {
    if (gamepads.some(g => g.assignedPlayerId) && onAction) {
      animationFrameRef.current = requestAnimationFrame(pollGamepads)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gamepads, onAction, pollGamepads])

  // Vibration pour un joueur spécifique
  const vibrateForPlayer = useCallback((playerId: string, duration: number = 200, intensity: number = 1.0) => {
    if (!vibrationEnabled) return

    const gamepadIndex = Object.entries(assignments).find(([_, pid]) => pid === playerId)?.[0]
    if (gamepadIndex === undefined) return

    const pad = navigator.getGamepads()[parseInt(gamepadIndex)]
    if (pad?.vibrationActuator) {
      pad.vibrationActuator.playEffect("dual-rumble", {
        startDelay: 0,
        duration,
        strongMagnitude: intensity,
        weakMagnitude: intensity * 0.5,
      })
    }
  }, [assignments, vibrationEnabled])

  // Vibration pour tous les joueurs
  const vibrateAll = useCallback((duration: number = 200, intensity: number = 1.0) => {
    if (!vibrationEnabled) return

    Object.entries(assignments).forEach(([index, playerId]) => {
      if (playerId) {
        const pad = navigator.getGamepads()[parseInt(index)]
        if (pad?.vibrationActuator) {
          pad.vibrationActuator.playEffect("dual-rumble", {
            startDelay: 0,
            duration,
            strongMagnitude: intensity,
            weakMagnitude: intensity * 0.5,
          })
        }
      }
    })
  }, [assignments, vibrationEnabled])

  return {
    gamepads,
    vibrateForPlayer,
    vibrateAll,
    rescan: scanGamepads,
    connectedCount: gamepads.filter(g => g.connected).length,
    assignedCount: gamepads.filter(g => g.assignedPlayerId).length,
  }
}
