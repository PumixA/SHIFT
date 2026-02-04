import { Rule, TriggerType, ActionType, RulePackDefinition, ConditionType } from '../types/rules';

/**
 * Default Rule Packs - 10+ predefined rule sets
 */

// ================================
// PACK 1: VANILLA (No rules)
// ================================
export const vanillaPack: RulePackDefinition = {
  id: 'vanilla',
  name: 'Vanilla',
  description: 'Le jeu de base sans règles spéciales. Parfait pour apprendre.',
  rules: [],
  difficulty: 'easy',
  playerCount: { min: 2, max: 4 },
  estimatedDuration: '5-10 min',
  tags: ['beginner', 'simple', 'classic'],
  isDefault: true
};

// ================================
// PACK 2: CLASSIC
// ================================
export const classicPack: RulePackDefinition = {
  id: 'classic',
  name: 'Classique',
  description: 'Des bonus et des pièges sur certaines cases. L\'expérience SHIFT traditionnelle.',
  rules: [
    {
      id: 'classic-turbo-5',
      title: 'Turbo Boost',
      trigger: TriggerType.ON_LAND,
      tileIndex: 5,
      conditions: [],
      effects: [{ type: ActionType.MOVE_RELATIVE, value: 2, target: 'self' }],
      priority: 1,
      tags: ['bonus', 'movement']
    },
    {
      id: 'classic-trap-10',
      title: 'Piège',
      trigger: TriggerType.ON_LAND,
      tileIndex: 10,
      conditions: [],
      effects: [{ type: ActionType.MOVE_RELATIVE, value: -3, target: 'self' }],
      priority: 1,
      tags: ['trap', 'movement']
    },
    {
      id: 'classic-bonus-15',
      title: 'Bonus Points',
      trigger: TriggerType.ON_LAND,
      tileIndex: 15,
      conditions: [],
      effects: [{ type: ActionType.MODIFY_SCORE, value: 100, target: 'self' }],
      priority: 1,
      tags: ['bonus', 'score']
    }
  ],
  difficulty: 'easy',
  playerCount: { min: 2, max: 4 },
  estimatedDuration: '10-15 min',
  tags: ['beginner', 'balanced', 'classic'],
  isDefault: true
};

// ================================
// PACK 3: CHAOS
// ================================
export const chaosPack: RulePackDefinition = {
  id: 'chaos',
  name: 'Chaos',
  description: 'Téléportations aléatoires et effets imprévisibles. Rien n\'est sûr!',
  rules: [
    {
      id: 'chaos-teleport-3',
      title: 'Portail A',
      trigger: TriggerType.ON_LAND,
      tileIndex: 3,
      conditions: [],
      effects: [{ type: ActionType.TELEPORT, value: 12, target: 'self' }],
      priority: 1,
      tags: ['teleport', 'chaos']
    },
    {
      id: 'chaos-teleport-12',
      title: 'Portail B',
      trigger: TriggerType.ON_LAND,
      tileIndex: 12,
      conditions: [],
      effects: [{ type: ActionType.TELEPORT, value: 3, target: 'self' }],
      priority: 1,
      tags: ['teleport', 'chaos']
    },
    {
      id: 'chaos-random-7',
      title: 'Case Mystère',
      trigger: TriggerType.ON_LAND,
      tileIndex: 7,
      conditions: [],
      effects: [{ type: ActionType.MOVE_RANDOM, value: 0, target: 'self' }],
      priority: 1,
      tags: ['random', 'chaos']
    },
    {
      id: 'chaos-swap-14',
      title: 'Échange',
      trigger: TriggerType.ON_LAND,
      tileIndex: 14,
      conditions: [],
      effects: [{ type: ActionType.SWAP_POSITIONS, value: 0, target: 'others' }],
      priority: 1,
      tags: ['interaction', 'chaos']
    },
    {
      id: 'chaos-dice6-bonus',
      title: 'Lucky 6',
      trigger: TriggerType.ON_DICE_ROLL,
      tileIndex: 6, // Dice value 6
      conditions: [],
      effects: [{ type: ActionType.EXTRA_TURN, value: 1, target: 'self' }],
      priority: 1,
      tags: ['dice', 'bonus']
    }
  ],
  difficulty: 'medium',
  playerCount: { min: 2, max: 4 },
  estimatedDuration: '15-25 min',
  tags: ['chaotic', 'unpredictable', 'fun'],
  isDefault: true
};

