"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronRight,
  ChevronLeft,
  X,
  Dice5,
  Footprints,
  Book,
  Grid,
  Zap,
  Trophy,
  MousePointer,
  Gamepad2,
  HelpCircle,
  CheckCircle2,
  SkipForward
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface TutorialStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  highlight?: string // CSS selector or element ID to highlight
  position?: "center" | "top" | "bottom" | "left" | "right"
  action?: "click" | "drag" | "hover" | "wait"
  targetElement?: string
  tip?: string
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Bienvenue dans SHIFT !",
    description: "SHIFT est un jeu de plateau avec des règles dynamiques. Chaque partie est unique grâce aux règles que vous créez et modifiez en cours de jeu.",
    icon: Trophy,
    position: "center",
  },
  {
    id: "dice",
    title: "Lancer le dé",
    description: "Cliquez sur le dé ou appuyez sur Espace pour le lancer. Votre pion avancera du nombre de cases indiqué.",
    icon: Dice5,
    highlight: "[data-tutorial='dice']",
    position: "bottom",
    action: "click",
    tip: "Astuce: Avec une manette, utilisez le bouton A/X",
  },
  {
    id: "movement",
    title: "Déplacement",
    description: "Votre pion se déplace automatiquement sur le plateau. Observez les cases spéciales qui peuvent déclencher des effets !",
    icon: Footprints,
    highlight: "[data-tutorial='board']",
    position: "left",
    action: "wait",
  },
  {
    id: "rules",
    title: "Les règles dynamiques",
    description: "C'est ce qui rend SHIFT unique ! Les règles définissent ce qui se passe quand vous atterrissez sur une case, passez dessus, ou atteignez certains scores.",
    icon: Book,
    highlight: "[data-tutorial='rules']",
    position: "left",
    tip: "Ouvrez le Livre de Règles pour voir et modifier les règles actives",
  },
  {
    id: "triggers",
    title: "Déclencheurs de règles",
    description: "Chaque règle a un déclencheur : 'Quand un joueur atterrit sur une case', 'Quand il lance un 6', etc. Les conditions peuvent être très variées !",
    icon: Zap,
    position: "center",
  },
  {
    id: "create-rule",
    title: "Créer une règle",
    description: "Après avoir joué, vous pouvez créer une nouvelle règle ! Choisissez un déclencheur, ajoutez des conditions, puis définissez les effets.",
    icon: Book,
    highlight: "[data-tutorial='add-rule']",
    position: "right",
    action: "click",
    tip: "Une seule modification par tour : règle OU case",
  },
  {
    id: "tiles",
    title: "Modifier le plateau",
    description: "Clic droit sur une case pour voir les options. Vous pouvez ajouter des cases dans toutes les directions ou supprimer des cases existantes.",
    icon: Grid,
    highlight: "[data-tutorial='board']",
    position: "left",
    action: "click",
    tip: "Le plateau peut grandir dans toutes les directions !",
  },
  {
    id: "effects",
    title: "Effets temporaires",
    description: "Certaines règles appliquent des effets qui durent plusieurs tours : bouclier, double dé, ralentissement... Surveillez vos effets actifs !",
    icon: Zap,
    highlight: "[data-tutorial='effects']",
    position: "bottom",
  },
  {
    id: "victory",
    title: "Objectif",
    description: "Le premier joueur à atteindre la dernière case ET avoir le plus de points gagne ! Les règles peuvent changer les conditions de victoire...",
    icon: Trophy,
    position: "center",
  },
  {
    id: "controls",
    title: "Contrôles",
    description: "Clavier: Espace = dé, Flèches = navigation, R = règles. Manette: A = dé, Joystick = navigation, Y = règles.",
    icon: Gamepad2,
    position: "center",
    tip: "Tout est jouable au clavier et à la manette !",
  },
  {
    id: "complete",
    title: "Vous êtes prêt !",
    description: "Bonne chance ! N'oubliez pas : dans SHIFT, les règles sont faites pour être changées. Soyez créatif et amusez-vous !",
    icon: CheckCircle2,
    position: "center",
  },
]

interface InteractiveTutorialProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  startStep?: number
}

