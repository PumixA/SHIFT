"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowRight,
  Zap,
  Shield,
  Shuffle,
  SkipForward,
  Target,
  Star,
  Flag,
  Home,
  AlertTriangle
} from "lucide-react"
import { Rule, ActionType, TriggerType, TRIGGER_INFO, ACTION_INFO } from "@/src/types/rules"

interface TileDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tileIndex: number
  tileType: 'normal' | 'special' | 'start' | 'end'
  rules: Rule[]
}

export function TileDetailModal({
  open,
  onOpenChange,
  tileIndex,
  tileType,
  rules
}: TileDetailModalProps) {
  const getTileIcon = () => {
    switch (tileType) {
      case 'start':
        return <Home className="h-6 w-6 text-cyan-400" />
      case 'end':
        return <Flag className="h-6 w-6 text-violet-400" />
      case 'special':
        return <Star className="h-6 w-6 text-yellow-400" />
      default:
        return <Target className="h-6 w-6 text-muted-foreground" />
    }
  }

  const getTileStyles = () => {
    switch (tileType) {
      case 'start':
        return 'border-cyan-500/50 bg-cyan-500/10'
      case 'end':
        return 'border-violet-500/50 bg-violet-500/10'
      case 'special':
        return 'border-yellow-500/50 bg-yellow-500/10'
      default:
        return 'border-border bg-card/50'
    }
  }

  const getEffectIcon = (type: string) => {
    switch (type) {
      case ActionType.MOVE_RELATIVE:
        return <ArrowRight className="h-4 w-4" />
      case ActionType.TELEPORT:
      case ActionType.MOVE_TO_TILE:
        return <Shuffle className="h-4 w-4" />
      case ActionType.SKIP_TURN:
        return <SkipForward className="h-4 w-4" />
      case ActionType.APPLY_SHIELD:
        return <Shield className="h-4 w-4" />
      case ActionType.BACK_TO_START:
        return <Home className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  const getEffectColor = (type: string, value: number | string) => {
    const numValue = Number(value)

    // Negative effects
    if (
      type === ActionType.BACK_TO_START ||
      type === ActionType.SKIP_TURN ||
      type === ActionType.APPLY_SLOW ||
      (type === ActionType.MOVE_RELATIVE && numValue < 0) ||
      (type === ActionType.MODIFY_SCORE && numValue < 0)
    ) {
      return 'text-red-400 bg-red-500/10 border-red-500/30'
    }

    // Positive effects
    if (
      type === ActionType.EXTRA_TURN ||
      type === ActionType.APPLY_SHIELD ||
      type === ActionType.APPLY_SPEED_BOOST ||
      type === ActionType.APPLY_DOUBLE_DICE ||
      (type === ActionType.MOVE_RELATIVE && numValue > 0) ||
      (type === ActionType.MODIFY_SCORE && numValue > 0)
    ) {
      return 'text-green-400 bg-green-500/10 border-green-500/30'
    }

    // Neutral effects
    return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
  }

  const formatEffectDescription = (effect: Rule['effects'][0]) => {
    const info = ACTION_INFO[effect.type as ActionType]
    if (!info) return `${effect.type}: ${effect.value}`

    const value = Number(effect.value)
    const target = effect.target === 'self' ? 'vous' :
                   effect.target === 'others' ? 'les autres' :
                   effect.target === 'all' ? 'tous' :
                   effect.target === 'leader' ? 'le leader' :
                   effect.target === 'last' ? 'le dernier' :
                   'un joueur aléatoire'

    switch (effect.type) {
      case ActionType.MOVE_RELATIVE:
        return value > 0 ? `Avancer ${target} de ${value} cases` : `Reculer ${target} de ${Math.abs(value)} cases`
      case ActionType.TELEPORT:
      case ActionType.MOVE_TO_TILE:
        return `Téléporter ${target} à la case ${value}`
      case ActionType.BACK_TO_START:
        return `Renvoyer ${target} au départ`
      case ActionType.SKIP_TURN:
        return `${target} passe son prochain tour`
      case ActionType.EXTRA_TURN:
        return `${target} gagne ${value} tour(s) supplémentaire(s)`
      case ActionType.MODIFY_SCORE:
        return value > 0 ? `+${value} points pour ${target}` : `${value} points pour ${target}`
      case ActionType.APPLY_SHIELD:
        return `Bouclier pour ${target} (${effect.duration || value} tours)`
      case ActionType.APPLY_DOUBLE_DICE:
        return `Dé doublé pour ${target} (${effect.duration || value} tours)`
      case ActionType.APPLY_SPEED_BOOST:
        return `Boost de vitesse pour ${target} (${effect.duration || value} tours)`
      case ActionType.APPLY_SLOW:
        return `Ralentissement pour ${target} (${effect.duration || value} tours)`
      case ActionType.SWAP_POSITIONS:
        return `Échanger les positions avec ${target}`
      default:
        return info.description
    }
  }

  const getTriggerDescription = (rule: Rule) => {
    const triggerType = typeof rule.trigger === 'object' ? rule.trigger.type : rule.trigger
    const info = TRIGGER_INFO[triggerType as TriggerType]
    return info?.description || triggerType
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${getTileStyles()}`}>
            {getTileIcon()}
            <div>
              <DialogTitle className="text-lg">
                Case {tileIndex}
                {tileType !== 'normal' && (
                  <Badge variant="outline" className="ml-2 capitalize">
                    {tileType === 'start' ? 'Départ' :
                     tileType === 'end' ? 'Arrivée' :
                     'Spéciale'}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {rules.length === 0
                  ? "Aucune règle sur cette case"
                  : `${rules.length} règle${rules.length > 1 ? 's' : ''} active${rules.length > 1 ? 's' : ''}`
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-[400px]">
          {rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Cette case n'a aucun effet</p>
              <p className="text-xs opacity-60">Les joueurs peuvent y atterrir sans conséquence</p>
            </div>
          ) : (
            <div className="space-y-4 p-1">
              {rules.map((rule, index) => (
                <div key={rule.id} className="border border-border/50 rounded-lg overflow-hidden">
                  {/* Rule Header */}
                  <div className="bg-card/50 px-4 py-2 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{rule.title}</h4>
                      {rule.tags && rule.tags.includes('core') && (
                        <Badge variant="secondary" className="text-[10px]">Core</Badge>
                      )}
                    </div>
                    {rule.description && (
                      <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                    )}
                  </div>

                  {/* Trigger */}
                  <div className="px-4 py-2 bg-background/50">
                    <p className="text-xs text-muted-foreground">
                      <span className="text-cyan-400 font-medium">Déclencheur:</span> {getTriggerDescription(rule)}
                    </p>
                  </div>

                  {/* Effects */}
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Effets:</p>
                    {rule.effects.map((effect, effectIndex) => (
                      <div
                        key={effectIndex}
                        className={`flex items-center gap-2 p-2 rounded-lg border ${getEffectColor(effect.type as string, effect.value)}`}
                      >
                        {getEffectIcon(effect.type as string)}
                        <span className="text-sm">{formatEffectDescription(effect)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Conditions */}
                  {rule.conditions && rule.conditions.length > 0 && (
                    <div className="px-4 py-2 bg-yellow-500/5 border-t border-yellow-500/20">
                      <div className="flex items-center gap-2 text-xs text-yellow-400">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{rule.conditions.length} condition{rule.conditions.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
