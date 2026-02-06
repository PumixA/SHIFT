import express from "express"
import { createServer } from "http"
import { Server, Socket } from "socket.io"
import cors from "cors"
import dotenv from "dotenv"
import crypto from "crypto"
import { GameState, Player, Tile, ChatMessage, GameAction } from "./types/game"
import {
  processDiceRoll,
  processRuleModification,
  processTileModification,
  createInitialGameState,
  resetPlayerTurnState,
} from "./engine/processor"
import { ActionType, TriggerType } from "./types/rules"
import { prisma, isDatabaseConnected } from "./config/prisma"
import { gameService } from "./services/GameService"
import { rulePackService } from "./services/RulePackService"
import { userService } from "./services/UserService"
import { friendService } from "./services/FriendService"
import { chatService } from "./services/ChatService"
import { saveGameService } from "./services/SaveGameService"
import { gameHistoryService } from "./services/GameHistoryService"
import { pushNotificationService } from "./services/PushNotificationService"
import { authService } from "./services/AuthService"
import { getDefaultPacks, getDefaultPackById } from "./data/default-rule-packs"
import { allTemplates, getTemplatesByCategory, searchTemplates } from "./data/rule-templates"

// --- Configuration initiale ---
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors())
app.use(express.json())

// Création du serveur HTTP pour Socket.io
const httpServer = createServer(app)

// Configuration de l'instance Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// --- Stockage des états de jeu ---
const games: Record<string, GameState> = {}

// --- Stockage des invitations (in-memory) ---
interface GameInvite {
  id: string
  senderId: string
  senderName: string
  recipientId: string
  roomId: string
  roomName: string
  status: "pending" | "accepted" | "declined"
  createdAt: Date
}
const gameInvites: GameInvite[] = []
const actionHistory: Record<string, GameAction[]> = {}
const userSockets: Map<string, string> = new Map() // socketId -> userId

// --- Helper: Get Room ID by Socket ---
function getRoomIdBySocket(socket: Socket): string | undefined {
  for (const room of socket.rooms) {
    if (room !== socket.id) {
      return room
    }
  }
  return undefined
}

// --- Helper: Add action to history ---
function addAction(roomId: string, action: Omit<GameAction, "id" | "timestamp">): GameAction {
  if (!actionHistory[roomId]) {
    actionHistory[roomId] = []
  }

  const fullAction: GameAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: new Date(),
  }

  actionHistory[roomId].push(fullAction)

  // Keep only last 100 actions per room
  if (actionHistory[roomId].length > 100) {
    actionHistory[roomId] = actionHistory[roomId].slice(-100)
  }

  return fullAction
}

// --- Interface Rule ---
interface Rule {
  id: string
  title: string
  trigger: { type: string; value?: any }
  tileIndex: number | null
  effects: { type: string; value: number; target: string }[]
}

// Route de test API
app.get("/", (req, res) => {
  res.send("Serveur SHIFT + Socket.io opérationnels !")
})

// API Routes for PWA/REST clients
app.get("/api/vapid-public-key", (req, res) => {
  res.json({ publicKey: pushNotificationService.getPublicKey() })
})

app.get("/api/rule-packs", async (req, res) => {
  const defaultPacks = getDefaultPacks()
  const dbPacks = await rulePackService.getPublicRulePacks()
  res.json({
    default: defaultPacks.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      difficulty: p.difficulty,
      rulesCount: p.rules.length,
      tags: p.tags,
      isDefault: true,
    })),
    custom: dbPacks.map((p) => ({
      packId: p.packId,
      name: p.name,
      description: p.description,
      rulesCount: (p.rules as any[]).length,
      usageCount: p.usageCount,
      tags: p.tags,
    })),
  })
})

app.get("/api/rule-templates", (req, res) => {
  const { category, search } = req.query

  if (search && typeof search === "string") {
    res.json(searchTemplates(search))
  } else if (category && typeof category === "string") {
    res.json(getTemplatesByCategory(category))
  } else {
    res.json(allTemplates)
  }
})

