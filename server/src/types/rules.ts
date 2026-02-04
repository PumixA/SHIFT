// ================================
// TRIGGER TYPES
// ================================

export enum TriggerType {
  // --- Mouvement (existing) ---
  ON_MOVE_START = 'ON_MOVE_START',
  ON_PASS_OVER = 'ON_PASS_OVER',
  ON_LAND = 'ON_LAND',
  ON_BACKWARD_MOVE = 'ON_BACKWARD_MOVE',
  ON_TELEPORT = 'ON_TELEPORT',

  // --- Tour (existing) ---
  ON_TURN_START = 'ON_TURN_START',
  ON_TURN_END = 'ON_TURN_END',
  ON_DICE_ROLL = 'ON_DICE_ROLL',

  // --- Interaction (existing) ---
  ON_PLAYER_BYPASS = 'ON_PLAYER_BYPASS',
  ON_SAME_TILE = 'ON_SAME_TILE',

  // --- Score (new) ---
  ON_SCORE_THRESHOLD = 'ON_SCORE_THRESHOLD',  // When score reaches X
  ON_SCORE_CHANGE = 'ON_SCORE_CHANGE',        // When score changes

  // --- Position (new) ---
  ON_REACH_POSITION = 'ON_REACH_POSITION',    // When reaching specific position
  ON_HALF_BOARD = 'ON_HALF_BOARD',            // When reaching half of the board
  ON_NEAR_VICTORY = 'ON_NEAR_VICTORY',        // When close to winning (e.g., 3 tiles away)
  ON_REACH_END = 'ON_REACH_END',              // When reaching the end tile (for victory)

  // --- Interaction (new) ---
  ON_OVERTAKE = 'ON_OVERTAKE',                // When overtaking another player
  ON_GET_OVERTAKEN = 'ON_GET_OVERTAKEN',      // When being overtaken

  // --- Game Flow (new) ---
  ON_GAME_START = 'ON_GAME_START',            // When game starts
  ON_FIRST_MOVE = 'ON_FIRST_MOVE',            // First move of a player
  ON_CONSECUTIVE_SIX = 'ON_CONSECUTIVE_SIX',  // Rolling 6 multiple times
  ON_AFTER_TURN = 'ON_AFTER_TURN',            // After a player's turn (for rule modification)

  // --- Effects (new) ---
  ON_EFFECT_APPLIED = 'ON_EFFECT_APPLIED',    // When an effect is applied
  ON_EFFECT_EXPIRED = 'ON_EFFECT_EXPIRED',    // When an effect expires
}

// ================================
// ACTION TYPES
// ================================

export enum ActionType {
  // --- Mouvement (existing) ---
  MOVE_RELATIVE = 'MOVE_RELATIVE',
  TELEPORT = 'TELEPORT',
  SWAP_POSITIONS = 'SWAP_POSITIONS',
  BACK_TO_START = 'BACK_TO_START',
  MOVE_TO_TILE = 'MOVE_TO_TILE',

  // --- Flux (existing) ---
  SKIP_TURN = 'SKIP_TURN',
  EXTRA_TURN = 'EXTRA_TURN',

  // --- Stats (existing) ---
  MODIFY_SCORE = 'MODIFY_SCORE',
  MODIFY_STAT = 'MODIFY_STAT',

  // --- Power-ups (new) ---
  APPLY_DOUBLE_DICE = 'APPLY_DOUBLE_DICE',        // Double dice value for N turns
  APPLY_SHIELD = 'APPLY_SHIELD',                   // Immune to negative effects for N turns
  APPLY_STEAL_POINTS = 'APPLY_STEAL_POINTS',       // Steal X points from target
  APPLY_SPEED_BOOST = 'APPLY_SPEED_BOOST',         // +X to all movements for N turns
  APPLY_SLOW = 'APPLY_SLOW',                       // -X to all movements for N turns
  APPLY_INVISIBILITY = 'APPLY_INVISIBILITY',       // Can't be targeted for N turns

