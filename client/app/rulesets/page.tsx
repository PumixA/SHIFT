"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, BookOpen, Plus, Trash2, Edit, Zap, Sparkles, Copy, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast, Toaster } from "sonner"
import { PageHeader, GameCard } from "@/components/ui/design-system"

interface RuleTemplate {
    ruleId: string
    title: string
    trigger: string
    tileIndex?: number | null
    effects: { type: string; value: number | string; target: string }[]
    priority: number
}

interface RulePack {
    packId: string
    name: string
    description?: string
    rules: RuleTemplate[]
    isDefault: boolean
    tags: string[]
}

const DEFAULT_PACKS: RulePack[] = [
    {
        packId: "default-vanilla",
        name: "Vanilla",
        description: "Aucune règle spéciale - jeu pur",
        rules: [],
        isDefault: true,
        tags: ["simple", "débutant"],
    },
    {
        packId: "default-classic",
        name: "Classique",
        description: "Quelques cases spéciales pour pimenter le jeu",
        rules: [
            { ruleId: "turbo-5", title: "Turbo Boost", trigger: "ON_LAND", tileIndex: 5, effects: [{ type: "MOVE_RELATIVE", value: 2, target: "self" }], priority: 1 },
            { ruleId: "trap-10", title: "Piège", trigger: "ON_LAND", tileIndex: 10, effects: [{ type: "MOVE_RELATIVE", value: -3, target: "self" }], priority: 1 },
        ],
        isDefault: true,
        tags: ["classique", "équilibré"],
    },
    {
        packId: "default-chaos",
        name: "Chaos",
        description: "Téléportations et surprises à chaque coin !",
        rules: [
            { ruleId: "teleport-5", title: "Téléporteur Alpha", trigger: "ON_LAND", tileIndex: 5, effects: [{ type: "TELEPORT", value: 15, target: "self" }], priority: 1 },
            { ruleId: "teleport-15", title: "Téléporteur Beta", trigger: "ON_LAND", tileIndex: 15, effects: [{ type: "TELEPORT", value: 3, target: "self" }], priority: 1 },
            { ruleId: "reset-10", title: "Retour Départ", trigger: "ON_LAND", tileIndex: 10, effects: [{ type: "BACK_TO_START", value: 0, target: "self" }], priority: 1 },
        ],
        isDefault: true,
        tags: ["chaos", "fun"],
    },
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
}

