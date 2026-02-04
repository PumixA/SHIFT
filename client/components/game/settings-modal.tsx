"use client"

import { useState } from "react"
import {
    Settings, LogOut, UserX, Crown, Users, Volume2, VolumeX, Gamepad2, Save, Keyboard,
    Pencil, LayoutGrid, Shield, AlertTriangle, Focus, Eye, EyeOff
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
import { GAME_SHORTCUTS } from "@/hooks/useKeyboardShortcuts"

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
            case 'cyan': return 'bg-cyan-500'
            case 'violet': return 'bg-violet-500'
            case 'orange': return 'bg-orange-500'
            case 'green': return 'bg-green-500'
            default: return 'bg-gray-500'
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-white/10">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                            <Settings className="h-5 w-5 text-muted-foreground" />
                            Paramètres de la partie
                        </DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="game" className="mt-4">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="game" className="text-xs">
                                <Settings className="h-4 w-4 mr-1" />
                                Partie
                            </TabsTrigger>
                            <TabsTrigger value="players" className="text-xs">
                                <Users className="h-4 w-4 mr-1" />
                                Joueurs
                            </TabsTrigger>
                            <TabsTrigger value="gamepad" className="text-xs">
                                <Gamepad2 className="h-4 w-4 mr-1" />
                                Manettes
                            </TabsTrigger>
                            <TabsTrigger value="shortcuts" className="text-xs">
                                <Keyboard className="h-4 w-4 mr-1" />
                                Touches
                            </TabsTrigger>
                        </TabsList>

                        {/* Onglet Partie */}
                        <TabsContent value="game" className="space-y-4 mt-4">
                            {/* Paramètres du créateur */}
                            {isHost && (
                                <Card className="bg-yellow-500/10 border-yellow-500/30">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Crown className="h-4 w-4 text-yellow-400" />
                                            Paramètres de l'hôte
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Ces paramètres affectent tous les joueurs
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {/* Édition de règles */}
                                        {onToggleRuleEdit && (
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                                <div className="flex items-center gap-3">
                                                    <Pencil className="h-5 w-5 text-cyan-400" />
                                                    <div>
                                                        <Label htmlFor="rule-edit" className="cursor-pointer font-medium">
                                                            Édition de règles
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Permettre aux joueurs de créer/modifier des règles
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    id="rule-edit"
                                                    checked={allowRuleEdit}
                                                    onCheckedChange={onToggleRuleEdit}
                                                />
                                            </div>
                                        )}

                                        {/* Modification du plateau */}
                                        {onToggleTileEdit && (
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                                <div className="flex items-center gap-3">
                                                    <LayoutGrid className="h-5 w-5 text-violet-400" />
                                                    <div>
                                                        <Label htmlFor="tile-edit" className="cursor-pointer font-medium">
                                                            Modification du plateau
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Permettre d'ajouter/supprimer des cases
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    id="tile-edit"
                                                    checked={allowTileEdit}
                                                    onCheckedChange={onToggleTileEdit}
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Paramètres audio */}
                            <div className="space-y-3">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                    Audio
                                </Label>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                    <div className="flex items-center gap-3">
                                        {soundEnabled ? (
                                            <Volume2 className="h-5 w-5 text-muted-foreground" />
                                        ) : (
                                            <VolumeX className="h-5 w-5 text-muted-foreground" />
                                        )}
                                        <Label htmlFor="sound" className="cursor-pointer">Effets sonores</Label>
                                    </div>
                                    <Switch
                                        id="sound"
                                        checked={soundEnabled}
                                        onCheckedChange={setSoundEnabled}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <Label htmlFor="vibration" className="cursor-pointer">Vibrations</Label>
                                            <p className="text-xs text-muted-foreground">Retour haptique manette</p>
                                        </div>
                                    </div>
                                    <Switch
                                        id="vibration"
                                        checked={vibrationEnabled}
                                        onCheckedChange={setVibrationEnabled}
                                    />
                                </div>
                            </div>

                            {/* Mode Focus */}
                            {onToggleFocusMode && (
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        Affichage
                                    </Label>

                                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                        <div className="flex items-center gap-3">
                                            {focusMode ? (
                                                <Eye className="h-5 w-5 text-cyan-400" />
                                            ) : (
                                                <EyeOff className="h-5 w-5 text-muted-foreground" />
                                            )}
                                            <div>
                                                <Label htmlFor="focus-mode" className="cursor-pointer">Mode Focus</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Masquer les éléments secondaires pour se concentrer sur le plateau
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
                            )}

                            <Separator />

                            {/* Sauvegarder */}
                            {onSaveGame && (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={onSaveGame}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Sauvegarder la partie
                                </Button>
                            )}

                            {/* Quitter */}
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={onLeaveGame}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Quitter la partie
                            </Button>
                        </TabsContent>

                        {/* Onglet Joueurs */}
                        <TabsContent value="players" className="space-y-4 mt-4">
                            {players.length > 0 ? (
                                <div className="space-y-2">
                                    {players.map((player) => {
                                        const isCurrentPlayer = String(player.id) === String(currentPlayerId)

                                        return (
                                            <div
                                                key={player.id}
                                                className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                                                    isCurrentPlayer
                                                        ? 'bg-cyan-500/10 border border-cyan-500/30'
                                                        : 'bg-white/5 hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded-full ${getColorClass(player.color)}`} />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-medium ${isCurrentPlayer ? 'text-cyan-400' : ''}`}>
                                                                {player.name}
                                                            </span>
                                                            {player.isHost && (
                                                                <Badge variant="outline" className="text-[10px] py-0 border-yellow-500/50">
                                                                    <Crown className="h-3 w-3 mr-1 text-yellow-400" />
                                                                    Hôte
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {isCurrentPlayer && (
                                                            <span className="text-xs text-muted-foreground">C'est vous</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Bouton kick (pour l'hôte uniquement) */}
                                                {isHost && !isCurrentPlayer && onKickPlayer && !isLocalMode && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                        onClick={() => handleKickClick(player)}
                                                    >
                                                        <UserX className="h-4 w-4 mr-2" />
                                                        Exclure
                                                    </Button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>Aucun joueur dans la partie</p>
                                </div>
                            )}

                            {isHost && !isLocalMode && (
                                <Card className="bg-orange-500/10 border-orange-500/30">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <Shield className="h-5 w-5 text-orange-400 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-medium text-orange-400">Vous êtes l'hôte</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Vous pouvez exclure n'importe quel joueur de la partie.
                                                    Les joueurs exclus seront redirigés vers le menu principal.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* Onglet Manettes */}
                        <TabsContent value="gamepad" className="mt-4">
                            <GamepadSettings
                                players={players.map(p => ({ id: String(p.id), name: p.name, color: p.color }))}
                                gamepadAssignments={gamepadAssignments}
                                onAssignGamepad={onAssignGamepad || (() => {})}
                            />
                        </TabsContent>

                        {/* Onglet Raccourcis */}
                        <TabsContent value="shortcuts" className="mt-4">
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Raccourcis clavier disponibles pendant le jeu.
                                </p>

                                <div className="grid gap-2">
                                    {Object.entries(GAME_SHORTCUTS).map(([key, shortcut]) => (
                                        <div
                                            key={key}
                                            className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                                        >
                                            <span className="text-sm">{shortcut.description}</span>
                                            <kbd className="px-2 py-1 text-xs font-mono bg-black/30 rounded border border-white/20">
                                                {shortcut.ctrl && "Ctrl+"}
                                                {shortcut.shift && "Maj+"}
                                                {shortcut.alt && "Alt+"}
                                                {shortcut.key === ' ' ? 'Espace' : shortcut.key.toUpperCase()}
                                            </kbd>
                                        </div>
                                    ))}
                                </div>

                                <Separator />

                                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                                    <h4 className="font-medium text-sm mb-2">Navigation</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                        <div>↑ ↓ ← → : Déplacer la vue</div>
                                        <div>Molette : Zoomer</div>
                                        <div>Glisser : Panoramique</div>
                                        <div>Clic droit : Menu contextuel</div>
                                    </div>
                                </div>
                            </div>
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
                            Ce joueur sera immédiatement retiré de la partie et redirigé vers le menu principal.
                            Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmKick}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            <UserX className="h-4 w-4 mr-2" />
                            Exclure
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
