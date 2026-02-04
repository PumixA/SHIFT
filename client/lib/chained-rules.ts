/**
 * Chained Conditional Rules System for SHIFT
 * Supports complex rule chains: If A then B, else C
 */

import { Rule, TriggerType, ActionType } from "@/src/types/rules"

// Condition types for chained rules
export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'not_contains'

export interface RuleCondition {
  id: string
  type: ConditionType
  operator: ConditionOperator
  value: number | string | boolean
  target?: ConditionTarget
}

export type ConditionType =
  | 'SCORE_CHECK'
  | 'POSITION_CHECK'
  | 'DICE_VALUE'
  | 'TURN_COUNT'
  | 'PLAYER_COUNT'
  | 'EFFECT_ACTIVE'
  | 'HAS_POWER_UP'
  | 'TILE_TYPE'
  | 'CONSECUTIVE_ROLLS'
  | 'DISTANCE_TO_END'
  | 'DISTANCE_TO_PLAYER'
  | 'IS_LEADING'
  | 'IS_LAST'

export type ConditionTarget = 'self' | 'any_player' | 'all_players' | 'leader' | 'last_player' | 'nearest_player'

// Chained rule action
export interface ChainedAction {
  id: string
  type: ActionType
  value?: number
  targetPlayer?: ConditionTarget
  duration?: number
  metadata?: Record<string, any>
}

// Complete chained rule structure
export interface ChainedRule {
  id: string
  name: string
  description: string
  enabled: boolean
  priority: number

  // Trigger
  trigger: TriggerType
  triggerTileId?: string

  // Condition chain
  conditions: RuleCondition[]
  conditionLogic: 'AND' | 'OR'

  // If conditions are met
  thenActions: ChainedAction[]

  // If conditions are NOT met (optional)
  elseActions?: ChainedAction[]

  // Chain to another rule (optional)
  chainToRuleId?: string
  chainCondition?: 'always' | 'on_success' | 'on_failure'

  // Metadata
  createdBy?: string
  createdAt?: string
  usageCount?: number
}

// Condition evaluation context
export interface EvaluationContext {
  currentPlayerId: string
  currentPlayerScore: number
  currentPlayerPosition: number
  diceValue?: number
  turnNumber: number
  players: Array<{
    id: string
    name: string
    score: number
    position: number
    effects: string[]
  }>
  tiles: Array<{
    id: string
    x: number
    y: number
    type: string
  }>
  consecutiveRolls?: Record<number, number> // diceValue -> count
}

/**
 * Evaluate a single condition
 */
export function evaluateCondition(
  condition: RuleCondition,
  context: EvaluationContext
): boolean {
  const { operator, value, target } = condition

  // Get the value to compare based on condition type
  let compareValue: number | string | boolean

  switch (condition.type) {
    case 'SCORE_CHECK':
      compareValue = getTargetScore(target || 'self', context)
      break

    case 'POSITION_CHECK':
      compareValue = getTargetPosition(target || 'self', context)
      break

    case 'DICE_VALUE':
      compareValue = context.diceValue || 0
      break

    case 'TURN_COUNT':
      compareValue = context.turnNumber
      break

    case 'PLAYER_COUNT':
      compareValue = context.players.length
      break

    case 'EFFECT_ACTIVE':
      const player = getTargetPlayer(target || 'self', context)
      compareValue = player?.effects.includes(value as string) || false
      break

    case 'HAS_POWER_UP':
      const p = getTargetPlayer(target || 'self', context)
      compareValue = p?.effects.some(e => e.startsWith('power_')) || false
      break

    case 'TILE_TYPE':
      const currentTile = context.tiles.find(t =>
        t.x === getTargetPosition(target || 'self', context)
      )
      compareValue = currentTile?.type || 'normal'
      break

    case 'CONSECUTIVE_ROLLS':
      const diceVal = context.diceValue || 0
      compareValue = context.consecutiveRolls?.[diceVal] || 0
      break

    case 'DISTANCE_TO_END':
      const maxPos = Math.max(...context.tiles.map(t => t.x))
      const playerPos = getTargetPosition(target || 'self', context)
      compareValue = maxPos - playerPos
      break

    case 'DISTANCE_TO_PLAYER':
      const selfPos = context.players.find(p => p.id === context.currentPlayerId)?.position || 0
      const nearestPos = getNearestPlayerPosition(context)
      compareValue = Math.abs(selfPos - nearestPos)
      break

    case 'IS_LEADING':
      compareValue = isPlayerLeading(context)
      break

    case 'IS_LAST':
      compareValue = isPlayerLast(context)
      break

    default:
      return false
  }

  // Compare values
  return compareValues(compareValue, operator, value)
}

