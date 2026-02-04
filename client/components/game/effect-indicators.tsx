"use client"

import { useState, useEffect } from "react"
import {
  Shield,
  Zap,
  Clock,
  Snail,
  Ghost,
  Swords,
  Dice1,
  Dice6,
  TrendingUp
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ActionType } from "@/src/types/rules"

interface TemporaryEffect {
  id: string
  type: ActionType | string
  value: number
  turnsRemaining: number
  source: string
  appliedAt: string
  appliedBy?: string
}

interface EffectIndicatorsProps {
  effects: TemporaryEffect[]
  compact?: boolean
}

const EFFECT_CONFIG: Record<string, { icon: React.ElementType; color: string; name: string; description: string }> = {
  [ActionType.APPLY_DOUBLE_DICE]: {
    icon: Zap,
    color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    name: 'Dé Double',
    description: 'Votre dé est doublé'
  },
  [ActionType.APPLY_SHIELD]: {
    icon: Shield,
    color: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    name: 'Bouclier',
    description: 'Protection contre les effets négatifs'
  },
  [ActionType.APPLY_SPEED_BOOST]: {
    icon: TrendingUp,
    color: 'text-green-400 bg-green-500/20 border-green-500/30',
    name: 'Vitesse',
    description: 'Bonus de mouvement'
  },
  [ActionType.APPLY_SLOW]: {
    icon: Snail,
    color: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    name: 'Ralenti',
    description: 'Mouvement réduit'
  },
  [ActionType.APPLY_INVISIBILITY]: {
    icon: Ghost,
    color: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    name: 'Invisible',
    description: 'Ne peut pas être ciblé'
  },
  [ActionType.SET_DICE_MIN]: {
    icon: Dice1,
    color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
    name: 'Dé Min',
    description: 'Minimum de dé garanti'
  },
  [ActionType.SET_DICE_MAX]: {
    icon: Dice6,
    color: 'text-red-400 bg-red-500/20 border-red-500/30',
    name: 'Dé Max',
    description: 'Maximum de dé limité'
  },
}

export function EffectIndicators({ effects, compact = false }: EffectIndicatorsProps) {
  if (!effects || effects.length === 0) {
    return null
  }

  if (compact) {
    return (
      <div className="flex gap-1">
        <TooltipProvider>
          {effects.map((effect) => {
            const config = EFFECT_CONFIG[effect.type] || {
              icon: Zap,
              color: 'text-violet-400 bg-violet-500/20 border-violet-500/30',
              name: effect.type,
              description: 'Effet actif'
            }
            const Icon = config.icon

            return (
              <Tooltip key={effect.id}>
                <TooltipTrigger asChild>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${config.color}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{config.name}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                  <p className="text-xs mt-1">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {effect.turnsRemaining} tour{effect.turnsRemaining > 1 ? 's' : ''} restant{effect.turnsRemaining > 1 ? 's' : ''}
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {effects.map((effect) => {
        const config = EFFECT_CONFIG[effect.type] || {
          icon: Zap,
          color: 'text-violet-400 bg-violet-500/20 border-violet-500/30',
          name: effect.type,
          description: 'Effet actif'
        }
        const Icon = config.icon

        return (
          <div
            key={effect.id}
            className={`flex items-center gap-3 p-2 rounded-lg border ${config.color}`}
          >
            <div className="h-8 w-8 rounded-full bg-background/50 flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{config.name}</p>
              <p className="text-xs opacity-80">{config.description}</p>
            </div>
            <Badge variant="secondary" className="font-mono">
              <Clock className="h-3 w-3 mr-1" />
              {effect.turnsRemaining}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}

// Mini version for player cards
export function EffectBadges({ effects }: { effects: TemporaryEffect[] }) {
  if (!effects || effects.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {effects.slice(0, 3).map((effect) => {
        const config = EFFECT_CONFIG[effect.type]
        if (!config) return null
        const Icon = config.icon

        return (
          <Badge
            key={effect.id}
            variant="secondary"
            className={`h-5 px-1.5 text-[10px] ${config.color}`}
          >
            <Icon className="h-3 w-3 mr-0.5" />
            {effect.turnsRemaining}
          </Badge>
        )
      })}
      {effects.length > 3 && (
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
          +{effects.length - 3}
        </Badge>
      )}
    </div>
  )
}
