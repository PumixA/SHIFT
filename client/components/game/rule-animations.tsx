"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Star, Shield, Flame, Snowflake, Sparkles, ArrowRight, RotateCcw, Plus, Minus, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

export interface RuleAnimationEvent {
  id: string
  ruleName: string
  ruleType: string
  triggerType: string
  actionType: string
  playerName: string
  playerColor: string
  details?: Record<string, any>
  position?: { x: number; y: number }
}

interface RuleAnimationsProps {
  className?: string
  onAnimationComplete?: (id: string) => void
}

// Animation configurations based on action type
const ANIMATION_CONFIGS: Record<string, {
  icon: React.ElementType
  color: string
  bgColor: string
  particles: number
  duration: number
}> = {
  MODIFY_SCORE: {
    icon: Star,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    particles: 8,
    duration: 2000,
  },
  MOVE_RELATIVE: {
    icon: ArrowRight,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    particles: 5,
    duration: 1500,
  },
  TELEPORT: {
    icon: Sparkles,
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
    particles: 12,
    duration: 2500,
  },
  BACK_TO_START: {
    icon: RotateCcw,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    particles: 6,
    duration: 2000,
  },
  APPLY_SHIELD: {
    icon: Shield,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    particles: 10,
    duration: 2000,
  },
  APPLY_DOUBLE_DICE: {
    icon: Zap,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    particles: 8,
    duration: 2000,
  },
  EXTRA_TURN: {
    icon: Plus,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    particles: 6,
    duration: 1500,
  },
  SKIP_TURN: {
    icon: Minus,
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
    particles: 4,
    duration: 1500,
  },
  APPLY_SPEED_BOOST: {
    icon: Flame,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    particles: 10,
    duration: 2000,
  },
  APPLY_SLOW: {
    icon: Snowflake,
    color: "text-blue-300",
    bgColor: "bg-blue-300/20",
    particles: 8,
    duration: 2000,
  },
  DEFAULT: {
    icon: Zap,
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
    particles: 6,
    duration: 1500,
  },
}

// Single animation component
function RuleAnimation({
  event,
  onComplete,
}: {
  event: RuleAnimationEvent
  onComplete: () => void
}) {
  const config = ANIMATION_CONFIGS[event.actionType] || ANIMATION_CONFIGS.DEFAULT
  const Icon = config.icon

  useEffect(() => {
    const timer = setTimeout(onComplete, config.duration)
    return () => clearTimeout(timer)
  }, [config.duration, onComplete])

  // Generate random particles
  const particles = Array.from({ length: config.particles }, (_, i) => ({
    id: i,
    angle: (i / config.particles) * 360,
    delay: i * 0.05,
    distance: 40 + Math.random() * 30,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
    >
      {/* Dark overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black"
      />

      {/* Main animation container */}
      <motion.div
        className="relative flex flex-col items-center"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 12 }}
      >
        {/* Icon with glow */}
        <motion.div
          className={cn(
            "relative w-24 h-24 rounded-full flex items-center justify-center",
            config.bgColor
          )}
          animate={{
            scale: [1, 1.2, 1],
            boxShadow: [
              `0 0 0 0 ${config.color.replace('text-', 'rgba(').replace('-400', ', 0.5)')}`,
              `0 0 40px 20px ${config.color.replace('text-', 'rgba(').replace('-400', ', 0.3)')}`,
              `0 0 0 0 ${config.color.replace('text-', 'rgba(').replace('-400', ', 0)')}`,
            ],
          }}
          transition={{ duration: 0.8, repeat: 2 }}
        >
          <Icon className={cn("w-12 h-12", config.color)} />
        </motion.div>

        {/* Particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={cn("absolute w-2 h-2 rounded-full", config.bgColor)}
            style={{
              top: "50%",
              left: "50%",
            }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{
              x: Math.cos((particle.angle * Math.PI) / 180) * particle.distance,
              y: Math.sin((particle.angle * Math.PI) / 180) * particle.distance,
              opacity: 0,
              scale: [1, 1.5, 0],
            }}
            transition={{
              duration: 1,
              delay: particle.delay,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Rule name */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.h3
            className={cn("text-2xl font-black uppercase tracking-wider", config.color)}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.5, repeat: 2 }}
          >
            {event.ruleName}
          </motion.h3>
          <p className="text-white/70 text-sm mt-1">
            Déclenché pour <span className="font-bold">{event.playerName}</span>
          </p>
        </motion.div>

        {/* Details badges */}
        {event.details && (
          <motion.div
            className="flex gap-2 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {event.details.scoreChange !== undefined && (
              <motion.div
                className={cn(
                  "px-4 py-2 rounded-full font-bold text-lg",
                  event.details.scoreChange > 0
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                )}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3, repeat: 3 }}
              >
                {event.details.scoreChange > 0 ? '+' : ''}{event.details.scoreChange} points
              </motion.div>
            )}
            {event.details.movement !== undefined && (
              <motion.div
                className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 font-bold text-lg"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 0.3, repeat: 3 }}
              >
                {event.details.movement > 0 ? '+' : ''}{event.details.movement} cases
              </motion.div>
            )}
            {event.details.turnsRemaining !== undefined && (
              <div className="px-4 py-2 rounded-full bg-violet-500/20 text-violet-400 font-bold text-lg">
                {event.details.turnsRemaining} tours
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

// Toast-style mini animation
function MiniRuleAnimation({
  event,
  onComplete,
}: {
  event: RuleAnimationEvent
  onComplete: () => void
}) {
  const config = ANIMATION_CONFIGS[event.actionType] || ANIMATION_CONFIGS.DEFAULT
  const Icon = config.icon

  useEffect(() => {
    const timer = setTimeout(onComplete, 3000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm",
        config.bgColor,
        "border-white/10"
      )}
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.5, repeat: 2 }}
      >
        <Icon className={cn("w-6 h-6", config.color)} />
      </motion.div>
      <div>
        <p className={cn("font-bold text-sm", config.color)}>{event.ruleName}</p>
        <p className="text-xs text-white/60">{event.playerName}</p>
      </div>
      {event.details?.scoreChange !== undefined && (
        <motion.span
          className={cn(
            "ml-auto font-bold",
            event.details.scoreChange > 0 ? "text-green-400" : "text-red-400"
          )}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.3 }}
        >
          {event.details.scoreChange > 0 ? '+' : ''}{event.details.scoreChange}
        </motion.span>
      )}
    </motion.div>
  )
}

