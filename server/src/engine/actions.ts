import { GameState, Player } from '../types/game';
import { RuleEffect, ActionType } from '../types/rules';

/**
 * Apply a single rule effect to the game state
 * @deprecated Use executeEffect in rule-evaluator.ts instead for full functionality
 */
export function applyRuleEffect(
  gameState: GameState,
  playerId: string,
  effect: RuleEffect
): GameState {
  // Clone state for immutability
  const newGameState: GameState = {
    ...gameState,
    players: gameState.players.map(p => ({ ...p })),
    tiles: gameState.tiles.map(t => ({ ...t }))
  };

  const player = newGameState.players.find(p => p.id === playerId);
  if (!player) {
    return gameState;
  }

  const value = Number(effect.value);

  switch (effect.type) {
    case ActionType.MOVE_RELATIVE:
      let newPosition = player.position + value;
      if (newPosition < 0) newPosition = 0;
      player.position = newPosition;
      break;

    case ActionType.TELEPORT:
    case ActionType.MOVE_TO_TILE:
      player.position = value;
      break;

    case ActionType.BACK_TO_START:
      player.position = 0;
      break;

    case ActionType.MODIFY_SCORE:
    case ActionType.MODIFY_STAT:
      player.score += value;
      break;

    case ActionType.SKIP_TURN:
      player.skipNextTurn = true;
      break;

    case ActionType.EXTRA_TURN:
      player.extraTurns = (player.extraTurns || 0) + value;
      break;

    case ActionType.SWAP_POSITIONS:
      // Find target based on effect.target
      const targets = newGameState.players.filter(p => p.id !== playerId);
      if (targets.length > 0) {
        const target = targets[0]; // Default to first other player
        const tempPos = player.position;
        player.position = target.position;
        target.position = tempPos;
      }
      break;

    case ActionType.MOVE_RANDOM:
      const maxTile = newGameState.tiles.length - 1;
      player.position = Math.floor(Math.random() * (maxTile + 1));
      break;

    default:
      // Unknown action type, return unchanged
      return gameState;
  }

  // Store last effect for meta actions
  newGameState.lastEffect = {
    type: effect.type.toString(),
    value: value,
    playerId: playerId,
    ruleId: ''
  };

  return newGameState;
}

/**
 * Apply effect to multiple targets
 */
export function applyEffectToTargets(
  gameState: GameState,
  sourcePlayerId: string,
  effect: RuleEffect
): GameState {
  let newState = { ...gameState, players: gameState.players.map(p => ({ ...p })) };

  const targets = getTargetPlayers(newState, sourcePlayerId, effect.target);

  for (const target of targets) {
    newState = applyRuleEffect(newState, target.id, {
      ...effect,
      target: 'self' // Apply directly to each target
    });
  }

  return newState;
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
      const sorted = [...state.players].sort((a, b) => b.position - a.position);
      return sorted.length > 0 ? [sorted[0]] : [];
    case 'last':
      const sortedAsc = [...state.players].sort((a, b) => a.position - b.position);
      return sortedAsc.length > 0 ? [sortedAsc[0]] : [];
    case 'random':
      const others = state.players.filter(p => p.id !== selfId);
      if (others.length === 0) return [];
      return [others[Math.floor(Math.random() * others.length)]];
    default:
      return state.players.filter(p => p.id === selfId);
  }
}

/**
 * Check if an effect would be blocked by shield
 */
export function wouldBeBlockedByShield(effectType: ActionType, value: number): boolean {
  const negativeEffects: ActionType[] = [
    ActionType.APPLY_SLOW,
    ActionType.SKIP_TURN,
    ActionType.BACK_TO_START,
    ActionType.APPLY_STEAL_POINTS
  ];

  if (negativeEffects.includes(effectType)) return true;
  if (effectType === ActionType.MOVE_RELATIVE && value < 0) return true;
  if ((effectType === ActionType.MODIFY_SCORE || effectType === ActionType.MODIFY_STAT) && value < 0) return true;

  return false;
}

/**
 * Get human-readable description of an effect
 */
export function getEffectDescription(effect: RuleEffect): string {
  const value = Number(effect.value);
  const target = effect.target === 'self' ? 'you' :
                 effect.target === 'others' ? 'other players' :
                 effect.target === 'all' ? 'all players' :
                 effect.target === 'leader' ? 'the leader' :
                 effect.target === 'last' ? 'the last player' :
                 'a random player';

  switch (effect.type) {
    case ActionType.MOVE_RELATIVE:
      return value > 0 ? `Move ${target} forward ${value} tiles` : `Move ${target} back ${Math.abs(value)} tiles`;
    case ActionType.TELEPORT:
    case ActionType.MOVE_TO_TILE:
      return `Teleport ${target} to tile ${value}`;
    case ActionType.BACK_TO_START:
      return `Send ${target} back to start`;
    case ActionType.SWAP_POSITIONS:
      return `Swap positions with ${target}`;
    case ActionType.MODIFY_SCORE:
    case ActionType.MODIFY_STAT:
      return value > 0 ? `Give ${target} ${value} points` : `Take ${Math.abs(value)} points from ${target}`;
    case ActionType.SKIP_TURN:
      return `${target} skip next turn`;
    case ActionType.EXTRA_TURN:
      return `${target} get ${value} extra turn(s)`;
    case ActionType.APPLY_DOUBLE_DICE:
      return `Double dice for ${target} (${effect.duration || value} turns)`;
    case ActionType.APPLY_SHIELD:
      return `Shield ${target} from negative effects (${effect.duration || value} turns)`;
    case ActionType.APPLY_SPEED_BOOST:
      return `Speed boost for ${target} (${effect.duration || value} turns)`;
    case ActionType.APPLY_SLOW:
      return `Slow down ${target} (${effect.duration || value} turns)`;
    case ActionType.APPLY_INVISIBILITY:
      return `Make ${target} invisible (${effect.duration || value} turns)`;
    case ActionType.APPLY_STEAL_POINTS:
      return `Steal ${value} points from ${target}`;
    case ActionType.SET_DICE_MIN:
      return `Set minimum dice to ${value} for ${target}`;
    case ActionType.SET_DICE_MAX:
      return `Set maximum dice to ${value} for ${target}`;
    case ActionType.REROLL_DICE:
      return `Force ${target} to reroll dice`;
    case ActionType.DECLARE_VICTORY:
      return `${target} win the game`;
    case ActionType.MOVE_TO_NEAREST_PLAYER:
      return `Move ${target} to nearest player`;
    case ActionType.MOVE_TO_FURTHEST_PLAYER:
      return `Move ${target} to furthest player`;
    case ActionType.MOVE_RANDOM:
      return `Teleport ${target} to random tile`;
    case ActionType.COPY_LAST_EFFECT:
      return `Copy last effect for ${target}`;
    case ActionType.REVERSE_LAST_EFFECT:
      return `Reverse last effect for ${target}`;
    default:
      return `Apply ${effect.type} to ${target}`;
  }
}
