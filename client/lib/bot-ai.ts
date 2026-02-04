/**
 * Bot AI Logic for SHIFT
 * Provides intelligent decision-making for AI players
 */

import { Rule, TriggerType, ActionType } from "@/src/types/rules"

export type BotDifficulty = 'easy' | 'medium' | 'hard'

export interface BotPlayer {
  id: string
  name: string
  color: string
  difficulty: BotDifficulty
  score: number
  position: number
  effects: BotEffect[]
}

export interface BotEffect {
  type: string
  turnsRemaining: number
  value?: number
}

export interface GameState {
  tiles: GameTile[]
  players: PlayerState[]
  rules: Rule[]
  currentPlayerId: string
  turnNumber: number
}

export interface GameTile {
  id: string
  x: number
  y: number
  type: string
  effects?: TileEffect[]
}

export interface TileEffect {
  ruleId: string
  actionType: string
  value?: number
}

export interface PlayerState {
  id: string
  name: string
  position: number
  score: number
  isBot: boolean
  botDifficulty?: BotDifficulty
}

export interface BotDecision {
  action: 'roll_dice' | 'add_rule' | 'modify_rule' | 'add_tile' | 'remove_tile' | 'skip'
  details?: Record<string, any>
  reasoning?: string
}

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy: {
    thinkingDelay: 1500,
    mistakeChance: 0.3,
    ruleCreationChance: 0.1,
    tileModificationChance: 0.05,
    lookAheadTiles: 2,
    considerOpponents: false,
  },
  medium: {
    thinkingDelay: 1000,
    mistakeChance: 0.1,
    ruleCreationChance: 0.3,
    tileModificationChance: 0.15,
    lookAheadTiles: 4,
    considerOpponents: true,
  },
  hard: {
    thinkingDelay: 500,
    mistakeChance: 0.02,
    ruleCreationChance: 0.5,
    tileModificationChance: 0.3,
    lookAheadTiles: 6,
    considerOpponents: true,
  },
}

/**
 * Main Bot AI class
 */
export class BotAI {
  private difficulty: BotDifficulty
  private settings: typeof DIFFICULTY_SETTINGS['easy']

  constructor(difficulty: BotDifficulty = 'medium') {
    this.difficulty = difficulty
    this.settings = DIFFICULTY_SETTINGS[difficulty]
  }

  /**
   * Decide what action the bot should take
   */
  async decideAction(
    bot: BotPlayer,
    gameState: GameState,
    canModify: boolean
  ): Promise<BotDecision> {
    // Simulate thinking time
    await this.think()

    // Easy bot sometimes makes random decisions
    if (this.shouldMakeMistake()) {
      return this.makeRandomDecision(canModify)
    }

    // Analyze game state
    const analysis = this.analyzeGameState(bot, gameState)

    // If can modify and it's beneficial, consider modifications
    if (canModify && this.shouldModifyGame(analysis)) {
      const modification = this.decideModification(bot, gameState, analysis)
      if (modification) return modification
    }

    // Default action: roll dice
    return {
      action: 'roll_dice',
      reasoning: 'Tour standard - lancer le dé',
    }
  }