  // --- Movement Advanced (new) ---
  MOVE_TO_NEAREST_PLAYER = 'MOVE_TO_NEAREST_PLAYER',
  MOVE_TO_FURTHEST_PLAYER = 'MOVE_TO_FURTHEST_PLAYER',
  MOVE_RANDOM = 'MOVE_RANDOM',                     // Random teleport

  // --- Dice Manipulation (new) ---
  SET_DICE_MIN = 'SET_DICE_MIN',                   // Minimum dice value for N turns
  SET_DICE_MAX = 'SET_DICE_MAX',                   // Maximum dice value for N turns
  REROLL_DICE = 'REROLL_DICE',                     // Force reroll

  // --- Meta (new) ---
  COPY_LAST_EFFECT = 'COPY_LAST_EFFECT',           // Copy the last effect applied
  REVERSE_LAST_EFFECT = 'REVERSE_LAST_EFFECT',     // Reverse the last effect

  // --- Victory (new) ---
  DECLARE_VICTORY = 'DECLARE_VICTORY',             // Declare the player as winner

  // --- Rule/Tile Modification (new) ---
  ALLOW_RULE_MODIFICATION = 'ALLOW_RULE_MODIFICATION',   // Allow adding/modifying rules
  ALLOW_TILE_MODIFICATION = 'ALLOW_TILE_MODIFICATION',   // Allow adding/removing tiles
}

// ================================
// CONDITION SYSTEM
// ================================

export enum ConditionType {
  SCORE_CHECK = 'SCORE_CHECK',
  POSITION_CHECK = 'POSITION_CHECK',
  EFFECT_ACTIVE = 'EFFECT_ACTIVE',
  DICE_VALUE = 'DICE_VALUE',
  TURN_COUNT = 'TURN_COUNT',
  PLAYER_COUNT = 'PLAYER_COUNT',
  HAS_POWER_UP = 'HAS_POWER_UP',
  PLAYER_RANK = 'PLAYER_RANK',         // Position in leaderboard
  TILES_FROM_END = 'TILES_FROM_END',   // Distance from victory
}

export type ConditionOperator = 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'neq';
export type ConditionTarget = 'self' | 'any' | 'all' | 'leader' | 'last' | 'others';

export interface RuleCondition {
  type: ConditionType;
  operator: ConditionOperator;
  value: number | string;
  target?: ConditionTarget;
}

// ================================
// EFFECTS SYSTEM
// ================================

export interface RuleEffect {
  type: ActionType | string;
  value: number | string;
  target: 'self' | 'all' | 'others' | 'random' | 'leader' | 'last';
  duration?: number;  // For temporary effects, number of turns
}

export interface TemporaryEffect {
  id: string;
  type: ActionType;
  value: number;
  turnsRemaining: number;
  source: string;         // Rule ID that created this effect
  appliedAt: Date;
  appliedBy?: string;     // Player ID who caused this effect
}

// ================================
// RULE INTERFACE
// ================================

export interface Rule {
  id: string;
  title?: string;
  description?: string;
  trigger: TriggerType;
  tileIndex?: number;
  conditions?: RuleCondition[];
  effects: RuleEffect[];
  priority: number;
  isActive?: boolean;
  createdBy?: string;
  tags?: string[];
}

// ================================
// RULE TEMPLATE (for library)
// ================================

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: 'movement' | 'score' | 'power-up' | 'interaction' | 'dice' | 'meta';
  trigger: TriggerType;
  triggerValue?: number | string;
  conditions: RuleCondition[];
  effects: RuleEffect[];
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

// ================================
// RULE PACK
// ================================

export interface RulePackDefinition {
  id: string;
  name: string;
  description: string;
  rules: Rule[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  playerCount: { min: number; max: number };
  estimatedDuration: string;
  tags: string[];
  isDefault?: boolean;
}
