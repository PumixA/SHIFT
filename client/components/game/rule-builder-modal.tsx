"use client"

import { useState, useMemo, useEffect } from "react"
import { Blocks, Zap, Play, X, Plus, Trash2, Crosshair, AlertCircle, Shield, Timer, Target, Sparkles, GitBranch, ChevronDown, ChevronUp, HelpCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TriggerType, ActionType, Rule, RuleEffect, RuleCondition, ConditionType, TRIGGER_INFO, ACTION_INFO } from "@/src/types/rules"
import { cn } from "@/lib/utils"

interface RuleBuilderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveRule: (rule: Rule) => void
  editingRule?: Rule | null
  initialData?: Partial<Rule>
  onStartSelection?: (currentData: Partial<Rule>) => void
}

// Regroupement des déclencheurs par catégorie
const TRIGGER_CATEGORIES = {
  movement: {
    label: "Mouvement",
    icon: Target,
    triggers: [
      TriggerType.ON_LAND,
      TriggerType.ON_PASS_OVER,
      TriggerType.ON_MOVE_START,
      TriggerType.ON_BACKWARD_MOVE,
      TriggerType.ON_TELEPORT,
    ],
  },
  turn: {
    label: "Tour",
    icon: Timer,
    triggers: [
      TriggerType.ON_TURN_START,
      TriggerType.ON_TURN_END,
      TriggerType.ON_DICE_ROLL,
      TriggerType.ON_AFTER_TURN,
    ],
  },
  interaction: {
    label: "Interaction",
    icon: Sparkles,
    triggers: [
      TriggerType.ON_PLAYER_BYPASS,
      TriggerType.ON_SAME_TILE,
      TriggerType.ON_OVERTAKE,
      TriggerType.ON_GET_OVERTAKEN,
    ],
  },
  score: {
    label: "Score",
    icon: Zap,
    triggers: [
      TriggerType.ON_SCORE_THRESHOLD,
      TriggerType.ON_SCORE_CHANGE,
    ],
  },
  position: {
    label: "Position",
    icon: Target,
    triggers: [
      TriggerType.ON_REACH_POSITION,
      TriggerType.ON_HALF_BOARD,
      TriggerType.ON_NEAR_VICTORY,
      TriggerType.ON_REACH_END,
    ],
  },
  flow: {
    label: "Flux de jeu",
    icon: GitBranch,
    triggers: [
      TriggerType.ON_GAME_START,
      TriggerType.ON_FIRST_MOVE,
      TriggerType.ON_CONSECUTIVE_SIX,
    ],
  },
  effect: {
    label: "Effets",
    icon: Shield,
    triggers: [
      TriggerType.ON_EFFECT_APPLIED,
      TriggerType.ON_EFFECT_EXPIRED,
    ],
  },
}

// Regroupement des actions par catégorie
const ACTION_CATEGORIES = {
  movement: {
    label: "Mouvement",
    actions: [
      ActionType.MOVE_RELATIVE,
      ActionType.TELEPORT,
      ActionType.MOVE_TO_TILE,
      ActionType.BACK_TO_START,
      ActionType.SWAP_POSITIONS,
      ActionType.MOVE_TO_NEAREST_PLAYER,
      ActionType.MOVE_TO_FURTHEST_PLAYER,
      ActionType.MOVE_RANDOM,
    ],
  },
  turn: {
    label: "Tour",
    actions: [
      ActionType.SKIP_TURN,
      ActionType.EXTRA_TURN,
    ],
  },
  score: {
    label: "Score",
    actions: [
      ActionType.MODIFY_SCORE,
      ActionType.APPLY_STEAL_POINTS,
    ],
  },
  powerup: {
    label: "Power-ups",
    actions: [
      ActionType.APPLY_DOUBLE_DICE,
      ActionType.APPLY_SHIELD,
      ActionType.APPLY_SPEED_BOOST,
      ActionType.APPLY_SLOW,
      ActionType.APPLY_INVISIBILITY,
    ],
  },
  dice: {
    label: "Dé",
    actions: [
      ActionType.SET_DICE_MIN,
      ActionType.SET_DICE_MAX,
      ActionType.REROLL_DICE,
    ],
  },
  meta: {
    label: "Méta",
    actions: [
      ActionType.COPY_LAST_EFFECT,
      ActionType.REVERSE_LAST_EFFECT,
      ActionType.DECLARE_VICTORY,
      ActionType.ALLOW_RULE_MODIFICATION,
      ActionType.ALLOW_TILE_MODIFICATION,
    ],
  },
}

