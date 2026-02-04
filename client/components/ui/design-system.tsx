"use client"

/**
 * @fileoverview SHIFT Design System
 *
 * Centralized design system components for consistent UI across the application.
 * Includes reusable components for menus, cards, badges, and page layouts.
 *
 * @module components/ui/design-system
 * @version 1.0.0
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

// ============================================
// DESIGN TOKENS (CSS Variables are in globals.css)
// ============================================

/**
 * Color definitions for the SHIFT design system.
 * Includes primary colors and player-specific color palettes.
 */

export const colors = {
    primary: {
        cyan: "cyan",
        violet: "violet",
        orange: "orange",
        green: "green",
    },
    player: {
        cyan: {
            bg: "bg-cyan-500",
            bgLight: "bg-cyan-500/20",
            text: "text-cyan-400",
            border: "border-cyan-500/50",
            gradient: "from-cyan-500 to-blue-600",
        },
        violet: {
            bg: "bg-violet-500",
            bgLight: "bg-violet-500/20",
            text: "text-violet-400",
            border: "border-violet-500/50",
            gradient: "from-violet-500 to-purple-600",
        },
        orange: {
            bg: "bg-orange-500",
            bgLight: "bg-orange-500/20",
            text: "text-orange-400",
            border: "border-orange-500/50",
            gradient: "from-orange-500 to-red-600",
        },
        green: {
            bg: "bg-green-500",
            bgLight: "bg-green-500/20",
            text: "text-green-400",
            border: "border-green-500/50",
            gradient: "from-green-500 to-emerald-600",
        },
    },
} as const

export type PlayerColor = keyof typeof colors.player

// ============================================
// MENU BUTTON - For main menu navigation
// ============================================

/**
 * MenuButton - Main menu navigation button with icon, label and selection state.
 *
 * @example
 * ```tsx
 * <MenuButton
 *   href="/play"
 *   icon={Gamepad2}
 *   label="JOUER"
 *   description="Créer ou rejoindre une partie"
 *   color="cyan"
 *   selected={true}
 * />
 * ```
 */
const menuButtonVariants = cva(
    "relative group cursor-pointer p-4 md:p-5 rounded-xl border-2 transition-all duration-200 flex items-center gap-4",
    {
        variants: {
            variant: {
                default: "border-white/5 hover:border-white/10 bg-white/[0.02]",
                selected: "bg-white/5",
            },
            color: {
                cyan: "data-[selected=true]:border-cyan-500/50",
                violet: "data-[selected=true]:border-violet-500/50",
                orange: "data-[selected=true]:border-orange-500/50",
                green: "data-[selected=true]:border-green-500/50",
            },
        },
        defaultVariants: {
            variant: "default",
            color: "cyan",
        },
    }
)

export interface MenuButtonProps
    extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
        VariantProps<typeof menuButtonVariants> {
    href: string
    icon: React.ElementType
    label: string
    description?: string
    selected?: boolean
}

export function MenuButton({
    href,
    icon: Icon,
    label,
    description,
    selected,
    color,
    className,
    ...props
}: MenuButtonProps) {
    const colorClasses = colors.player[color || "cyan"]

    return (
        <Link href={href} {...props}>
            <div
                className={cn(menuButtonVariants({ color }), className)}
                data-selected={selected}
            >
                {/* Glow effect on selection */}
                {selected && (
                    <div
                        className={cn(
                            "absolute inset-0 rounded-xl opacity-10 bg-gradient-to-r",
                            colorClasses.gradient
                        )}
                    />
                )}

                <div className="relative z-10 flex items-center gap-4 flex-1">
                    {/* Icon */}
                    <div
                        className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200",
                            selected
                                ? `bg-gradient-to-br ${colorClasses.gradient} shadow-lg`
                                : "bg-white/5"
                        )}
                    >
                        <Icon
                            className={cn(
                                "h-6 w-6",
                                selected ? "text-white" : "text-muted-foreground"
                            )}
                        />
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                        <h2
                            className={cn(
                                "text-xl md:text-2xl font-black tracking-tight transition-colors duration-200",
                                selected ? "text-white" : "text-muted-foreground"
                            )}
                        >
                            {label}
                        </h2>
                        {description && (
                            <p
                                className={cn(
                                    "text-xs transition-colors duration-200",
                                    selected ? "text-white/60" : "text-muted-foreground/50"
                                )}
                            >
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Arrow */}
                    <ChevronRight
                        className={cn(
                            "h-6 w-6 transition-all duration-200",
                            selected
                                ? "text-white opacity-100 translate-x-0"
                                : "text-muted-foreground opacity-0 -translate-x-2"
                        )}
                    />
                </div>
            </div>
        </Link>
    )
}

// ============================================
// GAME CARD - For displaying game/player info
// ============================================

/**
 * GameCard - Versatile card component for game UI elements.
 * Supports player color highlighting and various padding/variant options.
 *
 * @example
 * ```tsx
 * <GameCard variant="highlight" playerColor="cyan" padding="lg">
 *   <h3>Game Info</h3>
 *   <p>Content here</p>
 * </GameCard>
 * ```
 */