// --- Gestion des événements Temps Réel ---
io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`)

  // ================================
  // USER & AUTH EVENTS
  // ================================

  socket.on("register_user", async (data: { username: string; avatarPreset?: string }) => {
    const user = await userService.getOrCreateUser(data.username, data.avatarPreset)
    if (user) {
      userSockets.set(socket.id, user.id)
      friendService.setUserOnline(user.id, socket.id)
      socket.emit("user_registered", { userId: user.id, user })
      console.log(`[User] Registered: ${data.username} (${user.id})`)
    } else {
      socket.emit("error", { message: "Failed to register user" })
    }
  })

  socket.on("get_user_profile", async (data: { userId: string }) => {
    const user = await userService.getUserById(data.userId)
    const rawStats = await gameHistoryService.getStats(data.userId)
    const streak = await gameHistoryService.getWinStreak(data.userId)

    // Transform stats to match client expected format
    const stats = {
      gamesPlayed: rawStats.totalGames,
      gamesWon: rawStats.wins,
      totalScore: rawStats.averageScore * rawStats.totalGames, // Approximate total
      winRate: rawStats.winRate,
      avgScore: rawStats.averageScore,
      currentStreak: streak.current,
      bestStreak: streak.best,
    }

    socket.emit("user_profile", { user, stats })
  })

  socket.on(
    "update_user_profile",
    async (data: {
      userId: string
      username?: string
      avatarUrl?: string
      avatarPreset?: string
    }) => {
      const user = await userService.updateUser(data.userId, data)
      socket.emit("user_profile_updated", { user })
    }
  )

  socket.on("find_user_by_username", async (data: { username: string }) => {
    const user = await userService.getUserByUsername(data.username)
    if (user) {
      userSockets.set(socket.id, user.id)
      friendService.setUserOnline(user.id, socket.id)
      console.log(`[User] Logged in: ${data.username} (${user.id})`)
    }
    socket.emit("user_found", { user })
  })

  // ================================
  // AUTH EVENTS (Email/Password)
  // ================================

  socket.on(
    "auth_register",
    async (data: { username: string; email: string; password: string; avatarPreset?: string }) => {
      const result = await authService.register(data)
      if (result.success && result.user) {
        userSockets.set(socket.id, result.user.id)
        friendService.setUserOnline(result.user.id, socket.id)
      }
      socket.emit("auth_result", result)
    }
  )

  socket.on("auth_login", async (data: { email: string; password: string }) => {
    const result = await authService.login(data)
    if (result.success && result.user) {
      userSockets.set(socket.id, result.user.id)
      friendService.setUserOnline(result.user.id, socket.id)
    }
    socket.emit("auth_result", result)
  })

  socket.on("auth_forgot_password", async (data: { email: string }) => {
    const result = await authService.forgotPassword(data.email)
    socket.emit("forgot_password_result", result)
  })

  socket.on("auth_reset_password", async (data: { token: string; password: string }) => {
    const result = await authService.resetPassword(data.token, data.password)
    socket.emit("reset_password_result", result)
  })

  socket.on("auth_validate_reset_token", async (data: { token: string }) => {
    const result = await authService.validateResetToken(data.token)
    socket.emit("validate_token_result", result)
  })

  socket.on(
    "auth_change_password",
    async (data: { userId: string; currentPassword: string; newPassword: string }) => {
      const result = await authService.changePassword(
        data.userId,
        data.currentPassword,
        data.newPassword
      )
      socket.emit("change_password_result", result)
    }
  )

  // ================================
  // FRIEND EVENTS
  // ================================

  socket.on("friend_request_send", async (data: { userId: string; friendId: string }) => {
    const result = await friendService.sendFriendRequest(data.userId, data.friendId)
    socket.emit("friend_request_result", result)

    // Notify the target user if online
    const targetSocketId = friendService.getUserSocketId(data.friendId)
    if (targetSocketId) {
      const sender = await userService.getUserById(data.userId)
      io.to(targetSocketId).emit("friend_request_received", {
        requesterId: data.userId,
        requesterName: sender?.username || "Unknown",
      })

      // Send push notification
      await pushNotificationService.sendFriendRequestNotification(
        data.friendId,
        sender?.username || "Someone"
      )
    }
  })

  socket.on("friend_request_accept", async (data: { userId: string; requesterId: string }) => {
    const result = await friendService.acceptFriendRequest(data.userId, data.requesterId)
    socket.emit("friend_request_result", result)

    // Notify requester
    const requesterSocketId = friendService.getUserSocketId(data.requesterId)
    if (requesterSocketId) {
      io.to(requesterSocketId).emit("friend_request_accepted", { friendId: data.userId })
    }
  })

  socket.on("friend_request_decline", async (data: { userId: string; requesterId: string }) => {
    const result = await friendService.declineFriendRequest(data.userId, data.requesterId)
    socket.emit("friend_request_result", result)
  })

  socket.on("remove_friend", async (data: { userId: string; friendId: string }) => {
    const result = await friendService.removeFriend(data.userId, data.friendId)
    socket.emit("friend_removed", result)
  })

  socket.on("get_friends", async (data: { userId: string }) => {
    const friends = await friendService.getFriends(data.userId)
    const pending = await friendService.getPendingRequests(data.userId)
    const sent = await friendService.getSentRequests(data.userId)
    socket.emit("friends_list", { friends, pending, sent })
  })

  socket.on("block_user", async (data: { userId: string; targetId: string }) => {
    const result = await friendService.blockUser(data.userId, data.targetId)
    socket.emit("user_blocked", result)
  })

  socket.on(
    "invite_to_game",
    async (data: { userId: string; friendId: string; roomId: string; roomName?: string }) => {
      const targetSocketId = friendService.getUserSocketId(data.friendId)
      const inviter = await userService.getUserById(data.userId)
      const inviterName = inviter?.username || "Unknown"

      // Store the invitation
      const invite: GameInvite = {
        id: crypto.randomUUID(),
        senderId: data.userId,
        senderName: inviterName,
        recipientId: data.friendId,
        roomId: data.roomId,
        roomName: data.roomName || `Room ${data.roomId.substring(0, 6)}`,
        status: "pending",
        createdAt: new Date(),
      }
      gameInvites.push(invite)

      // Clean old invites (older than 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const validInvites = gameInvites.filter((inv) => inv.createdAt > oneHourAgo)
      gameInvites.length = 0
      gameInvites.push(...validInvites)

      if (targetSocketId) {
        io.to(targetSocketId).emit("game_invite_received", {
          inviterId: data.userId,
          inviterName: inviterName,
          roomId: data.roomId,
          roomName: invite.roomName,
          hostName: inviterName,
        })
      }

      // Also send push notification
      await pushNotificationService.sendGameInviteNotification(
        data.friendId,
        inviterName,
        data.roomId
      )

      socket.emit("invite_sent", { success: true })
    }
  )

  // ================================
  // CHAT EVENTS
  // ================================

  socket.on(
    "chat_message",
    async (data: { roomId: string; content: string; senderName: string }) => {
      const message = await chatService.sendMessage({
        roomId: data.roomId,
        senderId: socket.id,
        senderName: data.senderName,
        content: data.content,
        type: "text",
      })

      if (message) {
        io.to(data.roomId).emit("chat_message", message)

        // Add to action history
        addAction(data.roomId, {
          type: "chat",
          playerId: socket.id,
          playerName: data.senderName,
          description: `${data.senderName}: ${data.content.substring(0, 50)}${data.content.length > 50 ? "..." : ""}`,
        })
      }
    }
  )

  socket.on(
    "chat_emoji_reaction",
    (data: { roomId: string; emoji: string; senderName: string }) => {
      const reaction = chatService.sendEmojiReaction(data.roomId, {
        emoji: data.emoji,
        senderId: socket.id,
        senderName: data.senderName,
      })

      io.to(data.roomId).emit("emoji_reaction", reaction)
    }
  )

  socket.on("typing_indicator", (data: { roomId: string; isTyping: boolean }) => {
    chatService.setTyping(data.roomId, socket.id, data.isTyping)
    socket.to(data.roomId).emit("typing_update", {
      userId: socket.id,
      isTyping: data.isTyping,
      typingUsers: chatService.getTypingUsers(data.roomId),
    })
  })

  socket.on("get_chat_history", async (data: { roomId: string; limit?: number }) => {
    const messages = await chatService.getMessages(data.roomId, data.limit || 50)
    socket.emit("chat_history", messages)
  })

  // ================================
  // SAVE GAME EVENTS
  // ================================

  socket.on("save_game_request", async (data: { userId: string; roomId: string }) => {
    const game = games[data.roomId]
    if (!game) {
      socket.emit("save_game_result", { success: false, message: "Game not found" })
      return
    }

    const result = await saveGameService.saveGame(data.userId, game)
    socket.emit("save_game_result", result)

    if (result.success) {
      io.to(data.roomId).emit("game_saved", {
        savedBy: socket.id,
        roomId: data.roomId,
      })

      // Add system message
      const systemMsg = chatService.createSystemMessage(data.roomId, "Game saved")
      io.to(data.roomId).emit("chat_message", systemMsg)
    }
  })

  socket.on("get_saved_games", async (data: { userId: string }) => {
    const savedGames = await saveGameService.getSavedGames(data.userId)
    socket.emit("saved_games_list", savedGames)
  })

  socket.on("load_saved_game", async (data: { userId: string; roomId: string }) => {
    const gameState = await saveGameService.loadGame(data.userId, data.roomId)

    if (gameState) {
      games[data.roomId] = gameState
      socket.emit("game_state_loaded", { success: true, gameState })
      console.log(`[SaveGame] Loaded game ${data.roomId}`)
    } else {
      socket.emit("game_state_loaded", { success: false, message: "Saved game not found" })
    }
  })

  socket.on("delete_saved_game", async (data: { userId: string; roomId: string }) => {
    const result = await saveGameService.deleteSavedGame(data.userId, data.roomId)
    socket.emit("saved_game_deleted", result)
  })

  // ================================
  // GAME HISTORY EVENTS
  // ================================

  socket.on(
    "get_game_history",
    async (data: { userId: string; limit?: number; offset?: number }) => {
      const history = await gameHistoryService.getHistory(data.userId, data.limit, data.offset)
      const stats = await gameHistoryService.getStats(data.userId)
      const streak = await gameHistoryService.getWinStreak(data.userId)
      socket.emit("game_history", { history, stats, streak })
    }
  )

  // ================================
  // ACTION HISTORY EVENTS
  // ================================

  socket.on("get_action_history", (data: { roomId: string }) => {
    socket.emit("action_history", actionHistory[data.roomId] || [])
  })

  // ================================
  // PUSH NOTIFICATION EVENTS
  // ================================

  socket.on("register_push_subscription", async (data: { userId: string; subscription: any }) => {
    const result = await pushNotificationService.registerSubscription(
      data.userId,
      data.subscription
    )
    socket.emit("push_subscription_result", result)
  })

  socket.on("unregister_push_subscription", async (data: { endpoint: string }) => {
    const result = await pushNotificationService.unregisterSubscription(data.endpoint)
    socket.emit("push_unsubscription_result", result)
  })

  // ================================
  // EFFECT EVENTS
  // ================================

  socket.on(
    "effect_applied",
    (data: { roomId: string; playerId: string; effectType: string; duration: number }) => {
      io.to(data.roomId).emit("effect_applied", {
        playerId: data.playerId,
        effectType: data.effectType,
        duration: data.duration,
        timestamp: new Date(),
      })

      addAction(data.roomId, {
        type: "effect_applied",
        playerId: data.playerId,
        description: `Effect ${data.effectType} applied for ${data.duration} turns`,
      })
    }
  )

  socket.on("effect_expired", (data: { roomId: string; playerId: string; effectType: string }) => {
    io.to(data.roomId).emit("effect_expired", {
      playerId: data.playerId,
      effectType: data.effectType,
      timestamp: new Date(),
    })

    addAction(data.roomId, {
      type: "effect_expired",
      playerId: data.playerId,
      description: `Effect ${data.effectType} expired`,
    })
  })

  // ================================
  // ROOM EVENTS (EXISTING + ENHANCED)
  // ================================

  // Create a new room with custom settings
  socket.on(
    "create_room",
    async (data: {
      roomId: string
      roomName?: string
      password?: string
      maxPlayers?: number
      allowRuleEdit?: boolean
      allowTileEdit?: boolean
      rulePackId?: string
      playerName?: string
    }) => {
      const {
        roomId,
        roomName,
        password,
        maxPlayers,
        allowRuleEdit,
        allowTileEdit,
        rulePackId,
        playerName,
      } = data

      socket.rooms.forEach((room) => {
        if (room !== socket.id) socket.leave(room)
      })

      socket.join(roomId)
      console.log(`[Room] ${socket.id} created room: ${roomId}`)

      // Create game with custom settings
      games[roomId] = createInitialGameState(roomId, roomName || `Room ${roomId.substring(0, 6)}`)
      const game = games[roomId]

      // Apply custom settings
      if (maxPlayers) game.maxPlayers = maxPlayers
      if (password) game.password = password
      game.boardConfig = {
        ...game.boardConfig,
        allowRuleModification: allowRuleEdit ?? true,
        allowTileModification: allowTileEdit ?? true,
      }

      // Add creator as first player (host)
      const newPlayer: Player = {
        id: socket.id,
        name: playerName || "Host",
        color: "cyan",
        position: 0,
        score: 0,
        effects: [],
        isConnected: true,
        isHost: true,
      }
      game.players.push(newPlayer)
      game.currentTurn = newPlayer.id

      // Load rule pack if specified
      if (rulePackId) {
        try {
          const pack = await prisma.rulePack.findUnique({
            where: { id: rulePackId },
          })
          if (pack && pack.rules) {
            const rulesArray = pack.rules as any[]
            game.activeRules = rulesArray.map((r: any) => ({
              id: r.id || crypto.randomUUID(),
              title: r.title,
              description: r.description,
              trigger: r.trigger,
              conditions: r.conditions || [],
              actions: r.actions,
              effects: r.effects || [],
              isActive: true,
              priority: r.priority || 0,
              createdAt: r.createdAt || new Date().toISOString(),
            }))
          }
        } catch (error) {
          console.error("[Room] Failed to load rule pack:", error)
        }
      }

      socket.emit("room_joined", roomId)
      io.to(roomId).emit("game_state_sync", game)
      gameService.saveGameStateAsync(game)

      console.log(
        `[Room] Created with settings: maxPlayers=${maxPlayers}, allowRuleEdit=${allowRuleEdit}`
      )
    }
  )

  // Leave current room
  socket.on("leave_room", (data: { roomId: string }) => {
    const { roomId } = data
    const game = games[roomId]

    if (game) {
      const playerIndex = game.players.findIndex((p) => p.id === socket.id)
      if (playerIndex !== -1) {
        const player = game.players[playerIndex]
        game.players.splice(playerIndex, 1)

        // Notify others
        socket.to(roomId).emit("player_disconnected", {
          playerId: socket.id,
          playerName: player.name,
        })

        // System message
        const systemMsg = chatService.createSystemMessage(roomId, `${player.name} left the game`)
        io.to(roomId).emit("chat_message", systemMsg)

        // Update turn if needed
        if (game.currentTurn === socket.id && game.players.length > 0) {
          game.currentTurn = game.players[0].id
        }

        io.to(roomId).emit("game_state_sync", game)
      }
    }

    socket.leave(roomId)
    console.log(`[Room] ${socket.id} left room: ${roomId}`)
  })

  // Get game invites for a user
  socket.on("get_game_invites", (data: { userId: string }) => {
    const userInvites = gameInvites
      .filter((inv) => inv.recipientId === data.userId && inv.status === "pending")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    socket.emit("game_invites_list", {
      invites: userInvites.map((inv) => ({
        id: inv.id,
        hostId: inv.senderId,
        hostName: inv.senderName,
        roomId: inv.roomId,
        roomName: inv.roomName,
        createdAt: inv.createdAt.toISOString(),
      })),
    })
  })

  // Decline a game invite
  socket.on("decline_game_invite", (data: { userId: string; inviteId: string }) => {
    const invite = gameInvites.find((inv) => inv.id === data.inviteId)
    if (invite) {
      invite.status = "declined"
      socket.emit("game_invite_declined", { success: true })
    } else {
      socket.emit("game_invite_declined", { success: false })
    }
  })

  socket.on(
    "join_room",
    async (
      roomId: string,
      playerData?: { name?: string; userId?: string; avatarPreset?: string }
    ) => {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) socket.leave(room)
      })

      socket.join(roomId)
      console.log(`[Room] ${socket.id} joined: ${roomId}`)

      if (!games[roomId]) {
        const restoredGame = await gameService.restoreGameSession(roomId)

        if (restoredGame) {
          games[roomId] = restoredGame
          console.log(`[Room] Session restored from DB: ${roomId}`)
        } else {
          games[roomId] = createInitialGameState(roomId, `Room ${roomId.substring(0, 6)}`)
          console.log(`[Room] New game created with core rules: ${roomId}`)
        }
      }

      const game = games[roomId]

      // Player management with enhanced data
      if (game.players.length < 4) {
        const existingPlayer = game.players.find((p) => p.id === socket.id)

        if (!existingPlayer) {
          const colors: ("cyan" | "violet" | "orange" | "green")[] = [
            "cyan",
            "violet",
            "orange",
            "green",
          ]
          const usedColors = game.players.map((p) => p.color)
          const availableColor = colors.find((c) => !usedColors.includes(c)) || "cyan"

          const newPlayer: Player = {
            id: socket.id,
            name: playerData?.name || `Player ${game.players.length + 1}`,
            userId: playerData?.userId,
            avatarPreset: playerData?.avatarPreset,
            color: availableColor,
            position: 0,
            score: 0,
            effects: [],
            isConnected: true,
          }
          game.players.push(newPlayer)

          if (game.players.length === 1) {
            game.currentTurn = newPlayer.id
          }

          console.log(`[Player] Added: ${newPlayer.name} (${availableColor})`)

          // Add action
          addAction(roomId, {
            type: "join",
            playerId: socket.id,
            playerName: newPlayer.name,
            description: `${newPlayer.name} joined the game`,
          })

          // System message
          const systemMsg = chatService.createSystemMessage(
            roomId,
            `${newPlayer.name} joined the game`
          )
          io.to(roomId).emit("chat_message", systemMsg)
        }
      } else {
        console.log(`[Room] Full: ${roomId}. ${socket.id} is spectating.`)
      }

      socket.emit("room_joined", roomId)
      io.to(roomId).emit("game_state_sync", game)
      gameService.saveGameStateAsync(game)

      socket.to(roomId).emit("player_joined_room", {
        id: socket.id,
        name: playerData?.name,
        message: "A new player has arrived!",
      })
    }
  )

  socket.on("create_rule", (ruleData: any) => {
    console.log(`[Rule] Received from ${socket.id}`, ruleData)

    const roomId = getRoomIdBySocket(socket)
    if (!roomId || !games[roomId]) return

    let safeTileIndex: number | null = null

    if (
      (ruleData.trigger.type === "ON_LAND" || ruleData.trigger.type === "ON_PASS_OVER") &&
      ruleData.trigger.value !== null &&
      ruleData.trigger.value !== undefined &&
      ruleData.trigger.value !== ""
    ) {
      safeTileIndex = Number(ruleData.trigger.value)
    }

    const newRule: any = {
      ...ruleData,
      tileIndex: safeTileIndex,
      id: ruleData.id || crypto.randomUUID(),
      priority: ruleData.priority || 1,
      conditions: ruleData.conditions || [],
    }

    games[roomId].activeRules.push(newRule)
    console.log(`[Rule] Saved. Total: ${games[roomId].activeRules.length}`)

    io.to(roomId).emit("rule_added", newRule)
    io.to(roomId).emit("game_state_sync", games[roomId])

    addAction(roomId, {
      type: "rule_triggered",
      playerId: socket.id,
      description: `Rule "${newRule.title}" added`,
    })

    gameService.saveGameStateAsync(games[roomId])
  })

  socket.on("delete_rule", (data: { ruleId: string }) => {
    const roomId = getRoomIdBySocket(socket)
    if (!roomId || !games[roomId]) return

    const game = games[roomId]
    const ruleIndex = game.activeRules.findIndex((r) => r.id === data.ruleId)

    if (ruleIndex !== -1) {
      const deletedRule = game.activeRules.splice(ruleIndex, 1)[0]
      io.to(roomId).emit("rule_deleted", { ruleId: data.ruleId })
      io.to(roomId).emit("game_state_sync", game)

      addAction(roomId, {
        type: "rule_triggered",
        playerId: socket.id,
        description: `Rule "${deletedRule.title}" removed`,
      })

      gameService.saveGameStateAsync(game)
    }
  })

  // ================================
  // RULE MODIFICATION (WITH TURN RESTRICTIONS)
  // ================================

  socket.on(
    "modify_rule",
    (data: { type: "add" | "modify" | "delete"; ruleId?: string; rule?: any }) => {
      const roomId = getRoomIdBySocket(socket)
      if (!roomId || !games[roomId]) {
        socket.emit("error", { message: "Game not found" })
        return
      }

      const result = processRuleModification(games[roomId], socket.id, {
        type: data.type,
        ruleId: data.ruleId,
        rule: data.rule,
      })

      if (result.success) {
        games[roomId] = result.newState

        const actionType =
          data.type === "add"
            ? "rule_added"
            : data.type === "modify"
              ? "rule_modified"
              : "rule_deleted"

        io.to(roomId).emit(actionType, {
          ruleId: data.ruleId || data.rule?.id,
          rule: data.rule,
        })

        io.to(roomId).emit("game_state_sync", games[roomId])

        const player = games[roomId].players.find((p) => p.id === socket.id)
        addAction(roomId, {
          type: actionType as any,
          playerId: socket.id,
          playerName: player?.name,
          description: `${player?.name || "Player"} ${data.type}d a rule: ${data.rule?.title || data.ruleId}`,
        })

        // System message
        const systemMsg = chatService.createSystemMessage(
          roomId,
          `${player?.name || "Player"} ${data.type}d a rule`
        )
        io.to(roomId).emit("chat_message", systemMsg)

        gameService.saveGameStateAsync(games[roomId])
      } else {
        socket.emit("modification_error", {
          type: "rule",
          message: result.message,
        })
      }
    }
  )

  // ================================
  // TILE MODIFICATION (WITH TURN RESTRICTIONS)
  // ================================

  socket.on(
    "modify_tile",
    (data: {
      type: "add" | "remove"
      tileId?: string
      position?: { x: number; y: number }
      connectedTo?: string[]
      tileType?: "normal" | "special" | "end"
    }) => {
      const roomId = getRoomIdBySocket(socket)
      if (!roomId || !games[roomId]) {
        socket.emit("error", { message: "Game not found" })
        return
      }

      const result = processTileModification(games[roomId], socket.id, {
        type: data.type,
        tileId: data.tileId,
        position: data.position,
        connectedTo: data.connectedTo,
        tileType: data.tileType,
      })

      if (result.success) {
        games[roomId] = result.newState

        const eventType = data.type === "add" ? "tile_added" : "tile_removed"

        io.to(roomId).emit(eventType, {
          tileId: data.tileId,
          position: data.position,
          tiles: games[roomId].tiles,
        })

        io.to(roomId).emit("game_state_sync", games[roomId])

        const player = games[roomId].players.find((p) => p.id === socket.id)
        addAction(roomId, {
          type: eventType as any,
          playerId: socket.id,
          playerName: player?.name,
          description: `${player?.name || "Player"} ${data.type === "add" ? "added" : "removed"} a tile`,
        })

        // System message
        const systemMsg = chatService.createSystemMessage(
          roomId,
          `${player?.name || "Player"} ${data.type === "add" ? "added" : "removed"} a tile`
        )
        io.to(roomId).emit("chat_message", systemMsg)

        gameService.saveGameStateAsync(games[roomId])
      } else {
        socket.emit("modification_error", {
          type: "tile",
          message: result.message,
        })
      }
    }
  )

  // Get rules for a specific tile
  socket.on("get_tile_rules", (data: { roomId: string; tileIndex: number }) => {
    const game = games[data.roomId]
    if (!game) {
      socket.emit("tile_rules", { rules: [] })
      return
    }

    // Get all rules that apply to this tile
    const allRules = [...(game.activeRules || []), ...(game.coreRules || [])]
    const tileRules = allRules.filter((rule) => {
      const triggerType =
        typeof rule.trigger === "object" ? (rule.trigger as any).type : rule.trigger

      // Tile-based triggers
      if (
        triggerType === TriggerType.ON_LAND ||
        triggerType === TriggerType.ON_PASS_OVER ||
        triggerType === TriggerType.ON_REACH_POSITION
      ) {
        // Global rules (no specific tile) apply to all tiles
        if (rule.tileIndex === null || rule.tileIndex === undefined) {
          return true
        }

        return Number(rule.tileIndex) === data.tileIndex
      }

      return false
    })

    socket.emit("tile_rules", { rules: tileRules, tileIndex: data.tileIndex })
  })

  // Check modification eligibility
  socket.on("check_modification_eligibility", () => {
    const roomId = getRoomIdBySocket(socket)
    if (!roomId || !games[roomId]) {
      socket.emit("modification_eligibility", {
        canModify: false,
        reason: "Game not found",
      })
      return
    }

    const game = games[roomId]
    const player = game.players.find((p) => p.id === socket.id)

    if (!player) {
      socket.emit("modification_eligibility", {
        canModify: false,
        reason: "Player not found",
      })
      return
    }

    if (game.currentTurn !== socket.id) {
      socket.emit("modification_eligibility", {
        canModify: false,
        reason: "Not your turn",
      })
      return
    }

    if (!player.hasPlayedThisTurn) {
      socket.emit("modification_eligibility", {
        canModify: false,
        reason: "You must roll the dice first",
      })
      return
    }

    if (player.hasModifiedThisTurn) {
      socket.emit("modification_eligibility", {
        canModify: false,
        reason: "You have already modified this turn",
      })
      return
    }

    socket.emit("modification_eligibility", {
      canModify: true,
      canModifyRules: game.boardConfig?.allowRuleModification || false,
      canModifyTiles: game.boardConfig?.allowTileModification || false,
    })
  })

  socket.on("reset_game", (data: { roomId: string }) => {
    const game = games[data.roomId]
    if (game) {
      console.log(`[Game] Reset requested: ${data.roomId}`)
      delete games[data.roomId]
      actionHistory[data.roomId] = []
      chatService.cleanupRoom(data.roomId)

      io.to(data.roomId).emit("game_reset", { message: "Game has been reset." })
    }
  })

  socket.on("request_rematch", async (data: { roomId: string }) => {
    const game = games[data.roomId]
    if (!game) {
      socket.emit("error", { message: "Game not found." })
      return
    }

    console.log(`[Game] Rematch requested: ${data.roomId}`)

    // Record game history before reset
    if (game.winnerId) {
      const duration = game.startedAt
        ? Math.floor((Date.now() - new Date(game.startedAt).getTime()) / 1000)
        : 0
      await gameHistoryService.recordGame(game, duration)
    }

    // Reset players
    game.players.forEach((player) => {
      player.position = 0
      player.score = 0
      player.effects = []
      player.skipNextTurn = false
      player.extraTurns = 0
    })

    game.status = "playing"
    game.winnerId = null
    game.turnCount = 0
    game.startedAt = new Date()
    game.endedAt = undefined

    if (game.players.length > 0) {
      game.currentTurn = game.players[0].id
    }

    actionHistory[data.roomId] = []

    addAction(data.roomId, {
      type: "dice_roll",
      playerId: "system",
      description: "Rematch started!",
    })

    console.log(`[Game] Rematch initialized. ${game.players.length} players ready.`)

    io.to(data.roomId).emit("rematch_started", game)
    gameService.saveGameStateAsync(game)
  })

  // ================================
  // HOST CONTROLS (KICK & SETTINGS)
  // ================================

  socket.on("kick_player", (data: { roomId: string; playerId: string }) => {
    const game = games[data.roomId]
    if (!game) {
      socket.emit("error", { message: "Game not found" })
      return
    }

    // Verify the requester is the host (first player or has isHost flag)
    const requester = game.players.find((p) => p.id === socket.id)
    const isHost = game.players.indexOf(requester!) === 0 || requester?.isHost

    if (!isHost) {
      socket.emit("error", { message: "Only the host can kick players" })
      return
    }

    const playerToKick = game.players.find((p) => p.id === data.playerId)
    if (!playerToKick) {
      socket.emit("error", { message: "Player not found" })
      return
    }

    // Cannot kick yourself
    if (data.playerId === socket.id) {
      socket.emit("error", { message: "You cannot kick yourself" })
      return
    }

    const playerName = playerToKick.name || "Player"

    // Remove player from game
    game.players = game.players.filter((p) => p.id !== data.playerId)

    // If it was the kicked player's turn, advance to next player
    if (game.currentTurn === data.playerId && game.players.length > 0) {
      game.currentTurn = game.players[0].id
    }

    console.log(`[Kick] ${playerName} was kicked from ${data.roomId} by ${requester?.name}`)

    // Notify the kicked player
    io.to(data.playerId).emit("kicked_from_game", {
      reason: "You have been removed from the game by the host",
    })

    // Force the kicked player to leave the room
    const kickedSocket = io.sockets.sockets.get(data.playerId)
    if (kickedSocket) {
      kickedSocket.leave(data.roomId)
    }

    // Notify other players
    socket.to(data.roomId).emit("player_kicked", {
      playerId: data.playerId,
      playerName,
    })

    // Add action to history
    addAction(data.roomId, {
      type: "leave",
      playerId: data.playerId,
      playerName,
      description: `${playerName} was kicked from the game`,
    })

    // System message
    const systemMsg = chatService.createSystemMessage(
      data.roomId,
      `${playerName} was removed from the game`
    )
    io.to(data.roomId).emit("chat_message", systemMsg)

    // Sync game state
    io.to(data.roomId).emit("game_state_sync", game)
    gameService.saveGameStateAsync(game)
  })

  socket.on(
    "update_game_settings",
    (data: {
      roomId: string
      settings: {
        allowRuleEdit?: boolean
        allowTileEdit?: boolean
        maxPlayers?: number
      }
    }) => {
      const game = games[data.roomId]
      if (!game) {
        socket.emit("error", { message: "Game not found" })
        return
      }

      // Verify the requester is the host
      const requester = game.players.find((p) => p.id === socket.id)
      const isHost = game.players.indexOf(requester!) === 0 || requester?.isHost

      if (!isHost) {
        socket.emit("error", { message: "Only the host can change settings" })
        return
      }

      // Update settings
      if (!game.boardConfig) {
        game.boardConfig = {
          minTiles: 10,
          maxTiles: 50,
          allowRuleModification: true,
          allowTileModification: true,
          modificationsPerTurn: 1,
        }
      }

      if (data.settings.allowRuleEdit !== undefined) {
        game.boardConfig.allowRuleModification = data.settings.allowRuleEdit
      }

      if (data.settings.allowTileEdit !== undefined) {
        game.boardConfig.allowTileModification = data.settings.allowTileEdit
      }

      if (data.settings.maxPlayers !== undefined) {
        game.maxPlayers = data.settings.maxPlayers
      }

      console.log(`[Settings] ${data.roomId} updated by ${requester?.name}:`, data.settings)

      // Notify all players of the change
      io.to(data.roomId).emit("game_settings_updated", {
        allowRuleEdit: game.boardConfig.allowRuleModification,
        allowTileEdit: game.boardConfig.allowTileModification,
        maxPlayers: game.maxPlayers,
      })

      // Add action
      addAction(data.roomId, {
        type: "dice_roll", // Using existing type, could add custom type
        playerId: socket.id,
        playerName: requester?.name,
        description: `${requester?.name || "Host"} updated game settings`,
      })

      // System message
      const systemMsg = chatService.createSystemMessage(
        data.roomId,
        "Game settings have been updated"
      )
      io.to(data.roomId).emit("chat_message", systemMsg)

      // Sync
      io.to(data.roomId).emit("game_state_sync", game)
      gameService.saveGameStateAsync(game)
    }
  )

  socket.on("roll_dice", async (data: { roomId: string }) => {
    let game = games[data.roomId]

    if (!game) {
      socket.emit("error", { message: "Game not found." })
      return
    }

    if (game.status === "finished") {
      socket.emit("error", { message: "Game is finished!" })
      return
    }

    if (game.currentTurn !== socket.id) {
      console.warn(`[Game] Invalid turn attempt: ${socket.id}`)
      socket.emit("error", { message: "Not your turn!" })
      return
    }

    const player = game.players.find((p) => p.id === socket.id)
    if (!player) return

    // Check for skip turn
    if (player.skipNextTurn) {
      player.skipNextTurn = false
      const playerIndex = game.players.indexOf(player)
      const nextPlayerIndex = (playerIndex + 1) % game.players.length
      game.currentTurn = game.players[nextPlayerIndex].id

      io.to(data.roomId).emit("turn_skipped", {
        playerId: socket.id,
        playerName: player.name,
      })
      io.to(data.roomId).emit("game_state_sync", game)

      addAction(data.roomId, {
        type: "move",
        playerId: socket.id,
        playerName: player.name,
        description: `${player.name}'s turn was skipped`,
      })

      return
    }

    const diceValue = Math.floor(Math.random() * 6) + 1
    console.log(`[Dice] ${socket.id} rolled ${diceValue}`)

    // Increment turn count
    game.turnCount = (game.turnCount || 0) + 1

    const result = processDiceRoll(game, socket.id, diceValue)
    game = result.newState
    games[data.roomId] = game

    // Add action
    addAction(data.roomId, {
      type: "dice_roll",
      playerId: socket.id,
      playerName: player.name,
      description: `${player.name} rolled ${diceValue}`,
      details: { diceValue, logs: result.logs },
    })

    if (game.status === "finished") {
      console.log(`[Game] Victory: ${socket.id}`)
      game.endedAt = new Date()

      const duration = game.startedAt
        ? Math.floor((Date.now() - new Date(game.startedAt).getTime()) / 1000)
        : 0
      game.duration = duration

      io.to(data.roomId).emit("dice_result", {
        diceValue,
        players: game.players,
        currentTurn: game.currentTurn,
        logs: result.logs,
      })

      io.to(data.roomId).emit("game_over", {
        winnerId: game.winnerId,
        winnerName: player.name || `Player ${game.players.indexOf(player) + 1}`,
      })

      // Record history
      await gameHistoryService.recordGame(game, duration)

      // Send push notifications
      for (const p of game.players) {
        if (p.userId) {
          await pushNotificationService.sendGameOverNotification(
            p.userId,
            p.id === game.winnerId,
            game.roomName
          )
        }
      }

      addAction(data.roomId, {
        type: "dice_roll",
        playerId: socket.id,
        playerName: player.name,
        description: `${player.name} wins!`,
      })

      gameService.saveGameStateAsync(game)
    } else {
      // Check for extra turns
      if (player.extraTurns && player.extraTurns > 0) {
        player.extraTurns--
        // Don't change turn, but reset turn state for another action
        game = resetPlayerTurnState(game, player.id)
        games[data.roomId] = game
      } else {
        const playerIndex = game.players.indexOf(player)
        const nextPlayerIndex = (playerIndex + 1) % game.players.length
        const nextPlayerId = game.players[nextPlayerIndex].id

        // Reset turn state for next player
        game = resetPlayerTurnState(game, nextPlayerId)
        game.currentTurn = nextPlayerId
        games[data.roomId] = game

        // Send push notification for next player's turn
        const nextPlayer = game.players[nextPlayerIndex]
        if (nextPlayer.userId) {
          await pushNotificationService.sendYourTurnNotification(nextPlayer.userId, game.roomName)
        }
      }

      io.to(data.roomId).emit("dice_result", {
        diceValue,
        players: game.players,
        currentTurn: game.currentTurn,
        logs: result.logs,
      })

      gameService.saveGameStateAsync(game)
    }
  })

  socket.on("ping_test", () => {
    socket.emit("pong_response", {
      message: "Pong!",
      serverTime: new Date().toLocaleTimeString(),
    })
  })

  socket.on("send_shout", (data: { roomId: string; message: string }) => {
    io.to(data.roomId).emit("incoming_shout", {
      senderId: socket.id,
      message: data.message,
      timestamp: Date.now(),
    })
  })

  // ================================
  // RULE PACK EVENTS (ENHANCED)
  // ================================

  socket.on(
    "save_rule_pack",
    async (data: { name: string; description?: string; isPublic?: boolean }) => {
      const roomId = getRoomIdBySocket(socket)
      if (!roomId || !games[roomId]) {
        socket.emit("error", { message: "Must be in a room to save a pack." })
        return
      }

      const game = games[roomId]
      const pack = await rulePackService.createRulePack(data.name, game.activeRules, {
        description: data.description,
        isPublic: data.isPublic,
        createdBy: socket.id,
      })

      if (pack) {
        socket.emit("rule_pack_saved", {
          success: true,
          pack: {
            packId: pack.packId,
            name: pack.name,
            rulesCount: pack.rules.length,
          },
        })
        console.log(`[RulePack] Saved: "${data.name}"`)
      } else {
        socket.emit("rule_pack_saved", {
          success: false,
          message: "Error saving pack.",
        })
      }
    }
  )

  socket.on("get_rule_packs", async () => {
    // Get default packs from data file
    const defaultPacks = getDefaultPacks()
    const dbPacks = await rulePackService.getPublicRulePacks()

    socket.emit("rule_packs_list", {
      default: defaultPacks.map((p) => ({
        packId: p.id,
        name: p.name,
        description: p.description,
        rulesCount: p.rules.length,
        difficulty: p.difficulty,
        tags: p.tags,
        isDefault: true,
      })),
      custom: dbPacks.map((p) => ({
        packId: p.packId,
        name: p.name,
        description: p.description,
        rulesCount: (p.rules as any[]).length,
        usageCount: p.usageCount,
        tags: p.tags,
      })),
    })
  })

  socket.on("get_rule_templates", (data: { category?: string; search?: string }) => {
    if (data.search) {
      socket.emit("rule_templates", searchTemplates(data.search))
    } else if (data.category) {
      socket.emit("rule_templates", getTemplatesByCategory(data.category))
    } else {
      socket.emit("rule_templates", allTemplates)
    }
  })

  socket.on("load_rule_pack", async (data: { packId: string }) => {
    const roomId = getRoomIdBySocket(socket)
    if (!roomId || !games[roomId]) {
      socket.emit("error", { message: "Must be in a room to load a pack." })
      return
    }

    // Check default packs first
    const defaultPack = getDefaultPackById(data.packId)
    let rules: any[] = []
    let packName = ""

    if (defaultPack) {
      rules = defaultPack.rules
      packName = defaultPack.name
    } else {
      // Check DB packs
      const dbPack = await rulePackService.getRulePackById(data.packId)
      if (dbPack) {
        rules = rulePackService.convertPackToRules(dbPack)
        packName = dbPack.name
      }
    }

    if (rules.length === 0 && !defaultPack) {
      socket.emit("error", { message: "Rule pack not found." })
      return
    }

    games[roomId].activeRules = rules
    games[roomId].rulePackId = data.packId

    await rulePackService.incrementUsageCount(data.packId)

    console.log(`[RulePack] Loaded "${packName}" in room ${roomId}`)

    io.to(roomId).emit("rule_pack_loaded", {
      packId: data.packId,
      packName,
      rulesCount: rules.length,
    })
    io.to(roomId).emit("game_state_sync", games[roomId])

    addAction(roomId, {
      type: "rule_triggered",
      playerId: socket.id,
      description: `Rule pack "${packName}" loaded`,
    })

    gameService.saveGameStateAsync(games[roomId])
  })

  // ================================
  // DISCONNECT
  // ================================

  socket.on("disconnect", () => {
    console.log(`[Socket] Disconnected: ${socket.id}`)

    // Update user online status
    const userId = userSockets.get(socket.id)
    if (userId) {
      friendService.setUserOffline(userId)
      userSockets.delete(socket.id)
    }

    // Update game state
    for (const roomId in games) {
      const game = games[roomId]
      const player = game.players.find((p) => p.id === socket.id)

      if (player) {
        player.isConnected = false
        gameService.updatePlayerConnection(roomId, socket.id, false)

        // Add action
        addAction(roomId, {
          type: "leave",
          playerId: socket.id,
          playerName: player.name,
          description: `${player.name} disconnected`,
        })

        // System message
        const systemMsg = chatService.createSystemMessage(roomId, `${player.name} disconnected`)
        io.to(roomId).emit("chat_message", systemMsg)
        io.to(roomId).emit("player_disconnected", { playerId: socket.id, playerName: player.name })

        console.log(`[Player] Disconnected from room: ${socket.id} -> ${roomId}`)
        break
      }
    }
  })
})

// --- Server Start ---
const startServer = async () => {
  const dbConnected = await isDatabaseConnected()

  httpServer.listen(PORT, () => {
    console.log(`-----------------------------------------`)
    console.log(`  SHIFT Engine : http://localhost:${PORT}`)
    console.log(`  Socket.io    : Active`)
    console.log(`  PostgreSQL   : ${dbConnected ? "Connected" : "Memory Mode"}`)
    console.log(`  Rule Packs   : ${getDefaultPacks().length} default packs`)
    console.log(`  Templates    : ${allTemplates.length} templates`)
    console.log(`-----------------------------------------`)
  })
}

startServer()
