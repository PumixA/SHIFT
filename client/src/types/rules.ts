// ================================
// TRIGGER TYPES
// ================================

export enum TriggerType {
    // --- Mouvement ---
    ON_MOVE_START = "ON_MOVE_START",
    ON_PASS_OVER = "ON_PASS_OVER",
    ON_LAND = "ON_LAND",
    ON_BACKWARD_MOVE = "ON_BACKWARD_MOVE",
    ON_TELEPORT = "ON_TELEPORT",

    // --- Tour ---
    ON_TURN_START = "ON_TURN_START",
    ON_TURN_END = "ON_TURN_END",
    ON_DICE_ROLL = "ON_DICE_ROLL",

    // --- Interaction ---
    ON_PLAYER_BYPASS = "ON_PLAYER_BYPASS",
    ON_SAME_TILE = "ON_SAME_TILE",

    // --- Score ---
    ON_SCORE_THRESHOLD = "ON_SCORE_THRESHOLD",
    ON_SCORE_CHANGE = "ON_SCORE_CHANGE",

    // --- Position ---
    ON_REACH_POSITION = "ON_REACH_POSITION",
    ON_HALF_BOARD = "ON_HALF_BOARD",
    ON_NEAR_VICTORY = "ON_NEAR_VICTORY",

    // --- Interaction avancée ---
    ON_OVERTAKE = "ON_OVERTAKE",
    ON_GET_OVERTAKEN = "ON_GET_OVERTAKEN",

    // --- Flux de jeu ---
    ON_GAME_START = "ON_GAME_START",
    ON_FIRST_MOVE = "ON_FIRST_MOVE",
    ON_CONSECUTIVE_SIX = "ON_CONSECUTIVE_SIX",

    // --- Effets ---
    ON_EFFECT_APPLIED = "ON_EFFECT_APPLIED",
    ON_EFFECT_EXPIRED = "ON_EFFECT_EXPIRED",

    // --- Victoire et modification ---
    ON_REACH_END = "ON_REACH_END",
    ON_AFTER_TURN = "ON_AFTER_TURN",
}

// ================================
// ACTION TYPES
// ================================

export enum ActionType {
    // --- Mouvement ---
    MOVE_RELATIVE = "MOVE_RELATIVE",
    TELEPORT = "TELEPORT",
    SWAP_POSITIONS = "SWAP_POSITIONS",
    BACK_TO_START = "BACK_TO_START",
    MOVE_TO_TILE = "MOVE_TO_TILE",

    // --- Flux ---
    SKIP_TURN = "SKIP_TURN",
    EXTRA_TURN = "EXTRA_TURN",

    // --- Stats ---
    MODIFY_SCORE = "MODIFY_SCORE",
    MODIFY_STAT = "MODIFY_STAT",

    // --- Power-ups ---
    APPLY_DOUBLE_DICE = "APPLY_DOUBLE_DICE",
    APPLY_SHIELD = "APPLY_SHIELD",
    APPLY_STEAL_POINTS = "APPLY_STEAL_POINTS",
    APPLY_SPEED_BOOST = "APPLY_SPEED_BOOST",
    APPLY_SLOW = "APPLY_SLOW",
    APPLY_INVISIBILITY = "APPLY_INVISIBILITY",

    // --- Mouvement avancé ---
    MOVE_TO_NEAREST_PLAYER = "MOVE_TO_NEAREST_PLAYER",
    MOVE_TO_FURTHEST_PLAYER = "MOVE_TO_FURTHEST_PLAYER",
    MOVE_RANDOM = "MOVE_RANDOM",

    // --- Manipulation dé ---
    SET_DICE_MIN = "SET_DICE_MIN",
    SET_DICE_MAX = "SET_DICE_MAX",
    REROLL_DICE = "REROLL_DICE",

    // --- Meta ---
    COPY_LAST_EFFECT = "COPY_LAST_EFFECT",
    REVERSE_LAST_EFFECT = "REVERSE_LAST_EFFECT",

    // --- Victoire et modification ---
    DECLARE_VICTORY = "DECLARE_VICTORY",
    ALLOW_RULE_MODIFICATION = "ALLOW_RULE_MODIFICATION",
    ALLOW_TILE_MODIFICATION = "ALLOW_TILE_MODIFICATION",
}

