import { Rule, TemporaryEffect } from "./rules"

export interface TilePosition {
  x: number
  y: number
}

export type TileDirection = "up" | "down" | "left" | "right"

export interface Tile {
  id: string
  type: "start" | "end" | "special" | "normal"
  index: number
  position: TilePosition // 2D position for multi-directional board
  connections: string[] // IDs of connected tiles
  directions: TileDirection[] // Directions this tile connects to (default: ['right'])
  isEndTile?: boolean // Can be an end tile for victory
}

export interface Player {
  id: string
  name?: string
  color: "cyan" | "violet" | "orange" | "green"
  position: number
  tileId?: string // Current tile ID (for non-linear boards)
  score: number
  effects?: TemporaryEffect[] // Active temporary effects
  userId?: string // Link to User if authenticated
  avatarUrl?: string
  avatarPreset?: string
  isConnected?: boolean
  isHost?: boolean // Is this player the room host
  skipNextTurn?: boolean
  extraTurns?: number
  // Turn state
  hasPlayedThisTurn?: boolean // Has rolled dice this turn
  hasModifiedThisTurn?: boolean // Has added rule or modified tile this turn
}

export type GameStatus = "waiting" | "playing" | "paused" | "finished"

export interface GameState {
  roomId: string
  roomName?: string
  tiles: Tile[]
  players: Player[]
  currentTurn: string
  status: GameStatus
  winnerId: string | null
  activeRules: Rule[]
  coreRules: Rule[] // Non-deletable rules (can only be modified)
  turnCount?: number
  startedAt?: Date
  endedAt?: Date
  duration?: number
  rulePackId?: string
  maxPlayers?: number // Maximum players allowed (2-4)
  password?: string // Room password (optional)
  lastEffect?: {
    type: string
    value: number
    playerId: string
    ruleId: string
  }
  // Board configuration
  boardConfig: {
    minTiles: number // Minimum number of tiles
    maxTiles: number // Maximum number of tiles
    allowTileModification: boolean // Can players add/remove tiles
    allowRuleModification: boolean // Can players add/modify rules
    modificationsPerTurn: number // Max modifications per turn (rule or tile)
  }
}

export interface RuleLog {
  ruleId: string
  message: string
  timestamp?: Date
}

export interface RuleResult {
  state: GameState
  logs: string[]
}

// ================================
// CHAT SYSTEM
// ================================

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  content: string
  type: "text" | "emoji" | "system"
  createdAt: Date
}

export interface EmojiReaction {
  emoji: string
  senderId: string
  senderName: string
  timestamp: Date
}

// ================================
// ACTION HISTORY
// ================================

export interface GameAction {
  id: string
  type:
    | "dice_roll"
    | "move"
    | "rule_triggered"
    | "effect_applied"
    | "effect_expired"
    | "power_up"
    | "chat"
    | "join"
    | "leave"
    | "rule_added"
    | "rule_modified"
    | "rule_deleted"
    | "tile_added"
    | "tile_removed"
    | "tile_direction_changed"
    | "victory"
  playerId: string
  playerName?: string
  description: string
  details?: Record<string, any>
  timestamp: Date
}

// ================================
// TILE MANIPULATION
// ================================

export interface TileModification {
  type: "add" | "remove"
  tileId?: string // For removal
  position?: TilePosition // For addition
  connectedTo?: string[] // IDs of tiles to connect to
  tileType?: "normal" | "special" | "end"
}

export interface RuleModification {
  type: "add" | "modify" | "delete"
  ruleId?: string // For modify/delete
  rule?: Rule // For add/modify
}

// ================================
// SAVED GAME
// ================================

export interface SavedGameData {
  id: string
  userId: string
  roomId: string
  roomName?: string
  gameState: GameState
  lastActivity: Date
  createdAt: Date
}

// ================================
// GAME HISTORY
// ================================

export interface GameHistoryEntry {
  id: string
  userId: string
  roomId: string
  roomName?: string
  players: {
    id: string
    name: string
    score: number
    position: number
  }[]
  winner: string
  isWinner: boolean
  playerScore: number
  turnCount: number
  duration: number
  rulePackUsed?: string
  playedAt: Date
}

// ================================
// DICE CONTEXT
// ================================

export interface DiceContext {
  value: number
  originalValue: number
  modifiers: {
    type: string
    value: number
    source: string
  }[]
  isDouble?: boolean
  rerollCount?: number
}

// ================================
// GAME CONFIG
// ================================

export interface GameConfig {
  boardSize: number
  maxPlayers: number
  victoryTile: number
  allowRuleEdit: boolean
  turnTimeLimit?: number // In seconds, optional
  powerUpsEnabled: boolean
  chatEnabled: boolean
}
