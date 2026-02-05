export type ParticleType = "confetti" | "sparkle" | "explosion" | "trail" | "glow" | "cyber"

export interface Particle {
    id: string
    x: number
    y: number
    vx: number
    vy: number
    size: number
    color: string
    opacity: number
    rotation: number
    rotationSpeed: number
    life: number
    maxLife: number
    type: ParticleType
}

export interface ParticleConfig {
    count?: number
    colors?: string[]
    size?: { min: number; max: number }
    speed?: { min: number; max: number }
    life?: { min: number; max: number }
    gravity?: number
    friction?: number
    spread?: number
}

const DEFAULT_COLORS = {
    confetti: ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#f43f5e"],
    sparkle: ["#ffffff", "#fef08a", "#fde047"],
    explosion: ["#f97316", "#ef4444", "#fbbf24"],
    trail: ["#06b6d4", "#8b5cf6"],
    glow: ["#06b6d4", "#22d3ee"],
    cyber: ["#06b6d4", "#8b5cf6", "#22d3ee", "#a855f7"],
}

export class ParticleSystem {
    private particles: Particle[] = []
    private canvas: HTMLCanvasElement | null = null
    private ctx: CanvasRenderingContext2D | null = null
    private animationFrame: number | null = null
    private isRunning = false

    constructor(canvas?: HTMLCanvasElement) {
        if (canvas) {
            this.setCanvas(canvas)
        }
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.ctx = canvas.getContext("2d")
    }

    private createParticle(x: number, y: number, type: ParticleType, config: ParticleConfig = {}): Particle {
        const colors = config.colors || DEFAULT_COLORS[type]
        const size = config.size || { min: 4, max: 12 }
        const speed = config.speed || { min: 2, max: 8 }
        const life = config.life || { min: 30, max: 60 }
        const spread = config.spread || Math.PI * 2

        const angle = Math.random() * spread - spread / 2 - Math.PI / 2
        const velocity = speed.min + Math.random() * (speed.max - speed.min)

        return {
            id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            x,
            y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            size: size.min + Math.random() * (size.max - size.min),
            color: colors[Math.floor(Math.random() * colors.length)],
            opacity: 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            life: life.min + Math.random() * (life.max - life.min),
            maxLife: life.max,
            type,
        }
    }

