import { GameState, Player } from '../types/game';
import { ActionType, Rule, TriggerType, RuleCondition } from '../types/rules';
import { applyRuleEffect } from './actions';
import { evaluateConditions, buildContext } from './condition-evaluator';
import { applyTemporaryEffect, applyStealPoints, hasEffect } from './effect-manager';

interface RuleResult {
  state: GameState;
  logs: string[];
}

/**
 * Get all applicable rules for a given trigger and context
 * Includes both active rules and core rules
 */
export function getApplicableRules(
  state: GameState,
  contextData: any,
  triggerType: TriggerType | string
): Rule[] {
  // Combine active rules and core rules
  const allRules = [
    ...(state.activeRules || []),
    ...(state.coreRules || [])
  ];

  if (allRules.length === 0) {
    return [];
  }

  const matches = allRules.filter(rule => {
    // Skip inactive rules
    if (rule.isActive === false) {
      return false;
    }

    // 1. Check Trigger Type
    const ruleTriggerType = typeof rule.trigger === 'object'
      ? (rule.trigger as any).type
      : rule.trigger;

    if (ruleTriggerType !== triggerType) {
      return false;
    }

    // 2. Check Context-Specific Conditions
    switch (triggerType) {
      case TriggerType.ON_LAND:
      case TriggerType.ON_PASS_OVER:
      case TriggerType.ON_REACH_POSITION:
        // Match tile index
        if (rule.tileIndex !== null && rule.tileIndex !== undefined) {
          const ruleTile = Number(rule.tileIndex);
          const playerPos = Number(contextData);
          if (ruleTile !== playerPos) return false;
        }
        break;

      case TriggerType.ON_DICE_ROLL:
        // Match dice value
        if (rule.tileIndex !== null && rule.tileIndex !== undefined) {
          const targetDice = Number(rule.tileIndex);
          const actualDice = Number(contextData);
          if (targetDice !== actualDice) return false;
        }
        break;

      case TriggerType.ON_SCORE_THRESHOLD:
        // Check if score >= threshold
        if (rule.tileIndex !== null && rule.tileIndex !== undefined) {
          const threshold = Number(rule.tileIndex);
          const score = Number(contextData);
          if (score < threshold) return false;
        }
        break;

      case TriggerType.ON_CONSECUTIVE_SIX:
        // Check consecutive count
        if (rule.tileIndex !== null && rule.tileIndex !== undefined) {
          const requiredCount = Number(rule.tileIndex);
          const actualCount = Number(contextData);
          if (actualCount < requiredCount) return false;
        }
        break;

      case TriggerType.ON_NEAR_VICTORY:
        // Check distance from end
        if (rule.tileIndex !== null && rule.tileIndex !== undefined) {
          const threshold = Number(rule.tileIndex);
          const distance = Number(contextData);
          if (distance > threshold) return false;
        }
        break;
    }

    // 3. Evaluate complex conditions if present
    if (rule.conditions && rule.conditions.length > 0) {
      const context = buildContext(state, '', { tileIndex: contextData });
      if (!evaluateConditions(rule.conditions as RuleCondition[], context)) {
        return false;
      }
    }

    return true;
  });

  if (matches.length > 0) {
    console.log(`[RuleEvaluator] Found ${matches.length} rules for ${triggerType}`);
  }

  return matches;
}

/**
 * Sort rules by priority
 */
export function sortRules(rules: Rule[]): Rule[] {
  return [...rules].sort((a, b) => {
    // Priority (lower = execute first)
    const priorityA = a.priority ?? 5;
    const priorityB = b.priority ?? 5;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Creation date (older first)
    const dateA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
    const dateB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;

    return dateA - dateB;
  });
}

/**
 * Execute a chain of rules sequentially
 */
export function executeRuleChain(
  initialState: GameState,
  playerId: string,
  rules: Rule[]
): RuleResult {
  const sortedRules = sortRules(rules);
  let currentState: GameState = JSON.parse(JSON.stringify(initialState));
  const logs: string[] = [];

  const player = currentState.players.find(p => p.id === playerId);
  if (!player) {
    logs.push('Error: Player not found');
    return { state: initialState, logs };
  }

  for (const rule of sortedRules) {
    logs.push(`Rule: "${rule.title || rule.id}"`);

    for (const effect of rule.effects) {
      const result = executeEffect(currentState, playerId, effect, rule.id);
      currentState = result.state;
      if (result.log) {
        logs.push(`  -> ${result.log}`);
      }
    }
  }

  return { state: currentState, logs };
}

/**
 * Execute a single effect
 */
