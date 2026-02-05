"use client"

import { useState } from "react"
import { Sparkles, BookOpen, X } from "lucide-react"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface TutorialWelcomeModalProps {
    open: boolean
    onStartTutorial: () => void
    onSkip: () => void
    onNeverAsk: () => void
}

export function TutorialWelcomeModal({ open, onStartTutorial, onSkip, onNeverAsk }: TutorialWelcomeModalProps) {
    const [neverAskChecked, setNeverAskChecked] = useState(false)

    const handleSkip = () => {
        if (neverAskChecked) {
            onNeverAsk()
        } else {
            onSkip()
        }
    }

    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 sm:max-w-md">
                <AlertDialogHeader className="text-center sm:text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                        <Sparkles className="h-8 w-8 text-cyan-400" />
                    </div>
                    <AlertDialogTitle className="text-2xl font-bold">Bienvenue dans SHIFT !</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground mt-2 text-base">
                        C&apos;est votre première partie. Souhaitez-vous suivre le tutoriel interactif pour apprendre
                        les bases du jeu ?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <div className="flex items-start gap-3 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3">
                        <BookOpen className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />
                        <div className="text-muted-foreground text-sm">
                            <p className="text-foreground mb-1 font-medium">Le tutoriel couvre :</p>
                            <ul className="list-inside list-disc space-y-0.5 text-xs">
                                <li>Lancer le dé et se déplacer</li>
                                <li>Créer et modifier des règles</li>
                                <li>Utiliser les effets spéciaux</li>
                                <li>Les contrôles clavier et manette</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="never-ask"
                            checked={neverAskChecked}
                            onCheckedChange={(checked: boolean) => setNeverAskChecked(checked === true)}
                        />
                        <Label htmlFor="never-ask" className="text-muted-foreground cursor-pointer text-sm">
                            Ne plus me demander
                        </Label>
                    </div>
                </div>

                <AlertDialogFooter className="gap-2 sm:flex-row">
                    <Button
                        variant="ghost"
                        onClick={handleSkip}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Non merci
                    </Button>
                    <Button
                        onClick={onStartTutorial}
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                    >
                        <BookOpen className="mr-2 h-4 w-4" />
                        Oui, montrez-moi
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
