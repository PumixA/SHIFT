"use client"

import { useState, useCallback, useRef, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import {
    Book,
    Wifi,
    WifiOff,
    Users,
    Trophy,
    RefreshCw,
    Plus,
    Crosshair,
    Package,
    Settings,
    Home,
    HelpCircle,
    History,
    Bot,
} from "lucide-react"
import { socket } from "@/services/socket"
import { toast } from "sonner"

// Components - Core (always loaded)
import { TopBar } from "./game/top-bar"
import { GameViewport, type GameViewportRef } from "./game/game-viewport"
import { RuleBook } from "./game/rule-book"
import { ModificationPanel } from "./game/modification-panel"
import { RuleAnimations, useRuleAnimations } from "./game/rule-animations"
import { GamepadIndicator, GamepadBadge } from "./game/gamepad-indicator"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Rule } from "@/src/types/rules"
import { SavedGame, saveGame } from "@/lib/saved-games"
import { createBotAI, getBotThinkingMessage, type BotDifficulty, type BotAI } from "@/lib/bot-ai"

// Components - Lazy loaded modals (only loaded when needed)
const RuleBuilderModal = dynamic(
    () => import("./game/rule-builder-modal").then((m) => ({ default: m.RuleBuilderModal })),
    { ssr: false }
)
const RulePackModal = dynamic(() => import("./game/rule-pack-modal").then((m) => ({ default: m.RulePackModal })), {
    ssr: false,
})
const SettingsModal = dynamic(() => import("./game/settings-modal").then((m) => ({ default: m.SettingsModal })), {
    ssr: false,
})
const TileDetailModal = dynamic(
    () => import("./game/tile-detail-modal").then((m) => ({ default: m.TileDetailModal })),
    { ssr: false }
)
const TileSelectionModal = dynamic(
    () => import("./game/tile-selection-modal").then((m) => ({ default: m.TileSelectionModal })),
    { ssr: false }
)
const PathChoiceModal = dynamic(
    () => import("./game/path-choice-modal").then((m) => ({ default: m.PathChoiceModal })),
    { ssr: false }
)
const InteractiveTutorial = dynamic(
    () => import("./game/interactive-tutorial").then((m) => ({ default: m.InteractiveTutorial })),
    { ssr: false }
)
const TutorialWelcomeModal = dynamic(
    () => import("./game/tutorial-welcome-modal").then((m) => ({ default: m.TutorialWelcomeModal })),
    { ssr: false }
)
const TutorialHints = dynamic(() => import("./game/tutorial-hints").then((m) => ({ default: m.TutorialHints })), {
    ssr: false,
})
const ActionHistory = dynamic(() => import("./game/action-history").then((m) => ({ default: m.ActionHistory })), {
    ssr: false,
})

// Hooks from tutorial (need to import separately since we lazy load the component)
import { useTutorial } from "./game/interactive-tutorial"
import { useTutorialPreferences } from "@/hooks/use-tutorial-preferences"
import { buildTileGraph, calculatePossiblePaths, type PathOption, type TileNode } from "@/lib/path-utils"
import { useAudio } from "@/contexts/AudioContext"

// Hooks
import {
    useGameState,
    useTurnManagement,
    useRuleManagement,
    useTileManagement,
    type Player,
    type Tile,
    type GameConfig,
} from "@/hooks"
import { useGameControls, type GamepadAction } from "@/hooks/useGameControls"

// --- Constants ---
const PLAYER_COLORS: ("cyan" | "violet" | "orange" | "green")[] = ["cyan", "violet", "orange", "green"]

// --- Game Over Modal ---
const GameOverModal = memo(function GameOverModal({
    winner,
    players,
    onReset,
    onRematch,
}: {
    winner: { id: string; name: string; color?: string }
    players: Player[]
    onReset: () => void
    onRematch: () => void
}) {
    const colorClass =
        winner.color === "cyan"
            ? "border-cyan-500 text-cyan-400"
            : winner.color === "violet"
              ? "border-violet-500 text-violet-400"
              : winner.color === "orange"
                ? "border-orange-500 text-orange-400"
                : "border-green-500 text-green-400"

    const sortedPlayers = [...players].sort((a, b) => {
        if (String(a.id) === winner.id) return -1
        if (String(b.id) === winner.id) return 1
        return b.score - a.score
    })

    return (
        <div className="animate-in fade-in fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md duration-700">
            <div
                className={`bg-background/90 relative space-y-6 border-2 p-8 text-center md:p-12 ${colorClass.split(" ")[0]} mx-4 w-full max-w-2xl rounded-3xl`}
            >
                <Trophy className={`mx-auto h-20 w-20 ${colorClass.split(" ")[1]} animate-bounce`} />
                <div className="space-y-2">
                    <h2 className="text-muted-foreground text-xl font-black tracking-[0.3em] uppercase">
                        FIN DE PARTIE
                    </h2>
                    <h1 className={`text-4xl font-black italic md:text-5xl ${colorClass.split(" ")[1]}`}>
                        {winner.name} GAGNE !
                    </h1>
                </div>
                <div className="space-y-2 rounded-xl bg-black/30 p-4">
                    <h3 className="text-muted-foreground mb-3 text-sm font-bold uppercase">Classement</h3>
                    {sortedPlayers.map((player, index) => {
                        const isWinner = String(player.id) === winner.id
                        const playerColor =
                            player.color === "cyan"
                                ? "text-cyan-400 border-cyan-500"
                                : player.color === "violet"
                                  ? "text-violet-400 border-violet-500"
                                  : player.color === "orange"
                                    ? "text-orange-400 border-orange-500"
                                    : "text-green-400 border-green-500"
                        return (
                            <div
                                key={player.id}
                                className={`flex items-center justify-between rounded-lg border p-3 ${isWinner ? playerColor.split(" ")[1] : "border-white/5"} bg-white/5`}
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`text-xl font-black ${isWinner ? "text-yellow-400" : "text-muted-foreground"}`}
                                    >
                                        #{index + 1}
                                    </span>
                                    <div className={`h-3 w-3 rounded-full bg-${player.color}-500`} />
                                    <span className={`font-bold ${playerColor.split(" ")[0]}`}>{player.name}</span>
                                </div>
                                <span className="text-xl font-black">{player.score} pts</span>
                            </div>
                        )
                    })}
                </div>
                <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                    <Button
                        onClick={onRematch}
                        className="h-12 flex-1 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500"
                    >
                        <RefreshCw className="mr-2 h-5 w-5" /> Revanche
                    </Button>
                    <Button onClick={onReset} variant="outline" className="h-12 flex-1">
                        <Home className="mr-2 h-5 w-5" /> Menu
                    </Button>
                </div>
            </div>
        </div>
    )
})

