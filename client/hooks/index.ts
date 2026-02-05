// Game-related hooks
export { useGameState } from "./useGameState"
export type { Tile, Player, GameConfig, ServerPlayer, GameStatus, UseGameStateReturn } from "./useGameState"

export { useTurnManagement } from "./useTurnManagement"
export type { TurnPhase, UseTurnManagementProps, UseTurnManagementReturn } from "./useTurnManagement"

export { useSocketEvents } from "./useSocketEvents"
export type { UseSocketEventsProps, UseSocketEventsReturn, GameConfig as SocketGameConfig } from "./useSocketEvents"

export { useRuleManagement } from "./useRuleManagement"
export type { UseRuleManagementProps, UseRuleManagementReturn } from "./useRuleManagement"

export { useTileManagement } from "./useTileManagement"
export type { UseTileManagementProps, UseTileManagementReturn } from "./useTileManagement"

// Re-export existing hooks
export { useGameControls } from "./useGameControls"
export { useBotAI } from "./useBotAI"

// Tutorial preferences
export { useTutorialPreferences } from "./use-tutorial-preferences"
export type { TutorialPreferences, UseTutorialPreferencesReturn } from "./use-tutorial-preferences"
