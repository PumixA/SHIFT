"use client"

import { useState } from "react"
import {
    Settings,
    LogOut,
    UserX,
    Crown,
    Users,
    Volume2,
    VolumeX,
    Gamepad2,
    Save,
    Keyboard,
    Pencil,
    LayoutGrid,
    Shield,
    AlertTriangle,
    Focus,
    Eye,
    EyeOff,
    HelpCircle,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { GamepadSettings } from "./gamepad-settings"
import { TutorialHelpMenu } from "./tutorial-help-menu"
import { GAME_SHORTCUTS } from "@/hooks/useKeyboardShortcuts"
import { cn } from "@/lib/utils"
import type { TutorialSection } from "./interactive-tutorial"

interface Player {
    id: string | number
    name: string
    color: string
    isHost?: boolean
}

interface SettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    players: Player[]
    currentPlayerId: string | null
    isHost: boolean
    isLocalMode: boolean
    allowRuleEdit: boolean
    allowTileEdit?: boolean
    focusMode?: boolean
    onKickPlayer?: (playerId: string) => void
    onLeaveGame: () => void
    onToggleRuleEdit?: (enabled: boolean) => void
    onToggleTileEdit?: (enabled: boolean) => void
    onToggleFocusMode?: (enabled: boolean) => void
    onSaveGame?: () => void
    gamepadAssignments?: Record<number, string | null>
    onAssignGamepad?: (gamepadIndex: number, playerId: string | null) => void
    // Tutorial props
    tutorialCompletedSections?: string[]
    tutorialHintsEnabled?: boolean
    onStartTutorialSection?: (section: TutorialSection) => void
    onStartFullTutorial?: () => void
    onResetTutorialProgress?: () => void
    onToggleTutorialHints?: (enabled: boolean) => void
}

