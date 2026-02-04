"use client"

import { useState, useEffect } from "react"
import { socket } from "@/services/socket"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Save, Download, Package, Sparkles, Users, Zap } from "lucide-react"

/**
 * SJDP-95 & SJDP-96: Interface de gestion des Rule Packs
 */

interface RulePackInfo {
    packId: string
    name: string
    description?: string
    rulesCount: number
    usageCount?: number
    tags?: string[]
}

interface RulePackModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentRulesCount: number
}

export function RulePackModal({ open, onOpenChange, currentRulesCount }: RulePackModalProps) {
    const [activeTab, setActiveTab] = useState<"save" | "load">("load")
    const [packName, setPackName] = useState("")
    const [packDescription, setPackDescription] = useState("")
    const [isPublic, setIsPublic] = useState(false)
    const [availablePacks, setAvailablePacks] = useState<RulePackInfo[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Charger la liste des packs disponibles à l'ouverture
    useEffect(() => {
        if (open) {
            socket.emit('get_rule_packs')
        }
    }, [open])

    // Écouter la liste des packs
    useEffect(() => {
        function onRulePacksList(packs: RulePackInfo[]) {
            setAvailablePacks(packs)
        }

        function onRulePackSaved(data: { success: boolean; pack?: { packId: string; name: string; rulesCount: number }; message?: string }) {
            setIsLoading(false)
            if (data.success && data.pack) {
                toast.success(`Pack "${data.pack.name}" sauvegardé !`, {
                    description: `${data.pack.rulesCount} règles enregistrées`,
                    icon: <Save className="h-4 w-4" />
                })
                setPackName("")
                setPackDescription("")
                onOpenChange(false)
            } else {
                toast.error(data.message || "Erreur lors de la sauvegarde")
            }
        }

        function onRulePackLoaded(data: { packName: string; rulesCount: number }) {
            setIsLoading(false)
            toast.success(`Pack "${data.packName}" chargé !`, {
                description: `${data.rulesCount} règles activées`,
                icon: <Download className="h-4 w-4" />
            })
            onOpenChange(false)
        }

        socket.on('rule_packs_list', onRulePacksList)
        socket.on('rule_pack_saved', onRulePackSaved)
        socket.on('rule_pack_loaded', onRulePackLoaded)

        return () => {
            socket.off('rule_packs_list', onRulePacksList)
            socket.off('rule_pack_saved', onRulePackSaved)
            socket.off('rule_pack_loaded', onRulePackLoaded)
        }
    }, [onOpenChange])

    const handleSave = () => {
        if (!packName.trim()) {
            toast.error("Veuillez entrer un nom pour le pack")
            return
        }
        if (currentRulesCount === 0) {
            toast.error("Aucune règle à sauvegarder")
            return
        }
        setIsLoading(true)
        socket.emit('save_rule_pack', {
            name: packName.trim(),
            description: packDescription.trim() || undefined,
            isPublic,
        })
    }

    const handleLoad = (packId: string) => {
        setIsLoading(true)
        socket.emit('load_rule_pack', { packId })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-cyan-500/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black">
                        <Package className="h-5 w-5 text-cyan-500" />
                        Modes de Jeu
                    </DialogTitle>
                    <DialogDescription>
                        Sauvegardez vos règles ou chargez un preset existant
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "save" | "load")}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="load" className="flex items-center gap-2">
                            <Download className="h-4 w-4" /> Charger
                        </TabsTrigger>
                        <TabsTrigger value="save" className="flex items-center gap-2">
                            <Save className="h-4 w-4" /> Sauvegarder
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab: Charger un pack */}
                    <TabsContent value="load" className="space-y-4 mt-4">
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {availablePacks.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    Chargement des packs...
                                </div>
                            ) : (
                                availablePacks.map((pack) => (
                                    <div
                                        key={pack.packId}
                                        className="p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                                        onClick={() => handleLoad(pack.packId)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                                                    {pack.packId.startsWith('default-') && (
                                                        <Sparkles className="h-3 w-3 text-yellow-400" />
                                                    )}
                                                    {pack.name}
                                                </h4>
                                                {pack.description && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {pack.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        <Zap className="h-3 w-3 mr-1" />
                                                        {pack.rulesCount} règles
                                                    </Badge>
                                                    {pack.usageCount !== undefined && pack.usageCount > 0 && (
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            {pack.usageCount}x utilisé
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                disabled={isLoading}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab: Sauvegarder un pack */}
                    <TabsContent value="save" className="space-y-4 mt-4">
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="pack-name">Nom du pack</Label>
                                <Input
                                    id="pack-name"
                                    placeholder="Ex: Mon mode stratégie"
                                    value={packName}
                                    onChange={(e) => setPackName(e.target.value)}
                                    maxLength={50}
                                    className="bg-white/5"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pack-description">Description (optionnel)</Label>
                                <Input
                                    id="pack-description"
                                    placeholder="Décrivez votre mode de jeu..."
                                    value={packDescription}
                                    onChange={(e) => setPackDescription(e.target.value)}
                                    maxLength={200}
                                    className="bg-white/5"
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                <div>
                                    <Label htmlFor="is-public" className="cursor-pointer">Partager publiquement</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Permettre aux autres joueurs d'utiliser ce pack
                                    </p>
                                </div>
                                <Switch
                                    id="is-public"
                                    checked={isPublic}
                                    onCheckedChange={setIsPublic}
                                />
                            </div>

                            <div className="pt-2 border-t border-white/10">
                                <p className="text-sm text-muted-foreground mb-3">
                                    <span className="font-bold text-cyan-400">{currentRulesCount}</span> règle(s) seront sauvegardées
                                </p>
                                <Button
                                    onClick={handleSave}
                                    disabled={isLoading || !packName.trim() || currentRulesCount === 0}
                                    className="w-full bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {isLoading ? "Sauvegarde..." : "Sauvegarder le pack"}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
