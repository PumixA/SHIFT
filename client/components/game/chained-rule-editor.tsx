"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, ChevronDown, ChevronUp, GitBranch, Zap, HelpCircle, ArrowRight, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
    ChainedRule,
    RuleCondition,
    ChainedAction,
    ConditionType,
    ConditionOperator,
    ConditionTarget,
    CONDITION_TEMPLATES,
    ACTION_TEMPLATES,
    validateChainedRule,
} from "@/lib/chained-rules"
import { TriggerType, ActionType } from "@/src/types/rules"

interface ChainedRuleEditorProps {
    initialRule?: Partial<ChainedRule>
    onSave: (rule: ChainedRule) => void
    onCancel: () => void
    existingRules?: ChainedRule[]
}

const TRIGGER_OPTIONS = [
    { value: TriggerType.ON_LAND, label: "Quand un joueur atterrit sur une case" },
    { value: TriggerType.ON_PASS_OVER, label: "Quand un joueur passe sur une case" },
    { value: TriggerType.ON_DICE_ROLL, label: "Quand un joueur lance le dé" },
    { value: TriggerType.ON_TURN_START, label: "Au début du tour" },
    { value: TriggerType.ON_TURN_END, label: "A la fin du tour" },
    { value: TriggerType.ON_SCORE_CHANGE, label: "Quand le score change" },
    { value: TriggerType.ON_SAME_TILE, label: "Quand 2 joueurs sur même case" },
]

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
    eq: "est égal à",
    neq: "est différent de",
    gt: "est supérieur à",
    lt: "est inférieur à",
    gte: "est supérieur ou égal à",
    lte: "est inférieur ou égal à",
    contains: "contient",
    not_contains: "ne contient pas",
}

const TARGET_LABELS: Record<ConditionTarget, string> = {
    self: "Joueur actuel",
    any_player: "N'importe quel joueur",
    all_players: "Tous les joueurs",
    leader: "Le joueur en tête",
    last_player: "Le dernier joueur",
    nearest_player: "Le joueur le plus proche",
}

