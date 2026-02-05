"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { Lightbulb } from "lucide-react"
import type { TurnPhase } from "@/hooks/useTurnManagement"

export interface TutorialHint {
    id: string
    content: string
    description?: string
}

interface TutorialHintsProps {
    enabled: boolean
    turnCount: number
    turnPhase: TurnPhase
    hasRolledDice: boolean
    rulesCount: number
    dismissedHints: string[]
    onDismiss: (hintId: string) => void
}

const HINTS: TutorialHint[] = [
    {
        id: "hint_first_roll",
        content: "Lancez le dé !",
        description: "Cliquez sur le dé ou appuyez sur Espace pour commencer",
    },
    {
        id: "hint_after_move",
        content: "Vous pouvez modifier le jeu",
        description: "Créez une règle ou modifiez le plateau (clic droit sur une case)",
    },
    {
        id: "hint_open_rules",
        content: "Consultez le Livre de Règles",
        description: "Appuyez sur R pour voir et créer des règles",
    },
    {
        id: "hint_create_first_rule",
        content: "Créez votre première règle !",
        description: "Les règles rendent chaque partie unique",
    },
]

export function TutorialHints({
    enabled,
    turnCount,
    turnPhase,
    hasRolledDice,
    rulesCount,
    dismissedHints,
    onDismiss,
}: TutorialHintsProps) {
    // Track shown hints to prevent duplicates
    const shownHintsRef = useRef<Set<string>>(new Set())
    // Store onDismiss in a ref to avoid dependency issues
    const onDismissRef = useRef(onDismiss)
    onDismissRef.current = onDismiss

    const showHint = (hint: TutorialHint) => {
        if (!enabled) return
        if (dismissedHints.includes(hint.id)) return
        if (shownHintsRef.current.has(hint.id)) return

        shownHintsRef.current.add(hint.id)

        toast(hint.content, {
            id: hint.id, // Use stable ID to prevent duplicates
            description: hint.description,
            icon: <Lightbulb className="h-4 w-4 text-yellow-400" />,
            duration: 8000,
            action: {
                label: "Compris",
                onClick: () => {
                    onDismissRef.current(hint.id)
                },
            },
        })
    }

    // Hint: First roll (turn 1, roll phase)
    useEffect(() => {
        if (!enabled) return
        if (turnCount === 1 && turnPhase === "ROLL" && !hasRolledDice) {
            const timer = setTimeout(() => showHint(HINTS[0]), 2000)
            return () => clearTimeout(timer)
        }
    }, [enabled, turnCount, turnPhase, hasRolledDice, dismissedHints])

    // Hint: After move (modify phase)
    useEffect(() => {
        if (!enabled) return
        if (turnCount <= 2 && turnPhase === "MODIFY") {
            const timer = setTimeout(() => showHint(HINTS[1]), 1500)
            return () => clearTimeout(timer)
        }
    }, [enabled, turnCount, turnPhase, dismissedHints])

    // Hint: Open rules (turn 2-3, if no rules created)
    useEffect(() => {
        if (!enabled) return
        if (turnCount >= 2 && turnCount <= 3 && rulesCount === 0 && turnPhase === "ROLL") {
            const timer = setTimeout(() => showHint(HINTS[2]), 3000)
            return () => clearTimeout(timer)
        }
    }, [enabled, turnCount, rulesCount, turnPhase, dismissedHints])

    // Hint: Create first rule (turn 3+, still no rules)
    useEffect(() => {
        if (!enabled) return
        if (turnCount >= 3 && rulesCount === 0 && turnPhase === "MODIFY") {
            const timer = setTimeout(() => showHint(HINTS[3]), 2000)
            return () => clearTimeout(timer)
        }
    }, [enabled, turnCount, rulesCount, turnPhase, dismissedHints])

    // Reset shown hints when tutorial hints are disabled
    useEffect(() => {
        if (!enabled) {
            shownHintsRef.current.clear()
        }
    }, [enabled])

    return null
}

export { HINTS as TUTORIAL_HINT_LIST }