// ================================
// PACK 4: SPEED RUN
// ================================
export const speedRunPack: RulePackDefinition = {
  id: 'speed-run',
  name: 'Speed Run',
  description: 'Course effrénée vers la victoire! Bonus de vitesse et tours supplémentaires.',
  rules: [
    {
      id: 'speed-turbo-every5',
      title: 'Zones Turbo',
      trigger: TriggerType.ON_LAND,
      tileIndex: 5,
      conditions: [],
      effects: [{ type: ActionType.MOVE_RELATIVE, value: 3, target: 'self' }],
      priority: 1
    },
    {
      id: 'speed-turbo-10',
      title: 'Super Turbo',
      trigger: TriggerType.ON_LAND,
      tileIndex: 10,
      conditions: [],
      effects: [{ type: ActionType.MOVE_RELATIVE, value: 4, target: 'self' }],
      priority: 1
    },
    {
      id: 'speed-double-dice',
      title: 'Double Dé',
      trigger: TriggerType.ON_LAND,
      tileIndex: 8,
      conditions: [],
      effects: [{ type: ActionType.APPLY_DOUBLE_DICE, value: 2, target: 'self', duration: 2 }],
      priority: 1
    },
    {
      id: 'speed-extra-turn',
      title: 'Tour Bonus',
      trigger: TriggerType.ON_LAND,
      tileIndex: 15,
      conditions: [],
      effects: [{ type: ActionType.EXTRA_TURN, value: 1, target: 'self' }],
      priority: 1
    },
    {
      id: 'speed-boost-start',
      title: 'Départ Rapide',
      trigger: TriggerType.ON_GAME_START,
      conditions: [],
      effects: [{ type: ActionType.APPLY_SPEED_BOOST, value: 1, target: 'all', duration: 3 }],
      priority: 1
    }
  ],
  difficulty: 'easy',
  playerCount: { min: 2, max: 4 },
  estimatedDuration: '5-10 min',
  tags: ['fast', 'speed', 'racing']
};

// ================================
// PACK 5: SURVIVAL
// ================================
export const survivalPack: RulePackDefinition = {
  id: 'survival',
  name: 'Survie',
  description: 'Boucliers, attaques et effets défensifs. Survivez jusqu\'à la fin!',
  rules: [
    {
      id: 'survival-shield-4',
      title: 'Bouclier',
      trigger: TriggerType.ON_LAND,
      tileIndex: 4,
      conditions: [],
      effects: [{ type: ActionType.APPLY_SHIELD, value: 1, target: 'self', duration: 3 }],
      priority: 1
    },
    {
      id: 'survival-trap-8',
      title: 'Piège Mortel',
      trigger: TriggerType.ON_LAND,
      tileIndex: 8,
      conditions: [],
      effects: [{ type: ActionType.BACK_TO_START, value: 0, target: 'self' }],
      priority: 1
    },
    {
      id: 'survival-slow-12',
      title: 'Zone de Ralentissement',
      trigger: TriggerType.ON_LAND,
      tileIndex: 12,
      conditions: [],
      effects: [{ type: ActionType.APPLY_SLOW, value: 2, target: 'self', duration: 2 }],
      priority: 1
    },
    {
      id: 'survival-safe-16',
      title: 'Zone Sûre',
      trigger: TriggerType.ON_LAND,
      tileIndex: 16,
      conditions: [],
      effects: [
        { type: ActionType.APPLY_SHIELD, value: 1, target: 'self', duration: 2 },
        { type: ActionType.MODIFY_SCORE, value: 50, target: 'self' }
      ],
      priority: 1
    },
    {
      id: 'survival-bypass-attack',
      title: 'Attaque au Passage',
      trigger: TriggerType.ON_PLAYER_BYPASS,
      conditions: [],
      effects: [{ type: ActionType.APPLY_SLOW, value: 1, target: 'others', duration: 1 }],
      priority: 2
    }
  ],
  difficulty: 'medium',
  playerCount: { min: 2, max: 4 },
  estimatedDuration: '15-20 min',
  tags: ['survival', 'defensive', 'strategic']
};