/**
 * Compare two values with an operator
 */
function compareValues(
  a: number | string | boolean,
  operator: ConditionOperator,
  b: number | string | boolean
): boolean {
  switch (operator) {
    case 'eq':
      return a === b
    case 'neq':
      return a !== b
    case 'gt':
      return typeof a === 'number' && typeof b === 'number' && a > b
    case 'lt':
      return typeof a === 'number' && typeof b === 'number' && a < b
    case 'gte':
      return typeof a === 'number' && typeof b === 'number' && a >= b
    case 'lte':
      return typeof a === 'number' && typeof b === 'number' && a <= b
    case 'contains':
      return typeof a === 'string' && typeof b === 'string' && a.includes(b)
    case 'not_contains':
      return typeof a === 'string' && typeof b === 'string' && !a.includes(b)
    default:
      return false
  }
}

/**
 * Get target player from context
 */
function getTargetPlayer(target: ConditionTarget, context: EvaluationContext) {
  switch (target) {
    case 'self':
      return context.players.find(p => p.id === context.currentPlayerId)
    case 'leader':
      return context.players.reduce((a, b) => a.score > b.score ? a : b)
    case 'last_player':
      return context.players.reduce((a, b) => a.score < b.score ? a : b)
    case 'nearest_player':
      const selfPos = context.players.find(p => p.id === context.currentPlayerId)?.position || 0
      return context.players
        .filter(p => p.id !== context.currentPlayerId)
        .reduce((a, b) =>
          Math.abs(a.position - selfPos) < Math.abs(b.position - selfPos) ? a : b
        )
    default:
      return context.players.find(p => p.id === context.currentPlayerId)
  }
}

/**
 * Get target score
 */
function getTargetScore(target: ConditionTarget, context: EvaluationContext): number {
  const player = getTargetPlayer(target, context)
  return player?.score || 0
}

/**
 * Get target position
 */
function getTargetPosition(target: ConditionTarget, context: EvaluationContext): number {
  const player = getTargetPlayer(target, context)
  return player?.position || 0
}

/**
 * Get nearest player position
 */
function getNearestPlayerPosition(context: EvaluationContext): number {
  const selfPos = context.players.find(p => p.id === context.currentPlayerId)?.position || 0
  const others = context.players.filter(p => p.id !== context.currentPlayerId)
  if (others.length === 0) return selfPos
  return others.reduce((a, b) =>
    Math.abs(a.position - selfPos) < Math.abs(b.position - selfPos) ? a : b
  ).position
}

/**
 * Check if current player is leading
 */
function isPlayerLeading(context: EvaluationContext): boolean {
  const self = context.players.find(p => p.id === context.currentPlayerId)
  if (!self) return false
  return context.players.every(p => p.id === self.id || self.score >= p.score)
}

/**
 * Check if current player is last
 */
function isPlayerLast(context: EvaluationContext): boolean {
  const self = context.players.find(p => p.id === context.currentPlayerId)
  if (!self) return false
  return context.players.every(p => p.id === self.id || self.score <= p.score)
}

/**
 * Evaluate all conditions of a chained rule
 */
export function evaluateConditions(
  conditions: RuleCondition[],
  logic: 'AND' | 'OR',
  context: EvaluationContext
): boolean {
  if (conditions.length === 0) return true

  if (logic === 'AND') {
    return conditions.every(c => evaluateCondition(c, context))
  } else {
    return conditions.some(c => evaluateCondition(c, context))
  }
}

/**
 * Execute a chained rule and return the actions to perform
 */
export function executeChainedRule(
  rule: ChainedRule,
  context: EvaluationContext
): {
  actions: ChainedAction[]
  conditionsMet: boolean
  nextRuleId?: string
} {
  const conditionsMet = evaluateConditions(rule.conditions, rule.conditionLogic, context)

  const actions = conditionsMet ? rule.thenActions : (rule.elseActions || [])

  // Determine next rule in chain
  let nextRuleId: string | undefined
  if (rule.chainToRuleId) {
    if (rule.chainCondition === 'always') {
      nextRuleId = rule.chainToRuleId
    } else if (rule.chainCondition === 'on_success' && conditionsMet) {
      nextRuleId = rule.chainToRuleId
    } else if (rule.chainCondition === 'on_failure' && !conditionsMet) {
      nextRuleId = rule.chainToRuleId
    }
  }

  return { actions, conditionsMet, nextRuleId }
}

