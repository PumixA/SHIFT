import { RuleTemplate, TriggerType, ActionType, ConditionType } from '../types/rules';

/**
 * Rule Templates Library - 50+ predefined rule templates
 * Categories: movement, score, power-up, interaction, dice, meta
 */

// ================================
// MOVEMENT TEMPLATES (15)
// ================================

export const movementTemplates: RuleTemplate[] = [
  {
    id: 'tpl-turbo',
    name: 'Turbo Boost',
    description: 'Avance de cases supplémentaires en atterrissant sur cette case',
    category: 'movement',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.MOVE_RELATIVE, value: 3, target: 'self' }],
    difficulty: 'easy',
    tags: ['bonus', 'movement', 'speed']
  },
  {
    id: 'tpl-trap',
    name: 'Piège',
    description: 'Recule de cases en atterrissant sur cette case',
    category: 'movement',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.MOVE_RELATIVE, value: -3, target: 'self' }],
    difficulty: 'easy',
    tags: ['trap', 'movement', 'penalty']
  },
  {
    id: 'tpl-teleport-forward',
    name: 'Téléportation Avant',
    description: 'Téléporte vers une case plus avancée',
    category: 'movement',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.TELEPORT, value: 15, target: 'self' }],
    difficulty: 'easy',
    tags: ['teleport', 'bonus']
  },
  {
    id: 'tpl-teleport-back',
    name: 'Téléportation Arrière',
    description: 'Téléporte vers une case antérieure',
    category: 'movement',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.TELEPORT, value: 2, target: 'self' }],
    difficulty: 'easy',
    tags: ['teleport', 'trap']
  },
  {
    id: 'tpl-back-to-start',
    name: 'Retour au Départ',
    description: 'Renvoie le joueur à la case départ',
    category: 'movement',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.BACK_TO_START, value: 0, target: 'self' }],
    difficulty: 'easy',
    tags: ['trap', 'severe']
  },
  {
    id: 'tpl-swap-random',
    name: 'Échange Aléatoire',
    description: 'Échange sa position avec un autre joueur aléatoire',
    category: 'movement',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.SWAP_POSITIONS, value: 0, target: 'random' }],
    difficulty: 'medium',
    tags: ['swap', 'interaction', 'chaos']
  },
  {
    id: 'tpl-swap-leader',
    name: 'Détrône le Leader',
    description: 'Échange sa position avec le joueur en tête',
    category: 'movement',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.SWAP_POSITIONS, value: 0, target: 'leader' }],
    difficulty: 'medium',
    tags: ['swap', 'interaction', 'strategic']
  },
  {
    id: 'tpl-move-to-nearest',
    name: 'Rapprochement',
    description: 'Se téléporte à côté du joueur le plus proche',
    category: 'movement',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.MOVE_TO_NEAREST_PLAYER, value: 0, target: 'self' }],
    difficulty: 'medium',
    tags: ['teleport', 'interaction']
  },
  {
    id: 'tpl-move-to-furthest',
    name: 'Grand Saut',
    description: 'Se téléporte à côté du joueur le plus éloigné',
    category: 'movement',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.MOVE_TO_FURTHEST_PLAYER, value: 0, target: 'self' }],
    difficulty: 'medium',
    tags: ['teleport', 'interaction']
  },
  {
    id: 'tpl-random-teleport',
    name: 'Téléportation Aléatoire',
    description: 'Se téléporte sur une case aléatoire',
    category: 'movement',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.MOVE_RANDOM, value: 0, target: 'self' }],
    difficulty: 'medium',
    tags: ['teleport', 'random', 'chaos']
  },
  {
    id: 'tpl-push-all',
    name: 'Onde de Choc',
    description: 'Repousse tous les autres joueurs de 2 cases',
    category: 'movement',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.MOVE_RELATIVE, value: -2, target: 'others' }],
    difficulty: 'hard',
    tags: ['interaction', 'aggressive']
  },
  {
    id: 'tpl-pull-all',
    name: 'Attraction',
    description: 'Attire tous les autres joueurs de 2 cases',
    category: 'movement',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.MOVE_RELATIVE, value: 2, target: 'others' }],
    difficulty: 'hard',
    tags: ['interaction', 'strategic']
  },
  {
    id: 'tpl-speed-lane',
    name: 'Voie Rapide',
    description: 'Bonus de vitesse en passant sur cette case',
    category: 'movement',
    trigger: TriggerType.ON_PASS_OVER,
    conditions: [],
    effects: [{ type: ActionType.MOVE_RELATIVE, value: 1, target: 'self' }],
    difficulty: 'easy',
    tags: ['bonus', 'pass-over']
  },
  {
    id: 'tpl-speed-boost',
    name: 'Boost de Vitesse',
    description: 'Applique un bonus de mouvement pour plusieurs tours',
    category: 'movement',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.APPLY_SPEED_BOOST, value: 2, target: 'self', duration: 3 }],
    difficulty: 'medium',
    tags: ['power-up', 'speed']
  },
  {
    id: 'tpl-slow-zone',
    name: 'Zone de Ralentissement',
    description: 'Ralentit le joueur pour plusieurs tours',
    category: 'movement',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.APPLY_SLOW, value: 2, target: 'self', duration: 2 }],
    difficulty: 'medium',
    tags: ['trap', 'debuff']
  }
];