function executeEffect(
  state: GameState,
  playerId: string,
  effect: { type: string; value: number | string; target: string; duration?: number },
  ruleId: string
): { state: GameState; log: string } {
  let newState: GameState = JSON.parse(JSON.stringify(state));
  const value = Number(effect.value);

  // Determine target players
  const targets = getTargetPlayers(newState, playerId, effect.target);

  for (const target of targets) {
    const playerIndex = newState.players.findIndex(p => p.id === target.id);
    if (playerIndex === -1) continue;

    const player = newState.players[playerIndex];

    // Check for shield protection on negative effects
    const isNegativeEffect = isNegative(effect.type as ActionType, value);
    if (isNegativeEffect && hasEffect(player, ActionType.APPLY_SHIELD)) {
      return { state: newState, log: `Shield blocked effect on ${player.name || player.id}` };
    }

    switch (effect.type) {
      // === MOVEMENT ===
      case ActionType.MOVE_RELATIVE:
        const oldPos = player.position;
        player.position = Math.max(0, player.position + value);
        return { state: newState, log: `Move: ${oldPos} -> ${player.position}` };

      case ActionType.TELEPORT:
      case ActionType.MOVE_TO_TILE:
        player.position = value;
        return { state: newState, log: `Teleport to tile ${value}` };

      case ActionType.BACK_TO_START:
        player.position = 0;
        return { state: newState, log: `Sent back to start` };

      case ActionType.SWAP_POSITIONS:
        if (targets.length >= 2) {
          const pos1 = targets[0].position;
          targets[0].position = targets[1].position;
          targets[1].position = pos1;
          return { state: newState, log: `Positions swapped` };
        }
        break;

      case ActionType.MOVE_TO_NEAREST_PLAYER:
        const nearest = findNearestPlayer(newState, playerId);
        if (nearest) {
          player.position = nearest.position;
          return { state: newState, log: `Moved to nearest player at ${nearest.position}` };
        }
        break;

      case ActionType.MOVE_TO_FURTHEST_PLAYER:
        const furthest = findFurthestPlayer(newState, playerId);
        if (furthest) {
          player.position = furthest.position;
          return { state: newState, log: `Moved to furthest player at ${furthest.position}` };
        }
        break;

      case ActionType.MOVE_RANDOM:
        const maxTile = newState.tiles.length - 1;
        const randomPos = Math.floor(Math.random() * (maxTile + 1));
        player.position = randomPos;
        return { state: newState, log: `Random teleport to tile ${randomPos}` };

      // === SCORE ===
      case ActionType.MODIFY_SCORE:
      case ActionType.MODIFY_STAT:
        const oldScore = player.score;
        player.score += value;
        return { state: newState, log: `Score: ${oldScore} -> ${player.score}` };

      case ActionType.APPLY_STEAL_POINTS:
        const leader = getLeader(newState, playerId);
        if (leader) {
          const result = applyStealPoints(newState, playerId, leader.id, value);
          newState = result.state;
          return { state: newState, log: result.logs.join(', ') };
        }
        break;

      // === TURN FLOW ===
      case ActionType.SKIP_TURN:
        player.skipNextTurn = true;
        return { state: newState, log: `Next turn will be skipped` };

      case ActionType.EXTRA_TURN:
        player.extraTurns = (player.extraTurns || 0) + value;
        return { state: newState, log: `Gained ${value} extra turn(s)` };

      // === POWER-UPS (Temporary Effects) ===
      case ActionType.APPLY_DOUBLE_DICE:
      case ActionType.APPLY_SHIELD:
      case ActionType.APPLY_SPEED_BOOST:
      case ActionType.APPLY_SLOW:
      case ActionType.APPLY_INVISIBILITY:
      case ActionType.SET_DICE_MIN:
      case ActionType.SET_DICE_MAX:
        const duration = effect.duration || value || 1;
        const effectResult = applyTemporaryEffect(
          newState,
          target.id,
          effect.type as ActionType,
          value,
          duration,
          ruleId,
          playerId
        );
        newState = effectResult.state;
        return { state: newState, log: effectResult.logs.join(', ') };

      // === VICTORY ===
      case ActionType.DECLARE_VICTORY:
        // Victory is handled in processor.ts
        return { state: newState, log: 'Victory condition triggered' };

      // === MODIFICATION PERMISSIONS ===
      case ActionType.ALLOW_RULE_MODIFICATION:
      case ActionType.ALLOW_TILE_MODIFICATION:
        // These are checked in processor.ts
        return { state: newState, log: 'Modification allowed' };

      // === META ===
      case ActionType.COPY_LAST_EFFECT:
        if (newState.lastEffect) {
          // Re-apply last effect
          return executeEffect(
            newState,
            playerId,
            {
              type: newState.lastEffect.type,
              value: newState.lastEffect.value,
              target: effect.target
            },
            ruleId
          );
        }
        return { state: newState, log: 'No previous effect to copy' };

      case ActionType.REVERSE_LAST_EFFECT:
        if (newState.lastEffect) {
          // Apply inverse of last effect
          return executeEffect(
            newState,
            playerId,
            {
              type: newState.lastEffect.type,
              value: -newState.lastEffect.value,
              target: effect.target
            },
            ruleId
          );
        }
        return { state: newState, log: 'No previous effect to reverse' };

      case ActionType.REROLL_DICE:
        // Handled in processor.ts
        return { state: newState, log: 'Dice will be rerolled' };

      default:
        return { state: newState, log: `Unknown effect: ${effect.type}` };
    }
  }

  return { state: newState, log: '' };
}