// Main component with queue management
export function RuleAnimations({ className, onAnimationComplete }: RuleAnimationsProps) {
  const [queue, setQueue] = useState<RuleAnimationEvent[]>([])
  const [currentAnimation, setCurrentAnimation] = useState<RuleAnimationEvent | null>(null)
  const [miniAnimations, setMiniAnimations] = useState<RuleAnimationEvent[]>([])
  const [animationMode, setAnimationMode] = useState<"full" | "mini">("mini")

  // Add event to queue
  const addAnimation = useCallback((event: RuleAnimationEvent) => {
    if (animationMode === "full") {
      setQueue(prev => [...prev, event])
    } else {
      setMiniAnimations(prev => [...prev.slice(-4), event])
    }
  }, [animationMode])

  // Process queue for full animations
  useEffect(() => {
    if (!currentAnimation && queue.length > 0) {
      setCurrentAnimation(queue[0])
      setQueue(prev => prev.slice(1))
    }
  }, [currentAnimation, queue])

  const handleAnimationComplete = useCallback(() => {
    if (currentAnimation) {
      onAnimationComplete?.(currentAnimation.id)
    }
    setCurrentAnimation(null)
  }, [currentAnimation, onAnimationComplete])

  const handleMiniComplete = useCallback((id: string) => {
    setMiniAnimations(prev => prev.filter(a => a.id !== id))
    onAnimationComplete?.(id)
  }, [onAnimationComplete])

  // Expose addAnimation for external use
  useEffect(() => {
    (window as any).__addRuleAnimation = addAnimation
    return () => {
      delete (window as any).__addRuleAnimation
    }
  }, [addAnimation])

  return (
    <>
      {/* Full-screen animations */}
      <AnimatePresence>
        {currentAnimation && animationMode === "full" && (
          <RuleAnimation
            event={currentAnimation}
            onComplete={handleAnimationComplete}
          />
        )}
      </AnimatePresence>

      {/* Mini toast animations */}
      <div className={cn(
        "fixed top-4 right-4 z-50 flex flex-col gap-2 w-80",
        className
      )}>
        <AnimatePresence mode="popLayout">
          {miniAnimations.map((event) => (
            <MiniRuleAnimation
              key={event.id}
              event={event}
              onComplete={() => handleMiniComplete(event.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}

// Hook to trigger animations
export function useRuleAnimations() {
  const triggerAnimation = useCallback((event: RuleAnimationEvent) => {
    const addFn = (window as any).__addRuleAnimation
    if (addFn) {
      addFn(event)
    }
  }, [])

  return { triggerAnimation }
}
