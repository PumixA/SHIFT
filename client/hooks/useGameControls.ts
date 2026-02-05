"use client"

import { useState, useEffect, useCallback, useRef } from "react"

/**
 * Hook unifié pour la gestion des contrôles de jeu
 * - Clavier
 * - Manette (Gamepad API)
 * - Logique de modification de tour
 */

export interface GameControlsState {
    // Turn state
    hasPlayedThisTurn: boolean
    hasModifiedThisTurn: boolean
    canModify: boolean
    isMyTurn: boolean

    // Gamepad state
    gamepadConnected: boolean
    gamepadName: string | null
    gamepadIndex: number | null
}

export interface GameControlsActions {
    // Turn actions
    markAsPlayed: () => void
    markAsModified: () => void
    resetTurnState: () => void

    // Validation
    canAddRule: () => boolean
    canModifyRule: () => boolean
    canDeleteRule: () => boolean
    canAddTile: () => boolean
    canRemoveTile: () => boolean
}

interface UseGameControlsOptions {
    isMyTurn: boolean
    isHost: boolean
    allowRuleEdit: boolean
    allowTileEdit: boolean
    onAction?: (action: GamepadAction) => void
}

export type GamepadAction =
    | "roll_dice"
    | "confirm"
    | "cancel"
    | "menu"
    | "rules"
    | "navigate_up"
    | "navigate_down"
    | "navigate_left"
    | "navigate_right"
    | "zoom_in"
    | "zoom_out"
    | "center_camera"