    emit(x: number, y: number, type: ParticleType, config: ParticleConfig = {}) {
        const count = config.count || 20
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(x, y, type, config))
        }

        if (!this.isRunning) {
            this.start()
        }
    }

    confetti(x: number, y: number, config?: ParticleConfig) {
        this.emit(x, y, "confetti", {
            count: 50,
            size: { min: 6, max: 14 },
            speed: { min: 4, max: 12 },
            life: { min: 60, max: 120 },
            gravity: 0.15,
            ...config,
        })
    }

    sparkle(x: number, y: number, config?: ParticleConfig) {
        this.emit(x, y, "sparkle", {
            count: 15,
            size: { min: 2, max: 6 },
            speed: { min: 1, max: 3 },
            life: { min: 20, max: 40 },
            ...config,
        })
    }

    explosion(x: number, y: number, config?: ParticleConfig) {
        this.emit(x, y, "explosion", {
            count: 30,
            size: { min: 4, max: 10 },
            speed: { min: 5, max: 15 },
            life: { min: 20, max: 50 },
            ...config,
        })
    }

    trail(x: number, y: number, config?: ParticleConfig) {
        this.emit(x, y, "trail", {
            count: 3,
            size: { min: 3, max: 8 },
            speed: { min: 0.5, max: 2 },
            life: { min: 15, max: 30 },
            spread: Math.PI / 4,
            ...config,
        })
    }

    cyberBurst(x: number, y: number, config?: ParticleConfig) {
        this.emit(x, y, "cyber", {
            count: 25,
            size: { min: 2, max: 8 },
            speed: { min: 3, max: 10 },
            life: { min: 30, max: 60 },
            ...config,
        })
    }

    private update(config: ParticleConfig = {}) {
        const gravity = config.gravity ?? 0.1
        const friction = config.friction ?? 0.99

        this.particles = this.particles.filter((p) => {
            p.life -= 1
            if (p.life <= 0) return false

            p.vy += gravity
            p.vx *= friction
            p.vy *= friction

            p.x += p.vx
            p.y += p.vy
            p.rotation += p.rotationSpeed
            p.opacity = p.life / p.maxLife

            return true
        })
    }

    private draw() {
        if (!this.ctx || !this.canvas) return

        for (const p of this.particles) {
            this.ctx.save()
            this.ctx.translate(p.x, p.y)
            this.ctx.rotate(p.rotation)
            this.ctx.globalAlpha = p.opacity

            switch (p.type) {
                case "confetti":
                    this.drawConfetti(p)
                    break
                case "sparkle":
                    this.drawSparkle(p)
                    break
                case "explosion":
                    this.drawExplosion(p)
                    break
                case "trail":
                    this.drawTrail(p)
                    break
                case "glow":
                    this.drawGlow(p)
                    break
                case "cyber":
                    this.drawCyber(p)
                    break
            }

            this.ctx.restore()
        }
    }

    private drawConfetti(p: Particle) {
        if (!this.ctx) return
        this.ctx.fillStyle = p.color
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
    }

    private drawSparkle(p: Particle) {
        if (!this.ctx) return
        this.ctx.fillStyle = p.color
        this.ctx.beginPath()
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2
            const x = Math.cos(angle) * p.size
            const y = Math.sin(angle) * p.size
            if (i === 0) this.ctx.moveTo(x, y)
            else this.ctx.lineTo(x, y)
            const innerAngle = angle + Math.PI / 4
            const innerX = Math.cos(innerAngle) * p.size * 0.3
            const innerY = Math.sin(innerAngle) * p.size * 0.3
            this.ctx.lineTo(innerX, innerY)
        }
        this.ctx.closePath()
        this.ctx.fill()
    }

    private drawExplosion(p: Particle) {
        if (!this.ctx) return
        this.ctx.fillStyle = p.color
        this.ctx.beginPath()
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        this.ctx.fill()
    }

    private drawTrail(p: Particle) {
        if (!this.ctx) return
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, p.size)
        gradient.addColorStop(0, p.color)
        gradient.addColorStop(1, "transparent")
        this.ctx.fillStyle = gradient
        this.ctx.beginPath()
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        this.ctx.fill()
    }

    private drawGlow(p: Particle) {
        if (!this.ctx) return
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2)
        gradient.addColorStop(0, p.color)
        gradient.addColorStop(0.5, p.color + "80")
        gradient.addColorStop(1, "transparent")
        this.ctx.fillStyle = gradient
        this.ctx.beginPath()
        this.ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2)
        this.ctx.fill()
    }

    private drawCyber(p: Particle) {
        if (!this.ctx) return
        // Draw a hexagon
        this.ctx.strokeStyle = p.color
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2
            const x = Math.cos(angle) * p.size
            const y = Math.sin(angle) * p.size
            if (i === 0) this.ctx.moveTo(x, y)
            else this.ctx.lineTo(x, y)
        }
        this.ctx.closePath()
        this.ctx.stroke()
    }

    private render = () => {
        if (!this.isRunning) return

        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        }

        this.update()
        this.draw()

        if (this.particles.length > 0) {
            this.animationFrame = requestAnimationFrame(this.render)
        } else {
            this.stop()
        }
    }

    start() {
        if (this.isRunning) return
        this.isRunning = true
        this.render()
    }

    stop() {
        this.isRunning = false
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame)
            this.animationFrame = null
        }
    }

    clear() {
        this.particles = []
        this.stop()
    }

    destroy() {
        this.clear()
        this.canvas = null
        this.ctx = null
    }
}

// Singleton for global particle effects
let globalParticleSystem: ParticleSystem | null = null

export function getParticleSystem(): ParticleSystem {
    if (!globalParticleSystem) {
        globalParticleSystem = new ParticleSystem()
    }
    return globalParticleSystem
}

export function initParticleSystem(canvas: HTMLCanvasElement): ParticleSystem {
    const system = getParticleSystem()
    system.setCanvas(canvas)
    return system
}