export function ChainedRuleEditor({ initialRule, onSave, onCancel, existingRules = [] }: ChainedRuleEditorProps) {
    const [rule, setRule] = useState<Partial<ChainedRule>>({
        name: "",
        description: "",
        enabled: true,
        priority: 0,
        trigger: TriggerType.ON_LAND,
        conditions: [],
        conditionLogic: "AND",
        thenActions: [],
        elseActions: [],
        ...initialRule,
    })

    const [errors, setErrors] = useState<string[]>([])
    const [showElse, setShowElse] = useState((initialRule?.elseActions?.length || 0) > 0)
    const [expandedSections, setExpandedSections] = useState({
        conditions: true,
        then: true,
        else: true,
    })

    // Add condition
    const addCondition = useCallback((templateId?: string) => {
        const template = templateId ? CONDITION_TEMPLATES.find((t) => t.id === templateId) : CONDITION_TEMPLATES[0]

        if (!template) return

        const newCondition: RuleCondition = {
            id: `cond-${Date.now()}`,
            type: template.type,
            operator: template.operator,
            value: template.defaultValue,
            target: "self",
        }

        setRule((prev) => ({
            ...prev,
            conditions: [...(prev.conditions || []), newCondition],
        }))
    }, [])

    // Remove condition
    const removeCondition = useCallback((id: string) => {
        setRule((prev) => ({
            ...prev,
            conditions: prev.conditions?.filter((c) => c.id !== id),
        }))
    }, [])

    // Update condition
    const updateCondition = useCallback((id: string, updates: Partial<RuleCondition>) => {
        setRule((prev) => ({
            ...prev,
            conditions: prev.conditions?.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }))
    }, [])

    // Add action (then or else)
    const addAction = useCallback((type: "then" | "else", templateId?: string) => {
        const template = templateId ? ACTION_TEMPLATES.find((t) => t.id === templateId) : ACTION_TEMPLATES[0]

        if (!template) return

        const newAction: ChainedAction = {
            id: `action-${Date.now()}`,
            type: template.type,
            value: template.defaultValue,
            targetPlayer: "self",
        }

        const key = type === "then" ? "thenActions" : "elseActions"
        setRule((prev) => ({
            ...prev,
            [key]: [...(prev[key] || []), newAction],
        }))
    }, [])

    // Remove action
    const removeAction = useCallback((type: "then" | "else", id: string) => {
        const key = type === "then" ? "thenActions" : "elseActions"
        setRule((prev) => ({
            ...prev,
            [key]: prev[key]?.filter((a) => a.id !== id),
        }))
    }, [])

    // Update action
    const updateAction = useCallback((type: "then" | "else", id: string, updates: Partial<ChainedAction>) => {
        const key = type === "then" ? "thenActions" : "elseActions"
        setRule((prev) => ({
            ...prev,
            [key]: prev[key]?.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        }))
    }, [])

    // Toggle section
    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }))
    }

    // Handle save
    const handleSave = () => {
        const validation = validateChainedRule(rule)
        if (!validation.valid) {
            setErrors(validation.errors)
            return
        }

        const finalRule: ChainedRule = {
            id: initialRule?.id || `rule-${Date.now()}`,
            name: rule.name || "Nouvelle règle",
            description: rule.description || "",
            enabled: rule.enabled ?? true,
            priority: rule.priority ?? 0,
            trigger: rule.trigger || TriggerType.ON_LAND,
            conditions: rule.conditions || [],
            conditionLogic: rule.conditionLogic || "AND",
            thenActions: rule.thenActions || [],
            elseActions: showElse ? rule.elseActions : undefined,
            createdAt: initialRule?.createdAt || new Date().toISOString(),
        }

        onSave(finalRule)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-violet-500/30 bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                        <GitBranch className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Règle Conditionnelle</h3>
                        <p className="text-muted-foreground text-xs">
                            Si conditions... Alors actions... Sinon actions...
                        </p>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Nom de la règle</Label>
                        <Input
                            value={rule.name || ""}
                            onChange={(e) => setRule((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Bonus du leader"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Déclencheur</Label>
                        <Select
                            value={rule.trigger}
                            onValueChange={(v) => setRule((prev) => ({ ...prev, trigger: v as TriggerType }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TRIGGER_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Conditions Section */}
            <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardHeader className="cursor-pointer" onClick={() => toggleSection("conditions")}>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <span className="font-black text-yellow-400">SI</span>
                            <Badge variant="outline" className="text-xs">
                                {rule.conditions?.length || 0} condition
                                {(rule.conditions?.length || 0) !== 1 ? "s" : ""}
                            </Badge>
                        </CardTitle>
                        {expandedSections.conditions ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </div>
                </CardHeader>

                <AnimatePresence>
                    {expandedSections.conditions ? (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <CardContent className="space-y-4">
                                {/* Logic selector */}
                                {(rule.conditions?.length || 0) > 1 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">Combiner avec :</span>
                                        <Select
                                            value={rule.conditionLogic}
                                            onValueChange={(v) =>
                                                setRule((prev) => ({
                                                    ...prev,
                                                    conditionLogic: v as "AND" | "OR",
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="h-8 w-24">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="AND">ET</SelectItem>
                                                <SelectItem value="OR">OU</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Conditions list */}
                                <div className="space-y-2">
                                    {rule.conditions?.map((condition, index) => (
                                        <motion.div
                                            key={condition.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3"
                                        >
                                            {index > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    {rule.conditionLogic}
                                                </Badge>
                                            )}

                                            <Select
                                                value={condition.type}
                                                onValueChange={(v) =>
                                                    updateCondition(condition.id, {
                                                        type: v as ConditionType,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-40">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CONDITION_TEMPLATES.map((t) => (
                                                        <SelectItem key={t.id} value={t.type}>
                                                            {t.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <Select
                                                value={condition.operator}
                                                onValueChange={(v) =>
                                                    updateCondition(condition.id, {
                                                        operator: v as ConditionOperator,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-36">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(OPERATOR_LABELS).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <Input
                                                type={typeof condition.value === "number" ? "number" : "text"}
                                                value={condition.value as string | number}
                                                onChange={(e) =>
                                                    updateCondition(condition.id, {
                                                        value:
                                                            e.target.type === "number"
                                                                ? Number(e.target.value)
                                                                : e.target.value,
                                                    })
                                                }
                                                className="h-8 w-20"
                                            />

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-400 hover:text-red-300"
                                                onClick={() => removeCondition(condition.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Add condition button */}
                                <Select onValueChange={(v) => addCondition(v)}>
                                    <SelectTrigger className="w-full border-dashed">
                                        <div className="text-muted-foreground flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            Ajouter une condition
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CONDITION_TEMPLATES.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                <div className="flex flex-col">
                                                    <span>{t.name}</span>
                                                    <span className="text-muted-foreground text-xs">
                                                        {t.description}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </Card>

            {/* Flow indicator */}
            <div className="flex justify-center">
                <ArrowDown className="text-muted-foreground h-6 w-6" />
            </div>

            {/* THEN Section */}
            <Card className="border-green-500/30 bg-green-500/5">
                <CardHeader className="cursor-pointer" onClick={() => toggleSection("then")}>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <span className="font-black text-green-400">ALORS</span>
                            <Badge variant="outline" className="text-xs text-green-400">
                                {rule.thenActions?.length || 0} action{(rule.thenActions?.length || 0) !== 1 ? "s" : ""}
                            </Badge>
                        </CardTitle>
                        {expandedSections.then ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </div>
                </CardHeader>

                <AnimatePresence>
                    {expandedSections.then ? (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    {rule.thenActions?.map((action) => (
                                        <motion.div
                                            key={action.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3"
                                        >
                                            <Zap className="h-4 w-4 text-green-400" />

                                            <Select
                                                value={action.type}
                                                onValueChange={(v) =>
                                                    updateAction("then", action.id, {
                                                        type: v as ActionType,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="h-8 flex-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ACTION_TEMPLATES.map((t) => (
                                                        <SelectItem key={t.id} value={t.type}>
                                                            {t.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {action.type !== ActionType.EXTRA_TURN &&
                                                action.type !== ActionType.SKIP_TURN &&
                                                action.type !== ActionType.BACK_TO_START && (
                                                    <Input
                                                        type="number"
                                                        value={action.value || 0}
                                                        onChange={(e) =>
                                                            updateAction("then", action.id, {
                                                                value: Number(e.target.value),
                                                            })
                                                        }
                                                        className="h-8 w-20"
                                                    />
                                                )}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-400 hover:text-red-300"
                                                onClick={() => removeAction("then", action.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </motion.div>
                                    ))}
                                </div>

                                <Select onValueChange={(v) => addAction("then", v)}>
                                    <SelectTrigger className="w-full border-dashed">
                                        <div className="text-muted-foreground flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            Ajouter une action
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ACTION_TEMPLATES.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                <div className="flex flex-col">
                                                    <span>{t.name}</span>
                                                    <span className="text-muted-foreground text-xs">
                                                        {t.description}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </Card>

            {/* ELSE Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                    <span className="font-black text-red-400">SINON</span>
                    <span className="text-muted-foreground text-sm">
                        Actions si les conditions ne sont pas remplies
                    </span>
                </div>
                <Switch checked={showElse} onCheckedChange={setShowElse} />
            </div>

            {/* ELSE Section */}
            <AnimatePresence>
                {showElse ? (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <Card className="border-red-500/30 bg-red-500/5">
                            <CardHeader className="cursor-pointer" onClick={() => toggleSection("else")}>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <span className="font-black text-red-400">SINON</span>
                                        <Badge variant="outline" className="text-xs text-red-400">
                                            {rule.elseActions?.length || 0} action
                                            {(rule.elseActions?.length || 0) !== 1 ? "s" : ""}
                                        </Badge>
                                    </CardTitle>
                                    {expandedSections.else ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </div>
                            </CardHeader>

                            <AnimatePresence>
                                {expandedSections.else ? (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                    >
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                {rule.elseActions?.map((action) => (
                                                    <motion.div
                                                        key={action.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3"
                                                    >
                                                        <Zap className="h-4 w-4 text-red-400" />

                                                        <Select
                                                            value={action.type}
                                                            onValueChange={(v) =>
                                                                updateAction("else", action.id, {
                                                                    type: v as ActionType,
                                                                })
                                                            }
                                                        >
                                                            <SelectTrigger className="h-8 flex-1">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {ACTION_TEMPLATES.map((t) => (
                                                                    <SelectItem key={t.id} value={t.type}>
                                                                        {t.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>

                                                        {action.type !== ActionType.EXTRA_TURN &&
                                                            action.type !== ActionType.SKIP_TURN &&
                                                            action.type !== ActionType.BACK_TO_START && (
                                                                <Input
                                                                    type="number"
                                                                    value={action.value || 0}
                                                                    onChange={(e) =>
                                                                        updateAction("else", action.id, {
                                                                            value: Number(e.target.value),
                                                                        })
                                                                    }
                                                                    className="h-8 w-20"
                                                                />
                                                            )}

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-400 hover:text-red-300"
                                                            onClick={() => removeAction("else", action.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            <Select onValueChange={(v) => addAction("else", v)}>
                                                <SelectTrigger className="w-full border-dashed">
                                                    <div className="text-muted-foreground flex items-center gap-2">
                                                        <Plus className="h-4 w-4" />
                                                        Ajouter une action
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ACTION_TEMPLATES.map((t) => (
                                                        <SelectItem key={t.id} value={t.id}>
                                                            <div className="flex flex-col">
                                                                <span>{t.name}</span>
                                                                <span className="text-muted-foreground text-xs">
                                                                    {t.description}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </CardContent>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </Card>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <p className="mb-2 text-sm font-bold text-red-400">Erreurs :</p>
                    <ul className="list-inside list-disc space-y-1 text-sm text-red-400/80">
                        {errors.map((error, i) => (
                            <li key={i}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={onCancel} className="flex-1">
                    Annuler
                </Button>
                <Button
                    onClick={handleSave}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                >
                    {initialRule ? "Mettre à jour" : "Créer la règle"}
                </Button>
            </div>
        </div>
    )
}