/**
 * Convert a simple Rule to a ChainedRule
 */
export function convertToChainedRule(rule: Rule): ChainedRule {
  const conditions: RuleCondition[] = []

  // Convert simple conditions to RuleCondition format
  if (rule.conditions) {
    rule.conditions.forEach((c, index) => {
      conditions.push({
        id: `cond-${index}`,
        type: c.type as ConditionType,
        operator: (c.operator as ConditionOperator) || 'eq',
        value: c.value,
        target: (c.target as ConditionTarget) || 'self',
      })
    })
  }

  return {
    id: rule.id,
    name: rule.name,
    description: rule.description || '',
    enabled: rule.enabled,
    priority: rule.priority || 0,
    trigger: rule.trigger,
    triggerTileId: rule.targetTileId,
    conditions,
    conditionLogic: 'AND',
    thenActions: [{
      id: `action-${rule.id}`,
      type: rule.action.type as ActionType,
      value: rule.action.value,
      targetPlayer: (rule.action.target as ConditionTarget) || 'self',
      duration: rule.action.duration,
    }],
  }
}

/**
 * Predefined condition templates for the UI
 */
export const CONDITION_TEMPLATES = [
  {
    id: 'score_above',
    name: 'Score supérieur à',
    type: 'SCORE_CHECK' as ConditionType,
    operator: 'gt' as ConditionOperator,
    defaultValue: 10,
    description: 'Le score du joueur est supérieur à X',
  },
  {
    id: 'score_below',
    name: 'Score inférieur à',
    type: 'SCORE_CHECK' as ConditionType,
    operator: 'lt' as ConditionOperator,
    defaultValue: 5,
    description: 'Le score du joueur est inférieur à X',
  },
  {
    id: 'dice_equals',
    name: 'Dé égal à',
    type: 'DICE_VALUE' as ConditionType,
    operator: 'eq' as ConditionOperator,
    defaultValue: 6,
    description: 'Le joueur a lancé un X',
  },
  {
    id: 'dice_above',
    name: 'Dé supérieur à',
    type: 'DICE_VALUE' as ConditionType,
    operator: 'gte' as ConditionOperator,
    defaultValue: 4,
    description: 'Le joueur a lancé au moins X',
  },
  {
    id: 'is_leading',
    name: 'Est en tête',
    type: 'IS_LEADING' as ConditionType,
    operator: 'eq' as ConditionOperator,
    defaultValue: true,
    description: 'Le joueur est actuellement en tête',
  },
  {
    id: 'is_last',
    name: 'Est dernier',
    type: 'IS_LAST' as ConditionType,
    operator: 'eq' as ConditionOperator,
    defaultValue: true,
    description: 'Le joueur est actuellement dernier',
  },
  {
    id: 'near_end',
    name: 'Proche de la fin',
    type: 'DISTANCE_TO_END' as ConditionType,
    operator: 'lte' as ConditionOperator,
    defaultValue: 3,
    description: 'Le joueur est à X cases ou moins de la fin',
  },
  {
    id: 'turn_above',
    name: 'Tour supérieur à',
    type: 'TURN_COUNT' as ConditionType,
    operator: 'gte' as ConditionOperator,
    defaultValue: 10,
    description: 'On est au tour X ou plus',
  },
  {
    id: 'has_shield',
    name: 'A un bouclier',
    type: 'EFFECT_ACTIVE' as ConditionType,
    operator: 'eq' as ConditionOperator,
    defaultValue: 'shield',
    description: 'Le joueur a un bouclier actif',
  },
  {
    id: 'consecutive_six',
    name: 'Double 6 consécutif',
    type: 'CONSECUTIVE_ROLLS' as ConditionType,
    operator: 'gte' as ConditionOperator,
    defaultValue: 2,
    description: 'Le joueur a fait X fois 6 de suite',
  },
]

/**
 * Predefined action templates for the UI
 */
