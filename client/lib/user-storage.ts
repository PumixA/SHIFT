/**
 * User Storage - Local storage utilities for user data
 */

const STORAGE_PREFIX = "shift_"

export interface LocalUserData {
    id?: string
    username: string
    avatarPreset?: string
    avatarUrl?: string
    createdAt: string
}

export interface LocalSettings {
    audioMuted: boolean
    audioVolume: number
    sfxVolume: number
    musicVolume: number
    theme: "light" | "dark" | "system"
    language: string
    reducedMotion: boolean
    highContrast: boolean
    showTutorial: boolean
    notificationsEnabled: boolean
    // Tutorial preferences
    tutorialCompleted: boolean
    tutorialNeverAsk: boolean
    tutorialCompletedSections: string[]
    tutorialHintsEnabled: boolean
}

export interface LocalGamePreferences {
    defaultRulePack: string
    favoriteRulePacks: string[]
    recentRooms: string[]
    autoSave: boolean
    showActionHistory: boolean
    showEffectIndicators: boolean
}

const DEFAULT_SETTINGS: LocalSettings = {
    audioMuted: false,
    audioVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    theme: "system",
    language: "fr",
    reducedMotion: false,
    highContrast: false,
    showTutorial: true,
    notificationsEnabled: false,
    // Tutorial preferences
    tutorialCompleted: false,
    tutorialNeverAsk: false,
    tutorialCompletedSections: [],
    tutorialHintsEnabled: true,
}

const DEFAULT_GAME_PREFERENCES: LocalGamePreferences = {
    defaultRulePack: "classic",
    favoriteRulePacks: [],
    recentRooms: [],
    autoSave: true,
    showActionHistory: true,
    showEffectIndicators: true,
}

/**
 * Get item from localStorage with prefix
 */
function getItem<T>(key: string): T | null {
    if (typeof localStorage === "undefined") return null

    try {
        const value = localStorage.getItem(STORAGE_PREFIX + key)
        return value ? JSON.parse(value) : null
    } catch {
        return null
    }
}

/**
 * Set item in localStorage with prefix
 */
function setItem<T>(key: string, value: T): void {
    if (typeof localStorage === "undefined") return

    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    } catch (e) {
        console.warn("[Storage] Failed to save:", e)
    }
}

/**
 * Remove item from localStorage
 */
function removeItem(key: string): void {
    if (typeof localStorage === "undefined") return
    localStorage.removeItem(STORAGE_PREFIX + key)
}

// ================================
// USER DATA
// ================================

/**
 * Get local user data
 */
export function getLocalUser(): LocalUserData | null {
    return getItem<LocalUserData>("user")
}

/**
 * Save local user data
 */
export function saveLocalUser(user: LocalUserData): void {
    setItem("user", user)
}

/**
 * Update local user data
 */
export function updateLocalUser(updates: Partial<LocalUserData>): LocalUserData | null {
    const current = getLocalUser()
    if (!current) return null

    const updated = { ...current, ...updates }
    saveLocalUser(updated)
    return updated
}

/**
 * Clear local user data
 */
export function clearLocalUser(): void {
    removeItem("user")
}

/**
 * Check if user exists locally
 */
export function hasLocalUser(): boolean {
    return getLocalUser() !== null
}

// ================================
// SETTINGS
// ================================

/**
 * Get settings
 */
export function getSettings(): LocalSettings {
    const saved = getItem<Partial<LocalSettings>>("settings")
    return { ...DEFAULT_SETTINGS, ...saved }
}

/**
 * Save settings
 */
export function saveSettings(settings: Partial<LocalSettings>): LocalSettings {
    const current = getSettings()
    const updated = { ...current, ...settings }
    setItem("settings", updated)
    return updated
}

/**
 * Reset settings to defaults
 */
export function resetSettings(): LocalSettings {
    setItem("settings", DEFAULT_SETTINGS)
    return DEFAULT_SETTINGS
}

// ================================
// GAME PREFERENCES
// ================================

/**
 * Get game preferences
 */
export function getGamePreferences(): LocalGamePreferences {
    const saved = getItem<Partial<LocalGamePreferences>>("gamePrefs")
    return { ...DEFAULT_GAME_PREFERENCES, ...saved }
}

/**
 * Save game preferences
 */
export function saveGamePreferences(prefs: Partial<LocalGamePreferences>): LocalGamePreferences {
    const current = getGamePreferences()
    const updated = { ...current, ...prefs }
    setItem("gamePrefs", updated)
    return updated
}

/**
 * Add to recent rooms
 */
export function addRecentRoom(roomId: string): void {
    const prefs = getGamePreferences()
    const rooms = prefs.recentRooms.filter((r) => r !== roomId)
    rooms.unshift(roomId)
    // Keep only last 10 rooms
    saveGamePreferences({ recentRooms: rooms.slice(0, 10) })
}

/**
 * Add to favorite rule packs
 */
export function addFavoriteRulePack(packId: string): void {
    const prefs = getGamePreferences()
    if (!prefs.favoriteRulePacks.includes(packId)) {
        saveGamePreferences({
            favoriteRulePacks: [...prefs.favoriteRulePacks, packId],
        })
    }
}

/**
 * Remove from favorite rule packs
 */
export function removeFavoriteRulePack(packId: string): void {
    const prefs = getGamePreferences()
    saveGamePreferences({
        favoriteRulePacks: prefs.favoriteRulePacks.filter((p) => p !== packId),
    })
}

// ================================
// SESSION DATA
// ================================

/**
 * Get current session data
 */
export function getSessionData(): Record<string, any> | null {
    if (typeof sessionStorage === "undefined") return null

    try {
        const value = sessionStorage.getItem(STORAGE_PREFIX + "session")
        return value ? JSON.parse(value) : null
    } catch {
        return null
    }
}

/**
 * Save session data
 */
export function saveSessionData(data: Record<string, any>): void {
    if (typeof sessionStorage === "undefined") return

    try {
        const current = getSessionData() || {}
        sessionStorage.setItem(STORAGE_PREFIX + "session", JSON.stringify({ ...current, ...data }))
    } catch (e) {
        console.warn("[Storage] Failed to save session:", e)
    }
}

/**
 * Clear session data
 */
export function clearSessionData(): void {
    if (typeof sessionStorage === "undefined") return
    sessionStorage.removeItem(STORAGE_PREFIX + "session")
}

// ================================
// STORAGE UTILITIES
// ================================

/**
 * Get total storage usage
 */
export function getStorageUsage(): { used: number; available: number } {
    if (typeof localStorage === "undefined") {
        return { used: 0, available: 0 }
    }

    let used = 0
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(STORAGE_PREFIX)) {
            used += (localStorage.getItem(key) || "").length
        }
    }

    // Estimate available (usually 5MB)
    const available = 5 * 1024 * 1024

    return { used, available }
}

/**
 * Clear all SHIFT storage
 */
export function clearAllStorage(): void {
    if (typeof localStorage === "undefined") return

    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(key)
        }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key))
    clearSessionData()
}

/**
 * Export all user data
 */
export function exportUserData(): string {
    const data = {
        user: getLocalUser(),
        settings: getSettings(),
        gamePreferences: getGamePreferences(),
        exportedAt: new Date().toISOString(),
    }

    return JSON.stringify(data, null, 2)
}

/**
 * Import user data
 */
export function importUserData(jsonString: string): boolean {
    try {
        const data = JSON.parse(jsonString)

        if (data.user) saveLocalUser(data.user)
        if (data.settings) saveSettings(data.settings)
        if (data.gamePreferences) saveGamePreferences(data.gamePreferences)

        return true
    } catch {
        return false
    }
}
