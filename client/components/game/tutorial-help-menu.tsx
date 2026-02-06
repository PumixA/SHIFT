"use client"

import { BookOpen, RotateCcw, Play, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { TUTORIAL_SECTIONS, type TutorialSection, type TutorialSectionInfo } from "./interactive-tutorial"

interface TutorialHelpMenuProps {
    completedSections: string[]
    hintsEnabled: boolean
    onStartSection: (section: TutorialSection) => void
    onStartFull: () => void
    onReset: () => void
    onToggleHints: (enabled: boolean) => void
}

function SectionCard({
    section,
    isCompleted,
    onStart,
}: {
    section: TutorialSectionInfo
    isCompleted: boolean
    onStart: () => void
}) {
    const Icon = section.icon

    return (
        <div
            className={cn(
                "group relative rounded-2xl border p-4 transition-all duration-200",
                "bg-white/[0.03] hover:bg-white/[0.06]",
                isCompleted ? "border-cyan-500/20" : "border-white/[0.06] hover:border-white/10"
            )}
        >
            {isCompleted ? (
                <div className="absolute -top-2 -right-2 flex h-6 items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/20 px-2 text-[10px] font-medium text-cyan-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Vu
                </div>
            ) : null}

            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                        isCompleted
                            ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/10 shadow-lg shadow-cyan-500/10"
                            : "bg-white/5 group-hover:bg-white/10"
                    )}
                >
                    <Icon className={cn("h-5 w-5", isCompleted ? "text-cyan-400" : "text-white/60")} />
                </div>

                <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-white/90">{section.title}</h4>
                    <p className="mt-0.5 text-xs text-white/50">{section.description}</p>
                </div>
            </div>

            <Button
                size="sm"
                variant={isCompleted ? "outline" : "default"}
                className={cn(
                    "mt-4 h-9 w-full rounded-xl text-xs font-medium",
                    isCompleted
                        ? "border-white/10 bg-white/5 hover:bg-white/10"
                        : "bg-gradient-to-r from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/20 hover:from-cyan-500 hover:to-blue-500"
                )}
                onClick={onStart}
            >
                <Play className="mr-1.5 h-3 w-3" />
                {isCompleted ? "Revoir" : "Commencer"}
            </Button>
        </div>
    )
}

export function TutorialHelpMenu({
    completedSections,
    hintsEnabled,
    onStartSection,
    onStartFull,
    onReset,
    onToggleHints,
}: TutorialHelpMenuProps) {
    const sections = Object.values(TUTORIAL_SECTIONS)
    const allCompleted = sections.every((s) => completedSections.includes(s.id))

    return (
        <div className="space-y-5">
            {/* Section Grid */}
            <div className="grid grid-cols-2 gap-3">
                {sections.map((section) => (
                    <SectionCard
                        key={section.id}
                        section={section}
                        isCompleted={completedSections.includes(section.id)}
                        onStart={() => onStartSection(section.id)}
                    />
                ))}
            </div>

            <div className="h-px bg-white/[0.06]" />

            {/* Full Tutorial */}
            <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
                <div>
                    <p className="text-sm font-medium text-white/90">Tutoriel complet</p>
                    <p className="text-xs text-white/50">Revoir toutes les étapes</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-lg border-white/10 bg-white/5 hover:bg-white/10"
                    onClick={onStartFull}
                >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Relancer
                </Button>
            </div>

            <div className="h-px bg-white/[0.06]" />

            {/* Hints Toggle */}
            <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
                <div>
                    <Label htmlFor="hints-toggle" className="text-sm font-medium text-white/90">
                        Conseils contextuels
                    </Label>
                    <p className="text-xs text-white/50">Afficher des conseils pendant le jeu</p>
                </div>
                <Switch id="hints-toggle" checked={hintsEnabled} onCheckedChange={onToggleHints} />
            </div>

            {/* Reset Progress */}
            {allCompleted ? (
                <>
                    <div className="h-px bg-white/[0.06]" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-full rounded-lg text-white/50 hover:bg-white/5 hover:text-white/70"
                        onClick={onReset}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Réinitialiser la progression
                    </Button>
                </>
            ) : null}
        </div>
    )
}
