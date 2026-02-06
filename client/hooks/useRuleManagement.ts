"use client"

import { useCallback, useState } from "react"
import { socket } from "@/services/socket"
import { toast } from "sonner"
import { Rule, TriggerType } from "@/src/types/rules"
import type { TurnPhase } from "./useTurnManagement"

export interface LocalAction {
    type: string
    playerId: string
    playerName?: string
    playerColor?: string
    description: string
    details?: Record<string, unknown>
    turnNumber?: number
}

export interface UseRuleManagementProps {
    isLocalMode: boolean
    activeRoom: string | null
    canModifyRulesNow: boolean
    turnPhase: TurnPhase
    rules: Rule[]
    setRules: React.Dispatch<React.SetStateAction<Rule[]>>
    markModificationDone: () => void
    onLocalAction?: (action: LocalAction) => void
    currentPlayer?: { id: string | number; name: string; color: string }
    turnNumber?: number
}

export interface UseRuleManagementReturn {
    // State
    ruleBuilderOpen: boolean
    setRuleBuilderOpen: React.Dispatch<React.SetStateAction<boolean>>
    editingRule: Rule | null
    setEditingRule: React.Dispatch<React.SetStateAction<Rule | null>>
    draftRule: Partial<Rule> | null
    setDraftRule: React.Dispatch<React.SetStateAction<Partial<Rule> | null>>
    isSelectingTile: boolean
    setIsSelectingTile: React.Dispatch<React.SetStateAction<boolean>>

    // Actions
    handleSaveRule: (rule: Rule) => void
    handleDeleteRule: (ruleId: string) => void
    handleEditRule: (rule: Rule) => void
    handleAddRule: () => void
    handleAddRuleFromTemplate: (rule: Rule) => void
    handleStartTileSelection: (currentData: Partial<Rule>) => void
    handleTileClick: (index: number) => void
}

