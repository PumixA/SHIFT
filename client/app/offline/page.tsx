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
        <div className="bg-background flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="bg-muted mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                        <WifiOff className="text-muted-foreground h-10 w-10" />
                    </div>
                    <CardTitle className="text-2xl">Vous êtes hors ligne</CardTitle>
                    <CardDescription>
                        Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted/50 text-muted-foreground rounded-lg p-4 text-sm">
                        <p>Fonctionnalités disponibles hors ligne :</p>
                        <ul className="mt-2 list-inside list-disc text-left">
                            <li>Consulter les règles sauvegardées</li>
                            <li>Voir votre profil (données en cache)</li>
                            <li>Mode entraînement local</li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button onClick={handleRetry} className="flex-1">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Réessayer
                        </Button>
                        <Button onClick={handleHome} variant="outline" className="flex-1">
                            <Home className="mr-2 h-4 w-4" />
                            Accueil
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
