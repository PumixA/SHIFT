"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { getSettings, saveSettings } from "@/lib/user-storage"

export interface TutorialPreferences {
    isCompleted: boolean
    neverAskAgain: boolean
    completedSections: string[]
    hintsEnabled: boolean
}

export interface UseTutorialPreferencesReturn {
    preferences: TutorialPreferences
    isLoading: boolean
    markCompleted: () => void
    setNeverAskAgain: (value: boolean) => void
    markSectionCompleted: (sectionId: string) => void
    resetProgress: () => void
    toggleHints: (enabled: boolean) => void
    shouldShowWelcome: () => boolean
}

const LEGACY_TUTORIAL_KEY = "shift_tutorial_completed"

export function useTutorialPreferences(): UseTutorialPreferencesReturn {
    const [preferences, setPreferences] = useState<TutorialPreferences>({
        isCompleted: false,
        neverAskAgain: false,
        completedSections: [],
        hintsEnabled: true,
    })
    const [isLoading, setIsLoading] = useState(true)

    // Load preferences on mount and migrate legacy data
    useEffect(() => {
        const settings = getSettings()

        // Migrate legacy tutorial flag if present
        if (typeof localStorage !== "undefined") {
            const legacyCompleted = localStorage.getItem(LEGACY_TUTORIAL_KEY)
            if (legacyCompleted === "true") {
                saveSettings({
                    tutorialCompleted: true,
                    tutorialNeverAsk: true,
                })
                localStorage.removeItem(LEGACY_TUTORIAL_KEY)
            }
        }

        // Load current settings
        const refreshedSettings = getSettings()
        setPreferences({
            isCompleted: refreshedSettings.tutorialCompleted,
            neverAskAgain: refreshedSettings.tutorialNeverAsk,
            completedSections: refreshedSettings.tutorialCompletedSections,
            hintsEnabled: refreshedSettings.tutorialHintsEnabled,
        })
        setIsLoading(false)
    }, [])

    const markCompleted = useCallback(() => {
        saveSettings({ tutorialCompleted: true })
        setPreferences((prev) => ({ ...prev, isCompleted: true }))
    }, [])

    const setNeverAskAgain = useCallback((value: boolean) => {
        saveSettings({ tutorialNeverAsk: value })
        setPreferences((prev) => ({ ...prev, neverAskAgain: value }))
    }, [])

    const markSectionCompleted = useCallback((sectionId: string) => {
        const settings = getSettings()
        const sections = settings.tutorialCompletedSections
        if (!sections.includes(sectionId)) {
            const updated = [...sections, sectionId]
            saveSettings({ tutorialCompletedSections: updated })
            setPreferences((prev) => ({ ...prev, completedSections: updated }))
        }
    }, [])

    const resetProgress = useCallback(() => {
        saveSettings({
            tutorialCompleted: false,
            tutorialNeverAsk: false,
            tutorialCompletedSections: [],
        })
        setPreferences((prev) => ({
            ...prev,
            isCompleted: false,
            neverAskAgain: false,
            completedSections: [],
        }))
    }, [])

    const toggleHints = useCallback((enabled: boolean) => {
        saveSettings({ tutorialHintsEnabled: enabled })
        setPreferences((prev) => ({ ...prev, hintsEnabled: enabled }))
    }, [])

    const shouldShowWelcome = useCallback((): boolean => {
        if (isLoading) return false
        if (preferences.neverAskAgain) return false
        if (preferences.isCompleted) return false
        return true
    }, [isLoading, preferences.neverAskAgain, preferences.isCompleted])

    return useMemo(
        () => ({
            preferences,
            isLoading,
            markCompleted,
            setNeverAskAgain,
            markSectionCompleted,
            resetProgress,
            toggleHints,
            shouldShowWelcome,
        }),
        [
            preferences,
            isLoading,
            markCompleted,
            setNeverAskAgain,
            markSectionCompleted,
            resetProgress,
            toggleHints,
            shouldShowWelcome,
        ]
    )
}