// ================================
// SCORE TEMPLATES (10)
// ================================

export const scoreTemplates: RuleTemplate[] = [
  {
    id: 'tpl-bonus-points',
    name: 'Bonus de Points',
    description: 'Gagne des points en atterrissant sur cette case',
    category: 'score',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.MODIFY_SCORE, value: 100, target: 'self' }],
    difficulty: 'easy',
    tags: ['bonus', 'score']
  },
  {
    id: 'tpl-penalty-points',
    name: 'Pénalité de Points',
    description: 'Perd des points en atterrissant sur cette case',
    category: 'score',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.MODIFY_SCORE, value: -50, target: 'self' }],
    difficulty: 'easy',
    tags: ['trap', 'score']
  },
  {
    id: 'tpl-jackpot',
    name: 'Jackpot',
    description: 'Gagne un grand nombre de points',
    category: 'score',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.MODIFY_SCORE, value: 500, target: 'self' }],
    difficulty: 'easy',
    tags: ['bonus', 'score', 'rare']
  },
  {
    id: 'tpl-tax',
    name: 'Taxe',
    description: 'Perd des points à chaque passage',
    category: 'score',
    trigger: TriggerType.ON_PASS_OVER,
    conditions: [],
    effects: [{ type: ActionType.MODIFY_SCORE, value: -25, target: 'self' }],
    difficulty: 'easy',
    tags: ['trap', 'pass-over']
  },
  {
    id: 'tpl-steal-points',
    name: 'Vol de Points',
    description: 'Vole des points au joueur en tête',
    category: 'score',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.APPLY_STEAL_POINTS, value: 100, target: 'leader' }],
    difficulty: 'medium',
    tags: ['interaction', 'steal']
  },
  {
    id: 'tpl-steal-last',
    name: 'Vol au Dernier',
    description: 'Vole des points au joueur en dernière position',
    category: 'score',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.APPLY_STEAL_POINTS, value: 50, target: 'last' }],
    difficulty: 'medium',
    tags: ['interaction', 'steal']
  },
  {
    id: 'tpl-income',
    name: 'Revenu Passif',
    description: 'Gagne des points à chaque début de tour',
    category: 'score',
    trigger: TriggerType.ON_TURN_START,
    conditions: [],
    effects: [{ type: ActionType.MODIFY_SCORE, value: 20, target: 'self' }],
    difficulty: 'easy',
    tags: ['passive', 'score']
  },
  {
    id: 'tpl-distribution',
    name: 'Distribution',
    description: 'Tous les joueurs gagnent des points',
    category: 'score',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.MODIFY_SCORE, value: 50, target: 'all' }],
    difficulty: 'easy',
    tags: ['bonus', 'multiplayer']
  },
  {
    id: 'tpl-dice-bonus',
    name: 'Bonus Dé Élevé',
    description: 'Bonus de points en faisant un 6',
    category: 'score',
    trigger: TriggerType.ON_DICE_ROLL,
    triggerValue: 6,
    conditions: [],
    effects: [{ type: ActionType.MODIFY_SCORE, value: 75, target: 'self' }],
    difficulty: 'easy',
    tags: ['dice', 'bonus']
  },
  {
    id: 'tpl-dice-penalty',
    name: 'Malus Dé Faible',
    description: 'Pénalité de points en faisant un 1',
    category: 'score',
    trigger: TriggerType.ON_DICE_ROLL,
    triggerValue: 1,
    conditions: [],
    effects: [{ type: ActionType.MODIFY_SCORE, value: -50, target: 'self' }],
    difficulty: 'easy',
    tags: ['dice', 'trap']
  }
];