  /**
   * Simulate thinking delay
   */
  private async think(): Promise<void> {
    const delay = this.settings.thinkingDelay + Math.random() * 500
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Check if bot should make a "mistake" (for easier difficulties)
   */
  private shouldMakeMistake(): boolean {
    return Math.random() < this.settings.mistakeChance
  }

  /**
   * Make a random decision (for easy mode or mistakes)
   */
  private makeRandomDecision(canModify: boolean): BotDecision {
    if (canModify && Math.random() < 0.2) {
      return {
        action: 'skip',
        reasoning: 'Décision aléatoire - passer',
      }
    }
    return {
      action: 'roll_dice',
      reasoning: 'Décision aléatoire - lancer le dé',
    }
  }

  /**
   * Analyze the current game state
   */
  private analyzeGameState(bot: BotPlayer, gameState: GameState): GameAnalysis {
    const { tiles, players, rules } = gameState
    const botPosition = bot.position
    const totalTiles = tiles.length

    // Find dangerous and beneficial tiles ahead
    const tilesAhead = this.getTilesAhead(botPosition, tiles, this.settings.lookAheadTiles)
    const dangerousTiles = tilesAhead.filter(t => this.isTileDangerous(t, rules))
    const beneficialTiles = tilesAhead.filter(t => this.isTileBeneficial(t, rules))

    // Analyze opponents
    let opponentAnalysis: OpponentAnalysis | null = null
    if (this.settings.considerOpponents) {
      const opponents = players.filter(p => p.id !== bot.id)
      opponentAnalysis = this.analyzeOpponents(bot, opponents, tiles)
    }

    // Calculate scores and positions
    const isWinning = this.isLeading(bot, players)
    const distanceToEnd = totalTiles - botPosition - 1
    const turnUrgency = this.calculateUrgency(bot, players, distanceToEnd)

    return {
      tilesAhead,
      dangerousTiles,
      beneficialTiles,
      opponentAnalysis,
      isWinning,
      distanceToEnd,
      turnUrgency,
      activeRulesCount: rules.length,
    }
  }

  /**
   * Get tiles ahead of current position
   */
  private getTilesAhead(position: number, tiles: GameTile[], count: number): GameTile[] {
    // Sort tiles by position (assuming linear board for simplicity)
    const sortedTiles = [...tiles].sort((a, b) => a.x - b.x)
    const currentIndex = sortedTiles.findIndex(t => t.x === position)
    return sortedTiles.slice(currentIndex + 1, currentIndex + 1 + count)
  }

  /**
   * Check if a tile is dangerous
   */
  private isTileDangerous(tile: GameTile, rules: Rule[]): boolean {
    // Check rules that apply to this tile
    const applicableRules = rules.filter(r =>
      r.trigger === TriggerType.ON_LAND || r.trigger === TriggerType.ON_PASS_OVER
    )

    for (const rule of applicableRules) {
      if (rule.targetTileId === tile.id || !rule.targetTileId) {
        // Check if action is harmful
        const harmfulActions = [
          ActionType.BACK_TO_START,
          ActionType.MOVE_RELATIVE, // if negative
          ActionType.SKIP_TURN,
          ActionType.MODIFY_SCORE, // if negative
        ]
        if (harmfulActions.includes(rule.action.type as ActionType)) {
          if (rule.action.type === ActionType.MODIFY_SCORE && (rule.action.value || 0) < 0) {
            return true
          }
          if (rule.action.type === ActionType.MOVE_RELATIVE && (rule.action.value || 0) < 0) {
            return true
          }
          if ([ActionType.BACK_TO_START, ActionType.SKIP_TURN].includes(rule.action.type as ActionType)) {
            return true
          }
        }
      }
    }

    return tile.type === 'trap' || tile.type === 'danger'
  }

  /**
   * Check if a tile is beneficial
   */
  private isTileBeneficial(tile: GameTile, rules: Rule[]): boolean {
    const applicableRules = rules.filter(r =>
      r.trigger === TriggerType.ON_LAND || r.trigger === TriggerType.ON_PASS_OVER
    )

    for (const rule of applicableRules) {
      if (rule.targetTileId === tile.id || !rule.targetTileId) {
        const beneficialActions = [
          ActionType.EXTRA_TURN,
          ActionType.MODIFY_SCORE, // if positive
          ActionType.APPLY_SHIELD,
          ActionType.APPLY_DOUBLE_DICE,
        ]
        if (rule.action.type === ActionType.MODIFY_SCORE && (rule.action.value || 0) > 0) {
          return true
        }
        if (beneficialActions.includes(rule.action.type as ActionType)) {
          return true
        }
      }
    }

    return tile.type === 'bonus' || tile.type === 'special'
  }

  /**
   * Analyze opponents
   */
  private analyzeOpponents(bot: BotPlayer, opponents: PlayerState[], tiles: GameTile[]): OpponentAnalysis {
    const leader = opponents.reduce((a, b) => a.score > b.score ? a : b)
    const closest = opponents.reduce((a, b) =>
      Math.abs(a.position - bot.position) < Math.abs(b.position - bot.position) ? a : b
    )
    const nearestToEnd = opponents.reduce((a, b) =>
      (tiles.length - a.position) < (tiles.length - b.position) ? a : b
    )

    return {
      leader,
      closest,
      nearestToEnd,
      averageScore: opponents.reduce((sum, p) => sum + p.score, 0) / opponents.length,
      averagePosition: opponents.reduce((sum, p) => sum + p.position, 0) / opponents.length,
    }
  }

  /**
   * Check if bot is leading
   */
  private isLeading(bot: BotPlayer, players: PlayerState[]): boolean {
    return players.every(p => p.id === bot.id || bot.score >= p.score)
  }

  /**
   * Calculate urgency level
   */
  private calculateUrgency(bot: BotPlayer, players: PlayerState[], distanceToEnd: number): number {
    // Higher urgency if opponents are close to winning
    let urgency = 0

    for (const player of players) {
      if (player.id === bot.id) continue
      const playerDistance = players.length - player.position
      if (playerDistance < distanceToEnd) {
        urgency += (distanceToEnd - playerDistance) * 0.2
      }
      if (player.score > bot.score) {
        urgency += (player.score - bot.score) * 0.1
      }
    }

    return Math.min(1, urgency)
  }

  /**
   * Decide if bot should modify the game
   */
  private shouldModifyGame(analysis: GameAnalysis): boolean {
    // More likely to modify if losing or in danger
    let modifyChance = this.settings.ruleCreationChance

    if (!analysis.isWinning) {
      modifyChance += 0.2
    }

    if (analysis.dangerousTiles.length > 2) {
      modifyChance += 0.15
    }

    if (analysis.turnUrgency > 0.5) {
      modifyChance += 0.1
    }

    return Math.random() < modifyChance
  }

  /**
   * Decide what modification to make
   */
  private decideModification(
    bot: BotPlayer,
    gameState: GameState,
    analysis: GameAnalysis
  ): BotDecision | null {
    // Hard bot creates strategic rules
    if (this.difficulty === 'hard') {
      return this.createStrategicRule(bot, gameState, analysis)
    }

    // Medium bot creates simpler rules
    if (this.difficulty === 'medium') {
      if (Math.random() < 0.5 && analysis.dangerousTiles.length > 0) {
        return this.createDefensiveRule(bot, analysis)
      }
      return this.createSimpleRule(bot)
    }

    // Easy bot rarely creates rules
    return null
  }

  /**
   * Create a strategic rule (hard mode)
   */
  private createStrategicRule(
    bot: BotPlayer,
    gameState: GameState,
    analysis: GameAnalysis
  ): BotDecision {
    // If losing, create catch-up mechanics
    if (!analysis.isWinning && analysis.opponentAnalysis) {
      return {
        action: 'add_rule',
        details: {
          name: `Rattrapage ${bot.name}`,
          description: 'Bonus pour les joueurs en retard',
          trigger: TriggerType.ON_TURN_START,
          conditions: [{ type: 'SCORE_CHECK', operator: 'lt', value: analysis.opponentAnalysis.averageScore }],
          action: { type: ActionType.MODIFY_SCORE, value: 2 },
        },
        reasoning: 'Création d\'une règle de rattrapage car en retard au score',
      }
    }

    // If ahead, create defensive rules
    if (analysis.isWinning) {
      return {
        action: 'add_rule',
        details: {
          name: 'Protection du leader',
          description: 'Le leader reçoit un bouclier',
          trigger: TriggerType.ON_TURN_START,
          conditions: [{ type: 'POSITION_CHECK', operator: 'eq', value: 'first' }],
          action: { type: ActionType.APPLY_SHIELD, value: 1 },
        },
        reasoning: 'Création d\'une règle défensive car en tête',
      }
    }

    // Default: create movement bonus
    return {
      action: 'add_rule',
      details: {
        name: 'Accélération',
        description: 'Bonus de mouvement sur case spéciale',
        trigger: TriggerType.ON_LAND,
        action: { type: ActionType.MOVE_RELATIVE, value: 2 },
      },
      reasoning: 'Création d\'une règle de mouvement standard',
    }
  }

  /**
   * Create a defensive rule (medium mode)
   */
  private createDefensiveRule(bot: BotPlayer, analysis: GameAnalysis): BotDecision {
    return {
      action: 'add_rule',
      details: {
        name: 'Bouclier temporaire',
        description: 'Protection contre les effets négatifs',
        trigger: TriggerType.ON_DICE_ROLL,
        conditions: [{ type: 'DICE_VALUE', operator: 'eq', value: 6 }],
        action: { type: ActionType.APPLY_SHIELD, value: 2 },
      },
      reasoning: 'Création d\'une règle défensive suite à des dangers détectés',
    }
  }

  /**
   * Create a simple rule (medium/easy mode)
   */
  private createSimpleRule(bot: BotPlayer): BotDecision {
    const simpleRules = [
      {
        name: 'Bonus chanceux',
        trigger: TriggerType.ON_DICE_ROLL,
        conditions: [{ type: 'DICE_VALUE', operator: 'gte', value: 5 }],
        action: { type: ActionType.MODIFY_SCORE, value: 1 },
      },
      {
        name: 'Tour supplémentaire',
        trigger: TriggerType.ON_DICE_ROLL,
        conditions: [{ type: 'DICE_VALUE', operator: 'eq', value: 6 }],
        action: { type: ActionType.EXTRA_TURN },
      },
      {
        name: 'Boost de vitesse',
        trigger: TriggerType.ON_LAND,
        action: { type: ActionType.APPLY_SPEED_BOOST, value: 1 },
      },
    ]

    const rule = simpleRules[Math.floor(Math.random() * simpleRules.length)]
    return {
      action: 'add_rule',
      details: rule,
      reasoning: 'Création d\'une règle simple',
    }
  }

  /**
   * Generate a descriptive message for the bot's action
   */
  getActionMessage(decision: BotDecision, botName: string): string {
    switch (decision.action) {
      case 'roll_dice':
        return `${botName} lance le dé...`
      case 'add_rule':
        return `${botName} crée une nouvelle règle: "${decision.details?.name}"`
      case 'modify_rule':
        return `${botName} modifie une règle`
      case 'add_tile':
        return `${botName} ajoute une case au plateau`
      case 'remove_tile':
        return `${botName} retire une case du plateau`
      case 'skip':
        return `${botName} passe son tour de modification`
      default:
        return `${botName} réfléchit...`
    }
  }
}

// Types for analysis
interface GameAnalysis {
  tilesAhead: GameTile[]
  dangerousTiles: GameTile[]
  beneficialTiles: GameTile[]
  opponentAnalysis: OpponentAnalysis | null
  isWinning: boolean
  distanceToEnd: number
  turnUrgency: number
  activeRulesCount: number
}

interface OpponentAnalysis {
  leader: PlayerState
  closest: PlayerState
  nearestToEnd: PlayerState
  averageScore: number
  averagePosition: number
}

// Factory function
export function createBotAI(difficulty: BotDifficulty): BotAI {
  return new BotAI(difficulty)
}

// Utility to check if a player is a bot
export function isBot(player: PlayerState): boolean {
  return player.isBot === true
}

// Get bot thinking message based on difficulty
export function getBotThinkingMessage(difficulty: BotDifficulty): string {
  const messages = {
    easy: [
      "Hmm, voyons voir...",
      "Euh... que faire ?",
      "Je réfléchis...",
      "Bon, allez !",
    ],
    medium: [
      "Analysons la situation...",
      "Intéressant...",
      "Je calcule les options...",
      "Stratégie en cours...",
    ],
    hard: [
      "Analyse approfondie...",
      "Calcul des probabilités...",
      "Optimisation en cours...",
      "Évaluation stratégique...",
    ],
  }

  const pool = messages[difficulty]
  return pool[Math.floor(Math.random() * pool.length)]
}
