"use client"

import { Trophy, Target, Flame, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface StatsCardProps {
    gamesPlayed: number
    gamesWon: number
    totalScore: number
    winRate: number
    currentStreak: number
    compact?: boolean
}

export function StatsCard({
    gamesPlayed,
    gamesWon,
    totalScore,
    winRate,
    currentStreak,
    compact = false,
}: StatsCardProps) {
    if (compact) {
        return (
            <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="font-bold">{gamesWon}</span>
                    <span className="text-muted-foreground">victoires</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-cyan-500" />
                    <span className="font-bold">{gamesPlayed}</span>
                    <span className="text-muted-foreground">parties</span>
                </div>
                {currentStreak > 0 && (
                    <div className="flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="font-bold">{currentStreak}</span>
                        <span className="text-muted-foreground">série</span>
                    </div>
                )}
            </div>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-cyan-500" />
                    Statistiques
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Win Rate */}
                <div>
                    <div className="mb-1 flex justify-between text-sm">
                        <span className="text-muted-foreground">Taux de victoire</span>
                        <span className="font-bold">{winRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={winRate} className="h-2" />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <Trophy className="mx-auto mb-1 h-6 w-6 text-yellow-500" />
                        <p className="text-2xl font-bold">{gamesWon}</p>
                        <p className="text-muted-foreground text-xs">Victoires</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <Target className="mx-auto mb-1 h-6 w-6 text-cyan-500" />
                        <p className="text-2xl font-bold">{gamesPlayed}</p>
                        <p className="text-muted-foreground text-xs">Parties</p>
                    </div>
                </div>

                {/* Additional Stats */}
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Score total</span>
                        <span className="font-medium">{totalScore.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Score moyen</span>
                        <span className="font-medium">
                            {gamesPlayed > 0 ? Math.round(totalScore / gamesPlayed) : 0}
                        </span>
                    </div>
                    {currentStreak > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Série actuelle</span>
                            <span className="flex items-center gap-1 font-medium">
                                <Flame className="h-4 w-4 text-orange-500" />
                                {currentStreak}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