// ================================
// POWER-UP TEMPLATES (15)
// ================================

export const powerUpTemplates: RuleTemplate[] = [
  {
    id: 'tpl-double-dice',
    name: 'Double Dé',
    description: 'Double le résultat du dé pour plusieurs tours',
    category: 'power-up',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.APPLY_DOUBLE_DICE, value: 1, target: 'self', duration: 2 }],
    difficulty: 'medium',
    tags: ['power-up', 'dice']
  },
  {
    id: 'tpl-shield',
    name: 'Bouclier',
    description: 'Protection contre les effets négatifs pour plusieurs tours',
    category: 'power-up',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.APPLY_SHIELD, value: 1, target: 'self', duration: 3 }],
    difficulty: 'medium',
    tags: ['power-up', 'defensive']
  },
  {
    id: 'tpl-invisibility',
    name: 'Invisibilité',
    description: 'Ne peut pas être ciblé par les autres joueurs',
    category: 'power-up',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.APPLY_INVISIBILITY, value: 1, target: 'self', duration: 2 }],
    difficulty: 'medium',
    tags: ['power-up', 'defensive']
  },
  {
    id: 'tpl-extra-turn',
    name: 'Tour Supplémentaire',
    description: 'Gagne un tour supplémentaire',
    category: 'power-up',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.EXTRA_TURN, value: 1, target: 'self' }],
    difficulty: 'easy',
    tags: ['power-up', 'turn']
  },
  {
    id: 'tpl-skip-turn',
    name: 'Passer le Tour',
    description: 'Passe le prochain tour',
    category: 'power-up',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.SKIP_TURN, value: 1, target: 'self' }],
    difficulty: 'easy',
    tags: ['trap', 'turn']
  },
  {
    id: 'tpl-dice-min',
    name: 'Dé Minimum',
    description: 'Le dé ne peut pas être en dessous de cette valeur',
    category: 'power-up',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.SET_DICE_MIN, value: 3, target: 'self', duration: 3 }],
    difficulty: 'medium',
    tags: ['power-up', 'dice']
  },
  {
    id: 'tpl-dice-max',
    name: 'Dé Maximum',
    description: 'Le dé ne peut pas dépasser cette valeur',
    category: 'power-up',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.SET_DICE_MAX, value: 4, target: 'self', duration: 2 }],
    difficulty: 'medium',
    tags: ['trap', 'dice']
  },
  {
    id: 'tpl-reroll',
    name: 'Relance',
    description: 'Force une relance du dé',
    category: 'power-up',
    trigger: TriggerType.ON_DICE_ROLL,
    triggerValue: 1,
    conditions: [],
    effects: [{ type: ActionType.REROLL_DICE, value: 1, target: 'self' }],
    difficulty: 'medium',
    tags: ['dice', 'chance']
  },
  {
    id: 'tpl-slow-others',
    name: 'Ralentir les Autres',
    description: 'Ralentit tous les autres joueurs',
    category: 'power-up',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.APPLY_SLOW, value: 1, target: 'others', duration: 2 }],
    difficulty: 'hard',
    tags: ['power-up', 'aggressive']
  },
  {
    id: 'tpl-speed-others',
    name: 'Accélérer les Autres',
    description: 'Accélère tous les autres joueurs',
    category: 'power-up',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.APPLY_SPEED_BOOST, value: 1, target: 'others', duration: 2 }],
    difficulty: 'medium',
    tags: ['power-up', 'chaotic']
  },
  {
    id: 'tpl-skip-leader',
    name: 'Handicaper le Leader',
    description: 'Le leader passe son prochain tour',
    category: 'power-up',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.SKIP_TURN, value: 1, target: 'leader' }],
    difficulty: 'hard',
    tags: ['power-up', 'aggressive']
  },
  {
    id: 'tpl-extra-turn-six',
    name: 'Lucky Six',
    description: 'Tour supplémentaire en faisant un 6',
    category: 'power-up',
    trigger: TriggerType.ON_DICE_ROLL,
    triggerValue: 6,
    conditions: [],
    effects: [{ type: ActionType.EXTRA_TURN, value: 1, target: 'self' }],
    difficulty: 'easy',
    tags: ['dice', 'bonus']
  },
  {
    id: 'tpl-combo-shield',
    name: 'Armure Complète',
    description: 'Bouclier + Bonus de vitesse',
    category: 'power-up',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [
      { type: ActionType.APPLY_SHIELD, value: 1, target: 'self', duration: 2 },
      { type: ActionType.APPLY_SPEED_BOOST, value: 1, target: 'self', duration: 2 }
    ],
    difficulty: 'hard',
    tags: ['power-up', 'combo', 'rare']
  },
  {
    id: 'tpl-combo-double',
    name: 'Super Puissance',
    description: 'Double dé + Tour supplémentaire',
    category: 'power-up',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [
      { type: ActionType.APPLY_DOUBLE_DICE, value: 1, target: 'self', duration: 1 },
      { type: ActionType.EXTRA_TURN, value: 1, target: 'self' }
    ],
    difficulty: 'hard',
    tags: ['power-up', 'combo', 'rare']
  },
  {
    id: 'tpl-dispel',
    name: 'Dissipation',
    description: 'Inverse le dernier effet appliqué',
    category: 'power-up',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.REVERSE_LAST_EFFECT, value: 0, target: 'self' }],
    difficulty: 'medium',
    tags: ['power-up', 'counter']
  }
];

