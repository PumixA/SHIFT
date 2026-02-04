import { GameState, Player } from '../types/game';
import { ActionType, TemporaryEffect } from '../types/rules';
import crypto from 'crypto';

/**
 * Effect Manager - Handles temporary effects (power-ups, debuffs, etc.)
 */

export interface EffectResult {
  state: GameState;
  logs: string[];
  effectsApplied: TemporaryEffect[];
  effectsExpired: TemporaryEffect[];
}

/**
 * Apply a temporary effect to a player
 */
export function applyTemporaryEffect(
  gameState: GameState,
  playerId: string,
  effectType: ActionType,
  value: number,
  duration: number,
  source: string,
  appliedBy?: string
): EffectResult {
  const newState: GameState = JSON.parse(JSON.stringify(gameState));
  const logs: string[] = [];
  const effectsApplied: TemporaryEffect[] = [];

  const player = newState.players.find(p => p.id === playerId);
  if (!player) {
    return { state: gameState, logs: ['Player not found'], effectsApplied: [], effectsExpired: [] };
  }

  // Initialize effects array if not present
  if (!player.effects) {
    player.effects = [];
  }

  // Check for shield (blocks negative effects)
  const hasShield = player.effects.some(e => e.type === ActionType.APPLY_SHIELD && e.turnsRemaining > 0);
  const isNegativeEffect = [
    ActionType.APPLY_SLOW,
    ActionType.SKIP_TURN,
    ActionType.BACK_TO_START,
    ActionType.APPLY_STEAL_POINTS
  ].includes(effectType);

  if (hasShield && isNegativeEffect) {
    logs.push(`Shield blocked ${getEffectName(effectType)} on ${player.name || playerId}`);
    return { state: newState, logs, effectsApplied: [], effectsExpired: [] };
  }

  // Check for invisibility (can't be targeted by others)
  const hasInvisibility = player.effects.some(e => e.type === ActionType.APPLY_INVISIBILITY && e.turnsRemaining > 0);
  if (hasInvisibility && appliedBy && appliedBy !== playerId) {
    logs.push(`Invisibility protected ${player.name || playerId} from effect`);
    return { state: newState, logs, effectsApplied: [], effectsExpired: [] };
  }

  const newEffect: TemporaryEffect = {
    id: crypto.randomUUID(),
    type: effectType,
    value,
    turnsRemaining: duration,
    source,
    appliedAt: new Date(),
    appliedBy
  };

  // Handle stacking or replacing effects
  const existingEffectIndex = player.effects.findIndex(e => e.type === effectType);
  if (existingEffectIndex >= 0) {
    // Replace with new effect (could also stack based on game design)
    player.effects[existingEffectIndex] = newEffect;
    logs.push(`${getEffectName(effectType)} refreshed on ${player.name || playerId} (${duration} turns)`);
  } else {
    player.effects.push(newEffect);
    logs.push(`${getEffectName(effectType)} applied to ${player.name || playerId} (${duration} turns)`);
  }

  effectsApplied.push(newEffect);

  // Store last effect for COPY_LAST_EFFECT action
  newState.lastEffect = {
    type: effectType,
    value,
    playerId,
    ruleId: source
  };

  return { state: newState, logs, effectsApplied, effectsExpired: [] };
}

/**
 * Process end of turn - decrement effect durations and expire effects
 */
export function processEffectTurnEnd(gameState: GameState, playerId: string): EffectResult {
  const newState: GameState = JSON.parse(JSON.stringify(gameState));
  const logs: string[] = [];
  const effectsExpired: TemporaryEffect[] = [];

  const player = newState.players.find(p => p.id === playerId);
  if (!player || !player.effects) {
    return { state: newState, logs, effectsApplied: [], effectsExpired: [] };
  }

  const activeEffects: TemporaryEffect[] = [];

  for (const effect of player.effects) {
    effect.turnsRemaining--;

    if (effect.turnsRemaining <= 0) {
      effectsExpired.push(effect);
      logs.push(`${getEffectName(effect.type)} expired on ${player.name || playerId}`);
    } else {
      activeEffects.push(effect);
    }
  }

  player.effects = activeEffects;

  return { state: newState, logs, effectsApplied: [], effectsExpired };
}

/**
 * Get active effects for a player
 */
export function getActiveEffects(player: Player): TemporaryEffect[] {
  return (player.effects || []).filter(e => e.turnsRemaining > 0);
}

/**
 * Check if player has a specific effect active
 */
export function hasEffect(player: Player, effectType: ActionType): boolean {
  return getActiveEffects(player).some(e => e.type === effectType);
}

/**
 * Get effect value (returns 0 if not found)
 */
export function getEffectValue(player: Player, effectType: ActionType): number {
  const effect = getActiveEffects(player).find(e => e.type === effectType);
  return effect?.value || 0;
}

