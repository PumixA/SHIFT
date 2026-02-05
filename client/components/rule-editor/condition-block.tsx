"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RuleCondition, ConditionType, ConditionOperator, ConditionTarget } from "@/src/types/rules"

interface ConditionBlockProps {
    condition: RuleCondition
    onChange: (condition: RuleCondition) => void
}

const CONDITION_INFO: Record<ConditionType, { name: string; description: string; valueType: string }> = {
    [ConditionType.SCORE_CHECK]: { name: "Vérifier le score", description: "Score du joueur", valueType: "number" },
    [ConditionType.POSITION_CHECK]: {
        name: "Vérifier la position",
        description: "Position sur le plateau",
        valueType: "number",
    },
    [ConditionType.EFFECT_ACTIVE]: { name: "Effet actif", description: "Un effet est actif", valueType: "text" },
    [ConditionType.DICE_VALUE]: { name: "Valeur du dé", description: "Résultat du dé", valueType: "number" },
    [ConditionType.TURN_COUNT]: { name: "Numéro du tour", description: "Tour actuel", valueType: "number" },
    [ConditionType.PLAYER_COUNT]: {
        name: "Nombre de joueurs",
        description: "Joueurs dans la partie",
        valueType: "number",
    },
    [ConditionType.HAS_POWER_UP]: { name: "A un power-up", description: "Joueur avec power-up", valueType: "text" },
    [ConditionType.PLAYER_RANK]: {
        name: "Classement",
        description: "Position dans le classement",
        valueType: "number",
    },
    [ConditionType.TILES_FROM_END]: {
        name: "Distance de la fin",
        description: "Cases avant la fin",
        valueType: "number",
    },
}

const OPERATORS: { value: ConditionOperator; label: string }[] = [
    { value: "eq", label: "= égal à" },
    { value: "neq", label: "≠ différent de" },
    { value: "gt", label: "> supérieur à" },
    { value: "gte", label: "≥ supérieur ou égal à" },
    { value: "lt", label: "< inférieur à" },
    { value: "lte", label: "≤ inférieur ou égal à" },
]

const TARGETS: { value: ConditionTarget; label: string }[] = [
    { value: "self", label: "Joueur actuel" },
    { value: "any", label: "N'importe quel joueur" },
    { value: "all", label: "Tous les joueurs" },
    { value: "leader", label: "Le leader" },
    { value: "last", label: "Le dernier" },
    { value: "others", label: "Les autres joueurs" },
]

export function ConditionBlock({ condition, onChange }: ConditionBlockProps) {
    const info = CONDITION_INFO[condition.type]

    const handleTypeChange = (type: string) => {
        onChange({ ...condition, type: type as ConditionType })
    }

    const handleOperatorChange = (operator: string) => {
        onChange({ ...condition, operator: operator as ConditionOperator })
    }

    const handleValueChange = (value: string) => {
        onChange({
            ...condition,
            value: info?.valueType === "number" ? parseInt(value) || 0 : value,
        })
    }

    const handleTargetChange = (target: string) => {
        onChange({ ...condition, target: target as ConditionTarget })
    }

    return (
        <div className="space-y-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
            <div className="grid grid-cols-2 gap-3">
                {/* Condition Type */}
                <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={condition.type} onValueChange={handleTypeChange}>
                        <SelectTrigger className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(CONDITION_INFO).map(([type, info]) => (
                                <SelectItem key={type} value={type}>
                                    {info.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Target */}
                <div className="space-y-1">
                    <Label className="text-xs">Cible</Label>
                    <Select value={condition.target || "self"} onValueChange={handleTargetChange}>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Operator */}
                <div className="space-y-1">
                    <Label className="text-xs">Opérateur</Label>
                    <Select value={condition.operator} onValueChange={handleOperatorChange}>
                        <SelectTrigger className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {OPERATORS.map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Value */}
                <div className="space-y-1">
                    <Label className="text-xs">Valeur</Label>
                    <Input
                        type={info?.valueType === "number" ? "number" : "text"}
                        value={condition.value}
                        onChange={(e) => handleValueChange(e.target.value)}
                        className="h-9"
                    />
                </div>
            </div>

            {info ? <p className="text-muted-foreground text-xs">{info.description}</p> : null}
        </div>
    )
}
