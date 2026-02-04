"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Gamepad2, Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getGamepadType, GAMEPAD_BUTTON_LABELS, type GamepadAction } from "@/hooks/useGameControls"

interface GamepadIndicatorProps {
  className?: string
  showControls?: boolean
}

export function GamepadIndicator({ className, showControls = false }: GamepadIndicatorProps) {
  const [connected, setConnected] = useState(false)
  const [gamepadName, setGamepadName] = useState<string | null>(null)
  const [gamepadType, setGamepadType] = useState<'xbox' | 'playstation' | 'nintendo' | 'generic'>('generic')
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    const handleConnect = (e: GamepadEvent) => {
      setConnected(true)
      setGamepadName(e.gamepad.id)
      setGamepadType(getGamepadType(e.gamepad.id))
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    }

    const handleDisconnect = () => {
      setConnected(false)
      setGamepadName(null)
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    }

    window.addEventListener('gamepadconnected', handleConnect)
    window.addEventListener('gamepaddisconnected', handleDisconnect)

    // Check for existing gamepads
    const gamepads = navigator.getGamepads()
    for (const gamepad of gamepads) {
      if (gamepad) {
        setConnected(true)
        setGamepadName(gamepad.id)
        setGamepadType(getGamepadType(gamepad.id))
        break
      }
    }

    return () => {
      window.removeEventListener('gamepadconnected', handleConnect)
      window.removeEventListener('gamepaddisconnected', handleDisconnect)
    }
  }, [])

  const labels = GAMEPAD_BUTTON_LABELS[gamepadType]

  // Get display name for gamepad type
  const getTypeLabel = () => {
    switch (gamepadType) {
      case 'xbox': return 'Xbox'
      case 'playstation': return 'PlayStation'
      case 'nintendo': return 'Nintendo'
      default: return 'Manette'
    }
  }

  return (
    <>
      {/* Connection notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-4 left-1/2 z-[200] flex items-center gap-3 px-6 py-3 rounded-full border shadow-lg backdrop-blur-md"
            style={{
              backgroundColor: connected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              borderColor: connected ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
            }}
          >
            <Gamepad2 className={cn(
              "h-5 w-5",
              connected ? "text-green-400" : "text-red-400"
            )} />
            <span className={cn(
              "font-bold",
              connected ? "text-green-400" : "text-red-400"
            )}>
              {connected ? `${getTypeLabel()} connectée` : 'Manette déconnectée'}
            </span>
            {connected ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <X className="h-4 w-4 text-red-400" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent indicator */}
      <div className={cn("flex items-center gap-2", className)}>
        <Badge
          variant={connected ? "outline" : "secondary"}
          className={cn(
            "gap-1.5 transition-colors",
            connected
              ? "border-green-500/50 text-green-400 bg-green-500/10"
              : "text-muted-foreground"
          )}
        >
          <Gamepad2 className="h-3 w-3" />
          {connected ? getTypeLabel() : "Pas de manette"}
        </Badge>
      </div>

      {/* Controls help overlay (optional) */}
      {showControls && connected && labels && (
        <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-black/80 backdrop-blur border border-white/10 text-sm">
          <div className="flex items-center gap-2 mb-3">
            <Gamepad2 className="h-4 w-4 text-cyan-400" />
            <span className="font-bold">Contrôles {getTypeLabel()}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Lancer dé</span>
              <span className="font-mono text-cyan-400">{labels.roll_dice}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Confirmer</span>
              <span className="font-mono text-cyan-400">{labels.confirm}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Annuler</span>
              <span className="font-mono text-cyan-400">{labels.cancel}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Règles</span>
              <span className="font-mono text-cyan-400">{labels.rules}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Menu</span>
              <span className="font-mono text-cyan-400">{labels.menu}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Centrer</span>
              <span className="font-mono text-cyan-400">{labels.center_camera}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Compact version for header
export function GamepadBadge() {
  const [connected, setConnected] = useState(false)
  const [gamepadType, setGamepadType] = useState<string>('generic')

  useEffect(() => {
    const checkGamepads = () => {
      const gamepads = navigator.getGamepads()
      for (const gamepad of gamepads) {
        if (gamepad) {
          setConnected(true)
          setGamepadType(getGamepadType(gamepad.id))
          return
        }
      }
      setConnected(false)
    }

    const handleConnect = () => checkGamepads()
    const handleDisconnect = () => checkGamepads()

    window.addEventListener('gamepadconnected', handleConnect)
    window.addEventListener('gamepaddisconnected', handleDisconnect)
    checkGamepads()

    return () => {
      window.removeEventListener('gamepadconnected', handleConnect)
      window.removeEventListener('gamepaddisconnected', handleDisconnect)
    }
  }, [])

  if (!connected) return null

  const typeLabel = gamepadType === 'xbox' ? 'Xbox' :
                    gamepadType === 'playstation' ? 'PS' :
                    gamepadType === 'nintendo' ? 'Switch' : '🎮'

  return (
    <Badge
      variant="outline"
      className="gap-1 h-5 px-2 border-green-500/50 text-green-400 bg-green-500/10 text-[10px]"
    >
      <Gamepad2 className="h-2.5 w-2.5" />
      {typeLabel}
    </Badge>
  )
}