export function useGameControls(options: UseGameControlsOptions) {
    const { isMyTurn, isHost, allowRuleEdit, allowTileEdit, onAction } = options

    // Turn state
    const [hasPlayedThisTurn, setHasPlayedThisTurn] = useState(false)
    const [hasModifiedThisTurn, setHasModifiedThisTurn] = useState(false)

    // Gamepad state
    const [gamepadConnected, setGamepadConnected] = useState(false)
    const [gamepadName, setGamepadName] = useState<string | null>(null)
    const [gamepadIndex, setGamepadIndex] = useState<number | null>(null)

    // Refs for button state tracking
    const lastButtonStates = useRef<Record<number, boolean>>({})
    const lastAxisValues = useRef<Record<number, number>>({})
    const animationFrameRef = useRef<number | null>(null)

    // Computed permission
    const canModify = hasPlayedThisTurn && !hasModifiedThisTurn && isMyTurn

    // Actions
    const markAsPlayed = useCallback(() => {
        setHasPlayedThisTurn(true)
    }, [])

    const markAsModified = useCallback(() => {
        setHasModifiedThisTurn(true)
    }, [])

    const resetTurnState = useCallback(() => {
        setHasPlayedThisTurn(false)
        setHasModifiedThisTurn(false)
    }, [])

    // Validation functions
    const canAddRule = useCallback(() => {
        if (!isMyTurn) return false
        if (!allowRuleEdit && !isHost) return false
        if (!hasPlayedThisTurn) return false
        if (hasModifiedThisTurn) return false
        return true
    }, [isMyTurn, allowRuleEdit, isHost, hasPlayedThisTurn, hasModifiedThisTurn])

    const canModifyRule = useCallback(() => {
        if (!isMyTurn) return false
        if (!allowRuleEdit && !isHost) return false
        if (!hasPlayedThisTurn) return false
        if (hasModifiedThisTurn) return false
        return true
    }, [isMyTurn, allowRuleEdit, isHost, hasPlayedThisTurn, hasModifiedThisTurn])

    const canDeleteRule = useCallback(() => {
        if (!isMyTurn) return false
        if (!allowRuleEdit && !isHost) return false
        if (!hasPlayedThisTurn) return false
        if (hasModifiedThisTurn) return false
        return true
    }, [isMyTurn, allowRuleEdit, isHost, hasPlayedThisTurn, hasModifiedThisTurn])

    const canAddTile = useCallback(() => {
        if (!isMyTurn) return false
        if (!allowTileEdit && !isHost) return false
        if (!hasPlayedThisTurn) return false
        if (hasModifiedThisTurn) return false
        return true
    }, [isMyTurn, allowTileEdit, isHost, hasPlayedThisTurn, hasModifiedThisTurn])

    const canRemoveTile = useCallback(() => {
        if (!isMyTurn) return false
        if (!allowTileEdit && !isHost) return false
        if (!hasPlayedThisTurn) return false
        if (hasModifiedThisTurn) return false
        return true
    }, [isMyTurn, allowTileEdit, isHost, hasPlayedThisTurn, hasModifiedThisTurn])

    // Gamepad connection handling
    useEffect(() => {
        const handleGamepadConnected = (e: GamepadEvent) => {
            setGamepadConnected(true)
            setGamepadName(e.gamepad.id)
            setGamepadIndex(e.gamepad.index)
            console.log(`🎮 Manette connectée: ${e.gamepad.id}`)
        }

        const handleGamepadDisconnected = (e: GamepadEvent) => {
            if (e.gamepad.index === gamepadIndex) {
                setGamepadConnected(false)
                setGamepadName(null)
                setGamepadIndex(null)
                console.log(`🎮 Manette déconnectée`)
            }
        }

        window.addEventListener("gamepadconnected", handleGamepadConnected)
        window.addEventListener("gamepaddisconnected", handleGamepadDisconnected)

        // Check for already connected gamepads
        const gamepads = navigator.getGamepads()
        for (const gamepad of gamepads) {
            if (gamepad) {
                setGamepadConnected(true)
                setGamepadName(gamepad.id)
                setGamepadIndex(gamepad.index)
                break
            }
        }

        return () => {
            window.removeEventListener("gamepadconnected", handleGamepadConnected)
            window.removeEventListener("gamepaddisconnected", handleGamepadDisconnected)
        }
    }, [gamepadIndex])

    // Gamepad polling
    useEffect(() => {
        if (!gamepadConnected || gamepadIndex === null) return

        const DEADZONE = 0.3
        const BUTTON_MAP: Record<number, GamepadAction> = {
            0: "confirm", // A / Cross
            1: "cancel", // B / Circle
            2: "roll_dice", // X / Square
            3: "rules", // Y / Triangle
            8: "menu", // Select / Share
            9: "menu", // Start / Options
            12: "navigate_up", // D-pad up
            13: "navigate_down", // D-pad down
            14: "navigate_left", // D-pad left
            15: "navigate_right", // D-pad right
            4: "zoom_out", // LB / L1
            5: "zoom_in", // RB / R1
            10: "center_camera", // L3
        }

        const pollGamepad = () => {
            const gamepads = navigator.getGamepads()
            const gamepad = gamepads[gamepadIndex]

            if (!gamepad) {
                animationFrameRef.current = requestAnimationFrame(pollGamepad)
                return
            }

            // Check buttons
            gamepad.buttons.forEach((button, index) => {
                const isPressed = button.pressed || button.value > 0.5
                const wasPressed = lastButtonStates.current[index] || false

                // On button down (not held)
                if (isPressed && !wasPressed) {
                    const action = BUTTON_MAP[index]
                    if (action && onAction) {
                        onAction(action)
                    }
                }

                lastButtonStates.current[index] = isPressed
            })

            // Check axes (left stick for navigation)
            const leftStickX = gamepad.axes[0] || 0
            const leftStickY = gamepad.axes[1] || 0
            const lastX = lastAxisValues.current[0] || 0
            const lastY = lastAxisValues.current[1] || 0

            // Left/Right
            if (Math.abs(leftStickX) > DEADZONE && Math.abs(lastX) <= DEADZONE) {
                onAction?.(leftStickX > 0 ? "navigate_right" : "navigate_left")
            }
            // Up/Down
            if (Math.abs(leftStickY) > DEADZONE && Math.abs(lastY) <= DEADZONE) {
                onAction?.(leftStickY > 0 ? "navigate_down" : "navigate_up")
            }

            lastAxisValues.current[0] = leftStickX
            lastAxisValues.current[1] = leftStickY

            animationFrameRef.current = requestAnimationFrame(pollGamepad)
        }

        animationFrameRef.current = requestAnimationFrame(pollGamepad)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [gamepadConnected, gamepadIndex, onAction])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }

            switch (e.code) {
                case "Space":
                    e.preventDefault()
                    onAction?.("roll_dice")
                    break
                case "Enter":
                    e.preventDefault()
                    onAction?.("confirm")
                    break
                case "Escape":
                    e.preventDefault()
                    onAction?.("cancel")
                    break
                case "KeyR":
                    e.preventDefault()
                    onAction?.("rules")
                    break
                case "KeyM":
                    e.preventDefault()
                    onAction?.("menu")
                    break
                case "ArrowUp":
                    e.preventDefault()
                    onAction?.("navigate_up")
                    break
                case "ArrowDown":
                    e.preventDefault()
                    onAction?.("navigate_down")
                    break
                case "ArrowLeft":
                    e.preventDefault()
                    onAction?.("navigate_left")
                    break
                case "ArrowRight":
                    e.preventDefault()
                    onAction?.("navigate_right")
                    break
                case "Equal":
                case "NumpadAdd":
                    e.preventDefault()
                    onAction?.("zoom_in")
                    break
                case "Minus":
                case "NumpadSubtract":
                    e.preventDefault()
                    onAction?.("zoom_out")
                    break
                case "KeyC":
                    e.preventDefault()
                    onAction?.("center_camera")
                    break
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [onAction])

    return {
        // State
        state: {
            hasPlayedThisTurn,
            hasModifiedThisTurn,
            canModify,
            isMyTurn,
            gamepadConnected,
            gamepadName,
            gamepadIndex,
        } as GameControlsState,

        // Actions
        actions: {
            markAsPlayed,
            markAsModified,
            resetTurnState,
            canAddRule,
            canModifyRule,
            canDeleteRule,
            canAddTile,
            canRemoveTile,
        } as GameControlsActions,
    }
}