const gameCardVariants = cva(
    "rounded-xl border transition-all duration-200",
    {
        variants: {
            variant: {
                default: "bg-white/5 border-white/10 hover:bg-white/10",
                highlight: "border-2",
                transparent: "bg-transparent border-transparent",
            },
            padding: {
                none: "",
                sm: "p-3",
                md: "p-4",
                lg: "p-6",
            },
        },
        defaultVariants: {
            variant: "default",
            padding: "md",
        },
    }
)

export interface GameCardProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof gameCardVariants> {
    playerColor?: PlayerColor
}

export function GameCard({
    variant,
    padding,
    playerColor,
    className,
    children,
    ...props
}: GameCardProps) {
    const colorClasses = playerColor ? colors.player[playerColor] : null

    return (
        <div
            className={cn(
                gameCardVariants({ variant, padding }),
                variant === "highlight" && colorClasses && colorClasses.border,
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

// ============================================
// PLAYER BADGE - For displaying player color/name
// ============================================

/**
 * PlayerBadge - Displays player info with color-coded badge.
 * Used in player lists, game UI, and leaderboards.
 *
 * @example
 * ```tsx
 * <PlayerBadge
 *   color="violet"
 *   name="Player1"
 *   score={150}
 *   isCurrentTurn={true}
 *   size="md"
 * />
 * ```
 */
export interface PlayerBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    color: PlayerColor
    name: string
    score?: number
    isCurrentTurn?: boolean
    size?: "sm" | "md" | "lg"
}

export function PlayerBadge({
    color,
    name,
    score,
    isCurrentTurn,
    size = "md",
    className,
    ...props
}: PlayerBadgeProps) {
    const colorClasses = colors.player[color]

    const sizeClasses = {
        sm: "text-xs px-2 py-1",
        md: "text-sm px-3 py-1.5",
        lg: "text-base px-4 py-2",
    }

    const dotSizes = {
        sm: "w-2 h-2",
        md: "w-3 h-3",
        lg: "w-4 h-4",
    }

    return (
        <div
            className={cn(
                "flex items-center gap-2 rounded-full",
                colorClasses.bgLight,
                colorClasses.text,
                sizeClasses[size],
                isCurrentTurn && "ring-2 ring-white/50",
                className
            )}
            {...props}
        >
            <div className={cn("rounded-full", colorClasses.bg, dotSizes[size])} />
            <span className="font-medium">{name}</span>
            {score !== undefined && (
                <span className="opacity-60">({score}pts)</span>
            )}
        </div>
    )
}

// ============================================
// SECTION HEADER - For consistent section titles
// ============================================

/**
 * SectionHeader - Consistent section title component with optional icon and count.
 *
 * @example
 * ```tsx
 * <SectionHeader icon={Users} title="Amis en ligne" count={5} />
 * ```
 */
export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ElementType
    title: string
    count?: number
}

export function SectionHeader({
    icon: Icon,
    title,
    count,
    className,
    ...props
}: SectionHeaderProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground",
                className
            )}
            {...props}
        >
            {Icon && <Icon className="h-4 w-4" />}
            {title}
            {count !== undefined && (
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                    {count}
                </span>
            )}
        </div>
    )
}

// ============================================
// PAGE HEADER - For consistent page headers
// ============================================

/**
 * PageHeader - Consistent page header with icon, title and subtitle.
 * Used across all pages for navigation and branding.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   icon={Gamepad2}
 *   title="JOUER"
 *   subtitle="Créer ou rejoindre une partie"
 *   gradient="from-cyan-500 to-blue-600"
 * />
 * ```
 */
export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    icon: React.ElementType
    title: string
    subtitle?: string
    gradient?: string
    backHref?: string
}

export function PageHeader({
    icon: Icon,
    title,
    subtitle,
    gradient = "from-cyan-500 to-blue-600",
    className,
    ...props
}: PageHeaderProps) {
    return (
        <div className={cn("flex items-center gap-3", className)} {...props}>
            <div
                className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
                    gradient
                )}
            >
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-black tracking-tighter italic">{title}</h1>
                {subtitle && (
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
            </div>
        </div>
    )
}

// ============================================
// OPTION ROW - For settings/toggle rows
// ============================================

/**
 * OptionRow - Settings row with icon, label, description and control slot.
 * Used in settings pages and modals for consistent option presentation.
 *
 * @example
 * ```tsx
 * <OptionRow
 *   icon={Volume2}
 *   label="Volume principal"
 *   description="Ajuster le volume global"
 * >
 *   <Slider value={[70]} />
 * </OptionRow>
 * ```
 */
export interface OptionRowProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ElementType
    label: string
    description?: string
    children: React.ReactNode
}

export function OptionRow({
    icon: Icon,
    label,
    description,
    children,
    className,
    ...props
}: OptionRowProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-between p-4 rounded-xl bg-white/5",
                className
            )}
            {...props}
        >
            <div className="flex items-center gap-3">
                {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                <div>
                    <span className="font-medium">{label}</span>
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>
            {children}
        </div>
    )
}
