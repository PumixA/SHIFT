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
                "relative rounded-lg border p-4 transition-all",
                "bg-slate-800/50 hover:bg-slate-800",
                isCompleted ? "border-cyan-500/30" : "border-white/10 hover:border-white/20"
            )}
        >
            {isCompleted ? (
                <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 border-cyan-500/30 bg-cyan-500/20 text-cyan-400"
                >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Vu
                </Badge>
            ) : null}

            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        "bg-gradient-to-br",
                        isCompleted
                            ? "border border-cyan-500/30 from-cyan-500/20 to-blue-500/20"
                            : "border border-white/10 from-slate-700 to-slate-600"
                    )}
                >
                    <Icon className={cn("h-5 w-5", isCompleted ? "text-cyan-400" : "text-white/70")} />
                </div>

                <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium">{section.title}</h4>
                    <p className="text-muted-foreground mt-0.5 text-xs">{section.description}</p>
                </div>
            </div>

            <Button
                size="sm"
                variant={isCompleted ? "outline" : "default"}
                className={cn(
                    "mt-3 w-full",
                    !isCompleted && "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                )}
                onClick={onStart}
            >
                <Play className="mr-1 h-3 w-3" />
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
        <div className="space-y-4">
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

            <Separator className="bg-white/10" />

            {/* Full Tutorial */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Tutoriel complet</p>
                    <p className="text-muted-foreground text-xs">Revoir toutes les étapes</p>
                </div>
                <Button variant="outline" size="sm" onClick={onStartFull}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Relancer
                </Button>
            </div>

            <Separator className="bg-white/10" />

            {/* Hints Toggle */}
            <div className="flex items-center justify-between">
                <div>
                    <Label htmlFor="hints-toggle" className="text-sm font-medium">
                        Conseils contextuels
                    </Label>
                    <p className="text-muted-foreground text-xs">Afficher des conseils pendant le jeu</p>
                </div>
                <Switch id="hints-toggle" checked={hintsEnabled} onCheckedChange={onToggleHints} />
            </div>

            {/* Reset Progress */}
            {allCompleted ? (
                <>
                    <Separator className="bg-white/10" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground w-full"
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