// Helper to get gamepad type from ID
export function getGamepadType(id: string): "xbox" | "playstation" | "nintendo" | "generic" {
    const idLower = id.toLowerCase()
    if (idLower.includes("xbox") || idLower.includes("xinput")) return "xbox"
    if (idLower.includes("playstation") || idLower.includes("dualshock") || idLower.includes("dualsense"))
        return "playstation"
    if (idLower.includes("nintendo") || idLower.includes("switch") || idLower.includes("joy-con")) return "nintendo"
    return "generic"
}

// Button labels by gamepad type
export const GAMEPAD_BUTTON_LABELS: Record<string, Record<GamepadAction, string>> = {
    xbox: {
        roll_dice: "X",
        confirm: "A",
        cancel: "B",
        menu: "Menu",
        rules: "Y",
        navigate_up: "↑",
        navigate_down: "↓",
        navigate_left: "←",
        navigate_right: "→",
        zoom_in: "RB",
        zoom_out: "LB",
        center_camera: "L3",
    },
    playstation: {
        roll_dice: "□",
        confirm: "✕",
        cancel: "○",
        menu: "Options",
        rules: "△",
        navigate_up: "↑",
        navigate_down: "↓",
        navigate_left: "←",
        navigate_right: "→",
        zoom_in: "R1",
        zoom_out: "L1",
        center_camera: "L3",
    },
    nintendo: {
        roll_dice: "Y",
        confirm: "B",
        cancel: "A",
        menu: "+",
        rules: "X",
        navigate_up: "↑",
        navigate_down: "↓",
        navigate_left: "←",
        navigate_right: "→",
        zoom_in: "R",
        zoom_out: "L",
        center_camera: "L3",
    },
    generic: {
        roll_dice: "Btn 2",
        confirm: "Btn 0",
        cancel: "Btn 1",
        menu: "Btn 9",
        rules: "Btn 3",
        navigate_up: "↑",
        navigate_down: "↓",
        navigate_left: "←",
        navigate_right: "→",
        zoom_in: "R1",
        zoom_out: "L1",
        center_camera: "L3",
    },
}
