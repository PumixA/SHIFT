"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Filter, Plus, Zap, Book, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { socket } from "@/services/socket"
import { toast } from "sonner"
import { RuleTemplate, TriggerType, ActionType, TRIGGER_INFO, ACTION_INFO } from "@/src/types/rules"

const CATEGORIES = [
    { id: "all", name: "Tous", icon: Book },
    { id: "movement", name: "Mouvement", icon: Zap },
    { id: "score", name: "Score", icon: Zap },
    { id: "power-up", name: "Power-ups", icon: Zap },
    { id: "interaction", name: "Interaction", icon: Zap },
    { id: "dice", name: "Dé", icon: Zap },
    { id: "meta", name: "Méta", icon: Zap },
]

const DIFFICULTY_COLORS = {
    easy: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    hard: "bg-red-500/20 text-red-400 border-red-500/30",
}

export default function RuleTemplatesPage() {
    const router = useRouter()
    const [templates, setTemplates] = useState<RuleTemplate[]>([])
    const [filteredTemplates, setFilteredTemplates] = useState<RuleTemplate[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        socket.connect()
        socket.emit("get_rule_templates", {})

        socket.on("rule_templates", (data: RuleTemplate[]) => {
            setTemplates(data)
            setFilteredTemplates(data)
            setLoading(false)
        })

        return () => {
            socket.off("rule_templates")
        }
    }, [])

    useEffect(() => {
        let filtered = templates

        // Filter by category
        if (selectedCategory !== "all") {
            filtered = filtered.filter((t) => t.category === selectedCategory)
        }

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(
                (t) =>
                    t.name.toLowerCase().includes(query) ||
                    t.description.toLowerCase().includes(query) ||
                    t.tags.some((tag) => tag.toLowerCase().includes(query))
            )
        }

        setFilteredTemplates(filtered)
    }, [templates, selectedCategory, searchQuery])

    const handleUseTemplate = (template: RuleTemplate) => {
        // Store template in session and redirect to game or rule builder
        sessionStorage.setItem("ruleTemplate", JSON.stringify(template))
        toast.success(`Template "${template.name}" sélectionné`)
        router.push("/")
    }

    const getTriggerName = (trigger: TriggerType) => {
        return TRIGGER_INFO[trigger]?.name || trigger
    }

    const getEffectSummary = (template: RuleTemplate) => {
        return template.effects
            .map((e) => {
                const info = ACTION_INFO[e.type as ActionType]
                return info?.name || e.type
            })
            .join(", ")
    }

    if (loading) {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center">
                <div className="text-muted-foreground animate-pulse">Chargement...</div>
            </div>
        )
    }

    return (
        <div className="bg-background min-h-screen">
            {/* Header */}
            <header className="border-border/50 bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
                <div className="container mx-auto px-4 py-4">
                    <div className="mb-4 flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter italic">TEMPLATES DE RÈGLES</h1>
                            <p className="text-muted-foreground text-sm">{templates.length} templates disponibles</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Rechercher un template..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                {/* Categories */}
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
                    <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
                        {CATEGORIES.map((cat) => (
                            <TabsTrigger
                                key={cat.id}
                                value={cat.id}
                                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
                            >
                                {cat.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* Templates Grid */}
                {filteredTemplates.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Book className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                            <p className="text-muted-foreground">Aucun template trouvé</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredTemplates.map((template) => (
                            <Card
                                key={template.id}
                                className="overflow-hidden transition-colors hover:border-cyan-500/50"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{template.name}</CardTitle>
                                            <CardDescription className="mt-1">{template.description}</CardDescription>
                                        </div>
                                        <Badge variant="outline" className={DIFFICULTY_COLORS[template.difficulty]}>
                                            {template.difficulty === "easy"
                                                ? "Facile"
                                                : template.difficulty === "medium"
                                                  ? "Moyen"
                                                  : "Difficile"}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Trigger */}
                                    <div>
                                        <p className="text-muted-foreground mb-1 text-xs">Déclencheur</p>
                                        <Badge variant="secondary">
                                            {getTriggerName(template.trigger)}
                                            {template.triggerValue !== undefined && ` (${template.triggerValue})`}
                                        </Badge>
                                    </div>

                                    {/* Effects */}
                                    <div>
                                        <p className="text-muted-foreground mb-1 text-xs">Effets</p>
                                        <p className="text-sm">{getEffectSummary(template)}</p>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1">
                                        {template.tags.map((tag) => (
                                            <Badge key={tag} variant="outline" className="text-[10px]">
                                                <Tag className="mr-1 h-2 w-2" />
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>

                                    {/* Action */}
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => handleUseTemplate(template)}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Utiliser ce template
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