/**
 * Get target players based on target string
 */
function getTargetPlayers(state: GameState, selfId: string, target: string): Player[] {
  switch (target) {
    case 'self':
      return state.players.filter(p => p.id === selfId);
    case 'others':
      return state.players.filter(p => p.id !== selfId);
    case 'all':
      return state.players;
    case 'leader':
      const leader = getLeader(state, selfId);
      return leader ? [leader] : [];
    case 'last':
      const last = getLast(state);
      return last ? [last] : [];
    case 'random':
      const others = state.players.filter(p => p.id !== selfId);
      if (others.length === 0) return [];
      return [others[Math.floor(Math.random() * others.length)]];
    default:
      return state.players.filter(p => p.id === selfId);
  }
}

/**
 * Get the player in the lead (excluding self if specified)
 */
function getLeader(state: GameState, excludeId?: string): Player | null {
  const candidates = excludeId
    ? state.players.filter(p => p.id !== excludeId)
    : state.players;

  if (candidates.length === 0) return null;

  return candidates.reduce((leader, player) =>
    player.position > leader.position ? player : leader
  );
}

/**
 * Get the player in last place
 */
function getLast(state: GameState): Player | null {
  if (state.players.length === 0) return null;

  return state.players.reduce((last, player) =>
    player.position < last.position ? player : last
  );
}

/**
 * Find nearest player to self
 */
function findNearestPlayer(state: GameState, selfId: string): Player | null {
  const self = state.players.find(p => p.id === selfId);
  if (!self) return null;

  const others = state.players.filter(p => p.id !== selfId);
  if (others.length === 0) return null;

  return others.reduce((nearest, player) => {
    const currentDist = Math.abs(player.position - self.position);
    const nearestDist = Math.abs(nearest.position - self.position);
    return currentDist < nearestDist ? player : nearest;
  });
}

/**
 * Find furthest player from self
 */
function findFurthestPlayer(state: GameState, selfId: string): Player | null {
  const self = state.players.find(p => p.id === selfId);
  if (!self) return null;

  const others = state.players.filter(p => p.id !== selfId);
  if (others.length === 0) return null;

  return others.reduce((furthest, player) => {
    const currentDist = Math.abs(player.position - self.position);
    const furthestDist = Math.abs(furthest.position - self.position);
    return currentDist > furthestDist ? player : furthest;
  });
}

/**
 * Check if an effect is negative
 */
function isNegative(effectType: ActionType, value: number): boolean {
  const negativeEffects = [
    ActionType.APPLY_SLOW,
    ActionType.SKIP_TURN,
    ActionType.BACK_TO_START,
    ActionType.APPLY_STEAL_POINTS
  ];

  if (negativeEffects.includes(effectType)) return true;

  // MOVE_RELATIVE with negative value
  if (effectType === ActionType.MOVE_RELATIVE && value < 0) return true;

  // MODIFY_SCORE with negative value
  if ((effectType === ActionType.MODIFY_SCORE || effectType === ActionType.MODIFY_STAT) && value < 0) return true;

  return false;
}

/**
 * Get rules applicable to a specific tile (for UI display)
 */
export function getRulesForTile(state: GameState, tileIndex: number): Rule[] {
  const allRules = [
    ...(state.activeRules || []),
    ...(state.coreRules || [])
  ];

  return allRules.filter(rule => {
    if (rule.isActive === false) return false;

    const triggerType = typeof rule.trigger === 'object'
      ? (rule.trigger as any).type
      : rule.trigger;

    // Only tile-based triggers
    if (triggerType !== TriggerType.ON_LAND &&
        triggerType !== TriggerType.ON_PASS_OVER &&
        triggerType !== TriggerType.ON_REACH_POSITION) {
      return false;
    }

    // Global rules (no specific tile) apply to all tiles
    if (rule.tileIndex === null || rule.tileIndex === undefined) {
      return true;
    }

    return Number(rule.tileIndex) === tileIndex;
  });
}

/**
 * Get all rules that apply globally (not tile-specific)
 */
export function getGlobalRules(state: GameState): Rule[] {
  const allRules = [
    ...(state.activeRules || []),
    ...(state.coreRules || [])
  ];

  return allRules.filter(rule => {
    if (rule.isActive === false) return false;

    const triggerType = typeof rule.trigger === 'object'
      ? (rule.trigger as any).type
      : rule.trigger;

    // Non-tile triggers are global
    return triggerType !== TriggerType.ON_LAND &&
           triggerType !== TriggerType.ON_PASS_OVER &&
           triggerType !== TriggerType.ON_REACH_POSITION;
  });
}
