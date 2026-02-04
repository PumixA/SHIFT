"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RuleEffect, ActionType, ACTION_INFO } from "@/src/types/rules"

interface EffectBlockProps {
  effect: RuleEffect
  onChange: (effect: RuleEffect) => void
}

const TARGETS: { value: RuleEffect['target']; label: string }[] = [
  { value: 'self', label: 'Joueur actuel' },
  { value: 'others', label: 'Autres joueurs' },
  { value: 'all', label: 'Tous les joueurs' },
  { value: 'random', label: 'Joueur aléatoire' },
  { value: 'leader', label: 'Le leader' },
  { value: 'last', label: 'Le dernier' },
]

const ACTION_CATEGORIES = {
  movement: 'Mouvement',
  turn: 'Tour',
  score: 'Score',
  'power-up': 'Power-ups',
  dice: 'Dé',
  meta: 'Méta',
}

export function EffectBlock({ effect, onChange }: EffectBlockProps) {
  const info = ACTION_INFO[effect.type as ActionType]

  const handleTypeChange = (type: string) => {
    onChange({ ...effect, type: type as ActionType })
  }

  const handleValueChange = (value: string) => {
    onChange({
      ...effect,
      value: parseInt(value) || 0
    })
  }

  const handleTargetChange = (target: string) => {
    onChange({ ...effect, target: target as RuleEffect['target'] })
  }

  const handleDurationChange = (duration: string) => {
    onChange({ ...effect, duration: parseInt(duration) || undefined })
  }

  // Group actions by category
  const groupedActions = Object.entries(ACTION_INFO).reduce((acc, [type, info]) => {
    const category = info.category
    if (!acc[category]) acc[category] = []
    acc[category].push({ type, ...info })
    return acc
  }, {} as Record<string, typeof ACTION_INFO[ActionType][]>)

  return (
    <div className="p-3 rounded-lg border border-violet-500/30 bg-violet-500/5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Effect Type */}
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Action</Label>
          <Select value={effect.type as string} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(groupedActions).map(([category, actions]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {ACTION_CATEGORIES[category as keyof typeof ACTION_CATEGORIES] || category}
                  </div>
                  {actions.map((a) => (
                    <SelectItem key={a.type} value={a.type}>
                      {a.name}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Target */}
        <div className="space-y-1">
          <Label className="text-xs">Cible</Label>
          <Select value={effect.target} onValueChange={handleTargetChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARGETS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value */}
        <div className="space-y-1">
          <Label className="text-xs">
            {info?.valueType === 'tile' ? 'Case' :
             info?.valueType === 'turns' ? 'Tours' :
             info?.valueType === 'points' ? 'Points' :
             'Valeur'}
          </Label>
          <Input
            type="number"
            value={effect.value}
            onChange={(e) => handleValueChange(e.target.value)}
            className="h-9"
            min={info?.supportsNegative ? undefined : 0}
          />
        </div>
      </div>

      {/* Duration (for effects that support it) */}
      {info?.supportsDuration && (
        <div className="space-y-1">
          <Label className="text-xs">Durée (tours)</Label>
          <Input
            type="number"
            min={1}
            value={effect.duration || ''}
            onChange={(e) => handleDurationChange(e.target.value)}
            className="h-9"
            placeholder="Nombre de tours"
          />
        </div>
      )}

      {info && (
        <p className="text-xs text-muted-foreground">{info.description}</p>
      )}
    </div>
  )
}