// ================================
// CONDITION SYSTEM
// ================================

export enum ConditionType {
    SCORE_CHECK = "SCORE_CHECK",
    POSITION_CHECK = "POSITION_CHECK",
    EFFECT_ACTIVE = "EFFECT_ACTIVE",
    DICE_VALUE = "DICE_VALUE",
    TURN_COUNT = "TURN_COUNT",
    PLAYER_COUNT = "PLAYER_COUNT",
    HAS_POWER_UP = "HAS_POWER_UP",
    PLAYER_RANK = "PLAYER_RANK",
    TILES_FROM_END = "TILES_FROM_END",
}

export type ConditionOperator = "eq" | "gt" | "lt" | "gte" | "lte" | "neq"
export type ConditionTarget = "self" | "any" | "all" | "leader" | "last" | "others"

export interface RuleCondition {
    type: ConditionType
    operator: ConditionOperator
    value: number | string
    target?: ConditionTarget
}

// ================================
// EFFECTS SYSTEM
// ================================

export interface RuleEffect {
    type: ActionType | string
    value: number | string
    target: "self" | "all" | "others" | "random" | "leader" | "last"
    duration?: number
}

export interface TemporaryEffect {
    id: string
    type: ActionType
    value: number
    turnsRemaining: number
    source: string
    appliedAt: Date
    appliedBy?: string
}

// ================================
// RULE INTERFACE
// ================================

export interface Rule {
    id: string
    title: string
    description?: string
    trigger: {
        type: TriggerType
        value?: number | string
    }
    conditions: RuleCondition[]
    effects: RuleEffect[]
    priority?: number
    isActive?: boolean
    tags?: string[]
}

// ================================
// RULE TEMPLATE
// ================================

export interface RuleTemplate {
    id: string
    name: string
    description: string
    category: "movement" | "score" | "power-up" | "interaction" | "dice" | "meta"
    trigger: TriggerType
    triggerValue?: number | string
    conditions: RuleCondition[]
    effects: RuleEffect[]
    difficulty: "easy" | "medium" | "hard"
    tags: string[]
}

// ================================
// RULE PACK
// ================================

export interface RulePack {
    packId: string
    name: string
    description: string
    rules: Rule[]
    rulesCount?: number
    difficulty?: "easy" | "medium" | "hard" | "expert"
    usageCount?: number
    tags?: string[]
    isDefault?: boolean
}

// ================================
// TRIGGER INFO (for UI)
// ================================

export interface TriggerInfo {
    type: TriggerType
    name: string
    description: string
    needsValue: boolean
    valueType?: "tile" | "dice" | "score" | "turns"
    category: "movement" | "turn" | "interaction" | "score" | "position" | "flow" | "effect"
}

export interface ActionInfo {
    type: ActionType
    name: string
    description: string
    valueType: "number" | "tile" | "turns" | "points"
    supportsNegative: boolean
    supportsDuration: boolean
    category: "movement" | "turn" | "score" | "power-up" | "dice" | "meta"
}

