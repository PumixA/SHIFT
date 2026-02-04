"use client"

import { useState, useCallback } from "react"
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { TriggerBlock } from "./trigger-block"
import { ConditionBlock } from "./condition-block"
import { EffectBlock } from "./effect-block"
import {
  Rule,
  RuleCondition,
  RuleEffect,
  TriggerType,
  ActionType,
  ConditionType,
  TRIGGER_INFO,
  ACTION_INFO
} from "@/src/types/rules"

interface VisualEditorProps {
  initialRule?: Partial<Rule>
  onSave: (rule: Rule) => void
  onCancel: () => void
  onSelectTile?: (callback: (tileIndex: number) => void) => void
}

export function VisualEditor({ initialRule, onSave, onCancel, onSelectTile }: VisualEditorProps) {
  const [title, setTitle] = useState(initialRule?.title || "")
  const [description, setDescription] = useState(initialRule?.description || "")
  const [trigger, setTrigger] = useState<{ type: TriggerType; value?: number | string }>(
    initialRule?.trigger || { type: TriggerType.ON_LAND }
  )
  const [conditions, setConditions] = useState<RuleCondition[]>(initialRule?.conditions || [])
  const [effects, setEffects] = useState<RuleEffect[]>(
    initialRule?.effects || [{ type: ActionType.MOVE_RELATIVE, value: 1, target: 'self' }]
  )
  const [priority, setPriority] = useState(initialRule?.priority || 5)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSave = () => {
    if (!title.trim()) {
      return
    }

    const rule: Rule = {
      id: initialRule?.id || `rule-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      trigger,
      conditions,
      effects,
      priority,
      isActive: true,
      tags: []
    }

    onSave(rule)
  }

  const addCondition = () => {
    setConditions([
      ...conditions,
      { type: ConditionType.SCORE_CHECK, operator: 'gte', value: 0, target: 'self' }
    ])
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, condition: RuleCondition) => {
    const newConditions = [...conditions]
    newConditions[index] = condition
    setConditions(newConditions)
  }

  const addEffect = () => {
    setEffects([
      ...effects,
      { type: ActionType.MOVE_RELATIVE, value: 1, target: 'self' }
    ])
  }

  const removeEffect = (index: number) => {
    if (effects.length > 1) {
      setEffects(effects.filter((_, i) => i !== index))
    }
  }

  const updateEffect = (index: number, effect: RuleEffect) => {
    const newEffects = [...effects]
    newEffects[index] = effect
    setEffects(newEffects)
  }

  const moveEffect = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === effects.length - 1)
    ) {
      return
    }

    const newEffects = [...effects]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[newEffects[index], newEffects[newIndex]] = [newEffects[newIndex], newEffects[index]]
    setEffects(newEffects)
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nom de la règle *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Bonus de vitesse"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'effet de cette règle..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trigger */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400">QUAND</Badge>
            Déclencheur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TriggerBlock
            trigger={trigger}
            onChange={setTrigger}
            onSelectTile={onSelectTile}
          />
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">SI</Badge>
              Conditions
              <span className="text-sm font-normal text-muted-foreground">
                (optionnel)
              </span>
            </CardTitle>
            <Button size="sm" variant="outline" onClick={addCondition}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {conditions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune condition - La règle s'applique toujours
            </p>
          ) : (
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <ConditionBlock
                      condition={condition}
                      onChange={(c) => updateCondition(index, c)}
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeCondition(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Effects */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="secondary" className="bg-violet-500/20 text-violet-400">ALORS</Badge>
              Effets
            </CardTitle>
            <Button size="sm" variant="outline" onClick={addEffect}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {effects.map((effect, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex flex-col gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => moveEffect(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => moveEffect(index, 'down')}
                    disabled={index === effects.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex-1">
                  <EffectBlock
                    effect={effect}
                    onChange={(e) => updateEffect(index, e)}
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeEffect(index)}
                  disabled={effects.length <= 1}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            Options avancées
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité (1-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min={1}
                  max={10}
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 5)}
                />
                <p className="text-xs text-muted-foreground">
                  Les règles avec une priorité plus basse s'exécutent en premier
                </p>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button onClick={handleSave} className="flex-1" disabled={!title.trim()}>
          {initialRule?.id ? 'Modifier' : 'Créer'} la règle
        </Button>
      </div>
    </div>
  )
}
