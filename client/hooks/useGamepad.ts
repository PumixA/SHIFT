"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { GAMEPAD_MAPPINGS, ExtendedGamepadMapping, GamepadAction } from "@/lib/gamepad-mappings"

interface GamepadState {
    connected: boolean
    gamepadId: string | null
    mapping: ExtendedGamepadMapping | null
}

interface UseGamepadOptions {
    onAction?: (action: GamepadAction) => void
    pollInterval?: number
    deadzone?: number
}

export function useGamepad(options: UseGamepadOptions = {}) {
    const { onAction, pollInterval = 16, deadzone = 0.15 } = options
    const [state, setState] = useState<GamepadState>({
        connected: false,
        gamepadId: null,
        mapping: null,
    })

    const lastButtonStates = useRef<Record<number, boolean>>({})
    const lastAxisValues = useRef<Record<number, number>>({})
    const animationFrameRef = useRef<number | null>(null)

    const detectMapping = useCallback((gamepad: Gamepad): ExtendedGamepadMapping => {
        const id = gamepad.id.toLowerCase()

        if (id.includes("xbox") || id.includes("xinput")) {
            return GAMEPAD_MAPPINGS.xbox
        }
        if (id.includes("playstation") || id.includes("dualshock") || id.includes("dualsense")) {
            return GAMEPAD_MAPPINGS.playstation
        }
        if (id.includes("nintendo") || id.includes("switch") || id.includes("pro controller")) {
            return GAMEPAD_MAPPINGS.nintendo
        }

        return GAMEPAD_MAPPINGS.generic
    }, [])

    const handleGamepadConnected = useCallback(
        (event: GamepadEvent) => {
            const mapping = detectMapping(event.gamepad)
            setState({
                connected: true,
                gamepadId: event.gamepad.id,
                mapping,
            })
        },
        [detectMapping]
    )

    const handleGamepadDisconnected = useCallback(() => {
        setState({
            connected: false,
            gamepadId: null,
            mapping: null,
        })
        lastButtonStates.current = {}
        lastAxisValues.current = {}
    }, [])

    const pollGamepad = useCallback(() => {
        const gamepads = navigator.getGamepads()
        const gamepad = gamepads[0]

        if (!gamepad || !state.mapping || !onAction) {
            animationFrameRef.current = requestAnimationFrame(pollGamepad)
            return
        }

        // Check buttons
        gamepad.buttons.forEach((button, index) => {
            const isPressed = button.pressed || button.value > 0.5
            const wasPressed = lastButtonStates.current[index] || false

            if (isPressed && !wasPressed) {
                const action = state.mapping?.buttons[index]
                if (action) {
                    onAction(action)
                }
            }

            lastButtonStates.current[index] = isPressed
        })

        // Check axes (D-pad on sticks)
        gamepad.axes.forEach((value, index) => {
            const lastValue = lastAxisValues.current[index] || 0

            if (Math.abs(value) > deadzone && Math.abs(lastValue) <= deadzone) {
                const axisConfig = state.mapping?.axes[index]
                if (axisConfig) {
                    const action = value > 0 ? axisConfig.positive : axisConfig.negative
                    if (action) {
                        onAction(action)
                    }
                }
            }

            lastAxisValues.current[index] = value
        })

        animationFrameRef.current = requestAnimationFrame(pollGamepad)
    }, [state.mapping, onAction, deadzone])

    useEffect(() => {
        window.addEventListener("gamepadconnected", handleGamepadConnected)
        window.addEventListener("gamepaddisconnected", handleGamepadDisconnected)

        // Check for already connected gamepads
        const gamepads = navigator.getGamepads()
        const gamepad = gamepads[0]
        if (gamepad) {
            const mapping = detectMapping(gamepad)
            setState({
                connected: true,
                gamepadId: gamepad.id,
                mapping,
            })
        }

        return () => {
            window.removeEventListener("gamepadconnected", handleGamepadConnected)
            window.removeEventListener("gamepaddisconnected", handleGamepadDisconnected)
        }
    }, [handleGamepadConnected, handleGamepadDisconnected, detectMapping])

    useEffect(() => {
        if (state.connected && onAction) {
            animationFrameRef.current = requestAnimationFrame(pollGamepad)
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [state.connected, onAction, pollGamepad])

    const vibrate = useCallback(
        (duration: number = 200, strongMagnitude: number = 1.0, weakMagnitude: number = 0.5) => {
            const gamepads = navigator.getGamepads()
            const gamepad = gamepads[0]

            if (gamepad?.vibrationActuator) {
                gamepad.vibrationActuator.playEffect("dual-rumble", {
                    startDelay: 0,
                    duration,
                    strongMagnitude,
                    weakMagnitude,
                })
            }
        },
        []
    )

    return {
        ...state,
        vibrate,
    }
}
