"use client"

import { useState } from "react"
import { Check, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AvatarPreset {
    id: string
    url: string
    name: string
    category: string
}

const AVATAR_PRESETS: AvatarPreset[] = [
    // Cyber
    { id: "cyber-1", url: "/avatars/cyber-1.png", name: "Cyber Knight", category: "cyber" },
    { id: "cyber-2", url: "/avatars/cyber-2.png", name: "Neon Runner", category: "cyber" },
    { id: "cyber-3", url: "/avatars/cyber-3.png", name: "Data Hacker", category: "cyber" },
    { id: "cyber-4", url: "/avatars/cyber-4.png", name: "Chrome Warrior", category: "cyber" },
    // Robots
    { id: "robot-1", url: "/avatars/robot-1.png", name: "Mech Unit", category: "robot" },
    { id: "robot-2", url: "/avatars/robot-2.png", name: "AI Core", category: "robot" },
    { id: "robot-3", url: "/avatars/robot-3.png", name: "Sentinel", category: "robot" },
    { id: "robot-4", url: "/avatars/robot-4.png", name: "Drone Master", category: "robot" },
    // Animals
    { id: "animal-1", url: "/avatars/animal-1.png", name: "Cyber Wolf", category: "animal" },
    { id: "animal-2", url: "/avatars/animal-2.png", name: "Neon Cat", category: "animal" },
    { id: "animal-3", url: "/avatars/animal-3.png", name: "Digital Fox", category: "animal" },
    { id: "animal-4", url: "/avatars/animal-4.png", name: "Synth Bird", category: "animal" },
    // Abstract
    { id: "abstract-1", url: "/avatars/abstract-1.png", name: "Glitch", category: "abstract" },
    { id: "abstract-2", url: "/avatars/abstract-2.png", name: "Vortex", category: "abstract" },
    { id: "abstract-3", url: "/avatars/abstract-3.png", name: "Prism", category: "abstract" },
    { id: "abstract-4", url: "/avatars/abstract-4.png", name: "Matrix", category: "abstract" },
]

interface AvatarPickerProps {
    currentAvatar?: string
    currentPreset?: string
    onSelect: (preset?: string, url?: string) => void
}

export function AvatarPicker({ currentAvatar, currentPreset, onSelect }: AvatarPickerProps) {
    const [selectedPreset, setSelectedPreset] = useState(currentPreset)
    const [customUrl, setCustomUrl] = useState(currentAvatar || "")
    const [open, setOpen] = useState(false)

    const handlePresetSelect = (preset: AvatarPreset) => {
        setSelectedPreset(preset.id)
        setCustomUrl("")
    }

    const handleSave = () => {
        if (selectedPreset) {
            onSelect(selectedPreset, undefined)
        } else if (customUrl) {
            onSelect(undefined, customUrl)
        }
        setOpen(false)
    }

    const categories = [...new Set(AVATAR_PRESETS.map((a) => a.category))]

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Changer d'avatar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Choisir un avatar</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="presets" className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="presets">Presets</TabsTrigger>
                        <TabsTrigger value="custom">Personnalisé</TabsTrigger>
                    </TabsList>

                    <TabsContent value="presets" className="mt-4">
                        <div className="space-y-4">
                            {categories.map((category) => (
                                <div key={category}>
                                    <Label className="text-muted-foreground mb-2 block text-xs uppercase">
                                        {category === "cyber"
                                            ? "Cyberpunk"
                                            : category === "robot"
                                              ? "Robots"
                                              : category === "animal"
                                                ? "Animaux"
                                                : "Abstraits"}
                                    </Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {AVATAR_PRESETS.filter((a) => a.category === category).map((avatar) => (
                                            <button
                                                key={avatar.id}
                                                onClick={() => handlePresetSelect(avatar)}
                                                className={`relative rounded-lg border-2 p-1 transition-all ${
                                                    selectedPreset === avatar.id
                                                        ? "border-cyan-500 bg-cyan-500/10"
                                                        : "hover:border-border border-transparent"
                                                }`}
                                            >
                                                <Avatar className="mx-auto h-14 w-14">
                                                    <AvatarImage src={avatar.url} />
                                                    <AvatarFallback>{avatar.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                {selectedPreset === avatar.id && (
                                                    <div className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500">
                                                        <Check className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="custom" className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="avatar-url">URL de l'image</Label>
                            <Input
                                id="avatar-url"
                                placeholder="https://..."
                                value={customUrl}
                                onChange={(e) => {
                                    setCustomUrl(e.target.value)
                                    setSelectedPreset(undefined)
                                }}
                            />
                        </div>

                        {customUrl ? (
                            <div className="flex justify-center">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={customUrl} />
                                    <AvatarFallback>?</AvatarFallback>
                                </Avatar>
                            </div>
                        ) : null}

                        <p className="text-muted-foreground text-xs">
                            Utilisez une URL d'image publique (PNG, JPG, GIF)
                        </p>
                    </TabsContent>
                </Tabs>

                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Annuler
                    </Button>
                    <Button onClick={handleSave} disabled={!selectedPreset && !customUrl}>
                        Sauvegarder
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