export const ACTION_TEMPLATES = [
  {
    id: 'bonus_points',
    name: 'Bonus de points',
    type: ActionType.MODIFY_SCORE,
    defaultValue: 3,
    description: 'Ajoute X points au joueur',
  },
  {
    id: 'malus_points',
    name: 'Malus de points',
    type: ActionType.MODIFY_SCORE,
    defaultValue: -2,
    description: 'Retire X points au joueur',
  },
  {
    id: 'advance',
    name: 'Avancer',
    type: ActionType.MOVE_RELATIVE,
    defaultValue: 2,
    description: 'Avance de X cases',
  },
  {
    id: 'retreat',
    name: 'Reculer',
    type: ActionType.MOVE_RELATIVE,
    defaultValue: -3,
    description: 'Recule de X cases',
  },
  {
    id: 'extra_turn',
    name: 'Tour supplémentaire',
    type: ActionType.EXTRA_TURN,
    description: 'Le joueur rejoue',
  },
  {
    id: 'skip_turn',
    name: 'Passer un tour',
    type: ActionType.SKIP_TURN,
    description: 'Le joueur passe son prochain tour',
  },
  {
    id: 'shield',
    name: 'Appliquer bouclier',
    type: ActionType.APPLY_SHIELD,
    defaultValue: 2,
    description: 'Protège pendant X tours',
  },
  {
    id: 'double_dice',
    name: 'Double dé',
    type: ActionType.APPLY_DOUBLE_DICE,
    defaultValue: 1,
    description: 'Double le prochain lancer',
  },
  {
    id: 'teleport_start',
    name: 'Retour au départ',
    type: ActionType.BACK_TO_START,
    description: 'Renvoie au départ',
  },
  {
    id: 'steal_points',
    name: 'Voler des points',
    type: ActionType.APPLY_STEAL_POINTS,
    defaultValue: 2,
    description: 'Vole X points au joueur le plus proche',
  },
]

/**
 * Create a new chained rule from templates
 */
export function createChainedRuleFromTemplate(
  name: string,
  trigger: TriggerType,
  conditionTemplateIds: string[],
  thenActionTemplateIds: string[],
  elseActionTemplateIds?: string[]
): Omit<ChainedRule, 'id'> {
  const conditions: RuleCondition[] = conditionTemplateIds.map((id, idx) => {
    const template = CONDITION_TEMPLATES.find(t => t.id === id)
    if (!template) throw new Error(`Condition template ${id} not found`)
    return {
      id: `cond-${idx}`,
      type: template.type,
      operator: template.operator,
      value: template.defaultValue,
    }
  })

  const thenActions: ChainedAction[] = thenActionTemplateIds.map((id, idx) => {
    const template = ACTION_TEMPLATES.find(t => t.id === id)
    if (!template) throw new Error(`Action template ${id} not found`)
    return {
      id: `then-${idx}`,
      type: template.type,
      value: template.defaultValue,
    }
  })

  const elseActions: ChainedAction[] | undefined = elseActionTemplateIds?.map((id, idx) => {
    const template = ACTION_TEMPLATES.find(t => t.id === id)
    if (!template) throw new Error(`Action template ${id} not found`)
    return {
      id: `else-${idx}`,
      type: template.type,
      value: template.defaultValue,
    }
  })

  return {
    name,
    description: `Règle conditionnelle: ${name}`,
    enabled: true,
    priority: 0,
    trigger,
    conditions,
    conditionLogic: 'AND',
    thenActions,
    elseActions: elseActions?.length ? elseActions : undefined,
  }
}

/**
 * Validate a chained rule
 */
export function validateChainedRule(rule: Partial<ChainedRule>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!rule.name || rule.name.trim().length === 0) {
    errors.push('Le nom est requis')
  }

  if (!rule.trigger) {
    errors.push('Le déclencheur est requis')
  }

  if (!rule.thenActions || rule.thenActions.length === 0) {
    errors.push('Au moins une action "Alors" est requise')
  }

  // Validate each condition
  rule.conditions?.forEach((c, i) => {
    if (!c.type) {
      errors.push(`Condition ${i + 1}: le type est requis`)
    }
    if (!c.operator) {
      errors.push(`Condition ${i + 1}: l'opérateur est requis`)
    }
    if (c.value === undefined || c.value === null) {
      errors.push(`Condition ${i + 1}: la valeur est requise`)
    }
  })

  // Validate each action
  rule.thenActions?.forEach((a, i) => {
    if (!a.type) {
      errors.push(`Action "Alors" ${i + 1}: le type est requis`)
    }
  })

  rule.elseActions?.forEach((a, i) => {
    if (!a.type) {
      errors.push(`Action "Sinon" ${i + 1}: le type est requis`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}