// Trigger metadata for UI
export const TRIGGER_INFO: Record<TriggerType, TriggerInfo> = {
    [TriggerType.ON_MOVE_START]: {
        type: TriggerType.ON_MOVE_START,
        name: "Début de mouvement",
        description: "Se déclenche au début du mouvement",
        needsValue: false,
        category: "movement",
    },
    [TriggerType.ON_PASS_OVER]: {
        type: TriggerType.ON_PASS_OVER,
        name: "Passage sur case",
        description: "Se déclenche en passant sur une case",
        needsValue: true,
        valueType: "tile",
        category: "movement",
    },
    [TriggerType.ON_LAND]: {
        type: TriggerType.ON_LAND,
        name: "Atterrissage",
        description: "Se déclenche en atterrissant sur une case",
        needsValue: true,
        valueType: "tile",
        category: "movement",
    },
    [TriggerType.ON_BACKWARD_MOVE]: {
        type: TriggerType.ON_BACKWARD_MOVE,
        name: "Recul",
        description: "Se déclenche lors d'un mouvement arrière",
        needsValue: false,
        category: "movement",
    },
    [TriggerType.ON_TELEPORT]: {
        type: TriggerType.ON_TELEPORT,
        name: "Téléportation",
        description: "Se déclenche lors d'une téléportation",
        needsValue: false,
        category: "movement",
    },
    [TriggerType.ON_TURN_START]: {
        type: TriggerType.ON_TURN_START,
        name: "Début de tour",
        description: "Se déclenche au début de chaque tour",
        needsValue: false,
        category: "turn",
    },
    [TriggerType.ON_TURN_END]: {
        type: TriggerType.ON_TURN_END,
        name: "Fin de tour",
        description: "Se déclenche à la fin de chaque tour",
        needsValue: false,
        category: "turn",
    },
    [TriggerType.ON_DICE_ROLL]: {
        type: TriggerType.ON_DICE_ROLL,
        name: "Lancer de dé",
        description: "Se déclenche sur un résultat de dé spécifique",
        needsValue: true,
        valueType: "dice",
        category: "turn",
    },
    [TriggerType.ON_PLAYER_BYPASS]: {
        type: TriggerType.ON_PLAYER_BYPASS,
        name: "Dépassement",
        description: "Se déclenche en dépassant un joueur",
        needsValue: false,
        category: "interaction",
    },
    [TriggerType.ON_SAME_TILE]: {
        type: TriggerType.ON_SAME_TILE,
        name: "Même case",
        description: "Se déclenche sur la même case qu'un autre joueur",
        needsValue: false,
        category: "interaction",
    },
    [TriggerType.ON_SCORE_THRESHOLD]: {
        type: TriggerType.ON_SCORE_THRESHOLD,
        name: "Seuil de score",
        description: "Se déclenche quand le score atteint X",
        needsValue: true,
        valueType: "score",
        category: "score",
    },
    [TriggerType.ON_SCORE_CHANGE]: {
        type: TriggerType.ON_SCORE_CHANGE,
        name: "Changement de score",
        description: "Se déclenche quand le score change",
        needsValue: false,
        category: "score",
    },
    [TriggerType.ON_REACH_POSITION]: {
        type: TriggerType.ON_REACH_POSITION,
        name: "Atteindre position",
        description: "Se déclenche en atteignant une position",
        needsValue: true,
        valueType: "tile",
        category: "position",
    },
    [TriggerType.ON_HALF_BOARD]: {
        type: TriggerType.ON_HALF_BOARD,
        name: "Mi-parcours",
        description: "Se déclenche à la moitié du plateau",
        needsValue: false,
        category: "position",
    },
    [TriggerType.ON_NEAR_VICTORY]: {
        type: TriggerType.ON_NEAR_VICTORY,
        name: "Proche de la victoire",
        description: "Se déclenche près de la ligne d'arrivée",
        needsValue: true,
        valueType: "tile",
        category: "position",
    },
    [TriggerType.ON_OVERTAKE]: {
        type: TriggerType.ON_OVERTAKE,
        name: "Dépasser",
        description: "Se déclenche en dépassant un joueur",
        needsValue: false,
        category: "interaction",
    },
    [TriggerType.ON_GET_OVERTAKEN]: {
        type: TriggerType.ON_GET_OVERTAKEN,
        name: "Être dépassé",
        description: "Se déclenche en étant dépassé",
        needsValue: false,
        category: "interaction",
    },
    [TriggerType.ON_GAME_START]: {
        type: TriggerType.ON_GAME_START,
        name: "Début de partie",
        description: "Se déclenche au début de la partie",
        needsValue: false,
        category: "flow",
    },
    [TriggerType.ON_FIRST_MOVE]: {
        type: TriggerType.ON_FIRST_MOVE,
        name: "Premier mouvement",
        description: "Se déclenche au premier mouvement d'un joueur",
        needsValue: false,
        category: "flow",
    },
    [TriggerType.ON_CONSECUTIVE_SIX]: {
        type: TriggerType.ON_CONSECUTIVE_SIX,
        name: "Double 6",
        description: "Se déclenche sur plusieurs 6 consécutifs",
        needsValue: true,
        valueType: "dice",
        category: "flow",
    },
    [TriggerType.ON_EFFECT_APPLIED]: {
        type: TriggerType.ON_EFFECT_APPLIED,
        name: "Effet appliqué",
        description: "Se déclenche quand un effet est appliqué",
        needsValue: false,
        category: "effect",
    },
    [TriggerType.ON_EFFECT_EXPIRED]: {
        type: TriggerType.ON_EFFECT_EXPIRED,
        name: "Effet expiré",
        description: "Se déclenche quand un effet expire",
        needsValue: false,
        category: "effect",
    },
    [TriggerType.ON_REACH_END]: {
        type: TriggerType.ON_REACH_END,
        name: "Arrivée finale",
        description: "Se déclenche en atteignant la case finale",
        needsValue: false,
        category: "position",
    },
    [TriggerType.ON_AFTER_TURN]: {
        type: TriggerType.ON_AFTER_TURN,
        name: "Après le tour",
        description: "Se déclenche après avoir joué",
        needsValue: false,
        category: "turn",
    },
}