// ================================
// INTERACTION TEMPLATES (10)
// ================================

export const interactionTemplates: RuleTemplate[] = [
  {
    id: 'tpl-same-tile-duel',
    name: 'Duel',
    description: 'Repousse les autres joueurs sur la même case',
    category: 'interaction',
    trigger: TriggerType.ON_SAME_TILE,
    conditions: [],
    effects: [{ type: ActionType.MOVE_RELATIVE, value: -3, target: 'others' }],
    difficulty: 'medium',
    tags: ['interaction', 'same-tile']
  },
  {
    id: 'tpl-same-tile-party',
    name: 'Fête',
    description: 'Tous gagnent des points en étant sur la même case',
    category: 'interaction',
    trigger: TriggerType.ON_SAME_TILE,
    conditions: [],
    effects: [{ type: ActionType.MODIFY_SCORE, value: 50, target: 'all' }],
    difficulty: 'easy',
    tags: ['interaction', 'same-tile', 'party']
  },
  {
    id: 'tpl-overtake-bonus',
    name: 'Dépassement Récompensé',
    description: 'Bonus de points en dépassant un joueur',
    category: 'interaction',
    trigger: TriggerType.ON_OVERTAKE,
    conditions: [],
    effects: [{ type: ActionType.MODIFY_SCORE, value: 30, target: 'self' }],
    difficulty: 'easy',
    tags: ['interaction', 'overtake']
  },
  {
    id: 'tpl-overtake-attack',
    name: 'Attaque au Dépassement',
    description: 'Ralentit le joueur dépassé',
    category: 'interaction',
    trigger: TriggerType.ON_OVERTAKE,
    conditions: [],
    effects: [{ type: ActionType.APPLY_SLOW, value: 1, target: 'others', duration: 1 }],
    difficulty: 'medium',
    tags: ['interaction', 'overtake', 'aggressive']
  },
  {
    id: 'tpl-overtaken-revenge',
    name: 'Revanche',
    description: 'Bonus de vitesse quand on est dépassé',
    category: 'interaction',
    trigger: TriggerType.ON_GET_OVERTAKEN,
    conditions: [],
    effects: [{ type: ActionType.APPLY_SPEED_BOOST, value: 2, target: 'self', duration: 2 }],
    difficulty: 'medium',
    tags: ['interaction', 'overtaken', 'comeback']
  },
  {
    id: 'tpl-bypass-steal',
    name: 'Pickpocket',
    description: 'Vole des points en passant devant un joueur',
    category: 'interaction',
    trigger: TriggerType.ON_PLAYER_BYPASS,
    conditions: [],
    effects: [{ type: ActionType.APPLY_STEAL_POINTS, value: 25, target: 'others' }],
    difficulty: 'medium',
    tags: ['interaction', 'bypass', 'steal']
  },
  {
    id: 'tpl-bypass-swap',
    name: 'Échange au Passage',
    description: 'Chance d\'échanger de position en passant',
    category: 'interaction',
    trigger: TriggerType.ON_PLAYER_BYPASS,
    conditions: [],
    effects: [{ type: ActionType.SWAP_POSITIONS, value: 0, target: 'others' }],
    difficulty: 'hard',
    tags: ['interaction', 'bypass', 'swap']
  },
  {
    id: 'tpl-first-move-bonus',
    name: 'Premier Mouvement',
    description: 'Bonus de points au premier mouvement',
    category: 'interaction',
    trigger: TriggerType.ON_FIRST_MOVE,
    conditions: [],
    effects: [{ type: ActionType.MODIFY_SCORE, value: 100, target: 'self' }],
    difficulty: 'easy',
    tags: ['flow', 'bonus']
  },
  {
    id: 'tpl-game-start-shield',
    name: 'Protection Initiale',
    description: 'Tous les joueurs commencent avec un bouclier',
    category: 'interaction',
    trigger: TriggerType.ON_GAME_START,
    conditions: [],
    effects: [{ type: ActionType.APPLY_SHIELD, value: 1, target: 'all', duration: 2 }],
    difficulty: 'easy',
    tags: ['flow', 'defensive']
  },
  {
    id: 'tpl-near-victory-slow',
    name: 'Tension Finale',
    description: 'Ralentissement près de la victoire',
    category: 'interaction',
    trigger: TriggerType.ON_NEAR_VICTORY,
    conditions: [],
    effects: [{ type: ActionType.APPLY_SLOW, value: 1, target: 'self', duration: 2 }],
    difficulty: 'medium',
    tags: ['position', 'balance']
  }
];

