"use client"

import { useState, useEffect } from "react"
import { Gamepad2, Check, X, RefreshCw, Vibrate, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface GamepadInfo {
  index: number
  id: string
  connected: boolean
  mapping: string
  axes: number
  buttons: number
  assignedPlayer: number | null
  vibrationSupport: boolean
}

interface GamepadSettingsProps {
  players: { id: string; name: string; color: string }[]
  onAssignGamepad: (gamepadIndex: number, playerId: string | null) => void
  gamepadAssignments: Record<number, string | null>
}

export function GamepadSettings({ players, onAssignGamepad, gamepadAssignments }: GamepadSettingsProps) {
  const [gamepads, setGamepads] = useState<GamepadInfo[]>([])
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [deadzone, setDeadzone] = useState(0.15)
  const [pollRate, setPollRate] = useState(16)

  const scanGamepads = () => {
    const detected: GamepadInfo[] = []
    const pads = navigator.getGamepads()

    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i]
      if (pad) {
        detected.push({
          index: pad.index,
          id: pad.id,
          connected: pad.connected,
          mapping: pad.mapping || "standard",
          axes: pad.axes.length,
          buttons: pad.buttons.length,
          assignedPlayer: gamepadAssignments[pad.index] ? parseInt(gamepadAssignments[pad.index]!) : null,
          vibrationSupport: 'vibrationActuator' in pad,
        })
      }
    }

    setGamepads(detected)
  }

  useEffect(() => {
    scanGamepads()

    const handleConnect = () => scanGamepads()
    const handleDisconnect = () => scanGamepads()

    window.addEventListener("gamepadconnected", handleConnect)
    window.addEventListener("gamepaddisconnected", handleDisconnect)

    const interval = setInterval(scanGamepads, 1000)

    return () => {
      window.removeEventListener("gamepadconnected", handleConnect)
      window.removeEventListener("gamepaddisconnected", handleDisconnect)
      clearInterval(interval)
    }
  }, [gamepadAssignments])

  const testVibration = (gamepadIndex: number) => {
    const pad = navigator.getGamepads()[gamepadIndex]
    if (pad?.vibrationActuator) {
      pad.vibrationActuator.playEffect("dual-rumble", {
        startDelay: 0,
        duration: 200,
        weakMagnitude: 0.5,
        strongMagnitude: 1.0,
      })
    }
  }

  const getControllerType = (id: string): string => {
    const lowerId = id.toLowerCase()
    if (lowerId.includes("xbox")) return "Xbox"
    if (lowerId.includes("playstation") || lowerId.includes("dualshock") || lowerId.includes("dualsense")) return "PlayStation"
    if (lowerId.includes("nintendo") || lowerId.includes("switch")) return "Nintendo"
    return "Générique"
  }

  const getControllerIcon = (id: string): string => {
    const type = getControllerType(id)
    switch (type) {
      case "Xbox": return "🎮"
      case "PlayStation": return "🎮"
      case "Nintendo": return "🕹️"
      default: return "🎮"
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-cyan-400" />
          <h3 className="font-semibold">Manettes</h3>
          <Badge variant="secondary">{gamepads.length} connectée{gamepads.length > 1 ? "s" : ""}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={scanGamepads}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Liste des manettes */}
      <ScrollArea className="h-[300px]">
        {gamepads.length === 0 ? (
          <Card className="bg-secondary/30">
            <CardContent className="py-10 text-center">
              <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">Aucune manette détectée</p>
              <p className="text-sm text-muted-foreground mt-2">
                Connectez une manette et appuyez sur un bouton
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {gamepads.map((gamepad) => (
              <Card key={gamepad.index} className="bg-secondary/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-2xl">{getControllerIcon(gamepad.id)}</span>
                      Manette {gamepad.index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {gamepad.vibrationSupport && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => testVibration(gamepad.index)}
                          title="Tester la vibration"
                        >
                          <Vibrate className="h-4 w-4" />
                        </Button>
                      )}
                      <Badge variant={gamepad.connected ? "default" : "destructive"} className="text-[10px]">
                        {gamepad.connected ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                        {gamepad.connected ? "Connectée" : "Déconnectée"}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-xs truncate">
                    {getControllerType(gamepad.id)} • {gamepad.buttons} boutons • {gamepad.axes} axes
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground">Assigner au joueur :</Label>
                    <Select
                      value={gamepadAssignments[gamepad.index] || "none"}
                      onValueChange={(value) => onAssignGamepad(gamepad.index, value === "none" ? null : value)}
                    >
                      <SelectTrigger className="h-8 w-[180px]">
                        <SelectValue placeholder="Non assignée" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non assignée</SelectItem>
                        {players.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full bg-${player.color}-400`} />
                              {player.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />

      {/* Paramètres globaux */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Paramètres
        </h4>

        <div className="flex items-center justify-between">
          <div>
            <Label>Vibrations</Label>
            <p className="text-xs text-muted-foreground">Activer le retour haptique</p>
          </div>
          <Switch
            checked={vibrationEnabled}
            onCheckedChange={setVibrationEnabled}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Zone morte</Label>
            <span className="text-sm text-muted-foreground">{(deadzone * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[deadzone]}
            onValueChange={([v]) => setDeadzone(v)}
            min={0.05}
            max={0.3}
            step={0.01}
          />
          <p className="text-xs text-muted-foreground">
            Seuil de sensibilité des sticks analogiques
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Fréquence de polling</Label>
            <span className="text-sm text-muted-foreground">{pollRate}ms</span>
          </div>
          <Slider
            value={[pollRate]}
            onValueChange={([v]) => setPollRate(v)}
            min={8}
            max={32}
            step={8}
          />
          <p className="text-xs text-muted-foreground">
            Intervalle de lecture des entrées (plus bas = plus réactif)
          </p>
        </div>
      </div>

      {/* Légende des contrôles */}
      <Card className="bg-cyan-500/10 border-cyan-500/30">
        <CardContent className="p-4">
          <h5 className="font-medium text-sm mb-2">Contrôles</h5>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>🅰️ A / ✕ → Lancer le dé</div>
            <div>🅱️ B / ○ → Annuler</div>
            <div>🅧 X / □ → Menu règles</div>
            <div>🅨 Y / △ → Chat</div>
            <div>LB / L1 → Joueur précédent</div>
            <div>RB / R1 → Joueur suivant</div>
            <div>D-pad → Navigation</div>
            <div>Start → Pause / Menu</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
