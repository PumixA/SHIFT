"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Save, Trash2, Edit2, Play, Clock, Users, Download, Upload, FolderOpen, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  SavedGame,
  getSavedGames,
  deleteSavedGame,
  renameSavedGame,
  exportSavedGame,
  importSavedGame,
} from "@/lib/saved-games"

interface SavedGamesListProps {
  mode: "local" | "online"
  onCreateNew: () => void
}

export function SavedGamesList({ mode, onCreateNew }: SavedGamesListProps) {
  const router = useRouter()
  const [savedGames, setSavedGames] = useState<SavedGame[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    const games = getSavedGames().filter(g => g.mode === mode)
    setSavedGames(games)
  }, [mode])

  const handleLoad = (game: SavedGame) => {
    const gameConfig = {
      mode: game.mode,
      loadFromSave: true,
      savedGameId: game.id,
      players: game.players.map((p, idx) => ({
        name: p.name,
        color: p.color,
      })),
      allowRuleEdit: game.settings.allowRuleEdit,
    }
    sessionStorage.setItem("gameConfig", JSON.stringify(gameConfig))
    sessionStorage.setItem("savedGame", JSON.stringify(game))
    router.push("/game")
  }

  const handleDelete = (id: string) => {
    deleteSavedGame(id)
    setSavedGames(getSavedGames().filter(g => g.mode === mode))
    setDeleteConfirmId(null)
    toast.success("Partie supprimée")
  }

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameSavedGame(id, editName.trim())
      setSavedGames(getSavedGames().filter(g => g.mode === mode))
      setEditingId(null)
      toast.success("Partie renommée")
    }
  }

  const handleExport = (game: SavedGame) => {
    const json = exportSavedGame(game.id)
    if (json) {
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `shift-${game.name.replace(/\s+/g, '-').toLowerCase()}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Partie exportée")
    }
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const json = e.target?.result as string
          const game = importSavedGame(json)
          if (game) {
            setSavedGames(getSavedGames().filter(g => g.mode === mode))
            toast.success("Partie importée !")
          } else {
            toast.error("Fichier invalide")
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: SavedGame["status"]) => {
    switch (status) {
      case "playing":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">En cours</Badge>
      case "paused":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">En pause</Badge>
      case "finished":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Terminée</Badge>
      default:
        return <Badge variant="secondary">En attente</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-cyan-400" />
          <h3 className="font-bold">Parties Sauvegardées</h3>
          <Badge variant="secondary">{savedGames.length}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={handleImport}>
          <Upload className="h-4 w-4 mr-2" />
          Importer
        </Button>
      </div>

      {/* Liste */}
      <ScrollArea className="h-[300px]">
        {savedGames.length === 0 ? (
          <Card className="bg-white/5 border-dashed">
            <CardContent className="py-10 text-center">
              <Save className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">Aucune partie sauvegardée</p>
              <Button onClick={onCreateNew} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Créer une nouvelle partie
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {savedGames.map((game) => (
              <Card key={game.id} className="bg-white/5 hover:bg-white/10 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {editingId === game.id ? (
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 bg-white/10"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(game.id)
                              if (e.key === "Escape") setEditingId(null)
                            }}
                          />
                          <Button size="sm" className="h-8" onClick={() => handleRename(game.id)}>
                            OK
                          </Button>
                        </div>
                      ) : (
                        <h4 className="font-semibold truncate text-lg">{game.name}</h4>
                      )}

                      <div className="flex flex-wrap gap-2 mt-2">
                        {getStatusBadge(game.status)}
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {game.players.length} joueurs
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {game.rules.length} règles
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {game.tiles.length} cases
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(game.updatedAt)}
                      </p>

                      {/* Aperçu des joueurs */}
                      <div className="flex gap-2 mt-3">
                        {game.players.map((player, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full bg-${player.color}-500/20 text-${player.color}-400 text-xs`}
                          >
                            <div className={`w-2 h-2 rounded-full bg-${player.color}-500`} />
                            {player.name}
                            <span className="opacity-60">({player.score}pts)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleLoad(game)}
                        className="h-9 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Charger
                      </Button>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingId(game.id)
                            setEditName(game.name)
                          }}
                          title="Renommer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleExport(game)}
                          title="Exporter"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => setDeleteConfirmId(game.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Bouton nouvelle partie */}
      {savedGames.length > 0 && (
        <Button onClick={onCreateNew} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Créer une nouvelle partie
        </Button>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette partie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La partie sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
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