// ================================
// PACK 6: ECONOMY
// ================================
export const economyPack: RulePackDefinition = {
  id: 'economy',
  name: 'Économie',
  description: 'Gagnez, perdez et volez des points. La richesse mène à la victoire!',
  rules: [
    {
      id: 'economy-gold-3',
      title: 'Mine d\'Or',
      trigger: TriggerType.ON_LAND,
      tileIndex: 3,
      conditions: [],
      effects: [{ type: ActionType.MODIFY_SCORE, value: 200, target: 'self' }],
      priority: 1
    },
    {
      id: 'economy-tax-7',
      title: 'Taxe',
      trigger: TriggerType.ON_LAND,
      tileIndex: 7,
      conditions: [],
      effects: [{ type: ActionType.MODIFY_SCORE, value: -100, target: 'self' }],
      priority: 1
    },
    {
      id: 'economy-steal-11',
      title: 'Voleur',
      trigger: TriggerType.ON_LAND,
      tileIndex: 11,
      conditions: [],
      effects: [{ type: ActionType.APPLY_STEAL_POINTS, value: 150, target: 'leader' }],
      priority: 1
    },
    {
      id: 'economy-jackpot-15',
      title: 'Jackpot',
      trigger: TriggerType.ON_LAND,
      tileIndex: 15,
      conditions: [],
      effects: [{ type: ActionType.MODIFY_SCORE, value: 500, target: 'self' }],
      priority: 1
    },
    {
      id: 'economy-turn-income',
      title: 'Revenu Passif',
      trigger: TriggerType.ON_TURN_START,
      conditions: [],
      effects: [{ type: ActionType.MODIFY_SCORE, value: 25, target: 'self' }],
      priority: 3
    },
    {
      id: 'economy-same-tile-steal',
      title: 'Confrontation',
      trigger: TriggerType.ON_SAME_TILE,
      conditions: [],
      effects: [{ type: ActionType.APPLY_STEAL_POINTS, value: 50, target: 'others' }],
      priority: 2
    }
  ],
  difficulty: 'medium',
  playerCount: { min: 2, max: 4 },
  estimatedDuration: '15-25 min',
  tags: ['economy', 'points', 'competitive']
};

// ================================
// PACK 7: MYSTERY
// ================================
export const mysteryPack: RulePackDefinition = {
  id: 'mystery',
  name: 'Mystère',
  description: 'Effets aléatoires et surprises à chaque case. Le destin décide!',
  rules: [
    {
      id: 'mystery-random-2',
      title: 'Case Mystère 1',
      trigger: TriggerType.ON_LAND,
      tileIndex: 2,
      conditions: [],
      effects: [{ type: ActionType.MOVE_RANDOM, value: 0, target: 'self' }],
      priority: 1
    },
    {
      id: 'mystery-random-6',
      title: 'Case Mystère 2',
      trigger: TriggerType.ON_LAND,
      tileIndex: 6,
      conditions: [],
      effects: [{ type: ActionType.COPY_LAST_EFFECT, value: 0, target: 'self' }],
      priority: 1
    },
    {
      id: 'mystery-random-10',
      title: 'Case Mystère 3',
      trigger: TriggerType.ON_LAND,
      tileIndex: 10,
      conditions: [],
      effects: [{ type: ActionType.REVERSE_LAST_EFFECT, value: 0, target: 'self' }],
      priority: 1
    },
    {
      id: 'mystery-dice-1',
      title: 'Malchance',
      trigger: TriggerType.ON_DICE_ROLL,
      tileIndex: 1,
      conditions: [],
      effects: [{ type: ActionType.SKIP_TURN, value: 1, target: 'self' }],
      priority: 1
    },
    {
      id: 'mystery-dice-6',
      title: 'Chance',
      trigger: TriggerType.ON_DICE_ROLL,
      tileIndex: 6,
      conditions: [],
      effects: [
        { type: ActionType.APPLY_DOUBLE_DICE, value: 1, target: 'self', duration: 1 },
        { type: ActionType.EXTRA_TURN, value: 1, target: 'self' }
      ],
      priority: 1
    }
  ],
  difficulty: 'medium',
  playerCount: { min: 2, max: 4 },
  estimatedDuration: '15-25 min',
  tags: ['mystery', 'random', 'surprise']
};

