import { GameState, Player, Tile } from "../types/game"
import { TriggerType, ActionType, Rule } from "../types/rules"
import { getApplicableRules, executeRuleChain } from "./rule-evaluator"
import { processEffectTurnEnd, calculateDiceValue, calculateMovement } from "./effect-manager"

/**
 * Process a dice roll and all associated game logic
 */
export const processDiceRoll = (
  gameState: GameState,
  playerId: string,
  diceValue: number
): { newState: GameState; logs: string[] } => {
  let newState: GameState = JSON.parse(JSON.stringify(gameState))
  const logs: string[] = []

  // Defensive Check: If game is finished, do nothing
  if (newState.status === "finished") {
    return { newState, logs: ["Game is already finished."] }
  }

  const playerIndex = newState.players.findIndex((p: Player) => p.id === playerId)
  if (playerIndex === -1) {
    return { newState, logs: ["Error: Player not found"] }
  }

  const player = newState.players[playerIndex]

  // --- PRE-ROLL: Apply dice modifiers from effects ---
  const diceResult = calculateDiceValue(player, diceValue)
  const actualDiceValue = diceResult.value

  if (diceResult.modifiers.length > 0) {
    logs.push(`Dice modifiers: ${diceResult.modifiers.join(", ")}`)
  }

  logs.push(`Dice: ${diceValue}${actualDiceValue !== diceValue ? ` -> ${actualDiceValue}` : ""}`)

  // --- PHASE 1: TURN START TRIGGERS ---
  const turnStartRules = getApplicableRules(newState, player.position, TriggerType.ON_TURN_START)
  if (turnStartRules.length > 0) {
    const result = executeRuleChain(newState, playerId, turnStartRules)
    newState = result.state
    logs.push(...result.logs)
  }

  // --- PHASE 2: MOVE START TRIGGERS ---
  const startPosition = newState.players[playerIndex].position
  const moveStartRules = getApplicableRules(newState, startPosition, TriggerType.ON_MOVE_START)

  if (moveStartRules.length > 0) {
    const result = executeRuleChain(newState, playerId, moveStartRules)
    newState = result.state
    logs.push(...result.logs)
  }

  // --- PHASE 3: DICE ROLL TRIGGERS ---
  const diceRules = getApplicableRules(newState, actualDiceValue, TriggerType.ON_DICE_ROLL)
  if (diceRules.length > 0) {
    const result = executeRuleChain(newState, playerId, diceRules)
    newState = result.state
    logs.push(...result.logs)
  }

  // --- PHASE 4: PHYSICS (The Movement) ---
  const currentPos = newState.players[playerIndex].position

  // Apply movement modifiers from effects
  const movementResult = calculateMovement(newState.players[playerIndex], actualDiceValue)
  let movement = movementResult.movement

  if (movementResult.modifiers.length > 0) {
    logs.push(`Movement modifiers: ${movementResult.modifiers.join(", ")}`)
  }

  let newPosition = currentPos + movement

  // Ensure position doesn't go below 0
  if (newPosition < 0) newPosition = 0

  // Store previous position for pass-over checks
  const previousPosition = currentPos

  newState.players[playerIndex].position = newPosition
  logs.push(`Moved: ${currentPos} -> ${newPosition}`)

  // --- PHASE 5: PASS OVER TRIGGERS ---
  // Check all tiles between start and end position
  if (newPosition > previousPosition) {
    for (let tileIndex = previousPosition + 1; tileIndex < newPosition; tileIndex++) {
      const passOverRules = getApplicableRules(newState, tileIndex, TriggerType.ON_PASS_OVER)
      if (passOverRules.length > 0) {
        const result = executeRuleChain(newState, playerId, passOverRules)
        newState = result.state
        logs.push(...result.logs)
      }
    }
  }

  // --- PHASE 6: LANDING TRIGGERS ---
  const finalLandPosition = newState.players[playerIndex].position
  const landRules = getApplicableRules(newState, finalLandPosition, TriggerType.ON_LAND)

  if (landRules.length > 0) {
    const result = executeRuleChain(newState, playerId, landRules)
    newState = result.state
    logs.push(...result.logs)
  }

  // --- PHASE 7: VICTORY CHECK (Rule-based) ---
  const finalPos = newState.players[playerIndex].position

  // Check if player is on an end tile
  const currentTile = newState.tiles.find((t) => t.index === finalPos)
  const isOnEndTile = currentTile?.isEndTile || currentTile?.type === "end"

  if (isOnEndTile && newState.status !== "finished") {
    // Check for victory rules (ON_REACH_END with DECLARE_VICTORY)
    const victoryRules = getVictoryRules(newState)

    if (victoryRules.length > 0) {
      // Execute victory rules
      const result = executeRuleChain(newState, playerId, victoryRules)
      newState = result.state
      logs.push(...result.logs)

      // Check if DECLARE_VICTORY was triggered
      const victoryDeclared = victoryRules.some((rule) =>
        rule.effects.some((effect) => effect.type === ActionType.DECLARE_VICTORY)
      )

      if (victoryDeclared) {
        newState.status = "finished"
        newState.winnerId = playerId
        logs.push(`VICTORY: ${newState.players[playerIndex].name || playerId} Wins!`)
      }
    }
    // If no victory rules exist, reaching the end doesn't win automatically
  }

  // --- PHASE 8: SAME TILE TRIGGERS ---
  const playersOnSameTile = newState.players.filter(
    (p) => p.id !== playerId && p.position === finalPos
  )

  if (playersOnSameTile.length > 0) {
    const sameTileRules = getApplicableRules(newState, finalPos, TriggerType.ON_SAME_TILE)
    if (sameTileRules.length > 0) {
      const result = executeRuleChain(newState, playerId, sameTileRules)
      newState = result.state
      logs.push(...result.logs)
    }
  }

  // --- PHASE 9: EFFECT EXPIRATION ---
  const effectResult = processEffectTurnEnd(newState, playerId)
  newState = effectResult.state
  if (effectResult.logs.length > 0) {
    logs.push(...effectResult.logs)
  }

  // --- PHASE 10: MARK TURN STATE ---
  newState.players[playerIndex].hasPlayedThisTurn = true
  newState.players[playerIndex].hasModifiedThisTurn = false

  // Check if player can modify rules/tiles after playing (based on core rules)
  const canModify = checkCanModifyAfterTurn(newState)
  // This is stored in the game state, not player state

  // --- PHASE 11: TURN END TRIGGERS ---
  const turnEndRules = getApplicableRules(newState, finalPos, TriggerType.ON_TURN_END)
  if (turnEndRules.length > 0) {
    const result = executeRuleChain(newState, playerId, turnEndRules)
    newState = result.state
    logs.push(...result.logs)
  }

  return { newState, logs }
}