// Action metadata for UI
export const ACTION_INFO: Record<ActionType, ActionInfo> = {
    [ActionType.MOVE_RELATIVE]: {
        type: ActionType.MOVE_RELATIVE,
        name: "Déplacement relatif",
        description: "Avancer ou reculer de X cases",
        valueType: "number",
        supportsNegative: true,
        supportsDuration: false,
        category: "movement",
    },
    [ActionType.TELEPORT]: {
        type: ActionType.TELEPORT,
        name: "Téléportation",
        description: "Aller directement à une case",
        valueType: "tile",
        supportsNegative: false,
        supportsDuration: false,
        category: "movement",
    },
    [ActionType.SWAP_POSITIONS]: {
        type: ActionType.SWAP_POSITIONS,
        name: "Échange de positions",
        description: "Échanger sa position avec un autre joueur",
        valueType: "number",
        supportsNegative: false,
        supportsDuration: false,
        category: "movement",
    },
    [ActionType.BACK_TO_START]: {
        type: ActionType.BACK_TO_START,
        name: "Retour au départ",
        description: "Retourner à la case départ",
        valueType: "number",
        supportsNegative: false,
        supportsDuration: false,
        category: "movement",
    },
    [ActionType.MOVE_TO_TILE]: {
        type: ActionType.MOVE_TO_TILE,
        name: "Aller à la case",
        description: "Aller à une case spécifique",
        valueType: "tile",
        supportsNegative: false,
        supportsDuration: false,
        category: "movement",
    },
    [ActionType.SKIP_TURN]: {
        type: ActionType.SKIP_TURN,
        name: "Passer le tour",
        description: "Passer le prochain tour",
        valueType: "turns",
        supportsNegative: false,
        supportsDuration: false,
        category: "turn",
    },
    [ActionType.EXTRA_TURN]: {
        type: ActionType.EXTRA_TURN,
        name: "Tour supplémentaire",
        description: "Gagner un tour supplémentaire",
        valueType: "turns",
        supportsNegative: false,
        supportsDuration: false,
        category: "turn",
    },
    [ActionType.MODIFY_SCORE]: {
        type: ActionType.MODIFY_SCORE,
        name: "Modifier le score",
        description: "Gagner ou perdre des points",
        valueType: "points",
        supportsNegative: true,
        supportsDuration: false,
        category: "score",
    },
    [ActionType.MODIFY_STAT]: {
        type: ActionType.MODIFY_STAT,
        name: "Modifier statistique",
        description: "Modifier une statistique",
        valueType: "number",
        supportsNegative: true,
        supportsDuration: false,
        category: "score",
    },
    [ActionType.APPLY_DOUBLE_DICE]: {
        type: ActionType.APPLY_DOUBLE_DICE,
        name: "Double dé",
        description: "Doubler le résultat du dé",
        valueType: "turns",
        supportsNegative: false,
        supportsDuration: true,
        category: "power-up",
    },
    [ActionType.APPLY_SHIELD]: {
        type: ActionType.APPLY_SHIELD,
        name: "Bouclier",
        description: "Protection contre les effets négatifs",
        valueType: "turns",
        supportsNegative: false,
        supportsDuration: true,
        category: "power-up",
    },
    [ActionType.APPLY_STEAL_POINTS]: {
        type: ActionType.APPLY_STEAL_POINTS,
        name: "Vol de points",
        description: "Voler des points à un autre joueur",
        valueType: "points",
        supportsNegative: false,
        supportsDuration: false,
        category: "power-up",
    },
    [ActionType.APPLY_SPEED_BOOST]: {
        type: ActionType.APPLY_SPEED_BOOST,
        name: "Boost de vitesse",
        description: "Bonus de mouvement",
        valueType: "turns",
        supportsNegative: false,
        supportsDuration: true,
        category: "power-up",
    },
    [ActionType.APPLY_SLOW]: {
        type: ActionType.APPLY_SLOW,
        name: "Ralentissement",
        description: "Malus de mouvement",
        valueType: "turns",
        supportsNegative: false,
        supportsDuration: true,
        category: "power-up",
    },
    [ActionType.APPLY_INVISIBILITY]: {
        type: ActionType.APPLY_INVISIBILITY,
        name: "Invisibilité",
        description: "Ne peut pas être ciblé",
        valueType: "turns",
        supportsNegative: false,
        supportsDuration: true,
        category: "power-up",
    },
    [ActionType.MOVE_TO_NEAREST_PLAYER]: {
        type: ActionType.MOVE_TO_NEAREST_PLAYER,
        name: "Vers joueur proche",
        description: "Aller vers le joueur le plus proche",
        valueType: "number",
        supportsNegative: false,
        supportsDuration: false,
        category: "movement",
    },
    [ActionType.MOVE_TO_FURTHEST_PLAYER]: {
        type: ActionType.MOVE_TO_FURTHEST_PLAYER,
        name: "Vers joueur lointain",
        description: "Aller vers le joueur le plus éloigné",
        valueType: "number",
        supportsNegative: false,
        supportsDuration: false,
        category: "movement",
    },
    [ActionType.MOVE_RANDOM]: {
        type: ActionType.MOVE_RANDOM,
        name: "Téléport aléatoire",
        description: "Téléportation vers une case aléatoire",
        valueType: "number",
        supportsNegative: false,
        supportsDuration: false,
        category: "movement",
    },
    [ActionType.SET_DICE_MIN]: {
        type: ActionType.SET_DICE_MIN,
        name: "Dé minimum",
        description: "Définir le minimum du dé",
        valueType: "number",
        supportsNegative: false,
        supportsDuration: true,
        category: "dice",
    },
    [ActionType.SET_DICE_MAX]: {
        type: ActionType.SET_DICE_MAX,
        name: "Dé maximum",
        description: "Définir le maximum du dé",
        valueType: "number",
        supportsNegative: false,
        supportsDuration: true,
        category: "dice",
    },
    [ActionType.REROLL_DICE]: {
        type: ActionType.REROLL_DICE,
        name: "Relancer le dé",
        description: "Forcer une relance du dé",
        valueType: "number",
        supportsNegative: false,
        supportsDuration: false,
        category: "dice",
    },
    [ActionType.COPY_LAST_EFFECT]: {
        type: ActionType.COPY_LAST_EFFECT,
        name: "Copier dernier effet",
        description: "Copier le dernier effet appliqué",
        valueType: "number",
        supportsNegative: false,
        supportsDuration: false,
        category: "meta",
    },
    [ActionType.REVERSE_LAST_EFFECT]: {
        type: ActionType.REVERSE_LAST_EFFECT,
        name: "Inverser dernier effet",
        description: "Inverser le dernier effet",
        valueType: "number",
        supportsNegative: false,
        supportsDuration: false,
        category: "meta",
    },
    [ActionType.DECLARE_VICTORY]: {
        type: ActionType.DECLARE_VICTORY,
        name: "Déclarer victoire",
        description: "Le joueur gagne la partie",
        valueType: "number",
        supportsNegative: false,
        supportsDuration: false,
        category: "meta",
    },
    [ActionType.ALLOW_RULE_MODIFICATION]: {
        type: ActionType.ALLOW_RULE_MODIFICATION,
        name: "Autoriser modification règle",
        description: "Permet de modifier les règles",
        valueType: "number",
        supportsNegative: false,
        supportsDuration: false,
        category: "meta",
    },
    [ActionType.ALLOW_TILE_MODIFICATION]: {
        type: ActionType.ALLOW_TILE_MODIFICATION,
        name: "Autoriser modification case",
        description: "Permet de modifier les cases",
        valueType: "number",
        supportsNegative: false,
        supportsDuration: false,
        category: "meta",
    },
}
