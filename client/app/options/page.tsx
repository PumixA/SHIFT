"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Volume2,
    VolumeX,
    Gamepad2,
    Keyboard,
    Monitor,
    Bell,
    Accessibility,
    RotateCcw,
    ChevronRight,
    Music,
    Zap,
    Sun,
    Moon,
    Eye,
    Type,
    Vibrate,
    Settings,
    Save,
    Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { PageHeader } from "@/components/ui/design-system"

interface GameOptions {
    audio: {
        masterVolume: number
        musicVolume: number
        sfxVolume: number
        muted: boolean
    }
    controls: {
        gamepadEnabled: boolean
        gamepadVibration: boolean
        keyboardShortcuts: boolean
    }
    display: {
        theme: "dark" | "light" | "system"
        animations: boolean
        effectsQuality: "low" | "medium" | "high"
        showFps: boolean
    }
    notifications: {
        pushEnabled: boolean
        soundEnabled: boolean
        vibrationEnabled: boolean
        turnReminder: boolean
    }
    accessibility: {
        colorBlindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia"
        largeText: boolean
        reduceMotion: boolean
        highContrast: boolean
    }
}

const DEFAULT_OPTIONS: GameOptions = {
    audio: {
        masterVolume: 70,
        musicVolume: 50,
        sfxVolume: 80,
        muted: false,
    },
    controls: {
        gamepadEnabled: true,
        gamepadVibration: true,
        keyboardShortcuts: true,
    },
    display: {
        theme: "dark",
        animations: true,
        effectsQuality: "high",
        showFps: false,
    },
    notifications: {
        pushEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        turnReminder: true,
    },
    accessibility: {
        colorBlindMode: "none",
        largeText: false,
        reduceMotion: false,
        highContrast: false,
    },
}

const KEYBOARD_SHORTCUTS = [
    { key: "Espace", action: "Lancer le dé / Confirmer" },
    { key: "Échap", action: "Ouvrir le menu / Annuler" },
    { key: "R", action: "Ouvrir les règles" },
    { key: "H", action: "Ouvrir l'historique" },
    { key: "C", action: "Ouvrir le chat" },
    { key: "S", action: "Sauvegarder la partie" },
    { key: "↑↓←→", action: "Naviguer sur le plateau" },
    { key: "Tab", action: "Changer de focus" },
]

const GAMEPAD_BUTTONS = [
    { button: "A / X", action: "Confirmer / Lancer le dé" },
    { button: "B / ○", action: "Annuler / Retour" },
    { button: "X / □", action: "Ouvrir les règles" },
    { button: "Y / △", action: "Ouvrir le chat" },
    { button: "LB / L1", action: "Action précédente" },
    { button: "RB / R1", action: "Action suivante" },
    { button: "Start", action: "Menu pause" },
    { button: "D-Pad", action: "Navigation" },
]

