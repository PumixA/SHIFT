"use client"

import { useState, useEffect } from "react"
import { Save, Trash2, Edit2, Download, Upload, Play, Plus, Clock, Users, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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

interface SavedGamesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadGame: (game: SavedGame) => void
  currentGame?: Partial<SavedGame>
  onSaveCurrentGame?: (name: string) => void
}

export function SavedGamesModal({
  open,
  onOpenChange,
  onLoadGame,
  currentGame,
  onSaveCurrentGame,
}: SavedGamesModalProps) {
  const [savedGames, setSavedGames] = useState<SavedGame[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [newGameName, setNewGameName] = useState("")
  const [showNewGame, setShowNewGame] = useState(false)

  useEffect(() => {
    if (open) {
      setSavedGames(getSavedGames())
    }
  }, [open])

  const handleDelete = (id: string) => {
    deleteSavedGame(id)
    setSavedGames(getSavedGames())
    setDeleteConfirmId(null)
    toast.success("Partie supprimée")
  }

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameSavedGame(id, editName.trim())
      setSavedGames(getSavedGames())
      setEditingId(null)
      toast.success("Partie renommée")
    }
  }

  const handleExport = (id: string) => {
    const json = exportSavedGame(id)
    if (json) {
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `shift-game-${id}.json`
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
            setSavedGames(getSavedGames())
            toast.success("Partie importée")
          } else {
            toast.error("Fichier invalide")
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleSaveNew = () => {
    if (newGameName.trim() && onSaveCurrentGame) {
      onSaveCurrentGame(newGameName.trim())
      setSavedGames(getSavedGames())
      setShowNewGame(false)
      setNewGameName("")
      toast.success("Partie sauvegardée")
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-cyan-400" />
              Parties Sauvegardées
            </DialogTitle>
            <DialogDescription>
              Gérez vos parties sauvegardées. Chargez, renommez ou supprimez.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            {currentGame && onSaveCurrentGame && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewGame(true)}
                className="text-cyan-400 border-cyan-400/50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Sauvegarder partie actuelle
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
          </div>

          {showNewGame && (
            <div className="flex gap-2 mb-4 p-3 bg-secondary/50 rounded-lg">
              <Input
                placeholder="Nom de la partie..."
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                className="flex-1"
              />
              <Button size="icon" onClick={handleSaveNew} disabled={!newGameName.trim()}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setShowNewGame(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <ScrollArea className="h-[400px] pr-4">
            {savedGames.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Save className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune partie sauvegardée</p>
                <p className="text-sm mt-2">
                  Sauvegardez votre partie actuelle ou importez un fichier.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedGames.map((game) => (
                  <Card key={game.id} className="bg-secondary/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {editingId === game.id ? (
                            <div className="flex gap-2">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-8"
                                autoFocus
                              />
                              <Button size="icon" className="h-8 w-8" onClick={() => handleRename(game.id)}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <h4 className="font-semibold truncate">{game.name}</h4>
                          )}

                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {game.players.length} joueurs
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {game.mode === "local" ? "Local" : "En ligne"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {game.rules.length} règles
                            </Badge>
                          </div>

                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(game.updatedAt)}
                          </p>
                        </div>

                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            onClick={() => onLoadGame(game)}
                            className="h-8"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Charger
                          </Button>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingId(game.id)
                                setEditName(game.name)
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleExport(game.id)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-400 hover:text-red-300"
                              onClick={() => setDeleteConfirmId(game.id)}
                            >
                              <Trash2 className="h-3 w-3" />
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
        </DialogContent>
      </Dialog>

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
    </>
  )
}