export function SettingsModal({
    open,
    onOpenChange,
    players,
    currentPlayerId,
    isHost,
    isLocalMode,
    allowRuleEdit,
    allowTileEdit = true,
    focusMode = false,
    onKickPlayer,
    onLeaveGame,
    onToggleRuleEdit,
    onToggleTileEdit,
    onToggleFocusMode,
    onSaveGame,
    gamepadAssignments = {},
    onAssignGamepad,
    // Tutorial props
    tutorialCompletedSections = [],
    tutorialHintsEnabled = true,
    onStartTutorialSection,
    onStartFullTutorial,
    onResetTutorialProgress,
    onToggleTutorialHints,
}: SettingsModalProps) {
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [vibrationEnabled, setVibrationEnabled] = useState(true)
    const [kickConfirmOpen, setKickConfirmOpen] = useState(false)
    const [playerToKick, setPlayerToKick] = useState<Player | null>(null)

    const handleKickClick = (player: Player) => {
        setPlayerToKick(player)
        setKickConfirmOpen(true)
    }

    const confirmKick = () => {
        if (playerToKick && onKickPlayer) {
            onKickPlayer(String(playerToKick.id))
        }
        setKickConfirmOpen(false)
        setPlayerToKick(null)
    }

    const getColorClass = (color: string) => {
        switch (color) {
            case "cyan":
                return "bg-cyan-500"
            case "violet":
                return "bg-violet-500"
            case "orange":
                return "bg-orange-500"
            case "green":
                return "bg-green-500"
            default:
                return "bg-gray-500"
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[90vh] overflow-y-auto border-white/[0.08] bg-slate-900/95 backdrop-blur-xl sm:max-w-[560px]">
                    <DialogHeader className="pb-2">
                        <DialogTitle className="flex items-center gap-3 text-lg font-semibold tracking-tight">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg">
                                <Settings className="h-5 w-5 text-white/70" />
                            </div>
                            Paramètres de la partie
                        </DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="game" className="mt-2">
                        <TabsList className="grid h-11 w-full grid-cols-5 rounded-xl bg-white/5 p-1">
                            <TabsTrigger
                                value="game"
                                className="rounded-lg text-xs data-[state=active]:bg-white/10 data-[state=active]:shadow-sm"
                            >
                                <Settings className="mr-1.5 h-3.5 w-3.5" />
                                Partie
                            </TabsTrigger>
                            <TabsTrigger
                                value="players"
                                className="rounded-lg text-xs data-[state=active]:bg-white/10 data-[state=active]:shadow-sm"
                            >
                                <Users className="mr-1.5 h-3.5 w-3.5" />
                                Joueurs
                            </TabsTrigger>
                            <TabsTrigger
                                value="gamepad"
                                className="rounded-lg text-xs data-[state=active]:bg-white/10 data-[state=active]:shadow-sm"
                            >
                                <Gamepad2 className="mr-1.5 h-3.5 w-3.5" />
                                Manettes
                            </TabsTrigger>
                            <TabsTrigger
                                value="shortcuts"
                                className="rounded-lg text-xs data-[state=active]:bg-white/10 data-[state=active]:shadow-sm"
                            >
                                <Keyboard className="mr-1.5 h-3.5 w-3.5" />
                                Touches
                            </TabsTrigger>
                            <TabsTrigger
                                value="help"
                                className="rounded-lg text-xs data-[state=active]:bg-white/10 data-[state=active]:shadow-sm"
                            >
                                <HelpCircle className="mr-1.5 h-3.5 w-3.5" />
                                Aide
                            </TabsTrigger>
                        </TabsList>

                        {/* Onglet Partie */}
                        <TabsContent value="game" className="mt-5 space-y-5">
                            {/* Paramètres du créateur */}
                            {isHost ? (
                                <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-4">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20">
                                            <Crown className="h-4 w-4 text-amber-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-amber-200">Paramètres de l'hôte</h4>
                                            <p className="text-xs text-amber-200/60">Affectent tous les joueurs</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {/* Édition de règles */}
                                        {onToggleRuleEdit ? (
                                            <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/[0.07]">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20">
                                                        <Pencil className="h-4 w-4 text-cyan-400" />
                                                    </div>
                                                    <div>
                                                        <Label
                                                            htmlFor="rule-edit"
                                                            className="cursor-pointer text-sm font-medium"
                                                        >
                                                            Édition de règles
                                                        </Label>
                                                        <p className="text-xs text-white/50">
                                                            Créer et modifier des règles
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    id="rule-edit"
                                                    checked={allowRuleEdit}
                                                    onCheckedChange={onToggleRuleEdit}
                                                />
                                            </div>
                                        ) : null}

                                        {/* Modification du plateau */}
                                        {onToggleTileEdit ? (
                                            <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/[0.07]">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
                                                        <LayoutGrid className="h-4 w-4 text-violet-400" />
                                                    </div>
                                                    <div>
                                                        <Label
                                                            htmlFor="tile-edit"
                                                            className="cursor-pointer text-sm font-medium"
                                                        >
                                                            Modification du plateau
                                                        </Label>
                                                        <p className="text-xs text-white/50">
                                                            Ajouter ou supprimer des cases
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    id="tile-edit"
                                                    checked={allowTileEdit}
                                                    onCheckedChange={onToggleTileEdit}
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}

                            {/* Paramètres audio */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold tracking-wider text-white/40 uppercase">Audio</h4>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/[0.07]">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                                                {soundEnabled ? (
                                                    <Volume2 className="h-4 w-4 text-white/70" />
                                                ) : (
                                                    <VolumeX className="h-4 w-4 text-white/40" />
                                                )}
                                            </div>
                                            <Label htmlFor="sound" className="cursor-pointer text-sm font-medium">
                                                Effets sonores
                                            </Label>
                                        </div>
                                        <Switch id="sound" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                                    </div>

                                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/[0.07]">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                                                <Gamepad2 className="h-4 w-4 text-white/70" />
                                            </div>
                                            <div>
                                                <Label
                                                    htmlFor="vibration"
                                                    className="cursor-pointer text-sm font-medium"
                                                >
                                                    Vibrations
                                                </Label>
                                                <p className="text-xs text-white/50">Retour haptique manette</p>
                                            </div>
                                        </div>
                                        <Switch
                                            id="vibration"
                                            checked={vibrationEnabled}
                                            onCheckedChange={setVibrationEnabled}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Mode Focus */}
                            {onToggleFocusMode ? (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold tracking-wider text-white/40 uppercase">
                                        Affichage
                                    </h4>

                                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/[0.07]">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn(
                                                    "flex h-8 w-8 items-center justify-center rounded-lg",
                                                    focusMode ? "bg-cyan-500/20" : "bg-white/10"
                                                )}
                                            >
                                                {focusMode ? (
                                                    <Eye className="h-4 w-4 text-cyan-400" />
                                                ) : (
                                                    <EyeOff className="h-4 w-4 text-white/40" />
                                                )}
                                            </div>
                                            <div>
                                                <Label
                                                    htmlFor="focus-mode"
                                                    className="cursor-pointer text-sm font-medium"
                                                >
                                                    Mode Focus
                                                </Label>
                                                <p className="text-xs text-white/50">
                                                    Masquer les éléments secondaires
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            id="focus-mode"
                                            checked={focusMode}
                                            onCheckedChange={onToggleFocusMode}
                                        />
                                    </div>
                                </div>
                            ) : null}

                            <div className="h-px bg-white/[0.06]" />

                            {/* Actions */}
                            <div className="space-y-2">
                                {onSaveGame ? (
                                    <Button
                                        variant="outline"
                                        className="h-11 w-full justify-start rounded-xl border-white/10 bg-white/5 font-medium hover:bg-white/10"
                                        onClick={onSaveGame}
                                    >
                                        <Save className="mr-3 h-4 w-4 text-cyan-400" />
                                        Sauvegarder la partie
                                    </Button>
                                ) : null}

                                <Button
                                    variant="ghost"
                                    className="h-11 w-full justify-start rounded-xl font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                    onClick={onLeaveGame}
                                >
                                    <LogOut className="mr-3 h-4 w-4" />
                                    Quitter la partie
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Onglet Joueurs */}
                        <TabsContent value="players" className="mt-4 space-y-4">
                            {players.length > 0 ? (
                                <div className="space-y-2">
                                    {players.map((player) => {
                                        const isCurrentPlayer = String(player.id) === String(currentPlayerId)

                                        return (
                                            <div
                                                key={player.id}
                                                className={`flex items-center justify-between rounded-xl p-4 transition-colors ${
                                                    isCurrentPlayer
                                                        ? "border border-cyan-500/30 bg-cyan-500/10"
                                                        : "bg-white/5 hover:bg-white/10"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`h-4 w-4 rounded-full ${getColorClass(player.color)}`}
                                                    />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`font-medium ${isCurrentPlayer ? "text-cyan-400" : ""}`}
                                                            >
                                                                {player.name}
                                                            </span>
                                                            {player.isHost ? (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-yellow-500/50 py-0 text-[10px]"
                                                                >
                                                                    <Crown className="mr-1 h-3 w-3 text-yellow-400" />
                                                                    Hôte
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                        {isCurrentPlayer ? (
                                                            <span className="text-muted-foreground text-xs">
                                                                C'est vous
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                {/* Bouton kick (pour l'hôte uniquement) */}
                                                {isHost && !isCurrentPlayer && onKickPlayer && !isLocalMode ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 px-3 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                                        onClick={() => handleKickClick(player)}
                                                    >
                                                        <UserX className="mr-2 h-4 w-4" />
                                                        Exclure
                                                    </Button>
                                                ) : null}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-muted-foreground py-8 text-center">
                                    <Users className="mx-auto mb-3 h-12 w-12 opacity-50" />
                                    <p>Aucun joueur dans la partie</p>
                                </div>
                            )}

                            {isHost && !isLocalMode ? (
                                <Card className="border-orange-500/30 bg-orange-500/10">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <Shield className="mt-0.5 h-5 w-5 text-orange-400" />
                                            <div className="text-sm">
                                                <p className="font-medium text-orange-400">Vous êtes l'hôte</p>
                                                <p className="text-muted-foreground mt-1 text-xs">
                                                    Vous pouvez exclure n'importe quel joueur de la partie. Les joueurs
                                                    exclus seront redirigés vers le menu principal.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : null}
                        </TabsContent>

                        {/* Onglet Manettes */}
                        <TabsContent value="gamepad" className="mt-4">
                            <GamepadSettings
                                players={players.map((p) => ({ id: String(p.id), name: p.name, color: p.color }))}
                                gamepadAssignments={gamepadAssignments}
                                onAssignGamepad={onAssignGamepad || (() => {})}
                            />
                        </TabsContent>

                        {/* Onglet Raccourcis */}
                        <TabsContent value="shortcuts" className="mt-4">
                            <div className="space-y-4">
                                <p className="text-muted-foreground text-sm">
                                    Raccourcis clavier disponibles pendant le jeu.
                                </p>

                                <div className="grid gap-2">
                                    {Object.entries(GAME_SHORTCUTS).map(([key, shortcut]) => (
                                        <div
                                            key={key}
                                            className="flex items-center justify-between rounded-lg bg-white/5 p-2"
                                        >
                                            <span className="text-sm">{shortcut.description}</span>
                                            <kbd className="rounded border border-white/20 bg-black/30 px-2 py-1 font-mono text-xs">
                                                {"ctrl" in shortcut && shortcut.ctrl ? "Ctrl+" : null}
                                                {"shift" in shortcut && shortcut.shift ? "Maj+" : null}
                                                {"alt" in shortcut && shortcut.alt ? "Alt+" : null}
                                                {shortcut.key === " " ? "Espace" : shortcut.key.toUpperCase()}
                                            </kbd>
                                        </div>
                                    ))}
                                </div>

                                <Separator />

                                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3">
                                    <h4 className="mb-2 text-sm font-medium">Navigation</h4>
                                    <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
                                        <div>↑ ↓ ← → : Déplacer la vue</div>
                                        <div>Molette : Zoomer</div>
                                        <div>Glisser : Panoramique</div>
                                        <div>Clic droit : Menu contextuel</div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Onglet Aide */}
                        <TabsContent value="help" className="mt-4">
                            <TutorialHelpMenu
                                completedSections={tutorialCompletedSections}
                                hintsEnabled={tutorialHintsEnabled}
                                onStartSection={(section) => {
                                    onOpenChange(false)
                                    onStartTutorialSection?.(section)
                                }}
                                onStartFull={() => {
                                    onOpenChange(false)
                                    onStartFullTutorial?.()
                                }}
                                onReset={() => onResetTutorialProgress?.()}
                                onToggleHints={(enabled) => onToggleTutorialHints?.(enabled)}
                            />
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Dialog de confirmation d'exclusion */}
            <AlertDialog open={kickConfirmOpen} onOpenChange={setKickConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                            Exclure {playerToKick?.name} ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Ce joueur sera immédiatement retiré de la partie et redirigé vers le menu principal. Cette
                            action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmKick} className="bg-red-500 hover:bg-red-600">
                            <UserX className="mr-2 h-4 w-4" />
                            Exclure
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