// --- Main Component ---
export default function ShiftGame({ gameConfig }: { gameConfig?: GameConfig }) {
    const router = useRouter()
    const viewportRef = useRef<GameViewportRef>(null)
    const [currentSaveId, setCurrentSaveId] = useState<string | null>(null)
    const [currentSaveName, setCurrentSaveName] = useState<string>("")
    const hasAutoSavedRef = useRef(false)

    // ===========================================
    // HOOKS - Game State
    // ===========================================
    const {
        tiles,
        setTiles,
        players,
        setPlayers,
        rules,
        setRules,
        coreRules,
        setCoreRules,
        winner,
        setWinner,
        gameStatus,
        setGameStatus,
        allRules,
        isLocalMode,
        getCoordinatesFromIndex,
        getTileIndexFromCoords,
        mapServerPlayersToClient,
    } = useGameState(gameConfig)

    // ===========================================
    // STATE - Network & Permissions
    // ===========================================
    const [isConnected, setIsConnected] = useState(socket.connected)
    const [activeRoom, setActiveRoom] = useState<string | null>(null)
    const [isHost, setIsHost] = useState(false)
    const [allowRuleEdit, setAllowRuleEdit] = useState(gameConfig?.allowRuleEdit ?? true)
    const [allowTileEdit, setAllowTileEdit] = useState(gameConfig?.allowTileEdit ?? true)

    // ===========================================
    // HOOKS - Turn Management
    // ===========================================
    const turnManagement = useTurnManagement({
        players,
        gameStatus,
        isLocalMode,
        allowRuleEdit,
        allowTileEdit,
        isHost,
    })

    const {
        currentTurnId,
        setCurrentTurnId,
        localTurnIndex,
        setLocalTurnIndex,
        turnPhase,
        setTurnPhase,
        diceValue,
        setDiceValue,
        isRolling,
        setIsRolling,
        currentPlayer,
        isMyTurn,
        canRollDice,
        canModify,
        canModifyRulesNow,
        canModifyTilesNow,
        advanceToNextPlayer,
        handleEndTurn,
        markModificationDone,
    } = turnManagement

    // ===========================================
    // HOOKS - Rule Management
    // ===========================================
    const ruleManagement = useRuleManagement({
        isLocalMode,
        activeRoom,
        canModifyRulesNow,
        turnPhase,
        rules,
        setRules,
        markModificationDone,
    })

    const {
        ruleBuilderOpen,
        setRuleBuilderOpen,
        editingRule,
        draftRule,
        isSelectingTile,
        setIsSelectingTile,
        handleSaveRule,
        handleDeleteRule,
        handleEditRule,
        handleAddRule,
        handleAddRuleFromTemplate,
        handleStartTileSelection,
        handleTileClick,
    } = ruleManagement

    // ===========================================
    // HOOKS - Tile Management
    // ===========================================
    const tileManagement = useTileManagement({
        isLocalMode,
        activeRoom,
        canModifyTilesNow,
        turnPhase,
        tiles,
        setTiles,
        markModificationDone,
    })

    const {
        tileSelectionModalOpen,
        setTileSelectionModalOpen,
        tileSelectionMode,
        tileDetailOpen,
        setTileDetailOpen,
        selectedTileIndex,
        handleAddTile,
        handleRemoveTile,
        openTileSelectionModal,
        handleTileDetails,
    } = tileManagement

    // ===========================================
    // STATE - UI Modals
    // ===========================================
    const [mobileRuleBookOpen, setMobileRuleBookOpen] = useState(false)
    const [rulePackModalOpen, setRulePackModalOpen] = useState(false)
    const [settingsModalOpen, setSettingsModalOpen] = useState(false)
    const [actionHistoryOpen, setActionHistoryOpen] = useState(false)

    // ===========================================
    // STATE - Bot & Path Choice
    // ===========================================
    const [botAIs, setBotAIs] = useState<Record<string, BotAI>>({})
    const [botThinking, setBotThinking] = useState<string | null>(null)
    const [pathChoiceOpen, setPathChoiceOpen] = useState(false)
    const [availablePaths, setAvailablePaths] = useState<PathOption[]>([])
    const [pendingDiceValue, setPendingDiceValue] = useState<number | null>(null)
    const [gamepadAssignments, setGamepadAssignments] = useState<Record<number, string | null>>({})

    // ===========================================
    // HOOKS - Tutorial & Animations
    // ===========================================
    const {
        isOpen: tutorialOpen,
        activeSection: tutorialActiveSection,
        startTutorial,
        startSection: startTutorialSection,
        closeTutorial,
        completeTutorial,
    } = useTutorial()
    const tutorialPrefs = useTutorialPreferences()
    const { playDiceRoll, playGameAction, play } = useAudio()
    const [welcomeModalOpen, setWelcomeModalOpen] = useState(false)
    const { triggerAnimation } = useRuleAnimations()

    // ===========================================
    // COMPUTED
    // ===========================================
    const tileGraph = useMemo(() => {
        const tileNodes: TileNode[] = tiles.map((t) => ({
            id: t.id,
            x: t.x,
            y: t.y,
            type: t.type,
            connections: t.connections || [],
        }))
        return buildTileGraph(tileNodes)
    }, [tiles])

    const tileNodes = useMemo((): TileNode[] => {
        return tiles.map((t) => ({
            id: t.id,
            x: t.x,
            y: t.y,
            type: t.type,
            connections: t.connections || [],
        }))
    }, [tiles])

    const rulesForSelectedTile = useMemo(() => {
        return allRules.filter((rule) => {
            const triggerType = typeof rule.trigger === "object" ? rule.trigger.type : rule.trigger
            if (triggerType !== "ON_LAND" && triggerType !== "ON_PASS_OVER") return false
            const triggerValue = typeof rule.trigger === "object" ? rule.trigger.value : null
            if (triggerValue === null || triggerValue === undefined) return true
            return Number(triggerValue) === selectedTileIndex
        })
    }, [allRules, selectedTileIndex])

    // ===========================================
    // DICE & MOVEMENT
    // ===========================================
    const movePlayerToPath = useCallback(
        (path: PathOption, player: Player, diceVal: number) => {
            const finalTile = path.finalTile
            const newCoords = { x: finalTile.x, y: finalTile.y }

            setPlayers((prev) => prev.map((p, idx) => (idx === localTurnIndex ? { ...p, position: newCoords } : p)))

            // Victory is now handled only by explicit victory condition rules
            // No automatic victory when reaching the last tile

            setTurnPhase("MODIFY")
            toast.info(`${player.name} avance de ${diceVal} cases`, { icon: "🎲" })
        },
        [localTurnIndex, tiles, setPlayers, setWinner, setGameStatus, setTurnPhase, play]
    )

    const handlePathSelected = useCallback(
        (path: PathOption) => {
            const player = players[localTurnIndex]
            if (!player || pendingDiceValue === null) return

            movePlayerToPath(path, player, pendingDiceValue)
            setPendingDiceValue(null)
            setAvailablePaths([])
        },
        [players, localTurnIndex, pendingDiceValue, movePlayerToPath]
    )

    const rollDice = useCallback(() => {
        if (!canRollDice) return

        if (isLocalMode) {
            const player = players[localTurnIndex]
            if (!player) return

            playDiceRoll()
            setIsRolling(true)
            let rolls = 0
            const finalValue = Math.floor(Math.random() * 6) + 1

            const interval = setInterval(() => {
                setDiceValue(Math.floor(Math.random() * 6) + 1)
                rolls++
                if (rolls >= 10) {
                    clearInterval(interval)
                    setDiceValue(finalValue)
                    setIsRolling(false)

                    const currentTile = tiles.find((t) => t.x === player.position.x && t.y === player.position.y)
                    if (!currentTile) {
                        const fallbackTile = tiles[0]
                        setPlayers((prev) =>
                            prev.map((p, idx) =>
                                idx === localTurnIndex
                                    ? { ...p, position: { x: fallbackTile.x, y: fallbackTile.y } }
                                    : p
                            )
                        )
                        setTurnPhase("MODIFY")
                        return
                    }

                    const paths = calculatePossiblePaths(currentTile.id, finalValue, tileGraph)

                    if (paths.length === 0) {
                        toast.info(`${player.name} ne peut pas avancer`, { icon: "🎲" })
                        setTurnPhase("MODIFY")
                        return
                    }

                    const uniqueDestinations = new Map<string, PathOption>()
                    paths.forEach((path) => {
                        const destId = path.finalTile.id
                        if (!uniqueDestinations.has(destId)) {
                            uniqueDestinations.set(destId, path)
                        }
                    })
                    const uniquePaths = Array.from(uniqueDestinations.values())

                    if (uniquePaths.length === 1) {
                        movePlayerToPath(uniquePaths[0], player, finalValue)
                        return
                    }

                    // Bots automatically choose a random path
                    if (player.isBot) {
                        const randomPath = uniquePaths[Math.floor(Math.random() * uniquePaths.length)]
                        movePlayerToPath(randomPath, player, finalValue)
                        return
                    }

                    setAvailablePaths(uniquePaths)
                    setPendingDiceValue(finalValue)
                    setPathChoiceOpen(true)
                }
            }, 50)
        } else {
            if (currentTurnId !== socket.id) {
                toast.warning("Ce n'est pas votre tour !")
                return
            }
            socket.emit("roll_dice", { roomId: activeRoom })
        }
    }, [
        canRollDice,
        isLocalMode,
        players,
        localTurnIndex,
        currentTurnId,
        activeRoom,
        tiles,
        tileGraph,
        movePlayerToPath,
        setIsRolling,
        setDiceValue,
        setPlayers,
        setTurnPhase,
        playDiceRoll,
    ])

    // ===========================================
    // CAMERA
    // ===========================================
    const centerOnPlayer = useCallback(() => {
        if (currentPlayer && viewportRef.current) {
            viewportRef.current.centerOnTile(currentPlayer.position.x, currentPlayer.position.y)
        }
    }, [currentPlayer])

    // ===========================================
    // GAME LIFECYCLE
    // ===========================================
    const handleRematch = useCallback(() => {
        if (isLocalMode) {
            const resetPlayers = players.map((p) => ({
                ...p,
                position: getCoordinatesFromIndex(0),
                score: 0,
            }))
            setPlayers(resetPlayers)
            setLocalTurnIndex(0)
            setCurrentTurnId(String(resetPlayers[0]?.id))
            setWinner(null)
            setGameStatus("playing")
            setTurnPhase("ROLL")
            setDiceValue(null)
        } else if (activeRoom) {
            socket.emit("request_rematch", { roomId: activeRoom })
        }
    }, [
        isLocalMode,
        players,
        activeRoom,
        getCoordinatesFromIndex,
        setPlayers,
        setLocalTurnIndex,
        setCurrentTurnId,
        setWinner,
        setGameStatus,
        setTurnPhase,
        setDiceValue,
    ])

    const handleLeaveGame = useCallback(() => {
        sessionStorage.removeItem("gameConfig")
        router.push("/")
    }, [router])

    const handleKickPlayer = useCallback(
        (playerId: string) => {
            if (!isHost || isLocalMode) return
            socket.emit("kick_player", { roomId: activeRoom, playerId })
        },
        [isHost, isLocalMode, activeRoom]
    )

    const handleToggleRuleEdit = useCallback(
        (enabled: boolean) => {
            setAllowRuleEdit(enabled)
            if (!isLocalMode && activeRoom) {
                socket.emit("update_game_settings", { roomId: activeRoom, settings: { allowRuleEdit: enabled } })
            }
            toast.info(enabled ? "Édition de règles activée" : "Édition de règles désactivée")
        },
        [isLocalMode, activeRoom]
    )

    const handleToggleTileEdit = useCallback(
        (enabled: boolean) => {
            setAllowTileEdit(enabled)
            if (!isLocalMode && activeRoom) {
                socket.emit("update_game_settings", { roomId: activeRoom, settings: { allowTileEdit: enabled } })
            }
            toast.info(enabled ? "Modification du plateau activée" : "Modification du plateau désactivée")
        },
        [isLocalMode, activeRoom]
    )

    // ===========================================
    // SAVE/LOAD
    // ===========================================
    const handleSaveGame = useCallback(
        (name: string) => {
            const currentPlayerPositions = players.map((p) => {
                const tileIndex = getTileIndexFromCoords(p.position.x, p.position.y)
                return { name: p.name, color: p.color, position: tileIndex >= 0 ? tileIndex : 0, score: p.score }
            })

            const saved = saveGame({
                id: currentSaveId || undefined,
                name,
                mode: isLocalMode ? "local" : "online",
                players: currentPlayerPositions,
                tiles: tiles.map((t) => ({ id: t.id, x: t.x, y: t.y, type: t.type })),
                rules,
                currentTurnIndex: localTurnIndex,
                status: gameStatus === "finished" ? "finished" : "paused",
                settings: { allowRuleEdit, allowTileEdit, maxModificationsPerTurn: 1 },
            })
            setCurrentSaveId(saved.id)
            setCurrentSaveName(name)
        },
        [
            players,
            tiles,
            rules,
            localTurnIndex,
            gameStatus,
            isLocalMode,
            allowRuleEdit,
            allowTileEdit,
            getTileIndexFromCoords,
            currentSaveId,
        ]
    )

    const handleQuickSave = useCallback(() => {
        const name = currentSaveName || gameConfig?.roomName || `Partie du ${new Date().toLocaleDateString("fr-FR")}`
        handleSaveGame(name)
        toast.success("Partie sauvegardée")
    }, [currentSaveName, gameConfig?.roomName, handleSaveGame])

    // ===========================================
    // GAMEPAD
    // ===========================================
    const handleGamepadAction = useCallback(
        (action: GamepadAction) => {
            switch (action) {
                case "roll_dice":
                    if (canRollDice) rollDice()
                    break
                case "cancel":
                    if (tileSelectionModalOpen) setTileSelectionModalOpen(false)
                    else if (isSelectingTile) setIsSelectingTile(false)
                    else if (ruleBuilderOpen) setRuleBuilderOpen(false)
                    break
                case "menu":
                    setSettingsModalOpen((prev) => !prev)
                    break
                case "rules":
                    setMobileRuleBookOpen((prev) => !prev)
                    break
                case "center_camera":
                    centerOnPlayer()
                    break
                case "zoom_in":
                    viewportRef.current?.zoomIn?.()
                    break
                case "zoom_out":
                    viewportRef.current?.zoomOut?.()
                    break
            }
        },
        [
            canRollDice,
            rollDice,
            tileSelectionModalOpen,
            isSelectingTile,
            ruleBuilderOpen,
            centerOnPlayer,
            setTileSelectionModalOpen,
            setIsSelectingTile,
            setRuleBuilderOpen,
        ]
    )

    useGameControls({
        isMyTurn,
        isHost,
        allowRuleEdit,
        allowTileEdit,
        onAction: gameStatus === "playing" ? handleGamepadAction : undefined,
    })

    // ===========================================
    // EFFECTS - Initialization
    // ===========================================
    useEffect(() => {
        if (!gameConfig) return

        if (isLocalMode && gameConfig.players) {
            // Check if loading from an existing save
            if (gameConfig.loadFromSave && gameConfig.savedGameId) {
                const savedGameData = sessionStorage.getItem("savedGame")
                if (savedGameData) {
                    try {
                        const savedGame: SavedGame = JSON.parse(savedGameData)
                        // Mark as already saved to prevent auto-save
                        hasAutoSavedRef.current = true
                        setCurrentSaveId(savedGame.id)
                        setCurrentSaveName(savedGame.name)

                        // Load the saved game state
                        const loadedTiles: Tile[] = savedGame.tiles.map((t) => ({
                            id: t.id,
                            x: t.x,
                            y: t.y,
                            type: t.type,
                            connections: [],
                        }))
                        setTiles(loadedTiles)

                        const loadedPlayers: Player[] = savedGame.players.map((p, idx) => {
                            const tile = loadedTiles[p.position] || loadedTiles[0]
                            return {
                                id: `local-${idx}`,
                                name: p.name,
                                avatar: `/cyberpunk-avatar-${idx + 1}.png`,
                                score: p.score,
                                color: p.color,
                                position: { x: tile.x, y: tile.y },
                                isBot: gameConfig.players?.[idx]?.isBot,
                                botDifficulty: gameConfig.players?.[idx]?.botDifficulty as BotDifficulty,
                            }
                        })
                        setPlayers(loadedPlayers)
                        setRules(savedGame.rules)
                        setLocalTurnIndex(savedGame.currentTurnIndex)
                        setCurrentTurnId(String(loadedPlayers[savedGame.currentTurnIndex]?.id))
                        setGameStatus(savedGame.status === "finished" ? "finished" : "playing")
                        setTurnPhase("ROLL")
                        setAllowRuleEdit(savedGame.settings.allowRuleEdit)
                        setAllowTileEdit(savedGame.settings.allowTileEdit)
                        setIsHost(true)
                        setActiveRoom(`local-${Date.now()}`)

                        // Setup bot AIs
                        const newBotAIs: Record<string, BotAI> = {}
                        loadedPlayers.forEach((p) => {
                            if (p.isBot && p.botDifficulty) {
                                newBotAIs[String(p.id)] = createBotAI(p.botDifficulty)
                            }
                        })
                        setBotAIs(newBotAIs)

                        // Clean up sessionStorage
                        sessionStorage.removeItem("savedGame")
                        return
                    } catch {
                        // If parsing fails, continue with normal initialization
                    }
                }
            }

            // Normal new game initialization
            const localPlayers: Player[] = gameConfig.players.map((p, idx) => ({
                id: `local-${idx}`,
                name: p.name,
                avatar: `/cyberpunk-avatar-${idx + 1}.png`,
                score: 0,
                color: PLAYER_COLORS[idx] || "cyan",
                position: getCoordinatesFromIndex(0),
                isBot: p.isBot,
                botDifficulty: p.botDifficulty as BotDifficulty,
            }))
            setPlayers(localPlayers)
            setCurrentTurnId(`local-0`)
            setGameStatus("playing")
            setIsHost(true)
            setActiveRoom("local")
            setTurnPhase("ROLL")

            const newBotAIs: Record<string, BotAI> = {}
            localPlayers.forEach((p) => {
                if (p.isBot && p.botDifficulty) {
                    newBotAIs[String(p.id)] = createBotAI(p.botDifficulty)
                }
            })
            setBotAIs(newBotAIs)

            setActiveRoom(`local-${Date.now()}`)

            // Auto-save new game on creation (only once, only for new games)
            if (!hasAutoSavedRef.current) {
                hasAutoSavedRef.current = true
                const saveName = gameConfig.roomName || `Partie du ${new Date().toLocaleDateString("fr-FR")}`
                const saved = saveGame({
                    name: saveName,
                    mode: "local",
                    players: localPlayers.map((p) => ({
                        name: p.name,
                        color: p.color,
                        position: 0,
                        score: 0,
                    })),
                    tiles: tiles.map((t) => ({ id: t.id, x: t.x, y: t.y, type: t.type })),
                    rules: [],
                    currentTurnIndex: 0,
                    status: "playing",
                    settings: {
                        allowRuleEdit: gameConfig.allowRuleEdit ?? true,
                        allowTileEdit: gameConfig.allowTileEdit ?? true,
                        maxModificationsPerTurn: 1,
                    },
                })
                setCurrentSaveId(saved.id)
                setCurrentSaveName(saveName)
            }

            // Show welcome modal for first-time users instead of auto-starting tutorial
            const shouldShow =
                !tutorialPrefs.preferences.isCompleted &&
                !tutorialPrefs.preferences.neverAskAgain &&
                !tutorialPrefs.isLoading
            if (shouldShow) {
                setTimeout(() => setWelcomeModalOpen(true), 1000)
            }
        } else {
            socket.connect()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameConfig, isLocalMode, getCoordinatesFromIndex, setPlayers, setCurrentTurnId, setGameStatus, setTurnPhase])

    // ===========================================
    // EFFECTS - Socket Events (Online Mode)
    // ===========================================
    useEffect(() => {
        if (isLocalMode) return

        const onConnect = () => {
            setIsConnected(true)
            toast.success("Connecté au serveur")

            if (gameConfig?.action === "create") {
                const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
                socket.emit("create_room", {
                    roomId,
                    roomName: gameConfig.roomName,
                    password: gameConfig.password,
                    maxPlayers: gameConfig.maxPlayers,
                    allowRuleEdit: gameConfig.allowRuleEdit,
                    rulePackId: gameConfig.rulePackId,
                    playerName: gameConfig.playerName,
                })
            } else if (gameConfig?.action === "join" && gameConfig.roomCode) {
                socket.emit("join_room", gameConfig.roomCode, {
                    password: gameConfig.password,
                    playerName: gameConfig.playerName,
                })
            }
        }

        const onDisconnect = () => {
            setIsConnected(false)
            toast.error("Déconnecté du serveur")
        }

        const onRoomJoined = (roomId: string) => {
            setActiveRoom(roomId)
            toast.info(`Salon rejoint : ${roomId}`)
        }

        const onGameStateSync = (gameState: any) => {
            const syncedPlayers = mapServerPlayersToClient(gameState.players)
            setPlayers(syncedPlayers)
            setCurrentTurnId(gameState.currentTurn)
            setGameStatus(gameState.status)
            setAllowRuleEdit(gameState.allowRuleEdit ?? true)

            const me = gameState.players.find((p: any) => p.id === socket.id)
            setIsHost(me?.isHost ?? false)

            if (me) {
                setTurnPhase(me.hasPlayedThisTurn ? "MODIFY" : "ROLL")
            }

            if (gameState.boardConfig) {
                setAllowRuleEdit(gameState.boardConfig.allowRuleModification)
                setAllowTileEdit(gameState.boardConfig.allowTileModification)
            }

            if (gameState.activeRules) setRules(gameState.activeRules)
            if (gameState.coreRules) setCoreRules(gameState.coreRules)

            if (gameState.tiles?.length > 0 && gameState.tiles[0].position) {
                setTiles(
                    gameState.tiles.map((t: any, i: number) => ({
                        id: t.id,
                        x: t.position?.x ?? i - 10,
                        y: t.position?.y ?? 0,
                        type: t.type as "normal" | "special" | "start" | "end",
                        connections: t.connections || [],
                    }))
                )
            }

            if (gameState.status === "finished" && gameState.winnerId) {
                const winningPlayer = gameState.players.find((p: any) => p.id === gameState.winnerId)
                if (winningPlayer) {
                    setWinner({
                        id: gameState.winnerId,
                        name: winningPlayer.name || "Joueur",
                        color: winningPlayer.color,
                    })
                }
            }
        }

        const onDiceResult = (data: { diceValue: number; players: any[]; currentTurn: string }) => {
            playDiceRoll()
            setIsRolling(true)
            let rolls = 0
            const interval = setInterval(() => {
                setDiceValue(Math.floor(Math.random() * 6) + 1)
                rolls++
                if (rolls >= 10) {
                    clearInterval(interval)
                    setDiceValue(data.diceValue)
                    setIsRolling(false)
                    setPlayers(mapServerPlayersToClient(data.players))
                    setCurrentTurnId(data.currentTurn)
                    setTurnPhase("MODIFY")
                    toast.info(`Résultat : ${data.diceValue}`, { icon: "🎲" })
                }
            }, 50)
        }

        const onGameOver = (data: { winnerId: string; winnerName: string }) => {
            const winningPlayer = players.find((p) => String(p.id) === data.winnerId)
            const isMe = data.winnerId === socket.id
            play(isMe ? "victory" : "defeat")
            setWinner({ id: data.winnerId, name: data.winnerName, color: winningPlayer?.color })
            setGameStatus("finished")
        }

        const onRematchStarted = (gameState: any) => {
            setPlayers(mapServerPlayersToClient(gameState.players))
            setCurrentTurnId(gameState.currentTurn)
            setGameStatus("playing")
            setTurnPhase("ROLL")
            setWinner(null)
            setDiceValue(null)
            if (gameState.activeRules) setRules(gameState.activeRules)
            toast.success("Nouvelle partie !", { icon: "🎮" })
        }

        const onError = (data: { message: string }) => toast.error(data.message)

        const onKicked = (data: { reason?: string }) => {
            toast.error(data.reason || "Vous avez été exclu de la partie")
            sessionStorage.removeItem("gameConfig")
            router.push("/")
        }

        const onPlayerKicked = (data: { playerId: string; playerName: string }) => {
            toast.info(`${data.playerName} a été exclu de la partie`)
        }

        const onSettingsUpdated = (data: { allowRuleEdit?: boolean; allowTileEdit?: boolean }) => {
            if (data.allowRuleEdit !== undefined) setAllowRuleEdit(data.allowRuleEdit)
            if (data.allowTileEdit !== undefined) setAllowTileEdit(data.allowTileEdit)
            toast.info("Les paramètres de la partie ont été modifiés")
        }

        socket.on("connect", onConnect)
        socket.on("disconnect", onDisconnect)
        socket.on("room_joined", onRoomJoined)
        socket.on("game_state_sync", onGameStateSync)
        socket.on("dice_result", onDiceResult)
        socket.on("game_over", onGameOver)
        socket.on("rematch_started", onRematchStarted)
        socket.on("error", onError)
        socket.on("kicked_from_game", onKicked)
        socket.on("player_kicked", onPlayerKicked)
        socket.on("game_settings_updated", onSettingsUpdated)

        return () => {
            socket.off("connect", onConnect)
            socket.off("disconnect", onDisconnect)
            socket.off("room_joined", onRoomJoined)
            socket.off("game_state_sync", onGameStateSync)
            socket.off("dice_result", onDiceResult)
            socket.off("game_over", onGameOver)
            socket.off("rematch_started", onRematchStarted)
            socket.off("error", onError)
            socket.off("kicked_from_game", onKicked)
            socket.off("player_kicked", onPlayerKicked)
            socket.off("game_settings_updated", onSettingsUpdated)
            socket.disconnect()
        }
    }, [
        isLocalMode,
        gameConfig,
        mapServerPlayersToClient,
        players,
        router,
        setPlayers,
        setCurrentTurnId,
        setGameStatus,
        setTurnPhase,
        setDiceValue,
        setIsRolling,
        setRules,
        setCoreRules,
        setTiles,
        setWinner,
        playDiceRoll,
        play,
    ])

    // ===========================================
    // EFFECTS - Bot AI
    // ===========================================
    useEffect(() => {
        if (!isLocalMode || gameStatus !== "playing") return

        const player = players[localTurnIndex]
        if (!player?.isBot) return

        if (turnPhase === "ROLL" && !isRolling) {
            const timer = setTimeout(() => {
                setBotThinking(getBotThinkingMessage(player.botDifficulty || "medium"))
                setTimeout(() => {
                    setBotThinking(null)
                    rollDice()
                }, 800)
            }, 500)
            return () => clearTimeout(timer)
        }

        if (turnPhase === "MODIFY") {
            const timer = setTimeout(() => {
                setBotThinking(`${player.name} réfléchit...`)
                setTimeout(() => {
                    setBotThinking(null)
                    handleEndTurn()
                }, 1000)
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [isLocalMode, gameStatus, players, localTurnIndex, turnPhase, isRolling, rollDice, handleEndTurn])

    // ===========================================
    // RENDER
    // ===========================================
    return (
        <div className="bg-background text-foreground relative flex h-screen w-screen flex-col overflow-hidden">
            {winner ? (
                <GameOverModal winner={winner} players={players} onReset={handleLeaveGame} onRematch={handleRematch} />
            ) : null}

            <header className="bg-background/95 border-border/50 relative z-50 flex items-center justify-between border-b px-4 py-2 backdrop-blur">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-[10px] font-black tracking-[0.2em] uppercase">
                            {isLocalMode ? "Partie Locale" : "En Ligne"}
                        </span>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tighter text-white italic">SHIFT</h1>
                            {!isLocalMode && (
                                <Badge
                                    variant={isConnected ? "outline" : "destructive"}
                                    className={`h-5 gap-1.5 px-2 ${isConnected ? "border-cyan-500/30 text-cyan-400" : ""}`}
                                >
                                    {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                                    <span className="text-[10px] font-black uppercase">
                                        {activeRoom || (isConnected ? "Online" : "Offline")}
                                    </span>
                                </Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px]">
                                <Users className="mr-1 h-3 w-3" />
                                {players.length} joueur{players.length > 1 ? "s" : ""}
                            </Badge>
                            <GamepadBadge />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={startTutorial} className="h-9 w-9" title="Tutoriel">
                        <HelpCircle className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setActionHistoryOpen(true)}
                        className="h-9 w-9"
                        title="Historique"
                    >
                        <History className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setSettingsModalOpen(true)} className="h-9 w-9">
                        <Settings className="h-5 w-5" />
                    </Button>

                    {activeRoom ? (
                        <Button
                            onClick={() => setRulePackModalOpen(true)}
                            variant="outline"
                            size="sm"
                            className="border-violet-400/50 bg-violet-500/20 text-violet-400"
                        >
                            <Package className="mr-2 h-4 w-4" />
                            Modes
                        </Button>
                    ) : null}

                    <Button
                        onClick={handleAddRule}
                        size="sm"
                        disabled={!canModifyRulesNow}
                        className={`border ${canModifyRulesNow ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-400" : "cursor-not-allowed opacity-50"}`}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Règle
                    </Button>

                    <TopBar
                        currentTurnId={currentTurnId}
                        players={players}
                        diceValue={diceValue}
                        isRolling={isRolling}
                        onRollDice={rollDice}
                        gameStatus={gameStatus}
                        isLocalMode={isLocalMode}
                        canRoll={canRollDice}
                    />
                </div>
            </header>

            <div className="relative flex min-h-0 flex-1 overflow-hidden">
                <div className="relative min-w-0 flex-1">
                    <GameViewport
                        ref={viewportRef}
                        tiles={tiles}
                        players={players}
                        currentTurn={currentTurnId}
                        onAddTile={handleAddTile}
                        onCenterCamera={centerOnPlayer}
                        isSelectionMode={isSelectingTile}
                        onTileClick={handleTileClick}
                        rules={allRules}
                        onTileDetails={handleTileDetails}
                        isRemoveTileMode={false}
                        onRemoveTile={handleRemoveTile}
                        canModifyTiles={canModifyTilesNow}
                    />

                    {isSelectingTile ? (
                        <div className="absolute top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-yellow-400/50 bg-black/80 px-6 py-3 text-white">
                            <Crosshair className="h-5 w-5 animate-pulse text-yellow-400" />
                            <span className="font-bold">CLIQUEZ SUR UNE CASE</span>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                    setIsSelectingTile(false)
                                    setRuleBuilderOpen(true)
                                }}
                            >
                                ✕
                            </Button>
                        </div>
                    ) : null}
                </div>

                <aside className="border-border/50 bg-background/60 hidden border-l backdrop-blur-md lg:flex lg:w-80 lg:shrink-0">
                    <RuleBook
                        rules={rules}
                        onEditRule={handleEditRule}
                        onDeleteRule={handleDeleteRule}
                        onAddRule={handleAddRule}
                        onAddRuleFromTemplate={handleAddRuleFromTemplate}
                        onReorderRules={setRules}
                        disabled={!canModifyRulesNow}
                    />
                </aside>
            </div>

            <Button
                onClick={() => setMobileRuleBookOpen(true)}
                className="fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full bg-cyan-500 shadow-lg hover:bg-cyan-400 lg:hidden"
                size="icon"
            >
                <Book className="h-6 w-6" />
            </Button>

            <Sheet open={mobileRuleBookOpen} onOpenChange={setMobileRuleBookOpen}>
                <SheetContent side="right" className="w-full p-0 sm:max-w-md">
                    <SheetHeader className="border-b p-6">
                        <SheetTitle className="flex items-center gap-3">
                            <Book className="h-6 w-6 text-cyan-500" /> LIVRE DES RÈGLES
                        </SheetTitle>
                    </SheetHeader>
                    <RuleBook
                        rules={rules}
                        onEditRule={(rule) => {
                            setMobileRuleBookOpen(false)
                            handleEditRule(rule)
                        }}
                        onDeleteRule={handleDeleteRule}
                        onAddRule={() => {
                            setMobileRuleBookOpen(false)
                            handleAddRule()
                        }}
                        onAddRuleFromTemplate={handleAddRuleFromTemplate}
                        onReorderRules={setRules}
                        disabled={!canModifyRulesNow}
                    />
                </SheetContent>
            </Sheet>

            {gameStatus === "playing" && (
                <ModificationPanel
                    canModify={canModify}
                    canModifyRules={canModifyRulesNow}
                    canModifyTiles={canModifyTilesNow}
                    hasModifiedThisTurn={false}
                    hasPlayedThisTurn={turnPhase !== "ROLL"}
                    isCurrentTurn={isMyTurn}
                    onAddRule={handleAddRule}
                    onAddTile={() => openTileSelectionModal("add")}
                    onRemoveTile={() => openTileSelectionModal("remove")}
                    onEndTurn={handleEndTurn}
                />
            )}

            {botThinking ? (
                <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 animate-pulse items-center gap-3 rounded-full border border-violet-400 bg-violet-500/90 px-6 py-3 text-white">
                    <Bot className="h-5 w-5" />
                    <span className="font-bold">{botThinking}</span>
                </div>
            ) : null}

            <RuleBuilderModal
                open={ruleBuilderOpen}
                onOpenChange={setRuleBuilderOpen}
                onSaveRule={handleSaveRule}
                editingRule={editingRule}
                initialData={draftRule || undefined}
                onStartSelection={handleStartTileSelection}
            />

            <RulePackModal
                open={rulePackModalOpen}
                onOpenChange={setRulePackModalOpen}
                currentRulesCount={rules.length}
            />

            <SettingsModal
                open={settingsModalOpen}
                onOpenChange={setSettingsModalOpen}
                players={players.map((p) => ({ id: String(p.id), name: p.name, color: p.color, isHost: p.isHost }))}
                currentPlayerId={isLocalMode ? null : socket.id || null}
                isHost={isHost}
                isLocalMode={isLocalMode}
                allowRuleEdit={allowRuleEdit}
                allowTileEdit={allowTileEdit}
                onKickPlayer={handleKickPlayer}
                onLeaveGame={handleLeaveGame}
                onToggleRuleEdit={isHost ? handleToggleRuleEdit : undefined}
                onToggleTileEdit={isHost ? handleToggleTileEdit : undefined}
                onSaveGame={handleQuickSave}
                gamepadAssignments={gamepadAssignments}
                onAssignGamepad={(idx, id) => setGamepadAssignments((prev) => ({ ...prev, [idx]: id }))}
                tutorialCompletedSections={tutorialPrefs.preferences.completedSections}
                tutorialHintsEnabled={tutorialPrefs.preferences.hintsEnabled}
                onStartTutorialSection={startTutorialSection}
                onStartFullTutorial={startTutorial}
                onResetTutorialProgress={tutorialPrefs.resetProgress}
                onToggleTutorialHints={tutorialPrefs.toggleHints}
            />

            <TileDetailModal
                open={tileDetailOpen}
                onOpenChange={setTileDetailOpen}
                tileIndex={selectedTileIndex}
                tileType={tiles[selectedTileIndex]?.type || "normal"}
                rules={rulesForSelectedTile}
            />

            <TileSelectionModal
                open={tileSelectionModalOpen}
                onOpenChange={setTileSelectionModalOpen}
                tiles={tiles}
                mode={tileSelectionMode}
                onSelectTile={(tileId, direction) => {
                    if (tileSelectionMode === "add") {
                        const fromTile = tiles.find((t) => t.id === tileId)
                        if (fromTile) handleAddTile(direction, { x: fromTile.x, y: fromTile.y })
                    } else {
                        handleRemoveTile(tileId)
                    }
                    setTileSelectionModalOpen(false)
                }}
            />

            <PathChoiceModal
                open={pathChoiceOpen}
                onOpenChange={setPathChoiceOpen}
                paths={availablePaths}
                tiles={tileNodes}
                diceValue={pendingDiceValue || 0}
                onSelectPath={handlePathSelected}
                playerColor={currentPlayer?.color}
            />

            <Sheet open={actionHistoryOpen} onOpenChange={setActionHistoryOpen}>
                <SheetContent side="left" className="!w-full p-0 sm:!max-w-md">
                    <SheetTitle className="sr-only">Historique des actions</SheetTitle>
                    <ActionHistory
                        roomId={activeRoom || "local"}
                        currentPlayerId={isLocalMode ? String(players[localTurnIndex]?.id) : socket.id || undefined}
                    />
                </SheetContent>
            </Sheet>

            <RuleAnimations />

            {/* Tutorial System */}
            <TutorialWelcomeModal
                open={welcomeModalOpen}
                onStartTutorial={() => {
                    setWelcomeModalOpen(false)
                    startTutorial()
                }}
                onSkip={() => setWelcomeModalOpen(false)}
                onNeverAsk={() => {
                    tutorialPrefs.setNeverAskAgain(true)
                    setWelcomeModalOpen(false)
                }}
            />
            <InteractiveTutorial
                isOpen={tutorialOpen}
                onClose={closeTutorial}
                onComplete={() => {
                    tutorialPrefs.markCompleted()
                    completeTutorial()
                }}
                startSection={tutorialActiveSection}
                onSectionComplete={tutorialPrefs.markSectionCompleted}
            />
            <TutorialHints
                enabled={tutorialPrefs.preferences.hintsEnabled && !tutorialOpen ? isLocalMode : false}
                turnCount={localTurnIndex + 1}
                turnPhase={turnPhase}
                hasRolledDice={diceValue !== null}
                rulesCount={rules.length}
                dismissedHints={tutorialPrefs.preferences.completedSections}
                onDismiss={tutorialPrefs.markSectionCompleted}
            />

            <GamepadIndicator showControls={false} />
        </div>
    )
}
