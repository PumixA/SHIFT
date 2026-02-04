"use client"

import { useRef, useEffect, useImperativeHandle, forwardRef } from "react"
import { ParticleSystem, ParticleType, ParticleConfig } from "@/lib/particles"

export interface ParticleCanvasRef {
  emit: (x: number, y: number, type: ParticleType, config?: ParticleConfig) => void
  confetti: (x: number, y: number, config?: ParticleConfig) => void
  sparkle: (x: number, y: number, config?: ParticleConfig) => void
  explosion: (x: number, y: number, config?: ParticleConfig) => void
  trail: (x: number, y: number, config?: ParticleConfig) => void
  cyberBurst: (x: number, y: number, config?: ParticleConfig) => void
  clear: () => void
}

interface ParticleCanvasProps {
  className?: string
}

export const ParticleCanvas = forwardRef<ParticleCanvasRef, ParticleCanvasProps>(
  ({ className = "" }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const systemRef = useRef<ParticleSystem | null>(null)

    useEffect(() => {
      if (!canvasRef.current) return

      const canvas = canvasRef.current
      const handleResize = () => {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
      }

      handleResize()
      window.addEventListener("resize", handleResize)

      systemRef.current = new ParticleSystem(canvas)

      return () => {
        window.removeEventListener("resize", handleResize)
        systemRef.current?.destroy()
      }
    }, [])

    useImperativeHandle(ref, () => ({
      emit: (x, y, type, config) => {
        systemRef.current?.emit(x, y, type, config)
      },
      confetti: (x, y, config) => {
        systemRef.current?.confetti(x, y, config)
      },
      sparkle: (x, y, config) => {
        systemRef.current?.sparkle(x, y, config)
      },
      explosion: (x, y, config) => {
        systemRef.current?.explosion(x, y, config)
      },
      trail: (x, y, config) => {
        systemRef.current?.trail(x, y, config)
      },
      cyberBurst: (x, y, config) => {
        systemRef.current?.cyberBurst(x, y, config)
      },
      clear: () => {
        systemRef.current?.clear()
      },
    }))

    return (
      <canvas
        ref={canvasRef}
        className={`pointer-events-none absolute inset-0 z-50 ${className}`}
      />
    )
  }
)

ParticleCanvas.displayName = "ParticleCanvas"