// ================================
// DICE TEMPLATES (5)
// ================================

export const diceTemplates: RuleTemplate[] = [
  {
    id: 'tpl-dice-1-penalty',
    name: 'Malchance (1)',
    description: 'Pénalité quand on fait 1',
    category: 'dice',
    trigger: TriggerType.ON_DICE_ROLL,
    triggerValue: 1,
    conditions: [],
    effects: [{ type: ActionType.MODIFY_SCORE, value: -25, target: 'self' }],
    difficulty: 'easy',
    tags: ['dice', 'penalty']
  },
  {
    id: 'tpl-dice-6-bonus',
    name: 'Chance (6)',
    description: 'Bonus quand on fait 6',
    category: 'dice',
    trigger: TriggerType.ON_DICE_ROLL,
    triggerValue: 6,
    conditions: [],
    effects: [{ type: ActionType.MODIFY_SCORE, value: 50, target: 'self' }],
    difficulty: 'easy',
    tags: ['dice', 'bonus']
  },
  {
    id: 'tpl-consecutive-six',
    name: 'Double 6 = Prison',
    description: 'Retour au départ après 2 six consécutifs',
    category: 'dice',
    trigger: TriggerType.ON_CONSECUTIVE_SIX,
    triggerValue: 2,
    conditions: [],
    effects: [{ type: ActionType.BACK_TO_START, value: 0, target: 'self' }],
    difficulty: 'medium',
    tags: ['dice', 'penalty', 'classic']
  },
  {
    id: 'tpl-dice-double-3',
    name: 'Triple Magique',
    description: 'Double dé quand on fait 3',
    category: 'dice',
    trigger: TriggerType.ON_DICE_ROLL,
    triggerValue: 3,
    conditions: [],
    effects: [{ type: ActionType.APPLY_DOUBLE_DICE, value: 1, target: 'self', duration: 1 }],
    difficulty: 'medium',
    tags: ['dice', 'power-up']
  },
  {
    id: 'tpl-dice-4-shield',
    name: 'Quatre Protecteur',
    description: 'Bouclier quand on fait 4',
    category: 'dice',
    trigger: TriggerType.ON_DICE_ROLL,
    triggerValue: 4,
    conditions: [],
    effects: [{ type: ActionType.APPLY_SHIELD, value: 1, target: 'self', duration: 1 }],
    difficulty: 'medium',
    tags: ['dice', 'defensive']
  }
];

