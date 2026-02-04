"use client"

import { useCallback, useState } from "react"
import { socket } from "@/services/socket"
import { toast } from "sonner"
import { Rule, TriggerType } from "@/src/types/rules"
import type { TurnPhase } from "./useTurnManagement"

export interface UseRuleManagementProps {
    isLocalMode: boolean
    activeRoom: string | null
    canModifyRulesNow: boolean
    turnPhase: TurnPhase
    rules: Rule[]
    setRules: React.Dispatch<React.SetStateAction<Rule[]>>
    markModificationDone: () => void
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
                if (editingRule) {
                    setRules((prev) => prev.map((r) => (r.id === editingRule.id ? rule : r)))
                    toast.success(`Règle "${rule.title}" modifiée !`)
                } else {
                    setRules((prev) => [...prev, rule])
                    toast.success(`Règle "${rule.title}" créée !`)
                }
                markModificationDone()
            } else if (activeRoom) {
                socket.emit("create_rule", rule)
            }

            setEditingRule(null)
            setDraftRule(null)
            setRuleBuilderOpen(false)
        },
        [canModifyRulesNow, isLocalMode, activeRoom, editingRule, markModificationDone, setRules]
    )

    const handleDeleteRule = useCallback(
        (ruleId: string) => {
            if (!canModifyRulesNow) {
                toast.error("Vous ne pouvez pas supprimer de règle maintenant")
                return
            }

            if (isLocalMode) {
                setRules((prev) => prev.filter((r) => r.id !== ruleId))
                toast.info("Règle supprimée")
                markModificationDone()
            } else if (activeRoom) {
                socket.emit("delete_rule", { ruleId })
            }
        },
        [canModifyRulesNow, isLocalMode, activeRoom, markModificationDone, setRules]
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
        },
        [canModifyRulesNow, turnPhase, markModificationDone, setRules]
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
