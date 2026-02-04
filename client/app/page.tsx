"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Gamepad2, Users, Settings, BookOpen, User, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

export default function HomePage() {
    const router = useRouter()
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [username, setUsername] = useState<string | null>(null)

    const menuItems = [
        {
            id: "play",
            label: "JOUER",
            icon: Gamepad2,
            href: "/play",
            description: "Créer ou rejoindre une partie",
            gradient: "from-cyan-500 to-blue-600",
            glowColor: "cyan",
        },
        {
            id: "friends",
            label: "AMIS",
            icon: Users,
            href: "/friends",
            description: "Gérer vos amis et invitations",
            gradient: "from-violet-500 to-purple-600",
            glowColor: "violet",
        },
        {
            id: "options",
            label: "OPTIONS",
            icon: Settings,
            href: "/options",
            description: "Paramètres du jeu",
            gradient: "from-orange-500 to-red-600",
            glowColor: "orange",
        },
        {
            id: "rulesets",
            label: "SETS DE RÈGLES",
            icon: BookOpen,
            href: "/rulesets",
            description: "Créer et gérer vos presets",
            gradient: "from-green-500 to-emerald-600",
            glowColor: "green",
        },
    ]

    // Generate particle positions client-side only to avoid hydration mismatch
    const [particles, setParticles] = useState<Array<{ x: number; y: number; duration: number; delay: number }>>([])

    useEffect(() => {
        // Generate random positions only on client mount
        const newParticles = [...Array(20)].map(() => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 2,
        }))
        setParticles(newParticles)
    }, [])

    useEffect(() => {
        const storedUsername = localStorage.getItem("username")
        if (storedUsername) {
            setUsername(storedUsername)
        }
    }, [])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowUp") {
                e.preventDefault()
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : menuItems.length - 1))
            } else if (e.key === "ArrowDown") {
                e.preventDefault()
                setSelectedIndex((prev) => (prev < menuItems.length - 1 ? prev + 1 : 0))
            } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                router.push(menuItems[selectedIndex].href)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [selectedIndex, router, menuItems])

    return (
        <div className="bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
            {/* Background Effects */}
            <div className="via-background to-background absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20" />
            <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

            {/* Animated Background Grid */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Floating particles effect - rendered client-side only */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {particles.map((particle, i) => (
                    <motion.div
                        key={i}
                        className="absolute h-1 w-1 rounded-full bg-cyan-500/30"
                        initial={{
                            x: particle.x,
                            y: particle.y,
                        }}
                        animate={{
                            y: [null, -20, 20],
                            opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                            duration: particle.duration,
                            repeat: Infinity,
                            repeatType: "reverse",
                            delay: particle.delay,
                        }}
                    />
                ))}
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-lg space-y-12">
                {/* Logo & Title */}
                <motion.div
                    className="space-y-4 text-center"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="mb-4 flex items-center justify-center gap-3">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        >
                            <Gamepad2 className="h-10 w-10 text-cyan-500" />
                        </motion.div>
                    </div>
                    <h1 className="bg-gradient-to-r from-cyan-400 via-white to-violet-400 bg-clip-text text-6xl font-black tracking-tighter text-transparent italic drop-shadow-2xl md:text-8xl">
                        SHIFT
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase md:text-base">
                        Le jeu où les règles changent
                    </p>
                </motion.div>

                {/* Menu Items */}
                <motion.nav
                    className="space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    {menuItems.map((item, index) => {
                        const Icon = item.icon
                        const isSelected = selectedIndex === index

                        return (
                            <Link key={item.id} href={item.href}>
                                <motion.div
                                    className={`group relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 md:p-5 ${
                                        isSelected
                                            ? `border-${item.glowColor}-500/50 bg-white/5`
                                            : "border-white/5 bg-white/[0.02] hover:border-white/10"
                                    } `}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    whileHover={{ x: 8 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {/* Glow effect on selection */}
                                    {isSelected ? (
                                        <motion.div
                                            className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.gradient} opacity-10`}
                                            layoutId="menuGlow"
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    ) : null}

                                    <div className="relative z-10 flex items-center gap-4">
                                        {/* Icon */}
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-200 ${
                                                isSelected
                                                    ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                                                    : "bg-white/5"
                                            } `}
                                        >
                                            <Icon
                                                className={`h-6 w-6 ${isSelected ? "text-white" : "text-muted-foreground"}`}
                                            />
                                        </div>

                                        {/* Text */}
                                        <div className="flex-1">
                                            <h2
                                                className={`text-xl font-black tracking-tight transition-colors duration-200 md:text-2xl ${isSelected ? "text-white" : "text-muted-foreground"} `}
                                            >
                                                {item.label}
                                            </h2>
                                            <p
                                                className={`text-xs transition-colors duration-200 ${isSelected ? "text-white/60" : "text-muted-foreground/50"} `}
                                            >
                                                {item.description}
                                            </p>
                                        </div>

                                        {/* Arrow */}
                                        <ChevronRight
                                            className={`h-6 w-6 transition-all duration-200 ${isSelected ? "translate-x-0 text-white opacity-100" : "text-muted-foreground -translate-x-2 opacity-0"} `}
                                        />
                                    </div>
                                </motion.div>
                            </Link>
                        )
                    })}
                </motion.nav>

                {/* Profile Quick Access */}
                <motion.div
                    className="flex items-center justify-between pt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <Link href="/profile">
                        <div className="group flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2 transition-colors hover:bg-white/5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white/80 transition-colors group-hover:text-white">
                                    {username || "Profil"}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {username ? "Voir le profil" : "Se connecter"}
                                </p>
                            </div>
                        </div>
                    </Link>

                    <div className="text-muted-foreground/30 font-mono text-xs">v1.0.0</div>
                </motion.div>

                {/* Keyboard hint */}
                <motion.div
                    className="text-muted-foreground/30 text-center font-mono text-xs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    ↑↓ pour naviguer • Entrée pour sélectionner
                </motion.div>
            </div>
        </div>
    )
}