// ================================
// PACK 8: COMBAT
// ================================
export const combatPack: RulePackDefinition = {
  id: 'combat',
  name: 'Combat',
  description: 'Interactions agressives entre joueurs. Attaquez et défendez-vous!',
  rules: [
    {
      id: 'combat-same-tile',
      title: 'Duel',
      trigger: TriggerType.ON_SAME_TILE,
      conditions: [],
      effects: [{ type: ActionType.MOVE_RELATIVE, value: -2, target: 'others' }],
      priority: 1
    },
    {
      id: 'combat-overtake',
      title: 'Charge',
      trigger: TriggerType.ON_OVERTAKE,
      conditions: [],
      effects: [{ type: ActionType.APPLY_SLOW, value: 2, target: 'others', duration: 1 }],
      priority: 1
    },
    {
      id: 'combat-bypass',
      title: 'Coup Bas',
      trigger: TriggerType.ON_PLAYER_BYPASS,
      conditions: [],
      effects: [{ type: ActionType.APPLY_STEAL_POINTS, value: 50, target: 'others' }],
      priority: 1
    },
    {
      id: 'combat-shield-5',
      title: 'Armure',
      trigger: TriggerType.ON_LAND,
      tileIndex: 5,
      conditions: [],
      effects: [{ type: ActionType.APPLY_SHIELD, value: 1, target: 'self', duration: 3 }],
      priority: 1
    },
    {
      id: 'combat-invisibility-13',
      title: 'Invisibilité',
      trigger: TriggerType.ON_LAND,
      tileIndex: 13,
      conditions: [],
      effects: [{ type: ActionType.APPLY_INVISIBILITY, value: 1, target: 'self', duration: 2 }],
      priority: 1
    },
    {
      id: 'combat-weapon-9',
      title: 'Arme Secrète',
      trigger: TriggerType.ON_LAND,
      tileIndex: 9,
      conditions: [],
      effects: [{ type: ActionType.BACK_TO_START, value: 0, target: 'leader' }],
      priority: 1
    }
  ],
  difficulty: 'hard',
  playerCount: { min: 2, max: 4 },
  estimatedDuration: '20-30 min',
  tags: ['combat', 'aggressive', 'pvp']
};

// ================================
// PACK 9: RACE
// ================================
export const racePack: RulePackDefinition = {
  id: 'race',
  name: 'Course',
  description: 'Pure vitesse! Peu de pièges, beaucoup de bonus de mouvement.',
  rules: [
    {
      id: 'race-turbo-3',
      title: 'Boost 1',
      trigger: TriggerType.ON_LAND,
      tileIndex: 3,
      conditions: [],
      effects: [{ type: ActionType.MOVE_RELATIVE, value: 2, target: 'self' }],
      priority: 1
    },
    {
      id: 'race-turbo-7',
      title: 'Boost 2',
      trigger: TriggerType.ON_LAND,
      tileIndex: 7,
      conditions: [],
      effects: [{ type: ActionType.MOVE_RELATIVE, value: 3, target: 'self' }],
      priority: 1
    },
    {
      id: 'race-turbo-11',
      title: 'Boost 3',
      trigger: TriggerType.ON_LAND,
      tileIndex: 11,
      conditions: [],
      effects: [{ type: ActionType.MOVE_RELATIVE, value: 2, target: 'self' }],
      priority: 1
    },
    {
      id: 'race-turbo-14',
      title: 'Super Boost',
      trigger: TriggerType.ON_LAND,
      tileIndex: 14,
      conditions: [],
      effects: [{ type: ActionType.MOVE_RELATIVE, value: 4, target: 'self' }],
      priority: 1
    },
    {
      id: 'race-speed-boost',
      title: 'Nitro',
      trigger: TriggerType.ON_LAND,
      tileIndex: 17,
      conditions: [],
      effects: [{ type: ActionType.APPLY_SPEED_BOOST, value: 2, target: 'self', duration: 2 }],
      priority: 1
    },
    {
      id: 'race-pit-stop',
      title: 'Pit Stop',
      trigger: TriggerType.ON_LAND,
      tileIndex: 10,
      conditions: [],
      effects: [{ type: ActionType.SKIP_TURN, value: 1, target: 'self' }],
      priority: 1
    }
  ],
  difficulty: 'easy',
  playerCount: { min: 2, max: 4 },
  estimatedDuration: '5-10 min',
  tags: ['race', 'fast', 'simple']
};

