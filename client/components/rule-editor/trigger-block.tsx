"use client"

import { Crosshair } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TriggerType, TRIGGER_INFO, TriggerInfo } from "@/src/types/rules"

interface TriggerBlockProps {
    trigger: { type: TriggerType; value?: number | string }
    onChange: (trigger: { type: TriggerType; value?: number | string }) => void
    onSelectTile?: (callback: (tileIndex: number) => void) => void
}

const TRIGGER_CATEGORIES = {
    movement: "Mouvement",
    turn: "Tour",
    interaction: "Interaction",
    score: "Score",
    position: "Position",
    flow: "Flux de jeu",
    effect: "Effets",
}

export function TriggerBlock({ trigger, onChange, onSelectTile }: TriggerBlockProps) {
    const triggerInfo = TRIGGER_INFO[trigger.type]
    const needsValue = triggerInfo?.needsValue
    const valueType = triggerInfo?.valueType

    const handleTypeChange = (type: string) => {
        onChange({ type: type as TriggerType, value: undefined })
    }

    const handleValueChange = (value: string) => {
        onChange({ ...trigger, value: value ? parseInt(value) : undefined })
    }

    const handleSelectTile = () => {
        if (onSelectTile) {
            onSelectTile((tileIndex) => {
                onChange({ ...trigger, value: tileIndex })
            })
        }
    }

    // Group triggers by category
    const groupedTriggers = Object.entries(TRIGGER_INFO).reduce(
        (acc, [, info]) => {
            const category = info.category
            if (!acc[category]) acc[category] = []
            acc[category].push(info)
            return acc
        },
        {} as Record<string, TriggerInfo[]>
    )

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Type de déclencheur</Label>
                <Select value={trigger.type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choisir un déclencheur" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(groupedTriggers).map(([category, triggers]) => (
                            <div key={category}>
                                <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                                    {TRIGGER_CATEGORIES[category as keyof typeof TRIGGER_CATEGORIES] || category}
                                </div>
                                {triggers.map((t) => (
                                    <SelectItem key={t.type} value={t.type}>
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </div>
                        ))}
                    </SelectContent>
                </Select>
                {triggerInfo ? <p className="text-muted-foreground text-xs">{triggerInfo.description}</p> : null}
            </div>

            {needsValue ? (
                <div className="space-y-2">
                    <Label>
                        {valueType === "tile"
                            ? "Case cible"
                            : valueType === "dice"
                              ? "Valeur du dé"
                              : valueType === "score"
                                ? "Seuil de score"
                                : valueType === "turns"
                                  ? "Nombre de tours"
                                  : "Valeur"}
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            min={valueType === "dice" ? 1 : 0}
                            max={valueType === "dice" ? 6 : undefined}
                            value={trigger.value ?? ""}
                            onChange={(e) => handleValueChange(e.target.value)}
                            placeholder={valueType === "tile" ? "Index de la case" : valueType === "dice" ? "1-6" : "0"}
                        />
                        {valueType === "tile" && onSelectTile ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleSelectTile}
                                title="Sélectionner sur le plateau"
                            >
                                <Crosshair className="h-4 w-4" />
                            </Button>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    )
}