// Options de cible
const TARGET_OPTIONS = [
  { value: 'self', label: "Joueur actuel" },
  { value: 'all', label: "Tous les joueurs" },
  { value: 'others', label: "Autres joueurs" },
  { value: 'random', label: "Joueur aléatoire" },
  { value: 'leader', label: "Joueur en tête" },
  { value: 'last', label: "Dernier joueur" },
]

// Options de condition
const CONDITION_TYPE_OPTIONS = [
  { value: ConditionType.SCORE_CHECK, label: "Score", description: "Vérifie le score du joueur" },
  { value: ConditionType.POSITION_CHECK, label: "Position", description: "Vérifie la position sur le plateau" },
  { value: ConditionType.DICE_VALUE, label: "Valeur du dé", description: "Vérifie le résultat du dé" },
  { value: ConditionType.TURN_COUNT, label: "Numéro de tour", description: "Vérifie le nombre de tours joués" },
  { value: ConditionType.PLAYER_COUNT, label: "Nombre de joueurs", description: "Vérifie le nombre de joueurs" },
  { value: ConditionType.PLAYER_RANK, label: "Classement", description: "Vérifie le rang du joueur" },
  { value: ConditionType.TILES_FROM_END, label: "Distance de l'arrivée", description: "Cases restantes" },
  { value: ConditionType.HAS_POWER_UP, label: "A un power-up", description: "Vérifie si un effet est actif" },
]

const OPERATOR_OPTIONS = [
  { value: 'eq', label: "égal à", symbol: "=" },
  { value: 'neq', label: "différent de", symbol: "≠" },
  { value: 'gt', label: "supérieur à", symbol: ">" },
  { value: 'lt', label: "inférieur à", symbol: "<" },
  { value: 'gte', label: "supérieur ou égal à", symbol: "≥" },
  { value: 'lte', label: "inférieur ou égal à", symbol: "≤" },
]