export default function OptionsPage() {
    const router = useRouter()
    const [options, setOptions] = useState<GameOptions>(DEFAULT_OPTIONS)
    const [hasChanges, setHasChanges] = useState(false)
    const [resetDialogOpen, setResetDialogOpen] = useState(false)

    // Charger les options sauvegardées
    useEffect(() => {
        const saved = localStorage.getItem("gameOptions")
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setOptions({ ...DEFAULT_OPTIONS, ...parsed })
            } catch (e) {
                console.error("Erreur lors du chargement des options:", e)
            }
        }
    }, [])

    // Sauvegarder automatiquement les options
    useEffect(() => {
        if (hasChanges) {
            localStorage.setItem("gameOptions", JSON.stringify(options))
        }
    }, [options, hasChanges])

    const updateOption = <K extends keyof GameOptions>(
        category: K,
        key: keyof GameOptions[K],
        value: GameOptions[K][keyof GameOptions[K]]
    ) => {
        setOptions((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value,
            },
        }))
        setHasChanges(true)
    }

    const resetToDefaults = () => {
        setOptions(DEFAULT_OPTIONS)
        localStorage.setItem("gameOptions", JSON.stringify(DEFAULT_OPTIONS))
        setResetDialogOpen(false)
        setHasChanges(false)
        toast.success("Options réinitialisées")
    }

    const saveAndExit = () => {
        localStorage.setItem("gameOptions", JSON.stringify(options))
        toast.success("Options sauvegardées")
        router.push("/")
    }

    return (
        <div className="bg-background min-h-screen">
            {/* Background Effect */}
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.1),transparent_50%)]" />
            </div>

            {/* Header */}
            <header className="bg-background/80 relative sticky top-0 z-10 border-b border-white/5 backdrop-blur-xl">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/">
                                <Button variant="ghost" size="icon" className="hover:bg-white/10">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <PageHeader
                                icon={Settings}
                                title="OPTIONS"
                                subtitle="Paramètres du jeu"
                                gradient="from-orange-500 to-red-600"
                            />
                        </div>

                        {hasChanges ? (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                <Button
                                    onClick={saveAndExit}
                                    className="gap-2 bg-gradient-to-r from-orange-500 to-red-600"
                                >
                                    <Save className="h-4 w-4" />
                                    Sauvegarder
                                </Button>
                            </motion.div>
                        ) : null}
                    </div>
                </div>
            </header>

            <main className="relative z-10 container mx-auto max-w-2xl space-y-6 px-4 py-6">
                {/* Audio */}
                <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            {options.audio.muted ? (
                                <VolumeX className="h-5 w-5 text-red-400" />
                            ) : (
                                <Volume2 className="h-5 w-5 text-cyan-400" />
                            )}
                            Audio
                        </CardTitle>
                        <CardDescription>Gérer les volumes et le son</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Master Volume */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Volume principal</Label>
                                <span className="text-muted-foreground text-sm">{options.audio.masterVolume}%</span>
                            </div>
                            <Slider
                                value={[options.audio.masterVolume]}
                                onValueChange={([v]: number[]) => updateOption("audio", "masterVolume", v)}
                                max={100}
                                step={1}
                                disabled={options.audio.muted}
                            />
                        </div>

                        {/* Music Volume */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Music className="h-4 w-4" />
                                    Musique
                                </Label>
                                <span className="text-muted-foreground text-sm">{options.audio.musicVolume}%</span>
                            </div>
                            <Slider
                                value={[options.audio.musicVolume]}
                                onValueChange={([v]: number[]) => updateOption("audio", "musicVolume", v)}
                                max={100}
                                step={1}
                                disabled={options.audio.muted}
                            />
                        </div>

                        {/* SFX Volume */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Zap className="h-4 w-4" />
                                    Effets sonores
                                </Label>
                                <span className="text-muted-foreground text-sm">{options.audio.sfxVolume}%</span>
                            </div>
                            <Slider
                                value={[options.audio.sfxVolume]}
                                onValueChange={([v]: number[]) => updateOption("audio", "sfxVolume", v)}
                                max={100}
                                step={1}
                                disabled={options.audio.muted}
                            />
                        </div>

                        <Separator />

                        {/* Mute Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Couper le son</Label>
                                <p className="text-muted-foreground text-xs">Désactiver tous les sons</p>
                            </div>
                            <Switch
                                checked={options.audio.muted}
                                onCheckedChange={(v: boolean) => updateOption("audio", "muted", v)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Controls */}
                <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Gamepad2 className="h-5 w-5 text-violet-400" />
                            Contrôles
                        </CardTitle>
                        <CardDescription>Manette et raccourcis clavier</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Gamepad */}
                        <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                            <div className="flex items-center gap-3">
                                <Gamepad2 className="text-muted-foreground h-5 w-5" />
                                <div>
                                    <Label>Support manette</Label>
                                    <p className="text-muted-foreground text-xs">Activer le support des manettes</p>
                                </div>
                            </div>
                            <Switch
                                checked={options.controls.gamepadEnabled}
                                onCheckedChange={(v: boolean) => updateOption("controls", "gamepadEnabled", v)}
                            />
                        </div>

                        {/* Gamepad Vibration */}
                        <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                            <div className="flex items-center gap-3">
                                <Vibrate className="text-muted-foreground h-5 w-5" />
                                <div>
                                    <Label>Vibration manette</Label>
                                    <p className="text-muted-foreground text-xs">Retour haptique</p>
                                </div>
                            </div>
                            <Switch
                                checked={options.controls.gamepadVibration}
                                onCheckedChange={(v: boolean) => updateOption("controls", "gamepadVibration", v)}
                                disabled={!options.controls.gamepadEnabled}
                            />
                        </div>

                        {/* Keyboard Shortcuts */}
                        <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                            <div className="flex items-center gap-3">
                                <Keyboard className="text-muted-foreground h-5 w-5" />
                                <div>
                                    <Label>Raccourcis clavier</Label>
                                    <p className="text-muted-foreground text-xs">Activer les raccourcis</p>
                                </div>
                            </div>
                            <Switch
                                checked={options.controls.keyboardShortcuts}
                                onCheckedChange={(v: boolean) => updateOption("controls", "keyboardShortcuts", v)}
                            />
                        </div>

                        <Separator />

                        {/* Reference des controles */}
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="keyboard" className="border-white/10">
                                <AccordionTrigger className="text-sm">
                                    <span className="flex items-center gap-2">
                                        <Keyboard className="h-4 w-4" />
                                        Raccourcis clavier
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2 pt-2">
                                        {KEYBOARD_SHORTCUTS.map((shortcut, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm">
                                                <code className="rounded bg-white/10 px-2 py-1 font-mono text-xs">
                                                    {shortcut.key}
                                                </code>
                                                <span className="text-muted-foreground">{shortcut.action}</span>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="gamepad" className="border-white/10">
                                <AccordionTrigger className="text-sm">
                                    <span className="flex items-center gap-2">
                                        <Gamepad2 className="h-4 w-4" />
                                        Boutons manette
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2 pt-2">
                                        {GAMEPAD_BUTTONS.map((btn, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm">
                                                <code className="rounded bg-white/10 px-2 py-1 font-mono text-xs">
                                                    {btn.button}
                                                </code>
                                                <span className="text-muted-foreground">{btn.action}</span>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>

                {/* Display */}
                <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Monitor className="h-5 w-5 text-orange-400" />
                            Affichage
                        </CardTitle>
                        <CardDescription>Thème et effets visuels</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Theme */}
                        <div className="space-y-2">
                            <Label>Thème</Label>
                            <Select
                                value={options.display.theme}
                                onValueChange={(v: string) =>
                                    updateOption("display", "theme", v as "dark" | "light" | "system")
                                }
                            >
                                <SelectTrigger className="bg-white/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dark">
                                        <span className="flex items-center gap-2">
                                            <Moon className="h-4 w-4" />
                                            Sombre
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="light">
                                        <span className="flex items-center gap-2">
                                            <Sun className="h-4 w-4" />
                                            Clair
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="system">
                                        <span className="flex items-center gap-2">
                                            <Monitor className="h-4 w-4" />
                                            Système
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Animations */}
                        <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                            <div>
                                <Label>Animations</Label>
                                <p className="text-muted-foreground text-xs">Activer les animations de l'interface</p>
                            </div>
                            <Switch
                                checked={options.display.animations}
                                onCheckedChange={(v: boolean) => updateOption("display", "animations", v)}
                            />
                        </div>

                        {/* Effects Quality */}
                        <div className="space-y-2">
                            <Label>Qualité des effets</Label>
                            <Select
                                value={options.display.effectsQuality}
                                onValueChange={(v: string) =>
                                    updateOption("display", "effectsQuality", v as "low" | "medium" | "high")
                                }
                            >
                                <SelectTrigger className="bg-white/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Basse</SelectItem>
                                    <SelectItem value="medium">Moyenne</SelectItem>
                                    <SelectItem value="high">Haute</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Show FPS */}
                        <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                            <div>
                                <Label>Afficher les FPS</Label>
                                <p className="text-muted-foreground text-xs">Compteur de performance</p>
                            </div>
                            <Switch
                                checked={options.display.showFps}
                                onCheckedChange={(v: boolean) => updateOption("display", "showFps", v)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-green-400" />
                            Notifications
                        </CardTitle>
                        <CardDescription>Alertes et rappels</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                            <div>
                                <Label>Notifications push</Label>
                                <p className="text-muted-foreground text-xs">Recevoir des notifications</p>
                            </div>
                            <Switch
                                checked={options.notifications.pushEnabled}
                                onCheckedChange={(v: boolean) => updateOption("notifications", "pushEnabled", v)}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                            <div>
                                <Label>Son de notification</Label>
                                <p className="text-muted-foreground text-xs">Jouer un son</p>
                            </div>
                            <Switch
                                checked={options.notifications.soundEnabled}
                                onCheckedChange={(v: boolean) => updateOption("notifications", "soundEnabled", v)}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                            <div>
                                <Label>Vibration</Label>
                                <p className="text-muted-foreground text-xs">Vibrer sur mobile</p>
                            </div>
                            <Switch
                                checked={options.notifications.vibrationEnabled}
                                onCheckedChange={(v: boolean) => updateOption("notifications", "vibrationEnabled", v)}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                            <div>
                                <Label>Rappel de tour</Label>
                                <p className="text-muted-foreground text-xs">Notifier quand c'est votre tour</p>
                            </div>
                            <Switch
                                checked={options.notifications.turnReminder}
                                onCheckedChange={(v: boolean) => updateOption("notifications", "turnReminder", v)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Accessibility */}
                <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Accessibility className="h-5 w-5 text-blue-400" />
                            Accessibilité
                        </CardTitle>
                        <CardDescription>Options d'accessibilité</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Color Blind Mode */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Mode daltonien
                            </Label>
                            <Select
                                value={options.accessibility.colorBlindMode}
                                onValueChange={(v: string) =>
                                    updateOption(
                                        "accessibility",
                                        "colorBlindMode",
                                        v as GameOptions["accessibility"]["colorBlindMode"]
                                    )
                                }
                            >
                                <SelectTrigger className="bg-white/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Désactivé</SelectItem>
                                    <SelectItem value="protanopia">Protanopie (rouge)</SelectItem>
                                    <SelectItem value="deuteranopia">Deutéranopie (vert)</SelectItem>
                                    <SelectItem value="tritanopia">Tritanopie (bleu)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                            <div className="flex items-center gap-3">
                                <Type className="text-muted-foreground h-5 w-5" />
                                <div>
                                    <Label>Texte agrandi</Label>
                                    <p className="text-muted-foreground text-xs">Augmenter la taille du texte</p>
                                </div>
                            </div>
                            <Switch
                                checked={options.accessibility.largeText}
                                onCheckedChange={(v: boolean) => updateOption("accessibility", "largeText", v)}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                            <div>
                                <Label>Réduire les mouvements</Label>
                                <p className="text-muted-foreground text-xs">Minimiser les animations</p>
                            </div>
                            <Switch
                                checked={options.accessibility.reduceMotion}
                                onCheckedChange={(v: boolean) => updateOption("accessibility", "reduceMotion", v)}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                            <div>
                                <Label>Contraste élevé</Label>
                                <p className="text-muted-foreground text-xs">Améliorer la lisibilité</p>
                            </div>
                            <Switch
                                checked={options.accessibility.highContrast}
                                onCheckedChange={(v: boolean) => updateOption("accessibility", "highContrast", v)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Reset Button */}
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Réinitialiser par défaut
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Réinitialiser les options ?</DialogTitle>
                        </DialogHeader>
                        <p className="text-muted-foreground text-sm">
                            Tous les paramètres seront remis à leurs valeurs par défaut. Cette action est irréversible.
                        </p>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setResetDialogOpen(false)}>
                                Annuler
                            </Button>
                            <Button variant="destructive" onClick={resetToDefaults}>
                                Réinitialiser
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Version info */}
                <div className="text-muted-foreground/50 py-4 text-center font-mono text-xs">
                    SHIFT v1.0.0 • Options sauvegardées localement
                </div>
            </main>
        </div>
    )
}