// ================================
// PACK 10: EXPERT
// ================================
export const expertPack: RulePackDefinition = {
  id: 'expert',
  name: 'Expert',
  description: 'Conditions complexes et stratégie avancée. Pour les joueurs expérimentés!',
  rules: [
    {
      id: 'expert-leader-penalty',
      title: 'Fardeau du Leader',
      trigger: TriggerType.ON_TURN_START,
      conditions: [
        { type: ConditionType.PLAYER_RANK, operator: 'eq', value: 1, target: 'self' }
      ],
      effects: [{ type: ActionType.APPLY_SLOW, value: 1, target: 'self', duration: 1 }],
      priority: 1
    },
    {
      id: 'expert-comeback',
      title: 'Comeback',
      trigger: TriggerType.ON_TURN_START,
      conditions: [
        { type: ConditionType.PLAYER_RANK, operator: 'eq', value: 4, target: 'self' }
      ],
      effects: [{ type: ActionType.APPLY_SPEED_BOOST, value: 2, target: 'self', duration: 2 }],
      priority: 1
    },
    {
      id: 'expert-half-board',
      title: 'Mi-Parcours',
      trigger: TriggerType.ON_HALF_BOARD,
      conditions: [],
      effects: [
        { type: ActionType.MODIFY_SCORE, value: 100, target: 'self' },
        { type: ActionType.APPLY_DOUBLE_DICE, value: 1, target: 'self', duration: 1 }
      ],
      priority: 1
    },
    {
      id: 'expert-near-victory',
      title: 'Sprint Final',
      trigger: TriggerType.ON_NEAR_VICTORY,
      conditions: [],
      effects: [{ type: ActionType.APPLY_SLOW, value: 1, target: 'all', duration: 2 }],
      priority: 1
    },
    {
      id: 'expert-score-threshold',
      title: 'Richesse = Pouvoir',
      trigger: TriggerType.ON_SCORE_THRESHOLD,
      tileIndex: 500,
      conditions: [],
      effects: [{ type: ActionType.APPLY_SHIELD, value: 1, target: 'self', duration: 3 }],
      priority: 1
    },
    {
      id: 'expert-consecutive-six',
      title: 'Chance du Diable',
      trigger: TriggerType.ON_CONSECUTIVE_SIX,
      tileIndex: 2,
      conditions: [],
      effects: [{ type: ActionType.BACK_TO_START, value: 0, target: 'self' }],
      priority: 1
    }
  ],
  difficulty: 'expert',
  playerCount: { min: 2, max: 4 },
  estimatedDuration: '25-40 min',
  tags: ['expert', 'strategic', 'complex']
};

// ================================
// PACK 11: PARTY
// ================================
export const partyPack: RulePackDefinition = {
  id: 'party',
  name: 'Party',
  description: 'Mode fête avec beaucoup d\'interactions et de surprises. Parfait entre amis!',
  rules: [
    {
      id: 'party-swap-5',
      title: 'Musical Chairs',
      trigger: TriggerType.ON_LAND,
      tileIndex: 5,
      conditions: [],
      effects: [{ type: ActionType.SWAP_POSITIONS, value: 0, target: 'random' }],
      priority: 1
    },
    {
      id: 'party-everyone-moves',
      title: 'Conga Line',
      trigger: TriggerType.ON_LAND,
      tileIndex: 10,
      conditions: [],
      effects: [{ type: ActionType.MOVE_RELATIVE, value: 2, target: 'all' }],
      priority: 1
    },
    {
      id: 'party-points-all',
      title: 'Distribution',
      trigger: TriggerType.ON_LAND,
      tileIndex: 15,
      conditions: [],
      effects: [{ type: ActionType.MODIFY_SCORE, value: 100, target: 'all' }],
      priority: 1
    },
    {
      id: 'party-random-effect',
      title: 'Roulette',
      trigger: TriggerType.ON_DICE_ROLL,
      tileIndex: 3,
      conditions: [],
      effects: [{ type: ActionType.COPY_LAST_EFFECT, value: 0, target: 'self' }],
      priority: 1
    },
    {
      id: 'party-same-tile-party',
      title: 'Rencontre',
      trigger: TriggerType.ON_SAME_TILE,
      conditions: [],
      effects: [
        { type: ActionType.MODIFY_SCORE, value: 50, target: 'self' },
        { type: ActionType.MODIFY_SCORE, value: 50, target: 'others' }
      ],
      priority: 1
    }
  ],
  difficulty: 'easy',
  playerCount: { min: 3, max: 4 },
  estimatedDuration: '15-20 min',
  tags: ['party', 'fun', 'multiplayer']
};

// ================================
// EXPORT ALL PACKS
// ================================
export const defaultRulePacks: RulePackDefinition[] = [
  vanillaPack,
  classicPack,
  chaosPack,
  speedRunPack,
  survivalPack,
  economyPack,
  mysteryPack,
  combatPack,
  racePack,
  expertPack,
  partyPack
];

export function getDefaultPackById(packId: string): RulePackDefinition | undefined {
  return defaultRulePacks.find(p => p.id === packId);
}

export function getDefaultPacks(): RulePackDefinition[] {
  return defaultRulePacks;
}

export function getPacksByDifficulty(difficulty: string): RulePackDefinition[] {
  return defaultRulePacks.filter(p => p.difficulty === difficulty);
}

export function getPacksByTag(tag: string): RulePackDefinition[] {
  return defaultRulePacks.filter(p => p.tags.includes(tag));
}