export function RuleBuilderModal({ open, onOpenChange, onSaveRule, editingRule, initialData, onStartSelection }: RuleBuilderModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [triggerType, setTriggerType] = useState<TriggerType>(TriggerType.ON_LAND)
  const [triggerValue, setTriggerValue] = useState<string>("")
  const [effects, setEffects] = useState<RuleEffect[]>([{ type: ActionType.MODIFY_SCORE, value: 1, target: 'self' }])
  const [conditions, setConditions] = useState<RuleCondition[]>([])
  const [showConditions, setShowConditions] = useState(false)
  const [activeTab, setActiveTab] = useState("simple")
  const [priority, setPriority] = useState(0)

  // Initialize from editing rule or initial data
  useEffect(() => {
    if (editingRule) {
      setTitle(editingRule.title || "")
      setDescription(editingRule.description || "")
      setTriggerType(editingRule.trigger.type)
      setTriggerValue(editingRule.trigger.value?.toString() || "")
      setEffects(editingRule.effects || [{ type: ActionType.MODIFY_SCORE, value: 1, target: 'self' }])
      setConditions(editingRule.conditions || [])
      setShowConditions((editingRule.conditions?.length || 0) > 0)
      setPriority(editingRule.priority || 0)
    } else if (initialData) {
      if (initialData.title) setTitle(initialData.title)
      if (initialData.description) setDescription(initialData.description)
      if (initialData.trigger?.type) setTriggerType(initialData.trigger.type)
      if (initialData.trigger?.value !== undefined) setTriggerValue(initialData.trigger.value.toString())
      if (initialData.effects) setEffects(initialData.effects)
      if (initialData.conditions) setConditions(initialData.conditions)
    }
  }, [editingRule, initialData, open])

  // Reset form when closing
  useEffect(() => {
    if (!open && !editingRule) {
      setTitle("")
      setDescription("")
      setTriggerType(TriggerType.ON_LAND)
      setTriggerValue("")
      setEffects([{ type: ActionType.MODIFY_SCORE, value: 1, target: 'self' }])
      setConditions([])
      setShowConditions(false)
      setPriority(0)
    }
  }, [open, editingRule])

  const triggerInfo = TRIGGER_INFO[triggerType]
  const needsValue = triggerInfo?.needsValue

  // Effect management
  const addEffect = () => {
    setEffects([...effects, { type: ActionType.MODIFY_SCORE, value: 1, target: 'self' }])
  }

  const removeEffect = (index: number) => {
    if (effects.length > 1) {
      setEffects(effects.filter((_, i) => i !== index))
    }
  }

  const updateEffect = (index: number, field: keyof RuleEffect, value: any) => {
    const updated = [...effects]
    updated[index] = { ...updated[index], [field]: value }
    setEffects(updated)
  }

  // Condition management
  const addCondition = () => {
    setConditions([...conditions, { type: ConditionType.SCORE_CHECK, operator: 'gte', value: 0 }])
    setShowConditions(true)
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, field: keyof RuleCondition, value: any) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], [field]: value }
    setConditions(updated)
  }

  const handleSelectionClick = () => {
    if (onStartSelection) {
      onStartSelection({
        title,
        description,
        trigger: { type: triggerType, value: triggerValue ? Number(triggerValue) : undefined },
        effects,
        conditions,
      })
    }
  }

  // Generate preview
  const rulePreview = useMemo(() => {
    const trigger = TRIGGER_INFO[triggerType]
    let preview = `QUAND ${trigger?.name || triggerType}`

    if (needsValue && triggerValue) {
      if (trigger?.valueType === 'tile') {
        preview += ` (Case ${triggerValue})`
      } else if (trigger?.valueType === 'dice') {
        preview += ` (Dé = ${triggerValue})`
      } else if (trigger?.valueType === 'score') {
        preview += ` (Score ${triggerValue})`
      }
    }

    if (conditions.length > 0) {
      preview += "\nSI "
      preview += conditions.map(c => {
        const condType = CONDITION_TYPE_OPTIONS.find(ct => ct.value === c.type)?.label || c.type
        const op = OPERATOR_OPTIONS.find(o => o.value === c.operator)?.label || c.operator
        return `${condType} ${op} ${c.value}`
      }).join(" ET ")
    }

    preview += "\nALORS "
    preview += effects.map(e => {
      const action = ACTION_INFO[e.type as ActionType]
      const target = TARGET_OPTIONS.find(t => t.value === e.target)?.label || e.target

      if (e.type === ActionType.SKIP_TURN || e.type === ActionType.EXTRA_TURN) {
        return `${action?.name} (${target})`
      }
      if (e.type === ActionType.BACK_TO_START) {
        return `${action?.name} (${target})`
      }
      const sign = (e.value as number) >= 0 ? '+' : ''
      return `${action?.name} ${sign}${e.value} (${target})`
    }).join(", ")

    return preview
  }, [triggerType, triggerValue, effects, conditions, needsValue])

  const handleSave = () => {
    if (!title.trim()) return

    const rule: Rule = {
      id: editingRule?.id || `rule-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      trigger: {
        type: triggerType,
        value: triggerValue ? Number(triggerValue) : undefined,
      },
      conditions: conditions,
      effects: effects.map(e => ({
        ...e,
        value: typeof e.value === 'string' ? Number(e.value) : e.value,
      })),
      priority,
      isActive: true,
    }
    onSaveRule(rule)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-background border-border max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Blocks className="h-5 w-5 text-cyan-400" />
            {editingRule ? "Modifier la règle" : "Créer une règle"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-6 mt-2" style={{ width: 'calc(100% - 3rem)' }}>
            <TabsTrigger value="simple">Mode Simple</TabsTrigger>
            <TabsTrigger value="advanced">Mode Avancé</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6">
            <TabsContent value="simple" className="space-y-6 py-4 mt-0">
              {/* Nom de la règle */}
              <div className="space-y-2">
                <Label htmlFor="rule-title">Nom de la règle *</Label>
                <Input
                  id="rule-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Bonus de score, Téléportation..."
                  className="bg-secondary/50 border-border"
                />
              </div>

              {/* QUAND - Déclencheur */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="font-semibold text-yellow-400">QUAND</span>
                  <span className="text-xs text-muted-foreground">(Déclencheur)</span>
                </div>
                <div className="rounded-lg border-2 border-yellow-400/50 bg-yellow-400/5 p-4 space-y-4">
                  <Select value={triggerType} onValueChange={(value) => setTriggerType(value as TriggerType)}>
                    <SelectTrigger className="bg-secondary border-yellow-400/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {Object.entries(TRIGGER_CATEGORIES).map(([key, category]) => (
                        <div key={key}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <category.icon className="h-3 w-3" />
                            {category.label}
                          </div>
                          {category.triggers.map(trigger => {
                            const info = TRIGGER_INFO[trigger]
                            return (
                              <SelectItem key={trigger} value={trigger}>
                                <div className="flex flex-col">
                                  <span>{info?.name}</span>
                                  <span className="text-xs text-muted-foreground">{info?.description}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>

                  {needsValue && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">
                        {triggerInfo?.valueType === 'tile' && "Case :"}
                        {triggerInfo?.valueType === 'dice' && "Valeur du dé :"}
                        {triggerInfo?.valueType === 'score' && "Score :"}
                        {triggerInfo?.valueType === 'turns' && "Tours :"}
                      </Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={triggerValue}
                          onChange={(e) => setTriggerValue(e.target.value)}
                          placeholder="Valeur"
                          className="w-24 bg-secondary border-yellow-400/30"
                        />
                        {triggerInfo?.valueType === 'tile' && onStartSelection && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={handleSelectionClick}
                                  className="h-10 w-10 border-yellow-400/30 hover:bg-yellow-400/10"
                                >
                                  <Crosshair className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Sélectionner sur le plateau</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ALORS - Effets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-green-400" />
                    <span className="font-semibold text-green-400">ALORS</span>
                    <span className="text-xs text-muted-foreground">(Effets)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addEffect}
                    className="h-7 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </div>

                <div className="space-y-2">
                  {effects.map((effect, index) => {
                    const actionInfo = ACTION_INFO[effect.type as ActionType]
                    const needsValueForAction = actionInfo && effect.type !== ActionType.SKIP_TURN &&
                      effect.type !== ActionType.EXTRA_TURN && effect.type !== ActionType.BACK_TO_START

                    return (
                      <div key={index} className="rounded-lg border-2 border-green-400/50 bg-green-400/5 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Select value={effect.type} onValueChange={(value) => updateEffect(index, "type", value)}>
                            <SelectTrigger className="flex-1 min-w-[200px] bg-secondary border-green-400/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {Object.entries(ACTION_CATEGORIES).map(([key, category]) => (
                                <div key={key}>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                    {category.label}
                                  </div>
                                  {category.actions.map(action => {
                                    const info = ACTION_INFO[action]
                                    return (
                                      <SelectItem key={action} value={action}>
                                        <div className="flex flex-col">
                                          <span>{info?.name}</span>
                                          <span className="text-xs text-muted-foreground">{info?.description}</span>
                                        </div>
                                      </SelectItem>
                                    )
                                  })}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>

                          {needsValueForAction && (
                            <Input
                              type="number"
                              value={effect.value}
                              onChange={(e) => updateEffect(index, "value", e.target.value)}
                              className="w-20 bg-secondary border-green-400/30"
                              placeholder="Val."
                            />
                          )}

                          <Select value={effect.target} onValueChange={(value) => updateEffect(index, "target", value)}>
                            <SelectTrigger className="w-[150px] bg-secondary border-green-400/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TARGET_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {actionInfo?.supportsDuration && (
                            <div className="flex items-center gap-1">
                              <Timer className="h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                value={effect.duration || 1}
                                onChange={(e) => updateEffect(index, "duration", Number(e.target.value))}
                                className="w-16 bg-secondary border-green-400/30"
                                placeholder="Tours"
                                min={1}
                              />
                              <span className="text-xs text-muted-foreground">tours</span>
                            </div>
                          )}

                          {effects.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeEffect(index)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Aperçu */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Aperçu de la règle</Label>
                <Textarea
                  readOnly
                  value={rulePreview}
                  className="min-h-[80px] bg-secondary/30 border-border text-sm font-mono resize-none"
                />
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6 py-4 mt-0">
              {/* Informations de base */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rule-title-adv">Nom de la règle *</Label>
                  <Input
                    id="rule-title-adv"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nom de la règle"
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="bg-secondary/50"
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez ce que fait cette règle..."
                  className="bg-secondary/50 resize-none"
                  rows={2}
                />
              </div>

              {/* Déclencheur */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="font-semibold text-yellow-400">DÉCLENCHEUR</span>
                </div>
                <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/5 p-4 space-y-3">
                  <Select value={triggerType} onValueChange={(value) => setTriggerType(value as TriggerType)}>
                    <SelectTrigger className="bg-secondary border-yellow-400/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {Object.entries(TRIGGER_CATEGORIES).map(([key, category]) => (
                        <div key={key}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <category.icon className="h-3 w-3" />
                            {category.label}
                          </div>
                          {category.triggers.map(trigger => {
                            const info = TRIGGER_INFO[trigger]
                            return (
                              <SelectItem key={trigger} value={trigger}>
                                {info?.name}
                              </SelectItem>
                            )
                          })}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>

                  {needsValue && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Valeur :</Label>
                      <Input
                        type="number"
                        value={triggerValue}
                        onChange={(e) => setTriggerValue(e.target.value)}
                        className="w-24 bg-secondary border-yellow-400/30"
                      />
                      {triggerInfo?.valueType === 'tile' && onStartSelection && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectionClick}
                          className="border-yellow-400/30"
                        >
                          <Crosshair className="h-4 w-4 mr-1" />
                          Sélectionner
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-400" />
                    <span className="font-semibold text-orange-400">CONDITIONS</span>
                    <Badge variant="outline" className="text-xs">{conditions.length}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addCondition}
                    className="h-7 text-orange-400 hover:text-orange-300"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </div>

                {conditions.length > 0 && (
                  <div className="space-y-2">
                    {conditions.map((condition, index) => (
                      <div key={index} className="rounded-lg border border-orange-400/30 bg-orange-400/5 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {index > 0 && (
                            <Badge variant="secondary" className="text-xs">ET</Badge>
                          )}

                          <Select
                            value={condition.type}
                            onValueChange={(value) => updateCondition(index, "type", value)}
                          >
                            <SelectTrigger className="w-[140px] bg-secondary border-orange-400/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONDITION_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={condition.operator}
                            onValueChange={(value) => updateCondition(index, "operator", value)}
                          >
                            <SelectTrigger className="w-[120px] bg-secondary border-orange-400/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {OPERATOR_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.symbol} {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="number"
                            value={condition.value as number}
                            onChange={(e) => updateCondition(index, "value", Number(e.target.value))}
                            className="w-20 bg-secondary border-orange-400/30"
                          />

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCondition(index)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {conditions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Aucune condition - la règle s'appliquera toujours
                  </p>
                )}
              </div>

              {/* Effets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-green-400" />
                    <span className="font-semibold text-green-400">EFFETS</span>
                    <Badge variant="outline" className="text-xs">{effects.length}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addEffect}
                    className="h-7 text-green-400 hover:text-green-300"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </div>

                <div className="space-y-2">
                  {effects.map((effect, index) => {
                    const actionInfo = ACTION_INFO[effect.type as ActionType]
                    return (
                      <div key={index} className="rounded-lg border border-green-400/30 bg-green-400/5 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Select value={effect.type} onValueChange={(value) => updateEffect(index, "type", value)}>
                            <SelectTrigger className="w-[180px] bg-secondary border-green-400/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[250px]">
                              {Object.entries(ACTION_CATEGORIES).map(([key, category]) => (
                                <div key={key}>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                    {category.label}
                                  </div>
                                  {category.actions.map(action => (
                                    <SelectItem key={action} value={action}>
                                      {ACTION_INFO[action]?.name}
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>

                          {actionInfo && effect.type !== ActionType.SKIP_TURN &&
                           effect.type !== ActionType.EXTRA_TURN &&
                           effect.type !== ActionType.BACK_TO_START && (
                            <Input
                              type="number"
                              value={effect.value}
                              onChange={(e) => updateEffect(index, "value", e.target.value)}
                              className="w-20 bg-secondary border-green-400/30"
                            />
                          )}

                          <Select value={effect.target} onValueChange={(value) => updateEffect(index, "target", value)}>
                            <SelectTrigger className="w-[130px] bg-secondary border-green-400/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TARGET_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {actionInfo?.supportsDuration && (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={effect.duration || 1}
                                onChange={(e) => updateEffect(index, "duration", Number(e.target.value))}
                                className="w-14 bg-secondary border-green-400/30"
                                min={1}
                              />
                              <span className="text-xs text-muted-foreground">t.</span>
                            </div>
                          )}

                          {effects.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeEffect(index)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Aperçu */}
              <div className="space-y-2">
                <Label>Aperçu</Label>
                <Textarea
                  readOnly
                  value={rulePreview}
                  className="min-h-[80px] bg-secondary/30 text-sm font-mono resize-none"
                />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="gap-2 px-6 py-4 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-400/50"
          >
            <Blocks className="h-4 w-4 mr-2" />
            {editingRule ? "Mettre à jour" : "Créer la règle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