/**
 * Get victory rules (ON_REACH_END trigger with DECLARE_VICTORY action)
 */
function getVictoryRules(gameState: GameState): Rule[] {
  const allRules = [...(gameState.activeRules || []), ...(gameState.coreRules || [])]

  return allRules.filter(
    (rule) =>
      rule.trigger === TriggerType.ON_REACH_END &&
      rule.effects.some((effect) => effect.type === ActionType.DECLARE_VICTORY)
  )
}

/**
 * Check if player can modify rules/tiles after their turn
 */
function checkCanModifyAfterTurn(gameState: GameState): boolean {
  // Check core rules for ALLOW_RULE_MODIFICATION or ALLOW_TILE_MODIFICATION
  const allRules = [...(gameState.activeRules || []), ...(gameState.coreRules || [])]

  const modificationRules = allRules.filter(
    (rule) =>
      rule.trigger === TriggerType.ON_AFTER_TURN &&
      rule.effects.some(
        (effect) =>
          effect.type === ActionType.ALLOW_RULE_MODIFICATION ||
          effect.type === ActionType.ALLOW_TILE_MODIFICATION
      )
  )

  return modificationRules.length > 0
}

/**
 * Process a rule modification (add/modify/delete)
 */
export const processRuleModification = (
  gameState: GameState,
  playerId: string,
  modification: { type: "add" | "modify" | "delete"; ruleId?: string; rule?: Rule }
): { newState: GameState; success: boolean; message: string } => {
  const newState: GameState = JSON.parse(JSON.stringify(gameState))

  const playerIndex = newState.players.findIndex((p) => p.id === playerId)
  if (playerIndex === -1) {
    return { newState: gameState, success: false, message: "Player not found" }
  }

  const player = newState.players[playerIndex]

  // Check if it's the player's turn
  if (newState.currentTurn !== playerId) {
    return { newState: gameState, success: false, message: "Not your turn" }
  }

  // Check if player has played this turn
  if (!player.hasPlayedThisTurn) {
    return { newState: gameState, success: false, message: "You must roll the dice first" }
  }

  // Check if player has already modified this turn
  if (player.hasModifiedThisTurn) {
    return { newState: gameState, success: false, message: "You have already modified this turn" }
  }

  // Check if modifications are allowed
  if (!newState.boardConfig?.allowRuleModification) {
    return { newState: gameState, success: false, message: "Rule modifications are not allowed" }
  }

  switch (modification.type) {
    case "add":
      if (!modification.rule) {
        return { newState: gameState, success: false, message: "No rule provided" }
      }
      newState.activeRules.push(modification.rule)
      break

    case "modify":
      if (!modification.ruleId || !modification.rule) {
        return { newState: gameState, success: false, message: "Invalid modification data" }
      }
      // Check if it's a core rule (can be modified but not deleted)
      const coreRuleIndex = newState.coreRules?.findIndex((r) => r.id === modification.ruleId)
      if (coreRuleIndex !== undefined && coreRuleIndex >= 0) {
        newState.coreRules![coreRuleIndex] = modification.rule
      } else {
        const ruleIndex = newState.activeRules.findIndex((r) => r.id === modification.ruleId)
        if (ruleIndex === -1) {
          return { newState: gameState, success: false, message: "Rule not found" }
        }
        newState.activeRules[ruleIndex] = modification.rule
      }
      break

    case "delete":
      if (!modification.ruleId) {
        return { newState: gameState, success: false, message: "No rule ID provided" }
      }
      // Check if it's a core rule (cannot be deleted)
      const isCoreRule = newState.coreRules?.some((r) => r.id === modification.ruleId)
      if (isCoreRule) {
        return { newState: gameState, success: false, message: "Core rules cannot be deleted" }
      }
      newState.activeRules = newState.activeRules.filter((r) => r.id !== modification.ruleId)
      break
  }

  // Mark player as having modified this turn
  newState.players[playerIndex].hasModifiedThisTurn = true

  return { newState, success: true, message: "Rule modification successful" }
}