export function InteractiveTutorial({
  isOpen,
  onClose,
  onComplete,
  startStep = 0,
}: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(startStep)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)

  const step = TUTORIAL_STEPS[currentStep]
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1
  const isFirstStep = currentStep === 0

  // Highlight element when step changes
  useEffect(() => {
    if (step.highlight) {
      const element = document.querySelector(step.highlight) as HTMLElement
      if (element) {
        setHighlightedElement(element)
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      } else {
        setHighlightedElement(null)
      }
    } else {
      setHighlightedElement(null)
    }
  }, [step])

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete()
      onClose()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }, [isLastStep, onComplete, onClose])

  const handlePrev = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }, [isFirstStep])

  const handleSkip = useCallback(() => {
    onClose()
  }, [onClose])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        handleNext()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        handlePrev()
      } else if (e.key === "Escape") {
        e.preventDefault()
        handleSkip()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, handleNext, handlePrev, handleSkip])

  if (!isOpen) return null

  const Icon = step.icon

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!highlightedElement || step.position === "center") {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
    }

    const rect = highlightedElement.getBoundingClientRect()
    const positions: Record<string, React.CSSProperties> = {
      top: {
        bottom: `calc(100% - ${rect.top - 20}px)`,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
      },
      bottom: {
        top: rect.bottom + 20,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
      },
      left: {
        top: rect.top + rect.height / 2,
        right: `calc(100% - ${rect.left - 20}px)`,
        transform: "translateY(-50%)",
      },
      right: {
        top: rect.top + rect.height / 2,
        left: rect.right + 20,
        transform: "translateY(-50%)",
      },
    }

    return positions[step.position || "bottom"] || positions.bottom
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Backdrop with cutout */}
        <div className="absolute inset-0">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/80" />

          {/* Highlight cutout */}
          {highlightedElement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute pointer-events-none"
              style={{
                top: highlightedElement.getBoundingClientRect().top - 8,
                left: highlightedElement.getBoundingClientRect().left - 8,
                width: highlightedElement.getBoundingClientRect().width + 16,
                height: highlightedElement.getBoundingClientRect().height + 16,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.8)",
                borderRadius: "12px",
                border: "2px solid rgba(34, 211, 238, 0.5)",
              }}
            >
              {/* Pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-cyan-400"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          )}
        </div>

        {/* Tutorial card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={cn(
            "absolute z-10 w-[400px] max-w-[90vw]",
            "bg-gradient-to-br from-slate-900 to-slate-800",
            "border border-white/10 rounded-2xl shadow-2xl"
          )}
          style={getTooltipPosition()}
        >
          {/* Progress bar */}
          <div className="px-6 pt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Étape {currentStep + 1} / {TUTORIAL_STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br from-cyan-500/20 to-blue-500/20",
                "border border-cyan-500/30"
              )}>
                <Icon className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Action indicator */}
            {step.action && (
              <motion.div
                className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <MousePointer className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-400">
                  {step.action === "click" && "Cliquez sur l'élément en surbrillance"}
                  {step.action === "drag" && "Glissez-déposez l'élément"}
                  {step.action === "hover" && "Survolez l'élément"}
                  {step.action === "wait" && "Observez l'animation"}
                </span>
              </motion.div>
            )}

            {/* Tip */}
            {step.tip && (
              <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <HelpCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-yellow-400/80">{step.tip}</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-white"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Passer
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={isFirstStep}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
              >
                {isLastStep ? (
                  <>
                    Terminer
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1 pb-4">
            {TUTORIAL_STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentStep
                    ? "bg-cyan-400 w-4"
                    : index < currentStep
                    ? "bg-cyan-400/50"
                    : "bg-white/20"
                )}
              />
            ))}
          </div>
        </motion.div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSkip}
          className="fixed top-4 right-4 z-20 text-white/50 hover:text-white"
        >
          <X className="w-6 h-6" />
        </Button>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook to manage tutorial state
export function useTutorial() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)

  useEffect(() => {
    // Check if tutorial has been completed before
    const completed = localStorage.getItem("shift_tutorial_completed")
    if (completed) {
      setHasCompleted(true)
    }
  }, [])

  const startTutorial = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeTutorial = useCallback(() => {
    setIsOpen(false)
  }, [])

  const completeTutorial = useCallback(() => {
    setHasCompleted(true)
    localStorage.setItem("shift_tutorial_completed", "true")
    setIsOpen(false)
  }, [])

  const resetTutorial = useCallback(() => {
    setHasCompleted(false)
    localStorage.removeItem("shift_tutorial_completed")
  }, [])

  return {
    isOpen,
    hasCompleted,
    startTutorial,
    closeTutorial,
    completeTutorial,
    resetTutorial,
  }
}

// Quick help tooltips for specific elements
export function TutorialTooltip({
  children,
  content,
  show = true,
}: {
  children: React.ReactNode
  content: string
  show?: boolean
}) {
  const [isVisible, setIsVisible] = useState(false)

  if (!show) return <>{children}</>

  return (
    <div className="relative" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white/80 whitespace-nowrap"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