// ================================
// META TEMPLATES (5)
// ================================

export const metaTemplates: RuleTemplate[] = [
  {
    id: 'tpl-copy-last',
    name: 'Copie',
    description: 'Copie le dernier effet appliqué',
    category: 'meta',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.COPY_LAST_EFFECT, value: 0, target: 'self' }],
    difficulty: 'hard',
    tags: ['meta', 'copy']
  },
  {
    id: 'tpl-reverse-last',
    name: 'Inversion',
    description: 'Inverse le dernier effet appliqué',
    category: 'meta',
    trigger: TriggerType.ON_LAND,
    conditions: [],
    effects: [{ type: ActionType.REVERSE_LAST_EFFECT, value: 0, target: 'self' }],
    difficulty: 'hard',
    tags: ['meta', 'counter']
  },
  {
    id: 'tpl-leader-burden',
    name: 'Fardeau du Leader',
    description: 'Le leader est ralenti à chaque tour',
    category: 'meta',
    trigger: TriggerType.ON_TURN_START,
    conditions: [
      { type: ConditionType.PLAYER_RANK, operator: 'eq', value: 1, target: 'self' }
    ],
    effects: [{ type: ActionType.APPLY_SLOW, value: 1, target: 'self', duration: 1 }],
    difficulty: 'hard',
    tags: ['meta', 'balance']
  },
  {
    id: 'tpl-comeback-mechanic',
    name: 'Comeback',
    description: 'Le dernier reçoit un boost',
    category: 'meta',
    trigger: TriggerType.ON_TURN_START,
    conditions: [
      { type: ConditionType.PLAYER_RANK, operator: 'eq', value: 4, target: 'self' }
    ],
    effects: [{ type: ActionType.APPLY_SPEED_BOOST, value: 2, target: 'self', duration: 1 }],
    difficulty: 'hard',
    tags: ['meta', 'balance', 'comeback']
  },
  {
    id: 'tpl-score-milestone',
    name: 'Milestone de Score',
    description: 'Bonus en atteignant un seuil de points',
    category: 'meta',
    trigger: TriggerType.ON_SCORE_THRESHOLD,
    triggerValue: 500,
    conditions: [],
    effects: [{ type: ActionType.APPLY_SHIELD, value: 1, target: 'self', duration: 2 }],
    difficulty: 'medium',
    tags: ['meta', 'score', 'milestone']
  }
];

// ================================
// EXPORT ALL TEMPLATES
// ================================

export const allTemplates: RuleTemplate[] = [
  ...movementTemplates,
  ...scoreTemplates,
  ...powerUpTemplates,
  ...interactionTemplates,
  ...diceTemplates,
  ...metaTemplates
];

export function getTemplateById(templateId: string): RuleTemplate | undefined {
  return allTemplates.find(t => t.id === templateId);
}

export function getTemplatesByCategory(category: string): RuleTemplate[] {
  return allTemplates.filter(t => t.category === category);
}

export function getTemplatesByDifficulty(difficulty: string): RuleTemplate[] {
  return allTemplates.filter(t => t.difficulty === difficulty);
}

export function getTemplatesByTag(tag: string): RuleTemplate[] {
  return allTemplates.filter(t => t.tags.includes(tag));
}

export function searchTemplates(query: string): RuleTemplate[] {
  const lowerQuery = query.toLowerCase();
  return allTemplates.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

export function getRandomTemplates(count: number): RuleTemplate[] {
  const shuffled = [...allTemplates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