export default function RulesetsPage() {
    const router = useRouter()
    const [packs, setPacks] = useState<RulePack[]>([])
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newPackName, setNewPackName] = useState("")
    const [newPackDescription, setNewPackDescription] = useState("")
    const [packToDelete, setPackToDelete] = useState<RulePack | null>(null)

    useEffect(() => {
        const stored = localStorage.getItem("customRulePacks")
        const customPacks: RulePack[] = stored ? JSON.parse(stored) : []
        setPacks([...DEFAULT_PACKS, ...customPacks])
    }, [])

    const saveCustomPacks = (customPacks: RulePack[]) => {
        localStorage.setItem("customRulePacks", JSON.stringify(customPacks))
    }

    const createPack = () => {
        if (!newPackName.trim()) {
            toast.error("Veuillez entrer un nom pour le pack")
            return
        }

        const newPack: RulePack = {
            packId: `custom-${Date.now()}`,
            name: newPackName.trim(),
            description: newPackDescription.trim() || undefined,
            rules: [],
            isDefault: false,
            tags: ["personnalisé"],
        }

        const customPacks = packs.filter(p => !p.isDefault)
        customPacks.push(newPack)
        saveCustomPacks(customPacks)
        setPacks([...DEFAULT_PACKS, ...customPacks])

        setNewPackName("")
        setNewPackDescription("")
        setIsCreateOpen(false)
        toast.success(`Pack "${newPack.name}" créé !`)
    }

    const deletePack = (pack: RulePack) => {
        if (pack.isDefault) return

        const customPacks = packs.filter(p => !p.isDefault && p.packId !== pack.packId)
        saveCustomPacks(customPacks)
        setPacks([...DEFAULT_PACKS, ...customPacks])
        setPackToDelete(null)
        toast.success(`Pack "${pack.name}" supprimé`)
    }

    const duplicatePack = (pack: RulePack) => {
        const newPack: RulePack = {
            ...pack,
            packId: `custom-${Date.now()}`,
            name: `${pack.name} (copie)`,
            isDefault: false,
            tags: ["personnalisé", "copie"],
        }

        const customPacks = packs.filter(p => !p.isDefault)
        customPacks.push(newPack)
        saveCustomPacks(customPacks)
        setPacks([...DEFAULT_PACKS, ...customPacks])
        toast.success(`Pack dupliqué !`)
    }

    const defaultPacks = packs.filter(p => p.isDefault)
    const customPacks = packs.filter(p => !p.isDefault)

    return (
        <div className="min-h-screen bg-background">
            <Toaster position="bottom-right" theme="dark" richColors />

            {/* Background Effect */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.1),transparent_50%)]" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="hover:bg-white/10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <PageHeader
                            icon={BookOpen}
                            title="SETS DE RÈGLES"
                            subtitle={`${packs.length} packs disponibles`}
                            gradient="from-orange-500 to-red-600"
                        />
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau Pack
                    </Button>
                </div>
            </header>

            <main className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
                {/* Default Packs */}
                <section className="mb-10">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-4 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Packs Officiels
                    </h2>
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid md:grid-cols-3 gap-4"
                    >
                        {defaultPacks.map((pack) => (
                            <PackCard
                                key={pack.packId}
                                pack={pack}
                                onDuplicate={() => duplicatePack(pack)}
                            />
                        ))}
                    </motion.div>
                </section>

                {/* Custom Packs */}
                <section>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Mes Packs ({customPacks.length})
                    </h2>
                    {customPacks.length === 0 ? (
                        <GameCard className="text-center py-12">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">Aucun pack personnalisé</p>
                            <p className="text-sm text-muted-foreground/60 mt-1">
                                Créez un nouveau pack ou dupliquez un pack existant
                            </p>
                        </GameCard>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid md:grid-cols-2 gap-4"
                        >
                            {customPacks.map((pack) => (
                                <PackCard
                                    key={pack.packId}
                                    pack={pack}
                                    onDuplicate={() => duplicatePack(pack)}
                                    onDelete={() => setPackToDelete(pack)}
                                    onEdit={() => toast.info("Éditeur bientôt disponible")}
                                />
                            ))}
                        </motion.div>
                    )}
                </section>

                {/* Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-10 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20"
                >
                    <p className="text-sm text-orange-200">
                        <strong>Astuce :</strong> Les packs personnalisés sont sauvegardés dans votre navigateur.
                        Pour créer des règles complexes, lancez une partie et utilisez l'éditeur de règles intégré,
                        puis sauvegardez votre configuration.
                    </p>
                </motion.div>
            </main>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-orange-400" />
                            Nouveau Set de Règles
                        </DialogTitle>
                        <DialogDescription>
                            Créez un nouveau pack vide que vous pourrez compléter plus tard
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Nom du pack</Label>
                            <Input
                                value={newPackName}
                                onChange={(e) => setNewPackName(e.target.value)}
                                placeholder="Mon super pack"
                                maxLength={30}
                                onKeyDown={(e) => e.key === 'Enter' && createPack()}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description (optionnel)</Label>
                            <Input
                                value={newPackDescription}
                                onChange={(e) => setNewPackDescription(e.target.value)}
                                placeholder="Description du pack..."
                                maxLength={100}
                            />
                        </div>
                        <Button onClick={createPack} className="w-full" disabled={!newPackName.trim()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Créer le pack
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!packToDelete} onOpenChange={() => setPackToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer "{packToDelete?.name}" ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Le pack et toutes ses règles seront supprimés.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => packToDelete && deletePack(packToDelete)}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

// Pack Card Component
function PackCard({
    pack,
    onDuplicate,
    onDelete,
    onEdit,
}: {
    pack: RulePack
    onDuplicate: () => void
    onDelete?: () => void
    onEdit?: () => void
}) {
    return (
        <motion.div variants={itemVariants}>
            <GameCard className="h-full hover:bg-white/10 transition-colors">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {pack.isDefault && <Sparkles className="h-4 w-4 text-yellow-400" />}
                        <h3 className="font-bold text-lg text-white">{pack.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={onDuplicate} title="Dupliquer">
                            <Copy className="h-4 w-4" />
                        </Button>
                        {!pack.isDefault && onEdit && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={onEdit} title="Modifier">
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                        {!pack.isDefault && onDelete && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20" onClick={onDelete} title="Supprimer">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {pack.description && (
                    <p className="text-sm text-muted-foreground mb-3">{pack.description}</p>
                )}

                <div className="flex items-center gap-2 flex-wrap mb-3">
                    <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/30">
                        <Zap className="h-3 w-3 mr-1" />
                        {pack.rules.length} règle{pack.rules.length !== 1 ? 's' : ''}
                    </Badge>
                    {pack.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs border-white/20">
                            {tag}
                        </Badge>
                    ))}
                </div>

                {pack.rules.length > 0 && (
                    <div className="space-y-1 pt-3 border-t border-white/10">
                        {pack.rules.slice(0, 3).map((rule) => (
                            <div key={rule.ruleId} className="text-xs text-muted-foreground flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                                <span className="truncate">{rule.title}</span>
                                {rule.tileIndex != null && (
                                    <span className="text-cyan-400 shrink-0">(Case {rule.tileIndex})</span>
                                )}
                            </div>
                        ))}
                        {pack.rules.length > 3 && (
                            <div className="text-xs text-muted-foreground/60">
                                +{pack.rules.length - 3} autre{pack.rules.length - 3 > 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                )}
            </GameCard>
        </motion.div>
    )
}
