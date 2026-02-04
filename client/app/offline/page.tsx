"use client"

import { WifiOff, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  const handleHome = () => {
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <WifiOff className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Vous êtes hors ligne</CardTitle>
          <CardDescription>
            Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p>Fonctionnalités disponibles hors ligne :</p>
            <ul className="list-disc list-inside mt-2 text-left">
              <li>Consulter les règles sauvegardées</li>
              <li>Voir votre profil (données en cache)</li>
              <li>Mode entraînement local</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleRetry} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
            <Button onClick={handleHome} variant="outline" className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
