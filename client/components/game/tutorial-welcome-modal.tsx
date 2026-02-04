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

export function TutorialWelcomeModal({
  open,
  onStartTutorial,
  onSkip,
  onNeverAsk,
}: TutorialWelcomeModalProps) {
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
      <AlertDialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-white/10">
        <AlertDialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-cyan-400" />
          </div>
          <AlertDialogTitle className="text-2xl font-bold">
            Bienvenue dans SHIFT !
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-muted-foreground mt-2">
            C&apos;est votre première partie. Souhaitez-vous suivre le tutoriel
            interactif pour apprendre les bases du jeu ?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <BookOpen className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
                Le tutoriel couvre :
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
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
              onCheckedChange={(checked) => setNeverAskChecked(checked === true)}
            />
            <Label
              htmlFor="never-ask"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Ne plus me demander
            </Label>
          </div>
        </div>

        <AlertDialogFooter className="sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-2" />
            Non merci
          </Button>
          <Button
            onClick={onStartTutorial}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Oui, montrez-moi
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
