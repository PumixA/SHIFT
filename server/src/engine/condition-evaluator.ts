import { GameState, Player } from '../types/game';
import { RuleCondition, ConditionType, ConditionOperator, ActionType } from '../types/rules';
import { hasEffect } from './effect-manager';

/**
 * Condition Evaluator - Evaluates complex rule conditions
 */

interface EvaluationContext {
  state: GameState;
  playerId: string;
  diceValue?: number;
  tileIndex?: number;
  triggeredBy?: string;
}

/**
 * Evaluate a single condition
 */
export function evaluateCondition(condition: RuleCondition, context: EvaluationContext): boolean {
  const { state, playerId, diceValue, tileIndex } = context;
  const player = state.players.find(p => p.id === playerId);

  if (!player) return false;

  // Get target players based on condition.target
  const targetPlayers = getTargetPlayers(state, playerId, condition.target);

  switch (condition.type) {
    case ConditionType.SCORE_CHECK:
      return targetPlayers.some(p => compareValue(p.score, condition.operator, Number(condition.value)));

    case ConditionType.POSITION_CHECK:
      return targetPlayers.some(p => compareValue(p.position, condition.operator, Number(condition.value)));

    case ConditionType.EFFECT_ACTIVE:
      const effectType = condition.value as ActionType;
      if (condition.operator === 'eq') {
        return targetPlayers.some(p => hasEffect(p, effectType));
      } else if (condition.operator === 'neq') {
        return targetPlayers.some(p => !hasEffect(p, effectType));
      }
      return false;

    case ConditionType.DICE_VALUE:
      if (diceValue === undefined) return false;
      return compareValue(diceValue, condition.operator, Number(condition.value));

    case ConditionType.TURN_COUNT:
      const turnCount = state.turnCount || 0;
      return compareValue(turnCount, condition.operator, Number(condition.value));

    case ConditionType.PLAYER_COUNT:
      const playerCount = state.players.length;
      return compareValue(playerCount, condition.operator, Number(condition.value));

    case ConditionType.HAS_POWER_UP:
      const powerUpType = condition.value as ActionType;
      if (condition.operator === 'eq') {
        return targetPlayers.some(p => hasEffect(p, powerUpType));
      } else if (condition.operator === 'neq') {
        return targetPlayers.every(p => !hasEffect(p, powerUpType));
      }
      return false;

    case ConditionType.PLAYER_RANK:
      const rank = getPlayerRank(state, playerId);
      return compareValue(rank, condition.operator, Number(condition.value));

    case ConditionType.TILES_FROM_END:
      const victoryTile = 20; // Could be configurable
      const tilesFromEnd = victoryTile - player.position;
      return compareValue(tilesFromEnd, condition.operator, Number(condition.value));

    default:
      console.warn(`Unknown condition type: ${condition.type}`);
      return false;
  }
}

/**
 * Evaluate all conditions for a rule (AND logic by default)
 */
export function evaluateConditions(conditions: RuleCondition[], context: EvaluationContext): boolean {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions = always passes
  }

  return conditions.every(condition => evaluateCondition(condition, context));
}

/**
 * Compare two values using an operator
 */
function compareValue(actual: number, operator: ConditionOperator, expected: number): boolean {
  switch (operator) {
    case 'eq': return actual === expected;
    case 'neq': return actual !== expected;
    case 'gt': return actual > expected;
    case 'gte': return actual >= expected;
    case 'lt': return actual < expected;
    case 'lte': return actual <= expected;
    default: return false;
  }
}

/**
 * Get target players based on condition target
 */
function getTargetPlayers(state: GameState, selfId: string, target?: string): Player[] {
  switch (target) {
    case 'self':
      return state.players.filter(p => p.id === selfId);
    case 'others':
      return state.players.filter(p => p.id !== selfId);
    case 'all':
      return state.players;
    case 'leader':
      return [getLeader(state)];
    case 'last':
      return [getLast(state)];
    case 'any':
      return state.players; // Any will be checked with 'some'
    default:
      return state.players.filter(p => p.id === selfId);
  }
}

/**
 * Get the player in the lead (furthest position, or highest score if tied)
 */
export function getLeader(state: GameState): Player {
  return [...state.players].sort((a, b) => {
    if (b.position !== a.position) return b.position - a.position;
    return b.score - a.score;
  })[0];
}

/**
 * Get the player in last place
 */
export function getLast(state: GameState): Player {
  return [...state.players].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.score - b.score;
  })[0];
}

/**
 * Get player's rank (1 = leader, 2 = second, etc.)
 */
export function getPlayerRank(state: GameState, playerId: string): number {
  const sorted = [...state.players].sort((a, b) => {
    if (b.position !== a.position) return b.position - a.position;
    return b.score - a.score;
  });

  const index = sorted.findIndex(p => p.id === playerId);
  return index + 1;
}

/**
 * Check if player is at half board
 */
export function isAtHalfBoard(position: number, boardSize: number = 20): boolean {
  const halfPoint = Math.floor(boardSize / 2);
  return position >= halfPoint;
}

/**
 * Check if player is near victory
 */
export function isNearVictory(position: number, threshold: number = 3, victoryTile: number = 20): boolean {
  return (victoryTile - position) <= threshold;
}

/**
 * Check if player overtook another during this move
 */
export function checkOvertake(
  state: GameState,
  playerId: string,
  previousPosition: number,
  newPosition: number
): { overtook: Player[]; overtakenBy: Player[] } {
  const overtook: Player[] = [];
  const overtakenBy: Player[] = [];

  for (const other of state.players) {
    if (other.id === playerId) continue;

    // Check if we overtook this player
    if (previousPosition <= other.position && newPosition > other.position) {
      overtook.push(other);
    }

    // This is for checking if others overtook us (would be checked from their perspective)
  }

  return { overtook, overtakenBy };
}

/**
 * Get players on the same tile
 */
export function getPlayersOnSameTile(state: GameState, position: number): Player[] {
  return state.players.filter(p => p.position === position);
}

/**
 * Get nearest player to target (excluding self)
 */
export function getNearestPlayer(state: GameState, selfId: string, selfPosition: number): Player | null {
  const others = state.players.filter(p => p.id !== selfId);
  if (others.length === 0) return null;

  return others.reduce((nearest, player) => {
    const currentDistance = Math.abs(player.position - selfPosition);
    const nearestDistance = Math.abs(nearest.position - selfPosition);
    return currentDistance < nearestDistance ? player : nearest;
  });
}

/**
 * Get furthest player from target (excluding self)
 */
export function getFurthestPlayer(state: GameState, selfId: string, selfPosition: number): Player | null {
  const others = state.players.filter(p => p.id !== selfId);
  if (others.length === 0) return null;

  return others.reduce((furthest, player) => {
    const currentDistance = Math.abs(player.position - selfPosition);
    const furthestDistance = Math.abs(furthest.position - selfPosition);
    return currentDistance > furthestDistance ? player : furthest;
  });
}

/**
 * Evaluate score threshold trigger
 */
export function checkScoreThreshold(player: Player, threshold: number, previousScore?: number): boolean {
  if (previousScore !== undefined) {
    // Check if we just crossed the threshold
    return previousScore < threshold && player.score >= threshold;
  }
  return player.score >= threshold;
}

/**
 * Build evaluation context
 */
export function buildContext(
  state: GameState,
  playerId: string,
  options: { diceValue?: number; tileIndex?: number; triggeredBy?: string } = {}
): EvaluationContext {
  return {
    state,
    playerId,
    diceValue: options.diceValue,
    tileIndex: options.tileIndex,
    triggeredBy: options.triggeredBy
  };
}