/**
 * Calculate modified dice value based on effects
 */
export function calculateDiceValue(player: Player, originalValue: number): { value: number; modifiers: string[] } {
  let value = originalValue;
  const modifiers: string[] = [];

  // Double dice effect
  if (hasEffect(player, ActionType.APPLY_DOUBLE_DICE)) {
    value *= 2;
    modifiers.push(`Double Dice (x2)`);
  }

  // Dice min effect
  const minEffect = getActiveEffects(player).find(e => e.type === ActionType.SET_DICE_MIN);
  if (minEffect && value < minEffect.value) {
    value = minEffect.value;
    modifiers.push(`Minimum Dice (${minEffect.value})`);
  }

  // Dice max effect
  const maxEffect = getActiveEffects(player).find(e => e.type === ActionType.SET_DICE_MAX);
  if (maxEffect && value > maxEffect.value) {
    value = maxEffect.value;
    modifiers.push(`Maximum Dice (${maxEffect.value})`);
  }

  return { value, modifiers };
}

/**
 * Calculate modified movement based on effects
 */
export function calculateMovement(player: Player, baseMovement: number): { movement: number; modifiers: string[] } {
  let movement = baseMovement;
  const modifiers: string[] = [];

  // Speed boost effect
  const speedBoost = getEffectValue(player, ActionType.APPLY_SPEED_BOOST);
  if (speedBoost) {
    movement += speedBoost;
    modifiers.push(`Speed Boost (+${speedBoost})`);
  }

  // Slow effect
  const slow = getEffectValue(player, ActionType.APPLY_SLOW);
  if (slow) {
    movement -= slow;
    modifiers.push(`Slowed (-${slow})`);
  }

  // Ensure minimum movement of 0
  movement = Math.max(0, movement);

  return { movement, modifiers };
}

/**
 * Apply steal points effect
 */
export function applyStealPoints(
  gameState: GameState,
  stealerId: string,
  targetId: string,
  amount: number
): { state: GameState; logs: string[] } {
  const newState: GameState = JSON.parse(JSON.stringify(gameState));
  const logs: string[] = [];

  const stealer = newState.players.find(p => p.id === stealerId);
  const target = newState.players.find(p => p.id === targetId);

  if (!stealer || !target) {
    return { state: gameState, logs: ['Invalid players for steal'] };
  }

  // Check for shield
  const targetEffects = target.effects || [];
  if (targetEffects.some(e => e.type === ActionType.APPLY_SHIELD && e.turnsRemaining > 0)) {
    logs.push(`Shield blocked point steal on ${target.name || targetId}`);
    return { state: newState, logs };
  }

  // Check for invisibility
  if (targetEffects.some(e => e.type === ActionType.APPLY_INVISIBILITY && e.turnsRemaining > 0)) {
    logs.push(`Invisibility protected ${target.name || targetId} from point steal`);
    return { state: newState, logs };
  }

  // Calculate actual steal amount (can't steal more than target has)
  const actualSteal = Math.min(amount, target.score);

  target.score -= actualSteal;
  stealer.score += actualSteal;

  logs.push(`${stealer.name || stealerId} stole ${actualSteal} points from ${target.name || targetId}`);

  return { state: newState, logs };
}

/**
 * Remove all effects from a player
 */
export function clearEffects(gameState: GameState, playerId: string): GameState {
  const newState: GameState = JSON.parse(JSON.stringify(gameState));
  const player = newState.players.find(p => p.id === playerId);

  if (player) {
    player.effects = [];
  }

  return newState;
}

/**
 * Get human-readable effect name
 */
export function getEffectName(effectType: ActionType): string {
  const names: Record<string, string> = {
    [ActionType.APPLY_DOUBLE_DICE]: 'Double Dice',
    [ActionType.APPLY_SHIELD]: 'Shield',
    [ActionType.APPLY_STEAL_POINTS]: 'Point Steal',
    [ActionType.APPLY_SPEED_BOOST]: 'Speed Boost',
    [ActionType.APPLY_SLOW]: 'Slow',
    [ActionType.APPLY_INVISIBILITY]: 'Invisibility',
    [ActionType.SET_DICE_MIN]: 'Minimum Dice',
    [ActionType.SET_DICE_MAX]: 'Maximum Dice',
    [ActionType.SKIP_TURN]: 'Skip Turn',
    [ActionType.EXTRA_TURN]: 'Extra Turn',
  };

  return names[effectType] || effectType;
}

/**
 * Get all active effects in the game
 */
export function getAllActiveEffects(gameState: GameState): { playerId: string; playerName: string; effects: TemporaryEffect[] }[] {
  return gameState.players
    .filter(p => p.effects && p.effects.length > 0)
    .map(p => ({
      playerId: p.id,
      playerName: p.name || p.id,
      effects: getActiveEffects(p)
    }));
}
