"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { audioManager, SoundEffect } from "@/lib/audio-manager"

interface AudioContextValue {
    isMuted: boolean
    volume: number
    sfxVolume: number
    musicVolume: number
    toggleMute: () => void
    setVolume: (volume: number) => void
    setSfxVolume: (volume: number) => void
    setMusicVolume: (volume: number) => void
    play: (sound: SoundEffect) => void
    playDiceRoll: () => void
    playGameAction: (action: string, value?: number) => void
}

const AudioContext = createContext<AudioContextValue | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [isMuted, setIsMuted] = useState(false)
    const [volume, setVolumeState] = useState(0.7)
    const [sfxVolume, setSfxVolumeState] = useState(0.8)
    const [musicVolume, setMusicVolumeState] = useState(0.5)
    const [initialized, setInitialized] = useState(false)

    // Initialize audio manager on first user interaction
    useEffect(() => {
        const handleInteraction = () => {
            if (!initialized) {
                audioManager.init()
                const state = audioManager.getState()
                setIsMuted(state.isMuted)
                setVolumeState(state.volume)
                setSfxVolumeState(state.sfxVolume)
                setMusicVolumeState(state.musicVolume)
                setInitialized(true)
            }
            audioManager.unlock()
        }

        // Listen for any user interaction
        window.addEventListener("click", handleInteraction, { once: true })
        window.addEventListener("keydown", handleInteraction, { once: true })
        window.addEventListener("touchstart", handleInteraction, { once: true })

        return () => {
            window.removeEventListener("click", handleInteraction)
            window.removeEventListener("keydown", handleInteraction)
            window.removeEventListener("touchstart", handleInteraction)
        }
    }, [initialized])

    const toggleMute = useCallback(() => {
        const newMuted = audioManager.toggleMute()
        setIsMuted(newMuted)
    }, [])

    const setVolume = useCallback((vol: number) => {
        audioManager.setVolume(vol)
        setVolumeState(vol)
    }, [])

    const setSfxVolume = useCallback((vol: number) => {
        audioManager.setSfxVolume(vol)
        setSfxVolumeState(vol)
    }, [])

    const setMusicVolume = useCallback((vol: number) => {
        audioManager.setMusicVolume(vol)
        setMusicVolumeState(vol)
    }, [])

    const play = useCallback((sound: SoundEffect) => {
        audioManager.play(sound)
    }, [])

    const playDiceRoll = useCallback(() => {
        audioManager.playDiceRoll()
    }, [])

    const playGameAction = useCallback((action: string, value?: number) => {
        audioManager.playGameAction(action, value)
    }, [])

    return (
        <AudioContext.Provider
            value={{
                isMuted,
                volume,
                sfxVolume,
                musicVolume,
                toggleMute,
                setVolume,
                setSfxVolume,
                setMusicVolume,
                play,
                playDiceRoll,
                playGameAction,
            }}
        >
            {children}
        </AudioContext.Provider>
    )
}

export function useAudio() {
    const context = useContext(AudioContext)
    if (!context) {
        throw new Error("useAudio must be used within AudioProvider")
    }
    return context
}

export default AudioContext