export function useRuleManagement({
    isLocalMode,
    activeRoom,
    canModifyRulesNow,
    turnPhase,
    rules,
    setRules,
    markModificationDone,
    onLocalAction,
    currentPlayer,
    turnNumber,
}: UseRuleManagementProps): UseRuleManagementReturn {
    const [ruleBuilderOpen, setRuleBuilderOpen] = useState(false)
    const [editingRule, setEditingRule] = useState<Rule | null>(null)
    const [draftRule, setDraftRule] = useState<Partial<Rule> | null>(null)
    const [isSelectingTile, setIsSelectingTile] = useState(false)

    const handleSaveRule = useCallback(
        (rule: Rule) => {
            if (!canModifyRulesNow) {
                toast.error("Vous ne pouvez pas modifier les règles maintenant")
                return
            }

            if (isLocalMode) {
                const isEditing = !!editingRule
                if (isEditing) {
                    setRules((prev) => prev.map((r) => (r.id === editingRule.id ? rule : r)))
                    toast.success(`Règle "${rule.title}" modifiée !`)
                } else {
                    setRules((prev) => [...prev, rule])
                    toast.success(`Règle "${rule.title}" créée !`)
                }
                markModificationDone()

                // Track action
                if (onLocalAction && currentPlayer) {
                    onLocalAction({
                        type: isEditing ? "rule_modified" : "rule_added",
                        playerId: String(currentPlayer.id),
                        playerName: currentPlayer.name,
                        playerColor: currentPlayer.color,
                        description: isEditing
                            ? `${currentPlayer.name} modifie la règle "${rule.title}"`
                            : `${currentPlayer.name} crée la règle "${rule.title}"`,
                        details: { ruleName: rule.title, ruleId: rule.id },
                        turnNumber,
                    })
                }
            } else if (activeRoom) {
                socket.emit("create_rule", rule)
            }

            setEditingRule(null)
            setDraftRule(null)
            setRuleBuilderOpen(false)
        },
        [
            canModifyRulesNow,
            isLocalMode,
            activeRoom,
            editingRule,
            markModificationDone,
            setRules,
            onLocalAction,
            currentPlayer,
            turnNumber,
        ]
    )

    const handleDeleteRule = useCallback(
        (ruleId: string) => {
            if (!canModifyRulesNow) {
                toast.error("Vous ne pouvez pas supprimer de règle maintenant")
                return
            }

            if (isLocalMode) {
                const deletedRule = rules.find((r) => r.id === ruleId)
                setRules((prev) => prev.filter((r) => r.id !== ruleId))
                toast.info("Règle supprimée")
                markModificationDone()

                // Track action
                if (onLocalAction && currentPlayer && deletedRule) {
                    onLocalAction({
                        type: "rule_deleted",
                        playerId: String(currentPlayer.id),
                        playerName: currentPlayer.name,
                        playerColor: currentPlayer.color,
                        description: `${currentPlayer.name} supprime la règle "${deletedRule.title}"`,
                        details: { ruleName: deletedRule.title, ruleId },
                        turnNumber,
                    })
                }
            } else if (activeRoom) {
                socket.emit("delete_rule", { ruleId })
            }
        },
        [
            canModifyRulesNow,
            isLocalMode,
            activeRoom,
            markModificationDone,
            setRules,
            rules,
            onLocalAction,
            currentPlayer,
            turnNumber,
        ]
    )

    const handleEditRule = useCallback(
        (rule: Rule) => {
            if (!canModifyRulesNow) {
                toast.error("Vous ne pouvez pas modifier les règles maintenant")
                return
            }
            setEditingRule(rule)
            setRuleBuilderOpen(true)
        },
        [canModifyRulesNow]
    )

    const handleAddRule = useCallback(() => {
        if (!canModifyRulesNow) {
            if (turnPhase === "ROLL") {
                toast.warning("Lancez le dé d'abord")
            } else {
                toast.error("Vous ne pouvez pas ajouter de règle maintenant")
            }
            return
        }
        setEditingRule(null)
        setDraftRule(null)
        setRuleBuilderOpen(true)
    }, [canModifyRulesNow, turnPhase])

    const handleAddRuleFromTemplate = useCallback(
        (rule: Rule) => {
            if (!canModifyRulesNow) {
                toast.warning(turnPhase === "ROLL" ? "Lancez le dé d'abord" : "Modification impossible")
                return
            }
            setRules((prev) => [...prev, rule])
            toast.success(`Règle "${rule.title}" ajoutée !`)
            markModificationDone()

            // Track action
            if (onLocalAction && currentPlayer) {
                onLocalAction({
                    type: "rule_added",
                    playerId: String(currentPlayer.id),
                    playerName: currentPlayer.name,
                    playerColor: currentPlayer.color,
                    description: `${currentPlayer.name} ajoute la règle "${rule.title}" depuis un modèle`,
                    details: { ruleName: rule.title, ruleId: rule.id },
                    turnNumber,
                })
            }
        },
        [canModifyRulesNow, turnPhase, markModificationDone, setRules, onLocalAction, currentPlayer, turnNumber]
    )

    const handleStartTileSelection = useCallback((currentData: Partial<Rule>) => {
        setDraftRule(currentData)
        setRuleBuilderOpen(false)
        setIsSelectingTile(true)
        toast.info("Cliquez sur une case du plateau", { icon: "🎯" })
    }, [])

    const handleTileClick = useCallback(
        (index: number) => {
            if (!isSelectingTile) return
            setDraftRule((prev) => ({
                ...prev,
                trigger: { type: TriggerType.ON_LAND, value: index },
            }))
            setIsSelectingTile(false)
            setRuleBuilderOpen(true)
            toast.success(`Case ${index} sélectionnée`)
        },
        [isSelectingTile]
    )

    return {
        ruleBuilderOpen,
        setRuleBuilderOpen,
        editingRule,
        setEditingRule,
        draftRule,
        setDraftRule,
        isSelectingTile,
        setIsSelectingTile,
        handleSaveRule,
        handleDeleteRule,
        handleEditRule,
        handleAddRule,
        handleAddRuleFromTemplate,
        handleStartTileSelection,
        handleTileClick,
    }
}