/**
 * Process a tile modification (add/remove)
 */
export const processTileModification = (
  gameState: GameState,
  playerId: string,
  modification: {
    type: "add" | "remove"
    tileId?: string
    position?: { x: number; y: number }
    connectedTo?: string[]
    tileType?: "normal" | "special" | "end"
  }
): { newState: GameState; success: boolean; message: string } => {
  const newState: GameState = JSON.parse(JSON.stringify(gameState))

  const playerIndex = newState.players.findIndex((p) => p.id === playerId)
  if (playerIndex === -1) {
    return { newState: gameState, success: false, message: "Player not found" }
  }

  const player = newState.players[playerIndex]

  // Check if it's the player's turn
  if (newState.currentTurn !== playerId) {
    return { newState: gameState, success: false, message: "Not your turn" }
  }

  // Check if player has played this turn
  if (!player.hasPlayedThisTurn) {
    return { newState: gameState, success: false, message: "You must roll the dice first" }
  }

  // Check if player has already modified this turn
  if (player.hasModifiedThisTurn) {
    return { newState: gameState, success: false, message: "You have already modified this turn" }
  }

  // Check if tile modifications are allowed
  if (!newState.boardConfig?.allowTileModification) {
    return { newState: gameState, success: false, message: "Tile modifications are not allowed" }
  }

  switch (modification.type) {
    case "add":
      if (!modification.position) {
        return { newState: gameState, success: false, message: "No position provided" }
      }

      // Check max tiles limit
      if (
        newState.boardConfig?.maxTiles &&
        newState.tiles.length >= newState.boardConfig.maxTiles
      ) {
        return { newState: gameState, success: false, message: "Maximum tiles reached" }
      }

      // Check if position is already occupied
      const existingTile = newState.tiles.find(
        (t) =>
          t.position.x === modification.position!.x && t.position.y === modification.position!.y
      )
      if (existingTile) {
        return { newState: gameState, success: false, message: "Position already occupied" }
      }

      // Create new tile
      const newTile: Tile = {
        id: `tile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: modification.tileType || "normal",
        index: newState.tiles.length,
        position: modification.position,
        connections: modification.connectedTo || [],
        directions: ["right"],
        isEndTile: modification.tileType === "end",
      }

      // Update connections on connected tiles
      if (modification.connectedTo) {
        for (const connectedId of modification.connectedTo) {
          const connectedTile = newState.tiles.find((t) => t.id === connectedId)
          if (connectedTile && !connectedTile.connections.includes(newTile.id)) {
            connectedTile.connections.push(newTile.id)
          }
        }
      }

      newState.tiles.push(newTile)
      break

    case "remove":
      if (!modification.tileId) {
        return { newState: gameState, success: false, message: "No tile ID provided" }
      }

      // Check min tiles limit
      if (
        newState.boardConfig?.minTiles &&
        newState.tiles.length <= newState.boardConfig.minTiles
      ) {
        return { newState: gameState, success: false, message: "Minimum tiles reached" }
      }

      // Can't remove tile if a player is on it
      const playersOnTile = newState.players.filter((p) => {
        const tile = newState.tiles.find((t) => t.id === modification.tileId)
        return tile && p.position === tile.index
      })
      if (playersOnTile.length > 0) {
        return {
          newState: gameState,
          success: false,
          message: "Cannot remove tile with players on it",
        }
      }

      // Can't remove start tile
      const tileToRemove = newState.tiles.find((t) => t.id === modification.tileId)
      if (tileToRemove?.type === "start") {
        return { newState: gameState, success: false, message: "Cannot remove start tile" }
      }

      // Remove tile and update connections
      newState.tiles = newState.tiles.filter((t) => t.id !== modification.tileId)
      for (const tile of newState.tiles) {
        tile.connections = tile.connections.filter((c) => c !== modification.tileId)
      }

      // Reindex tiles
      newState.tiles.forEach((tile, index) => {
        tile.index = index
      })
      break
  }

  // Mark player as having modified this turn
  newState.players[playerIndex].hasModifiedThisTurn = true

  return { newState, success: true, message: "Tile modification successful" }
}

/**
 * Reset turn state for a player (called when turn changes)
 */
export const resetPlayerTurnState = (gameState: GameState, playerId: string): GameState => {
  const newState: GameState = JSON.parse(JSON.stringify(gameState))

  const playerIndex = newState.players.findIndex((p) => p.id === playerId)
  if (playerIndex !== -1) {
    newState.players[playerIndex].hasPlayedThisTurn = false
    newState.players[playerIndex].hasModifiedThisTurn = false
  }

  return newState
}

/**
 * Create default core rules for a new game
 */
export const createDefaultCoreRules = (): Rule[] => {
  return [
    {
      id: "core-victory",
      title: "Victory Condition",
      description: "Win the game by reaching the end tile",
      trigger: TriggerType.ON_REACH_END,
      conditions: [],
      effects: [{ type: ActionType.DECLARE_VICTORY, value: 1, target: "self" }],
      priority: 0,
      isActive: true,
      tags: ["core", "victory"],
    },
    {
      id: "core-rule-modification",
      title: "Rule Modification",
      description: "After playing, you can add, modify, or delete one rule",
      trigger: TriggerType.ON_AFTER_TURN,
      conditions: [],
      effects: [{ type: ActionType.ALLOW_RULE_MODIFICATION, value: 1, target: "self" }],
      priority: 0,
      isActive: true,
      tags: ["core", "modification"],
    },
    {
      id: "core-tile-modification",
      title: "Tile Modification",
      description: "After playing, you can add or remove one tile",
      trigger: TriggerType.ON_AFTER_TURN,
      conditions: [],
      effects: [{ type: ActionType.ALLOW_TILE_MODIFICATION, value: 1, target: "self" }],
      priority: 0,
      isActive: true,
      tags: ["core", "modification"],
    },
  ]
}

/**
 * Initialize a new game with proper board config
 */
export const createInitialGameState = (roomId: string, roomName?: string): GameState => {
  const tiles: Tile[] = Array.from({ length: 20 }, (_, i) => ({
    id: `tile-${i}`,
    index: i,
    type: i === 0 ? "start" : i === 19 ? "end" : i % 5 === 0 ? "special" : "normal",
    position: { x: i, y: 0 },
    connections: i < 19 ? [`tile-${i + 1}`] : [],
    directions: ["right"] as ("up" | "down" | "left" | "right")[],
    isEndTile: i === 19,
  }))

  // Add backward connections
  for (let i = 1; i < tiles.length; i++) {
    tiles[i].connections.unshift(`tile-${i - 1}`)
  }

  return {
    roomId,
    roomName,
    tiles,
    players: [],
    currentTurn: "",
    status: "waiting",
    winnerId: null,
    activeRules: [],
    coreRules: createDefaultCoreRules(),
    turnCount: 0,
    boardConfig: {
      minTiles: 5,
      maxTiles: 50,
      allowTileModification: true,
      allowRuleModification: true,
      modificationsPerTurn: 1,
    },
  }
}
